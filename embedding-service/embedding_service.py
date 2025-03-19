from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from typing import List, Dict
import faiss
import numpy as np
import os
import json

class TextItem(BaseModel):
    _id: str  # Ensure _id is received as a string
    text: str # Ensure text is a string

class TextBatchRequest(BaseModel):
    texts: List[TextItem]  # Expecting a list of TextItem objects

class QueryRequest(BaseModel):
    table_name: str
    text: str
    top_k: int = 20

class EmbeddingData(BaseModel):
    table_name: str
    ids: List[int]
    embeddings: List[List[List[float]]]

ckpt = None

# Initialize FastAPI
app = FastAPI()

def load_colbert_model():
    """Load Jina ColBERT Model Only When Needed"""
    global ckpt
    if ckpt is None:
        from colbert.infra import ColBERTConfig
        from colbert.modeling.checkpoint import Checkpoint
        print("Loading Jina ColBERT Model...")
        ckpt = Checkpoint("jinaai/jina-colbert-v2", colbert_config=ColBERTConfig())
        print("Jina ColBERT Model Loaded!")

FAISS_INDEX_DIR = os.path.join(os.path.dirname(__file__), "indexes")
os.makedirs(FAISS_INDEX_DIR, exist_ok=True)

# Store FAISS indexes and row IDs per table
table_indexes: Dict[str, faiss.Index] = {}
row_ids: Dict[str, List[int]] = {}

# FAISS Index Configuration
embedding_dim = 4096 

def get_index_path(table_name):
    """ Generate FAISS index file path for a specific table inside 'indexes/' """
    return os.path.join(FAISS_INDEX_DIR, f"{table_name}_faiss.bin")


def get_id_path(table_name):
    """ Generate JSON file path for storing PostgreSQL row IDs """
    return os.path.join(FAISS_INDEX_DIR, f"{table_name}_row_ids.json")

def create_faiss_index(embedding_dim):
    """ Create a new FAISS index for a table """
    return faiss.IndexFlatL2(embedding_dim)

def save_faiss_index(table_name):
    """ Save FAISS index and corresponding PostgreSQL row IDs for a specific table """
    if table_name in table_indexes:
        index_path = get_index_path(table_name)
        faiss.write_index(table_indexes[table_name], index_path)
        
        # Save row IDs as JSON
        id_path = get_id_path(table_name)
        with open(id_path, "w") as f:
            json.dump(row_ids.get(table_name, []), f)

        print(f"FAISS index and row IDs saved for '{table_name}'.")

def load_faiss_indexes():
    """ Load all FAISS indexes and corresponding row IDs from 'indexes/' at startup """
    global table_indexes, row_ids
    for file in os.listdir(FAISS_INDEX_DIR):
        if file.endswith("_faiss.bin"):
            table_name = file.replace("_faiss.bin", "")
            index_path = get_index_path(table_name)
            id_path = get_id_path(table_name)
            
            try:
                # Load FAISS index
                table_indexes[table_name] = faiss.read_index(index_path)

                # Load row IDs
                if os.path.exists(id_path):
                    with open(id_path, "r") as f:
                        row_ids[table_name] = json.load(f)
                else:
                    row_ids[table_name] = []

                print(f"Loaded FAISS index and row IDs for '{table_name}'")
            except Exception as e:
                print(f"ERROR loading FAISS index for '{table_name}': {e}")

# Load FAISS index at startup
load_faiss_indexes()

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

        if ckpt is None:        
            load_colbert_model()

        with torch.no_grad():
            embedding_vectors = ckpt.queryFromText([request.text], bsize=1)
        
            embedding = embedding_vectors[0].tolist()

        return {"embedding": embedding}
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"❌ ERROR: {str(e)}")

@app.post("/index-embeddings/")
async def indexVectorEmbeddings(data: EmbeddingData):
    try:
        table_name = data.table_name

        # Initialize FAISS index if not exists
        if table_name not in table_indexes:
            print(f"Creating new FAISS index for '{table_name}'")
            table_indexes[table_name] = create_faiss_index(embedding_dim)
            row_ids[table_name] = []

        index = table_indexes[table_name]

        num_docs = len(data.ids)
        if num_docs == 0:
            raise HTTPException(status_code=400, detail="No embeddings provided")

        # Convert embeddings to numpy
        embeddings_np = np.array(data.embeddings, dtype=np.float32).reshape(num_docs, -1)

        print(f"Indexing {num_docs} embeddings for '{table_name}'")

        # Add to FAISS index
        index.add(embeddings_np)

        # Store row IDs
        row_ids[table_name].extend(data.ids)

        # Save FAISS index and row IDs
        save_faiss_index(table_name)

        return {"message": f"Successfully indexed {num_docs} embeddings in FAISS for '{table_name}'"}

    except Exception as e:
        print(f"❌ ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/")
async def performSemanticSearch(request: QueryRequest):
    try:
        table_name = request.table_name

        if table_name not in table_indexes:
            raise HTTPException(status_code=404, detail=f"FAISS index for '{table_name}' not found.")

        if ckpt is None:        
            load_colbert_model()

        index = table_indexes[table_name]

        if index.ntotal == 0:
            raise HTTPException(status_code=400, detail=f"FAISS index for '{table_name}' is empty.")

        print(f"Searching FAISS for '{table_name}'")

        # Generate query embedding
        with torch.no_grad():
            query_embedding = ckpt.queryFromText([request.text], bsize=1)[0].tolist()

        query_np = np.array([query_embedding], dtype=np.float32).reshape(1, -1)

        # Perform FAISS search
        distances, indices = index.search(query_np, request.top_k)

        print(f"Found {len(indices[0])} matches.")

        # Convert FAISS indices to actual PostgreSQL row IDs
        matched_ids = [row_ids[table_name][i] for i in indices[0] if i < len(row_ids[table_name])]

        return {"matched_ids": matched_ids, "distances": distances[0].tolist()}

    except Exception as e:
        print(f"❌ ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Run the service
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3001)