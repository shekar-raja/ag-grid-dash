from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from typing import List
import faiss
import numpy as np
import os

class TextItem(BaseModel):
    _id: str  # Ensure _id is received as a string
    text: str # Ensure text is a string

class TextBatchRequest(BaseModel):
    texts: List[TextItem]  # Expecting a list of TextItem objects

class QueryRequest(BaseModel):
    text: str

class EmbeddingData(BaseModel):
    ids: List[int]
    embeddings: List[List[List[float]]]


INDEX_PATH = os.path.join(os.path.dirname(__file__), "faiss_index.bin")
ckpt = None

# Initialize FastAPI
app = FastAPI()

# FAISS Index (128-dim embeddings)
embedding_dim = 4096
index = faiss.IndexFlatL2(embedding_dim)  
opportunity_ids = []  # Store opportunity IDs

def load_colbert_model():
    """Load Jina ColBERT Model Only When Needed"""
    global ckpt
    if ckpt is None:
        from colbert.infra import ColBERTConfig
        from colbert.modeling.checkpoint import Checkpoint
        print("Loading Jina ColBERT Model...")
        ckpt = Checkpoint("jinaai/jina-colbert-v2", colbert_config=ColBERTConfig())
        print("Jina ColBERT Model Loaded!")

def save_faiss_index():
    """ Save FAISS index to disk """
    faiss.write_index(index, INDEX_PATH)
    print(f"FAISS index saved to {INDEX_PATH}")

def load_faiss_index():
    """ Load FAISS index from disk if available """
    global index
    if os.path.exists(INDEX_PATH):
        print(f"Loading FAISS index from {INDEX_PATH}...")
        index = faiss.read_index(INDEX_PATH)
        print("FAISS index loaded successfully")
    else:
        print("⚠ No FAISS index found. You need to index embeddings first.")

# Load FAISS index at startup
load_faiss_index()

@app.post("/generate-embedding/")
async def generate_embedding(data: TextBatchRequest):
    try:
        if not data.texts:
            raise HTTPException(status_code=400, detail="❌ ERROR: Texts cannot be empty.")

        load_colbert_model()

        # Extract texts from the request
        texts = [item.text for item in data.texts if item.text.strip()]

        if not texts:
            raise HTTPException(status_code=400, detail="❌ ERROR: No valid texts provided.")

        with torch.no_grad():
            query_vectors = ckpt.queryFromText(texts, bsize=len(texts))  # Batch processing

        embeddings = [vector.tolist() for vector in query_vectors]

        # Return embeddings mapped to corresponding document _id
        return {"embeddings": embeddings}

    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"❌ ERROR: {str(e)}")

@app.post("/generate-query-embedding/")
async def generate_embedding(request: QueryRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="❌ ERROR: Query text cannot be empty.")
        
        load_colbert_model()
        

        with torch.no_grad():
            embedding_vectors = ckpt.queryFromText([request.text], bsize=1)
        
            embedding = embedding_vectors[0].tolist()

        return {"embedding": embedding}
    except Exception as e:
        print(f"❌ ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"❌ ERROR: {str(e)}")

@app.post("/index-embeddings/")
async def indexVectorEmbeddings(data: EmbeddingData):
    try:
        global opportunity_ids

        print("Indexing embeddings in FIASS")

        num_docs = len(data.ids)

        if num_docs == 0:
            raise HTTPException(status_code=400, detail="No embeddings provided")

        embeddings_np = np.array(data.embeddings, dtype=np.float32)

        reshaped_embeddings = embeddings_np.reshape(num_docs, -1)

        print(f"Reshaped embeddings: {reshaped_embeddings.shape}")

        index.add(reshaped_embeddings)
        opportunity_ids.extend(data.ids)
        
        # Save FAISS index after indexing
        save_faiss_index()

        return {"message": f"Successfully indexed {num_docs} embeddings in FAISS"}
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500)

# @app.post("/search/")
# async def performSemanticSearch()

# Run the service
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3001)