import os
import re
import uuid
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from openai import OpenAI

# Initialize connections
# Typically the script might be run outside Docker, so we fallback to localhost if qdrant cannot be resolved, but we'll try the env var first.
qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
qdrant_client = QdrantClient(url=qdrant_url)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

COLLECTION_NAME = "id_national_laws"

def get_embedding(text):
    response = openai_client.embeddings.create(
        input=text[:8000],  # truncate if too long
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def init_qdrant_collection():
    try:
        collections = qdrant_client.get_collections().collections
        exists = any(col.name == COLLECTION_NAME for col in collections)
        
        if not exists:
            print(f"Creating collection '{COLLECTION_NAME}'...")
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
            )
            print(f"Collection '{COLLECTION_NAME}' created successfully.")
        else:
            print(f"Collection '{COLLECTION_NAME}' already exists.")
    except Exception as e:
        print(f"Error checking/creating collection: {e}")
        # If running from outside docker and qdrant URL is qdrant:6333, we can gracefully fallback:
        if "Failed to connect" in str(e) and "qdrant:6333" in qdrant_url:
            print("Fallback to http://localhost:6333. Please ensure Qdrant port is exposed or run script inside container.")

def ingest_law_file(filepath, source_name):
    print(f"Reading file: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by "Pasal " (keeping the word "Pasal")
    # This regex looks ahead for "Pasal " followed by digits (and optional letters)
    chunks = re.split(r'(?=Pasal \d+[A-Z]?)', content)
    
    points = []
    
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk.startswith("Pasal"):
            continue # Skip intros, chapters, or empty splits
            
        # Extract Pasal Number using regex
        pasal_match = re.search(r'Pasal (\d+[A-Z]?)', chunk)
        pasal_num = pasal_match.group(1) if pasal_match else "Unknown"
        
        # Get Vector embedding
        vector = get_embedding(chunk)
        
        # Create Point
        point_id = str(uuid.uuid4())
        payload = {
            "source_law": source_name,
            "pasal": pasal_num,
            "text": chunk
        }
        
        points.append(PointStruct(id=point_id, vector=vector, payload=payload))

    # Upsert to Qdrant (in batches if necessary, but for ~100s chunks, one request is fine)
    if points:
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            qdrant_client.upsert(collection_name=COLLECTION_NAME, points=batch)
            print(f"Upserted batch {i//batch_size + 1} ({len(batch)} points)")
        
        print(f"✅ Successfully ingested {len(points)} articles from {source_name} into '{COLLECTION_NAME}'.")
    else:
        print(f"No valid articles found in {source_name}.")

if __name__ == "__main__":
    init_qdrant_collection()
    
    # Ingest the target law text
    target_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "laws", "kuhperdata_buku3.txt")
    if os.path.exists(target_file):
        ingest_law_file(target_file, "KUHPerdata Buku III")
    else:
        print(f"File not found: {target_file}")
