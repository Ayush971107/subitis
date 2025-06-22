import os
import json
import time
import asyncio
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
import hashlib

from dotenv import load_dotenv
from openai import OpenAI
from pinecone import Pinecone
from groq import Groq
from letta_client import Letta, MessageCreate

@dataclass
class TimingStats:
    operation: str
    duration_ms: float
    timestamp: str

def timeit(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        duration_ms = (end_time - start_time) * 1000
        return result, duration_ms
    return wrapper

load_dotenv()

# ─── Clients ────────────────────────────────────────────────────────────────────
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pinecone_client.Index("subitis-guides")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

letta_client = Letta(
    token=os.getenv("LETTA_API_KEY"),
    # base_url="http://localhost:8283"  # if self-hosted
)


class DispatcherAgent:
    def __init__(self):
        # Create a Letta agent for memory management only
        self.agent = letta_client.agents.create(
            memory_blocks=[
                {
                    "label": "call_history",
                    "value": "",
                    "description": "Rolling bullet-point summary of the call so far"
                }
            ],
            system="You are a memory manager for crisis dispatch calls.",
            model="openai/gpt-4o-mini",
            embedding="openai/text-embedding-3-small"
        )
        
        # In-memory cache for embeddings and summaries
        self.embedding_cache = {}
        self.summary_cache = None
        self.summary_cache_time = 0
        self.rag_cache = {}
        
    def _get_text_hash(self, text: str) -> str:
        """Generate a hash for caching purposes"""
        return hashlib.md5(text.encode()).hexdigest()[:8]

    @lru_cache(maxsize=128)
    def _get_embedding_cached(self, text: str) -> List[float]:
        """Cache embeddings to avoid repeated API calls"""
        resp = openai_client.embeddings.create(
            model="text-embedding-ada-002",
            input=[text]
        )
        return resp.data[0].embedding

    @timeit
    def _get_rag_passages_fast(self, text: str, top_k: int = 3) -> Tuple[List[str], float]:
        """Optimized RAG with embedding caching"""
        text_hash = self._get_text_hash(text)
        
        # Check cache first
        if text_hash in self.rag_cache:
            return self.rag_cache[text_hash]
        
        # Get cached embedding
        q_emb = self._get_embedding_cached(text)

        # Query Pinecone
        result = index.query(
            vector=q_emb,
            top_k=top_k,
            include_metadata=True
        )
        passages = [match["metadata"]["text"] for match in result["matches"]]
        
        # Cache result
        self.rag_cache[text_hash] = passages
        
        return passages

    def _get_current_summary_fast(self) -> str:
        """Fast summary retrieval with caching"""
        current_time = time.time()
        
        # Use cache if it's fresh (less than 5 seconds old)
        if self.summary_cache and (current_time - self.summary_cache_time) < 5:
            return self.summary_cache
        
        # Otherwise fetch from Letta
        try:
            block = letta_client.agents.blocks.retrieve(
                agent_id=self.agent.id,
                block_label="call_history"
            )
            self.summary_cache = block.value if block else ""
            self.summary_cache_time = current_time
            return self.summary_cache
        except:
            return ""

    def _update_summary_async(self, new_summary: str):
        """Update summary asynchronously (fire and forget)"""
        try:
            letta_client.agents.blocks.modify(
                agent_id=self.agent.id,
                block_label="call_history",
                value=new_summary
            )
            self.summary_cache = new_summary
            self.summary_cache_time = time.time()
        except Exception as e:
            print(f"Warning: Failed to update summary: {e}")

    def process_chunk_fast(self, transcript_chunk: str) -> Dict:
        """
        Optimized version of process_chunk with caching and async operations
        Returns: {"summary": [...], "advice": "...", "timings": [...]}
        """
        timings = []
        start_time = time.time()
        
        # 1) Get current summary (with caching)
        summary_start = time.time()
        current_summary = self._get_current_summary_fast()
        summary_time = (time.time() - summary_start) * 1000
        timings.append(TimingStats("get_summary_fast", summary_time, datetime.now().isoformat()))
        
        # 2) Get RAG passages (with caching)
        passages, rag_time = self._get_rag_passages_fast(transcript_chunk)
        timings.append(TimingStats("rag_retrieval_fast", rag_time, datetime.now().isoformat()))
        
        rag_context = "\n\n".join(passages)

        # 3) Build prompt for Groq
        system_prompt = f"""You are an AI assistant helping emergency dispatchers during live 911 calls.

You will receive:
1. Current call summary from memory
2. Dispatcher guidelines/protocols from knowledge base
3. Current conversation context (full caller-dispatcher exchange history)
4. New caller message

Your job:
- Analyze what the caller just said in context of the full conversation
- Identify any NEW information that hasn't been addressed yet
- Avoid repeating guidance the dispatcher has already given
- Provide specific, actionable advice for what the dispatcher should do/ask next

Respond with a JSON object containing:
- "summary": array of SHORT bullet-point facts (max 5-8 words each)
- "advice": string with specific guidance for the dispatcher

CRITICAL: Keep summary bullets extremely brief and factual. Use keywords, not full sentences.
Examples of good bullets: "Caller: chest pain, 45yo male", "Location: 123 Main St", "Conscious, breathing normally"

Be concise and focus on actionable information."""

        user_prompt = f"""Current call summary:
{current_summary}

Dispatcher guidelines context:
{rag_context}

{transcript_chunk}

Analyze the conversation and provide updated summary with advice for what the dispatcher should do next."""

        # 4) Call Groq
        groq_start = time.time()
        try:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            groq_time = (time.time() - groq_start) * 1000
            timings.append(TimingStats("groq_inference", groq_time, datetime.now().isoformat()))

            # 5) Parse response
            content = response.choices[0].message.content
            
            try:
                start = content.find('{')
                end = content.rfind('}') + 1
                if start != -1 and end != 0:
                    json_str = content[start:end]
                    result = json.loads(json_str)
                else:
                    result = {
                        "summary": [transcript_chunk],
                        "advice": content
                    }
            except json.JSONDecodeError:
                result = {
                    "summary": [transcript_chunk],
                    "advice": content
                }

            # 6) Update Letta memory asynchronously (fire and forget)
            if "summary" in result and result["summary"]:
                new_summary = "\n".join([f"• {item}" for item in result["summary"]])
                # Fire and forget - don't wait for this
                import threading
                thread = threading.Thread(target=self._update_summary_async, args=(new_summary,))
                thread.daemon = True
                thread.start()
                
                timings.append(TimingStats("update_summary_async", 0, datetime.now().isoformat()))

            total_time = (time.time() - start_time) * 1000
            timings.append(TimingStats("total_processing_fast", total_time, datetime.now().isoformat()))
            
            # Convert timings to dict for JSON serialization
            timing_data = [{"operation": t.operation, "duration_ms": t.duration_ms, "timestamp": t.timestamp} 
                          for t in timings]
            
            return {
                "summary": result.get("summary", []),
                "advice": result.get("advice", ""),
                "timings": timing_data
            }

        except Exception as e:
            print(f"Error calling Groq: {e}")
            return {
                "summary": [transcript_chunk],
                "advice": "Error processing request. Please try again.",
                "timings": []
            }

def print_timings(timings):
    print("\n=== Performance Timings ===")
    for t in timings:
        print(f"{t['operation']}: {t['duration_ms']:.2f}ms")
    print("=" * 25)

if __name__ == "__main__":
    agent = DispatcherAgent()

    # Test single run
    test_text = "I have a headache since morning, since afternoon i began feeling feverish"
    
    print(f"\n{'='*50}")
    print(f"Test: Processing transcript chunk...")
    out = agent.process_chunk_fast(test_text)
    
    print("\n=== Results ===")
    print("Summary bullets:", out["summary"])
    print("Advice:", out["advice"])
    
    if "timings" in out:
        print_timings(out["timings"])
    else:
        print("No timing information available")
