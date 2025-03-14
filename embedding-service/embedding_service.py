from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from colbert.infra import ColBERTConfig
from colbert.modeling.checkpoint import Checkpoint
from typing import List

# Load Colbert V2 Embedding Model
ckpt = Checkpoint("jinaai/jina-colbert-v2", colbert_config=ColBERTConfig())

# Initialize FastAPI
app = FastAPI()

class TextItem(BaseModel):
    _id: str  # Ensure _id is received as a string
    text: str # Ensure text is a string

class TextBatchRequest(BaseModel):
    texts: List[TextItem]  # Expecting a list of TextItem objects

@app.post("/generate-embedding/")
async def generate_embedding(data: TextBatchRequest):
    try:
        global ckpt

        if not data.texts:
            raise HTTPException(status_code=400, detail="❌ ERROR: Texts cannot be empty.")

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
        print(f"❌ ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"❌ ERROR: {str(e)}")

# Run the service
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3001)