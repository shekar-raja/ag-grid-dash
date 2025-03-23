from fastapi import APIRouter, HTTPException
import torch
import numpy as np

from schemas.models import TextBatchRequest, QueryRequest, EmbeddingData
from services.colbert import load_colbert_model
from services import faiss_index as index_service

embedding_router = APIRouter()

index_service.load_faiss_indexes()
ckpt = load_colbert_model()

@embedding_router.post("/generate-embedding/")
async def generate_embedding(data: TextBatchRequest):
    try:
        if not data.texts:
            raise HTTPException(status_code=400, detail="❌ ERROR: Texts cannot be empty.")

        texts = [item.text for item in data.texts if item.text.strip()]
        if not texts:
            raise HTTPException(status_code=400, detail="❌ ERROR: No valid texts provided.")

        with torch.no_grad():
            query_vectors = ckpt.queryFromText(texts, bsize=len(texts))

        embeddings = [vector.tolist() for vector in query_vectors]
        return {"embeddings": embeddings}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@embedding_router.post("/generate-query-embedding/")
async def generate_query_embedding(request: QueryRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="❌ ERROR: Query text cannot be empty.")

        with torch.no_grad():
            vectors = ckpt.queryFromText([request.text], bsize=1)
            embedding = vectors[0].tolist()

        return {"embedding": embedding}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@embedding_router.post("/index-embeddings/")
async def index_embeddings(data: EmbeddingData):
    try:
        table_name = data.table_name

        if table_name not in index_service.table_indexes:
            print(f"Creating new FAISS index for '{table_name}'")
            index_service.table_indexes[table_name] = index_service.create_faiss_index(index_service.embedding_dim)
            index_service.row_ids[table_name] = []

        index = index_service.table_indexes[table_name]

        embeddings_np = np.array(data.embeddings, dtype=np.float32).reshape(len(data.ids), -1)
        index.add(embeddings_np)
        index_service.row_ids[table_name].extend(data.ids)
        index_service.save_faiss_index(table_name)

        return {"message": f"Successfully indexed {len(data.ids)} embeddings in FAISS for '{table_name}'"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@embedding_router.post("/search/")
async def search(request: QueryRequest):
    try:
        table_name = request.table_name

        if table_name not in index_service.table_indexes:
            raise HTTPException(status_code=404, detail=f"FAISS index for '{table_name}' not found.")

        index = index_service.table_indexes[table_name]
        if index.ntotal == 0:
            raise HTTPException(status_code=400, detail=f"FAISS index for '{table_name}' is empty.")

        with torch.no_grad():
            embedding = ckpt.queryFromText([request.text], bsize=1)[0].tolist()

        query_np = np.array([embedding], dtype=np.float32).reshape(1, -1)
        distances, indices = index.search(query_np, request.top_k)

        matched_ids = [index_service.row_ids[table_name][i] for i in indices[0] if i < len(index_service.row_ids[table_name])]
        return {"matched_ids": matched_ids, "distances": distances[0].tolist()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))