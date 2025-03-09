import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

# Load Open-Source Embedding Model
# model_name = "all-MiniLM-L6-v2"
model_name = "all-mpnet-base-v2"

model = SentenceTransformer(model_name)

# Initialize FastAPI
app = FastAPI()

class TextRequest(BaseModel):
    text: str

@app.post("/generate_embedding/")
async def generate_embedding(data: TextRequest):
    try:
        if not data.text.strip():
            raise HTTPException(status_code=400, detail="❌ ERROR: Text cannot be empty.")

        # Generate Embeddings using Open-Source Model
        embedding = model.encode(data.text).tolist()

        print(f"✅ Generated Embedding: {embedding[:5]}... for text: {data.text}")  # Print first 5 numbers
        return {"embedding": embedding}

    except Exception as e:
        print(f"❌ ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"❌ ERROR: {str(e)}")

# Run the service
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3001)