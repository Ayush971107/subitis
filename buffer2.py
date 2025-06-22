import os
import asyncio
import json
import logging
import websockets
from collections import deque
from typing import Dict, List, Tuple
from concurrent.futures import ThreadPoolExecutor

from groq import Groq
from agent import DispatcherAgent

# ── Configuration ─────────────────────────────────────────────────────────────
WS_URL = "wss://e30c-2607-f140-400-21-d1c3-a928-d6c1-dd17.ngrok-free.app/"

BUFFER_INTERVAL = 5.5
MAX_WORKERS = 3
MAX_BUFFERED_MESSAGES = 1000
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("buffer")
logger.setLevel(logging.DEBUG)

# ── Clients ───────────────────────────────────────────────────────────────────
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
agent = DispatcherAgent()
executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

# ── Queues & Buffers ─────────────────────────────────────────────────────────
raw_queue: deque = deque(maxlen=MAX_BUFFERED_MESSAGES)
task_queue: asyncio.Queue = asyncio.Queue()

# ── Dialogue Consolidation ────────────────────────────────────────────────────
def consolidate_dialogue_with_groq(raw_messages: List[Dict]) -> List[Tuple[str, str]]:
    """
    Call Groq to merge fragmented ASR messages into clean dialogue.
    Returns list of (role, text).
    """
    if not raw_messages:
        return []
    # Group and sort fragments
    fragments_by_role: Dict[str, List[Dict]] = {}
    for msg in raw_messages:
        role = msg.get('metadata', {}).get('role', 'unknown')
        if role == 'agent':
            role = 'dispatcher'
        text = msg.get('text', '').strip()
        timestamp = msg.get('metadata', {}).get('timestamp', '0')
        sequence = msg.get('metadata', {}).get('sequenceNumber', 0)
        fragments_by_role.setdefault(role, []).append({
            'text': text,
            'ts': int(timestamp) if str(timestamp).isdigit() else 0,
            'seq': sequence,
        })
    for role, frags in fragments_by_role.items():
        frags.sort(key=lambda x: (x['ts'], x['seq']))
    # Build prompt
    fragments_text = ''
    for role, frags in fragments_by_role.items():
        fragments_text += f"\n{role.upper()} FRAGMENTS:\n"
        for i, f in enumerate(frags):
            fragments_text += f"  {i+1}. [{f['seq']}@{f['ts']}] '{f['text']}'\n"
    prompt = (
        f"You are an expert at merging ASR fragments into coherent dialogue.\n"
        f"Return ONLY valid JSON array of {{'role':..., 'text':...}}.\n"
        f"Fragments:{fragments_text}"
    )
    try:
        resp = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "Always respond with valid JSON array only."},
                {"role": "user",   "content": prompt}
            ],
            temperature=0.1,
            max_tokens=500
        )
        content = resp.choices[0].message.content.strip()
        data = json.loads(content)
        if not isinstance(data, list):
            raise ValueError("Expected list JSON from Groq")
        cleaned: List[Tuple[str, str]] = []
        for item in data:
            r = item.get('role')
            t = item.get('text', '').strip()
            if r and t:
                cleaned.append((r, t))
        return cleaned
    except Exception as e:
        logger.error(f"Consolidation error: {e}")
        return []

# ── Buffer Collector ───────────────────────────────────────────────────────────
async def buffer_collector():
    """
    Every BUFFER_INTERVAL seconds, batch raw_queue into task_queue.
    """
    loop = asyncio.get_running_loop()
    next_flush = loop.time() + BUFFER_INTERVAL
    while True:
        # Sleep until the next flush time
        await asyncio.sleep(max(0, next_flush - loop.time()))
        next_flush += BUFFER_INTERVAL
        if raw_queue:
            batch = list(raw_queue)
            raw_queue.clear()
            await task_queue.put(batch)
            logger.info(f"Queued batch of {len(batch)} messages")
        else:
            logger.debug("No messages to flush this interval")

# ── Processing Worker ─────────────────────────────────────────────────────────
async def processing_worker(worker_id: str, websocket):
    """
    Consume batches from task_queue, consolidate via Groq, update memory, run agent, send reply.
    """
    loop = asyncio.get_running_loop()
    while True:
        batch: List[Dict] = await task_queue.get()
        try:
            # 1) Consolidate fragments
            coherent = await loop.run_in_executor(executor, consolidate_dialogue_with_groq, batch)
            if not coherent:
                logger.debug(f"[{worker_id}] No coherent dialogue extracted")
                task_queue.task_done()
                continue
            
            # Log Groq preprocessing output
            logger.info(f"[{worker_id}] Groq preprocessing output:")
            for role, text in coherent:
                logger.info("   %s: %s", role, text)
            # 2) Debounced memory update
            for role, text in coherent:
                agent._update_conversation_async(role, text)
            # 3) Choose last caller statement or last item
            callers = [t for r, t in coherent if r == 'caller']
            if callers:
                chunk_text = callers[-1]
                last_role = 'caller'
            else:
                last_role, chunk_text = coherent[-1]
            # 4) Run agent
            future = loop.run_in_executor(
                executor,
                agent.process_chunk_fast,
                chunk_text,
                last_role
            )
            try:
                out = await asyncio.wait_for(future, timeout=15)
            except asyncio.TimeoutError:
                logger.error(f"[{worker_id}] Agent processing timed out")
                task_queue.task_done()
                continue
            # 5) Emit suggestions_update event to the main WebSocket server
            payload = {
                "event": "distribute_suggestions",
                "data": {
                    "role": "assistant",
                    "summary": out.get("summary", []),
                    "advice": out.get("advice", ""),
                    "patient_age": out.get("patient_age", None),
                    "criticality_level": out.get("criticality_level", "low"),
                    "processed_dialogue": coherent,
                    "worker_id": worker_id,
                    "raw_output": out,
                    "source": "ai_buffer_processor"  # Identify this as coming from the AI processor
                }
            }
            
            # Send to main WebSocket server for distribution to all clients
            await websocket.send(json.dumps(payload))
            logger.info(f"[{worker_id}] Sent suggestions_update event to main server for distribution")
                
        except Exception as e:
            logger.error(f"[{worker_id}] Error: {e}")
        finally:
            task_queue.task_done()

# ── WebSocket Handler ─────────────────────────────────────────────────────────
async def ws_handler():
    async with websockets.connect(WS_URL) as ws:
        logger.info(f"Connected to {WS_URL}")
        # Start collector and workers
        collector = asyncio.create_task(buffer_collector())
        workers = [
            asyncio.create_task(processing_worker(f"worker-{i}", ws))
            for i in range(MAX_WORKERS)
        ]
        try:
            async for raw in ws:
                try:
                    msg = json.loads(raw)
                    if msg.get('event') == 'interim-transcription':
                        raw_queue.append(msg)
                        logger.debug(f"📨 Queued: {msg.get('metadata', {}).get('role', 'unknown')} - {msg.get('text', '')[:30]}...")
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON: {raw}")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        finally:
            # Shutdown
            collector.cancel()
            for w in workers:
                w.cancel()
            await asyncio.gather(collector, *workers, return_exceptions=True)

# ── Entry Point ────────────────────────────────────────────────────────────────
def main():
    asyncio.run(ws_handler())

if __name__ == "__main__":
    main()
