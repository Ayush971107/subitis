import os
import json
import time
import hashlib
import threading
from typing import Dict, List, Optional, Any, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
import hashlib
import asyncio

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
        # Create a Letta agent for memory management
        self.agent = letta_client.agents.create(
            memory_blocks=[
                {
                    "label": "call_history",
                    "value": "",
                    "description": "Rolling bullet-point summary of the call so far"
                },
                {
                    "label": "full_conversation",
                    "value": "",
                    "description": "Complete conversation history in format: [role]: [message]"
                }
            ],
            system="You are a memory manager for crisis dispatch calls.",
            model="openai/gpt-4o-mini",
            embedding="openai/text-embedding-3-small"
        )
        
        # In-memory cache for embeddings and summaries
        self.embedding_cache = {}
        self.summary_cache = None
        self.conversation_cache = ""
        self.summary_cache_time = 0
        self.rag_cache = {}
        self.prev_advice_cache = ""
        
        # Add synchronization locks
        self._conversation_lock = threading.Lock()
        self._pending_update = False
        self._last_successful_cache = self.conversation_cache
        self._skip_count = 0  # Track how many updates we've skipped

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
            
    def _update_conversation_async(self, role: str, message: str):
        """Update conversation history with proper synchronization"""
        try:
            with self._conversation_lock:
                # Update in-memory cache
                new_entry = f"{role}: {message}\n"
                self.conversation_cache += new_entry
                
                # Skip update if one is already pending
                if self._pending_update:
                    self._skip_count += 1
                    if self._skip_count == 10:
                        pass  
                    return
                
                self._pending_update = True
                current_cache = self.conversation_cache
                if self._skip_count > 0:
                    pass  
                    self._skip_count = 0  # Reset skip count
            
            # Update Letta in background
            def _update():
                try:
                    letta_client.agents.blocks.modify(
                        agent_id=self.agent.id,
                        block_label="full_conversation",
                        value=current_cache
                    )
                    # Update successful cache on success
                    with self._conversation_lock:
                        self._last_successful_cache = current_cache
                    pass  
                    
                except Exception as e:
                    print(f"Warning: Failed to update conversation in Letta: {e}")
                    # Revert to last successful state on failure
                    with self._conversation_lock:
                        self.conversation_cache = self._last_successful_cache
                finally:
                    with self._conversation_lock:
                        self._pending_update = False
            
            # Run in background thread
            thread = threading.Thread(target=_update)
            thread.daemon = True
            thread.start()
            
        except Exception as e:
            print(f"Warning: Failed to update conversation cache: {e}")
            with self._conversation_lock:
                self._pending_update = False

    def _get_full_conversation(self) -> str:
        """Get the full conversation history"""
        if not self.conversation_cache:
            try:
                block = letta_client.agents.blocks.retrieve(
                    agent_id=self.agent.id,
                    block_label="full_conversation"
                )
                self.conversation_cache = block.value if block else ""
            except Exception as e:
                print(f"Warning: Failed to fetch conversation: {e}")
                self.conversation_cache = ""
        return self.conversation_cache

    def process_chunk_fast(self, transcript_chunk: str, role: str = "caller") -> Dict:
        """
        Process a chunk of conversation with role context
        
        Args:
            transcript_chunk: The text of the message
            role: Either 'caller' or 'dispatcher' to indicate who is speaking
            
        Returns: {"summary": [...], "advice": "...", "timings": [...]}
        """
        timings = []
        start_time = time.time()
        
        # 1) Update conversation history with new message
        self._update_conversation_async(role, transcript_chunk)
        
        # 2) Get current summary (with caching)
        summary_start = time.time()
        current_summary = self._get_current_summary_fast()
        conversation_history = self._get_full_conversation()
        summary_time = (time.time() - summary_start) * 1000
        timings.append(TimingStats("get_summary_and_history", summary_time, datetime.now().isoformat()))
        
        # 3) Get RAG passages (with caching) - use both current chunk and recent conversation
        rag_query = f"{transcript_chunk}\n\nRecent conversation:\n{conversation_history[-1000:]}"  # Use last ~1000 chars for context
        passages, rag_time = self._get_rag_passages_fast(rag_query)
        timings.append(TimingStats("rag_retrieval_fast", rag_time, datetime.now().isoformat()))
        
        rag_context = "\n\n".join(passages)

        # 4) Build prompt for Groq
        system_prompt = """### SYSTEM PROMPT  – Emergency-Dispatcher Copilot ###

You are an AI assistant supporting 911 dispatchers in real-time.

**INPUT (every turn)**  
1. **memory_summary** – current running summary (array of brief bullets)  
2. **guidelines** – dispatcher protocols / SOPs relevant to the call  
3. **history** – full caller–dispatcher transcript up to now  
4. **last_msg** – most recent line from caller *or* dispatcher  
5. **prev_advice** – the advice you gave on the immediately-previous turn  

**YOUR TASKS**  
- Understand the entire context, but respond **only to last_msg**.  
- Detect **new, unaddressed facts** and merge them into *memory_summary* (add or update; max 5-8 words each).  
- NEVER repeat anything found in **prev_advice**.  
- Generate **specific, actionable guidance** for the dispatcher in **atmost two bullet points**, written in **second-person** (“You should …”, “Ask …”). 
 

**OUTPUT**  
Return **only** a valid JSON object with these keys:

```json
{
  "summary": [           // updated running bullets
    "Caller: chest pain, 45 M",
    "Location: 123 Main St",
    "Conscious, breathing normal"
  ],
  "advice": [            // max 2 bullets, second-person voice
    "You should verify exact pain onset time",
    "Ask whether aspirin taken recently"
  ],
  "patient_age": 45,     // extracted age if mentioned, null if unknown
  "criticality_level": "medium"  // "low", "medium", "high", or "critical"
}
```

**CRITICALITY LEVELS:**
- **low**: Minor injuries, non-urgent medical issues
- **medium**: Moderate pain, stable vital signs, non-life-threatening
- **high**: Severe symptoms, potential for deterioration, urgent response needed  
- **critical**: Life-threatening, cardiac arrest, severe trauma, immediate response required
"""
        user_prompt = f"""=== CURRENT CALL SUMMARY ===
{current_summary}

=== APPLICABLE GUIDELINES ===
{rag_context}

=== FULL CONVERSATION HISTORY ===
{conversation_history}

=== PREVIOUS ADVICE GIVEN ===
{self.prev_advice_cache or "None (first turn)"}

=== ANALYSIS REQUEST ===
The above is the complete conversation history. The most recent message was from the {role}.

Please analyze the conversation and provide:
1. An updated summary of key facts
2. Advice for what the dispatcher should do/say next

Remember: DO NOT repeat anything from the "Previous Advice Given" section above. Avoid giving similar advice or asking about the same topics that were already covered in previous advice."""
        # 4) Call Groq
        groq_start = time.time()
        try:
            response = groq_client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
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
                        "advice": content,
                        "patient_age": None,
                        "criticality_level": "low"
                    }
            except json.JSONDecodeError:
                result = {
                    "summary": [transcript_chunk],
                    "advice": content,
                    "patient_age": None,
                    "criticality_level": "low"
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

            # Update prev_advice cache with the new advice (regardless of role)
            if "advice" in result:
                self.prev_advice_cache = result["advice"]
                
            total_time = (time.time() - start_time) * 1000
            timings.append(TimingStats("total_processing_fast", total_time, datetime.now().isoformat()))
            
            # Convert timings to dict for JSON serialization
            timing_data = [{"operation": t.operation, "duration_ms": t.duration_ms, "timestamp": t.timestamp} 
                          for t in timings]
            
            return {
                "summary": result.get("summary", []),
                "advice": result.get("advice", ""),
                "patient_age": result.get("patient_age", None),
                "criticality_level": result.get("criticality_level", "low"),
                "timings": timing_data
            }

        except Exception as e:
            print(f"Error calling Groq: {e}")
            return {
                "summary": [transcript_chunk],
                "advice": "Error processing request. Please try again.",
                "patient_age": None,
                "criticality_level": "low",
                "timings": []
            }

# def print_timings(timings):
#     print("\n=== Performance Timings ===")
#     for t in timings:
#         print(f"{t['operation']}: {t['duration_ms']:.2f}ms")
#     print("=" * 25)

# if __name__ == "__main__":
#     agent = DispatcherAgent()

#     # Example conversation flow
#     conversation = [
#         ("caller", "911, what's your emergency?"),
#         ("dispatcher", "Hello, this is 911. What's your emergency?"),
#         ("caller", "I have a really bad headache and fever since this morning"),
#         ("dispatcher", "I'm sorry to hear that. Can you tell me if you're having any other symptoms?"),
#         ("caller", "Yes, I also feel nauseous and my temperature is 101.5"),
#         ("dispatcher", "I'll get help to you right away. Are you alone right now?")
#     ]
    
#     print(f"\n{'='*50}")
#     print("Simulating conversation...\n")
    
#     for i, (role, text) in enumerate(conversation, 1):
#         print(f"{role.upper()}: {text}")
        
#         # Only process dispatcher messages to generate responses
#         if role == "dispatcher":
#             print("\nProcessing dispatcher message...")
#             out = agent.process_chunk_fast(text, role=role)
            
#             print("\n=== Assistant Analysis ===")
#             print("Updated Summary:")
#             for point in out["summary"]:
#                 print(f"- {point}")
#             print("\nSuggested Next Steps:", out["advice"])
            
#             if "timings" in out:
#                 print("\nPerformance Timings:")
#                 print_timings(out["timings"])
#             print("\n" + "-"*50 + "\n")
