import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from colbert.infra import ColBERTConfig
from colbert.modeling.checkpoint import Checkpoint

# Load Colbert V2 Embedding Model
ckpt = Checkpoint("jinaai/jina-colbert-v2", colbert_config=ColBERTConfig())

# Initialize FastAPI
app = FastAPI()

class TextRequest(BaseModel):
    text: str

@app.post("/generate-embedding/")
async def generate_embedding(data: TextRequest):
    try:
        if not data.text.strip():
            raise HTTPException(status_code=400, detail="❌ ERROR: Text cannot be empty.")

        # Generate Embeddings
        docs = [data.text]

        with torch.no_grad():
            query_vectors = ckpt.queryFromText(docs, bsize=1)
        
        embedding = query_vectors[0].tolist()

        print(f"✅ Generated Embedding: {embedding[:5]}... for text: {data.text}")  # Print first 5 numbers
        return {"embedding": embedding}

    except Exception as e:
        print(f"❌ ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"❌ ERROR: {str(e)}")

# Run the service
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3001)