# main.py
from fastapi import FastAPI
from routes.embedding import embedding_router

app = FastAPI()
app.include_router(embedding_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=3001)
