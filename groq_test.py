import os
from openai import OpenAI
from pinecone import Pinecone
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("subitis-guides")
groq = Groq(api_key=os.getenv("GROQ_API_KEY"))

def rag_answer(question: str, top_k: int = 5) -> str:
    q_resp = openai.embeddings.create(
        model="text-embedding-ada-002",
        input=[question]
    )
    q_emb = q_resp.data[0].embedding

    result = index.query(
        vector=q_emb,
        top_k=top_k,
        include_metadata=True
    )
    passages = [m['metadata']['text'] for m in result['matches']]

    prompt = (
        "Use only the context below to answer the question.\n\n"
        + "\n\n".join(passages)
        + f"\n\nQuestion: {question}"
    )

    chat = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    return chat.choices[0].message.content

if __name__ == "__main__":
    print(rag_answer("Who can i disclose Confidential Information to"))