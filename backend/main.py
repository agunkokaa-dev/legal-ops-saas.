import os
import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from supabase import create_client, Client
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from openai import OpenAI
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import uuid
from graph import clm_graph

load_dotenv()

app = FastAPI(title="CLAUSE Intelligent Engine", version="1.1.0")

# --- INISIALISASI ---
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
qdrant = QdrantClient(url=os.getenv("QDRANT_URL", "http://qdrant:6333"))
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
COLLECTION_NAME = "contracts_vectors"

existing_collections = qdrant.get_collections().collections
collection_names = [col.name for col in existing_collections]

if COLLECTION_NAME not in collection_names:
    qdrant.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    )

# =====================================================================
# 1. STEP 3: SECURITY HARDENING (MAGIC NUMBERS VALIDATION)
# =====================================================================
@app.post("/api/upload")
async def upload_contract(
    file: UploadFile = File(...),
    tenant_id: str = Form(...)
):
    # Validasi 1: Ekstensi Kasar
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Hanya menerima file berformat PDF.")

    contents = await file.read()
    
    # Validasi 2: OWASP Magic Numbers (PDF Signature '%PDF-')
    if not contents.startswith(b'%PDF-'):
        raise HTTPException(status_code=403, detail="Peringatan Keamanan: File ini mencoba menyamar sebagai PDF. Ditolak.")

    try:
        pdf_reader = PdfReader(io.BytesIO(contents))
        text_content = ""
        for page_num, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            if text:
                text_content += f"[Page {page_num + 1}] " + text + "\n" # Metadata Halaman untuk Sitasi

        if not text_content.strip():
            raise HTTPException(status_code=400, detail="Kami tidak dapat membaca dokumen ini. Pastikan PDF tidak dienkripsi atau berupa gambar hasil scan tanpa OCR.")

        contract_id = str(uuid.uuid4())
        
        # Invoke the Multi-Agent Workflow
        print(f"Invoking LangGraph for {file.filename}...")
        final_state = clm_graph.invoke({
            "contract_id": contract_id,
            "raw_document": text_content[:15000] # Limiting context window for safety
        })
        print(f"LangGraph execution complete with score: {final_state.get('risk_score')}")

        # Map the numerical risk_score to categorical classification
        score = final_state.get("risk_score", 0.0)
        if score >= 75.0:
            risk_level = "High"
        elif score >= 40.0:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Update Supabase integration
        supabase.table("contracts").insert({
            "id": contract_id, 
            "tenant_id": tenant_id, 
            "title": file.filename,
            "contract_value": final_state.get("contract_value", "Unknown"),
            "end_date": final_state.get("end_date", "Unknown"),
            "risk_level": risk_level
        }).execute()
        
        # Existing Vector Embedding
        response = openai_client.embeddings.create(input=text_content[:8000], model="text-embedding-3-small")
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[PointStruct(
                id=contract_id, vector=response.data[0].embedding,
                payload={"tenant_id": tenant_id, "contract_id": contract_id, "text": text_content[:1500]}
            )]
        )
        return {
            "status": "success", 
            "message": "Dokumen aman dan berhasil diindeks beserta analisa AI.",
            "smart_metadata": final_state
        }
    except Exception as e:
        print(f"API Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================================
# 2. STEP 1: THE INTELLIGENCE LAYER (EVIDENCE-BASED CHAT & TENANT ISOLATION)
# =====================================================================
@app.post("/api/chat")
async def chat_with_clause(
    question: str = Form(...),
    tenant_id: str = Form(...)
):
    try:
        # 1. Ubah pertanyaan jadi angka (Vector)
        question_vector = openai_client.embeddings.create(input=question, model="text-embedding-3-small").data[0].embedding

        # 2. Pencarian Ketat (Strict Tenant Isolation) - RAG
        search_results = qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=question_vector,
            limit=3,
            # INI ADALAH KUNCI UTAMA KEAMANAN RAG MULTI-TENANT:
            query_filter=Filter(
                must=[FieldCondition(key="tenant_id", match=MatchValue(value=tenant_id))]
            )
        )

        if not search_results:
            return {"answer": "Maaf, saya tidak menemukan dokumen yang relevan di brankas perusahaan Anda untuk menjawab ini.", "citations": []}

        # 3. Kumpulkan Bukti (Context Injection)
        context = ""
        citations = []
        for hit in search_results:
            context += f"Sumber Dokumen: {hit.payload.get('text', '')}\n---\n"
            citations.append({"contract_id": hit.payload.get('contract_id')})

        # 4. Prompt Engineering untuk LLM
        system_prompt = f"""Anda adalah CLAUSE, asisten hukum AI senior. Jawab pertanyaan hanya berdasarkan konteks dokumen berikut. 
        Jika jawabannya tidak ada di dokumen, katakan 'Data tidak ditemukan'. Jangan berhalusinasi.
        
        KONTEKS DOKUMEN:
        {context}"""

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini", # Gunakan model yang lebih cepat/murah untuk MVP
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ]
        )

        return {
            "answer": response.choices[0].message.content,
            "citations": citations
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))