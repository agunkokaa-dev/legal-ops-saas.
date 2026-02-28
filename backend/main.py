import os
import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from qdrant_client import models
from openai import OpenAI
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import uuid
from graph import clm_graph

load_dotenv()

app = FastAPI(title="CLAUSE Intelligent Engine", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INISIALISASI ---
# Use Service Role Key if available to bypass RLS for backend data fetching
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(os.getenv("SUPABASE_URL"), supabase_key)
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

class MatterCreate(BaseModel):
    name: str
    description: str
    tenant_id: str

@app.post("/api/matters")
async def create_matter(matter: MatterCreate):
    try:
        matter_id = str(uuid.uuid4())
        response = supabase.table("matters").insert({
            "id": matter_id,
            "tenant_id": matter.tenant_id,
            "name": matter.name,
            "description": matter.description
        }).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        print(f"API Create Matter Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/matters")
async def get_matters(tenant_id: str):
    try:
        if not tenant_id:
            raise HTTPException(status_code=400, detail="tenant_id is required")
        response = supabase.table("matters").select("*").eq("tenant_id", tenant_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        print(f"API Get Matters Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================================
# 1. STEP 3: SECURITY HARDENING (MAGIC NUMBERS VALIDATION)
# =====================================================================
@app.post("/api/upload")
async def upload_contract(
    file: UploadFile = File(...),
    tenant_id: str = Form(...),
    matter_id: str = Form(None),
    contract_id: str = Form(None)
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

        if not contract_id:
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

        # Check if record already exists to determine update vs insert (Simpler)
        existing = supabase.table("contracts").select("id").eq("id", contract_id).execute()
        
        if existing.data and len(existing.data) > 0:
            # We already have a contract seeded (from frontend Storage logic). Update AI outputs.
            supabase.table("contracts").update({
                "contract_value": final_state.get("contract_value", "Unknown"),
                "end_date": final_state.get("end_date", "Unknown"),
                "risk_level": risk_level,
                "counter_proposal": final_state.get("counter_proposal"),
                "draft_revisions": final_state.get("draft_revisions")
            }).eq("id", contract_id).execute()
        else:
            # Standalone dashboard upload. Insert completely new row.
            supabase.table("contracts").insert({
                "id": contract_id, 
                "tenant_id": tenant_id, 
                "matter_id": matter_id,
                "title": file.filename,
                "contract_value": final_state.get("contract_value", "Unknown"),
                "end_date": final_state.get("end_date", "Unknown"),
                "risk_level": risk_level,
                "counter_proposal": final_state.get("counter_proposal"),
                "draft_revisions": final_state.get("draft_revisions")
            }).execute()
        
        # =====================================================================
        # DEAL GENEALOGY: Persist Obligations & Clauses from LangGraph Agents
        # =====================================================================
        
        # Insert extracted obligations into contract_obligations
        obligations = final_state.get("extracted_obligations", [])
        if obligations:
            obligations_data = [
                {
                    "tenant_id": tenant_id,
                    "contract_id": contract_id,
                    "description": ob.get("description", ""),
                    "due_date": ob.get("due_date"),  # Can be null
                    "status": "pending"
                }
                for ob in obligations if ob.get("description")
            ]
            if obligations_data:
                try:
                    supabase.table("contract_obligations").insert(obligations_data).execute()
                    print(f"✅ Inserted {len(obligations_data)} obligations for contract {contract_id}")
                except Exception as ob_err:
                    print(f"⚠️ Failed to insert obligations: {ob_err}")

        # Insert classified clauses into contract_clauses
        clauses = final_state.get("classified_clauses", [])
        if clauses:
            clauses_data = [
                {
                    "tenant_id": tenant_id,
                    "contract_id": contract_id,
                    "clause_type": cl.get("clause_type", "Other"),
                    "original_text": cl.get("original_text", ""),
                    "ai_summary": cl.get("ai_summary")
                }
                for cl in clauses if cl.get("original_text")
            ]
            if clauses_data:
                try:
                    supabase.table("contract_clauses").insert(clauses_data).execute()
                    print(f"✅ Inserted {len(clauses_data)} clauses for contract {contract_id}")
                except Exception as cl_err:
                    print(f"⚠️ Failed to insert clauses: {cl_err}")
        
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
            limit=20, # Increased limit to bypass ghost vector pollution

            # INI ADALAH KUNCI UTAMA KEAMANAN RAG MULTI-TENANT:
            query_filter=Filter(
                must=[FieldCondition(key="tenant_id", match=MatchValue(value=tenant_id))]
            )
        )

        if not search_results:
            return {"answer": "Maaf, saya tidak menemukan dokumen yang relevan di brankas perusahaan Anda untuk menjawab ini.", "citations": []}

        # 3. Handle Ghost Data and Fetch Context Enrichment
        contract_ids = list(set([str(hit.payload.get('contract_id')) for hit in search_results if hit.payload.get('contract_id')]))
        
        valid_contracts = {}
        if contract_ids:
            try:
                print(f"Current Tenant ID in chat: {tenant_id}")
                # Query contracts table to ensure they still exist (Fixes Ghost Data)
                # and extract risk_level and metadata (Context Enrichment)
                supabase_response = supabase.table("contracts").select("*").in_("id", contract_ids).execute()
                for record in supabase_response.data:
                    valid_contracts[str(record['id'])] = record
            except Exception as e:
                print(f"Error fetching contract metadata: {e}")

        print(f"Qdrant Contract IDs: {contract_ids}")
        print(f"Supabase Valid Contracts: {list(valid_contracts.keys())}")

        # 4. Kumpulkan Bukti (Context Injection) & Clean Ghost Data
        context = ""
        citations = []
        for hit in search_results:
            contract_id = str(hit.payload.get('contract_id'))
            
            # If contract is not in Supabase, it's Ghost Data (deleted), so we PERMANENTLY delete it from Qdrant.
            if contract_id not in valid_contracts:
                try:
                    qdrant.delete(
                        collection_name=COLLECTION_NAME, 
                        wait=False, 
                        points_selector=models.Filter(must=[models.FieldCondition(key="contract_id", match=models.MatchValue(value=contract_id))])
                    )
                    print(f"Permanently deleted Ghost Contract ID from Qdrant: {contract_id}")
                except Exception as e:
                    print(f"Error deleting ghost vector: {e}")
                continue

            contract_meta = valid_contracts[contract_id]
            risk_level = contract_meta.get('risk_level', 'Unknown')
            # Extract smart_metadata (e.g. LangGraph risk assessment/compliance issues)
            # Safely fallback to 'metadata' or 'smart_metadata'
            smart_meta = contract_meta.get('smart_metadata', contract_meta.get('metadata', 'None'))
            file_title = contract_meta.get('title', contract_meta.get('file_name', 'Unknown Document'))

            context += "Sumber Dokumen:\n"
            context += f"Judul Dokumen: {file_title}\n"
            context += f"Raw Text: {hit.payload.get('text', '')}\n"
            context += f"LangGraph Risk Assessment untuk dokumen ini: Risk Level: {risk_level}, Metadata: {smart_meta}\n---\n"
            
            # Avoid duplicate citations for the same document
            if not any(cite['contract_id'] == contract_id for cite in citations):
                citations.append({
                    "contract_id": contract_id, 
                    "file_name": file_title
                })

        if not citations:
            return {"answer": "Maaf, seluruh dokumen relevan yang ditemukan sudah dihapus dari sistem (Ghost Data) atau fitur pencarian gagal.", "citations": []}

        # 5. Prompt Engineering untuk LLM
        system_prompt = f"""Anda adalah CLAUSE, Manajer Portofolio Hukum AI (AI Legal Portfolio Manager) tingkat Enterprise yang sangat profesional, sopan, dan analitis.
        Tugas Anda adalah merangkum, mengevaluasi, dan membandingkan informasi dari KESELURUHAN DOKUMEN yang diberikan di konteks.
        Jawablah pertanyaan secara general dan komprehensif. Jangan hanya terfokus pada satu dokumen jika terdapat beberapa dokumen relevan.

        PANDUAN MENJAWAB:
        1. Jika pengguna bertanya tentang "risiko", "bahaya", atau "kepatuhan" secara umum di portofolio mereka, SELALU identifikasi dan urutkan berdasarkan 'Risk Level' dan 'Metadata' dari dokumen-dokumen yang terlampir. Uraikan dokumen mana yang berisiko tinggi dan mana yang aman.
        2. Jika seluruh dokumen berisiko rendah atau tidak ada klausa berbahaya, JANGAN menjawab "Data tidak ditemukan". Berikan ringkasan manajerial yang profesional, contoh: "Berdasarkan analisis portofolio, dokumen-dokumen Anda saat ini diklasifikasikan sebagai [Risk Level]. Tidak terdapat klausa agregat yang membahayakan, namun perhatikan catatan kepatuhan berikut pada masing-masing kontrak: [Ringkasan Metadata]."
        3. Jika informasi yang ditanyakan benar-benar tidak tertuang dalam teks maupun metadata portofolio, jawab dengan sopan: "Maaf, usai menelusuri portofolio Anda, informasi spesifik mengenai hal tersebut tidak tertuang di dalam dokumen yang dianalisis."
        4. Gunakan bahasa Indonesia yang baku, terstruktur, elegan, dan berorientasi pada eksekutif pengambil keputusan.

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