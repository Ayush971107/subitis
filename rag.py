import os
import time
import logging
from glob import glob
from typing import List, Tuple

import tiktoken
from openai import OpenAI, RateLimitError, APITimeoutError, APIError, APIConnectionError, InternalServerError
from pinecone import Pinecone, ServerlessSpec
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, before_sleep_log
import dotenv

dotenv.load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("rag_index.log")],
)
logger = logging.getLogger(__name__)

# embedding & Pinecone
OPENAI_EMBED_MODEL = "text-embedding-ada-002"
EMBED_BATCH_SIZE     = 50
UPSERT_BATCH_SIZE    = 50
INDEX_NAME           = "subitis-guides"

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pinecone_api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=pinecone_api_key)

if INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=INDEX_NAME,
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )
index = pc.Index(INDEX_NAME)

enc = tiktoken.get_encoding("cl100k_base")

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(min=2, max=60),
    retry=retry_if_exception_type((RateLimitError, APITimeoutError, APIError, APIConnectionError, InternalServerError)),
    before_sleep=before_sleep_log(logger, logging.WARNING)
)
def get_embeddings(texts: List[str]) -> List[List[float]]:
    resp = openai_client.embeddings.create(
        model=OPENAI_EMBED_MODEL,
        input=texts
    )
    return [d.embedding for d in resp.data]

def chunk_text(md: str, max_tokens: int = 500) -> List[str]:
    """Split markdown into chunks of ≤max_tokens (approx)."""
    paragraphs = md.split("\n\n")
    chunks, current = [], []
    curr_tokens = 0

    for para in paragraphs:
        tlen = len(enc.encode(para))
        if tlen > max_tokens:
            for sent in para.split(". "):
                stok = len(enc.encode(sent + "."))
                if curr_tokens + stok > max_tokens:
                    chunks.append("\n\n".join(current))
                    current, curr_tokens = [], 0
                current.append(sent + ".")
                curr_tokens += stok
        else:
            if curr_tokens + tlen > max_tokens:
                chunks.append("\n\n".join(current))
                current, curr_tokens = [], 0
            current.append(para)
            curr_tokens += tlen

    if current:
        chunks.append("\n\n".join(current))
    return chunks

def process_file(path: str):
    text = open(path, encoding="utf-8").read()
    chunks = chunk_text(text, max_tokens=500)
    logger.info(f"{os.path.basename(path)} → {len(chunks)} chunks")

    items = [
        (f"{os.path.splitext(os.path.basename(path))[0]}_chunk_{i}", chunk)
        for i, chunk in enumerate(chunks, 1)
    ]

    for i in range(0, len(items), EMBED_BATCH_SIZE):
        batch = items[i : i + EMBED_BATCH_SIZE]
        ids, texts = zip(*batch)
        embeddings = get_embeddings(list(texts))

        vectors = list(zip(ids, embeddings))
        for j in range(0, len(vectors), UPSERT_BATCH_SIZE):
            sub = vectors[j : j + UPSERT_BATCH_SIZE]
            index.upsert(vectors=sub)
            logger.info(f"Upserted {len(sub)} vectors from {os.path.basename(path)}")

if __name__ == "__main__":
    start = time.time()
    md_files = [
        "DC_Crisis_Line_Responder_Training_Manual_structured.md",
        "Dispatch_Training_Manual_structured.md"
    ]
    total = 0

    for md in md_files:
        process_file(md)
        total += 1

    logger.info(f"✅ Indexed {total} files in {time.time() - start:.1f}s")
