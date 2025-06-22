import os
import json
from typing import List, Dict

from dotenv import load_dotenv
from openai import OpenAI
from pinecone import Pinecone
from groq import Groq
from letta_client import Letta, MessageCreate

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
            model="openai/gpt-4o-mini",  # Required for Letta Cloud, but we'll use Groq separately
            embedding="openai/text-embedding-3-small"
        )

    def _get_rag_passages(self, text: str, top_k: int = 3) -> List[str]:
        # 1) Embed the latest transcript chunk
        resp = openai_client.embeddings.create(
            model="text-embedding-ada-002",
            input=[text]
        )
        q_emb = resp.data[0].embedding

        # 2) Query Pinecone
        result = index.query(
            vector=q_emb,
            top_k=top_k,
            include_metadata=True
        )
        return [match["metadata"]["text"] for match in result["matches"]]

    def _get_current_summary(self) -> str:
        # Get current call history from Letta memory
        block = letta_client.agents.blocks.retrieve(
            agent_id=self.agent.id,
            block_label="call_history"
        )
        return block.value if block else ""

    def _update_summary(self, new_summary: str):
        # Update the call history in Letta memory
        letta_client.agents.blocks.modify(
            agent_id=self.agent.id,
            block_label="call_history",
            value=new_summary
        )

    def process_chunk(self, transcript_chunk: str) -> Dict:
        """
        Call this on every new transcript snippet.
        Returns: {"summary": [...], "advice": "..."}
        """
        # 1) Get current summary and RAG context
        current_summary = self._get_current_summary()
        passages = self._get_rag_passages(transcript_chunk)
        rag_context = "\n\n".join(passages)

        # 2) Build prompt for Groq
        system_prompt = """You are a crisis-dispatch copilot. Your job is to:
1. Update the running summary with new facts from the transcript
2. Provide concise advice based on dispatcher guidelines

Respond with a JSON object containing:
- "summary": array of bullet-point facts about the call
- "advice": string with specific guidance for the dispatcher

Be concise and focus on actionable information."""

        user_prompt = f"""Current call summary:
{current_summary}

Dispatcher guidelines context:
{rag_context}

New transcript segment:
{transcript_chunk}

Update the summary with any new facts and provide advice."""

        # 3) Call Groq
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

            # 4) Parse response
            content = response.choices[0].message.content
            
            # Try to extract JSON from the response
            try:
                # Look for JSON in the response
                start = content.find('{')
                end = content.rfind('}') + 1
                if start != -1 and end != 0:
                    json_str = content[start:end]
                    result = json.loads(json_str)
                else:
                    # Fallback if no JSON found
                    result = {
                        "summary": [transcript_chunk],
                        "advice": content
                    }
            except json.JSONDecodeError:
                # Fallback parsing
                result = {
                    "summary": [transcript_chunk],
                    "advice": content
                }

            # 5) Update Letta memory with new summary
            if "summary" in result and result["summary"]:
                new_summary = "\n".join([f"• {item}" for item in result["summary"]])
                self._update_summary(new_summary)

            return {
                "summary": result.get("summary", []),
                "advice": result.get("advice", "")
            }

        except Exception as e:
            print(f"Error calling Groq: {e}")
            return {
                "summary": [transcript_chunk],
                "advice": "Error processing request. Please try again."
            }

if __name__ == "__main__":
    agent = DispatcherAgent()

    new_text = "I have a headache since morning, since afternoon i began feeling feverish"
    out = agent.process_chunk(new_text)
    print("Summary bullets:", out["summary"])
    print("Advice:", out["advice"])
