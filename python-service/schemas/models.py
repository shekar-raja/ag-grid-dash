# schemas/models.py
from pydantic import BaseModel
from typing import List

class TextItem(BaseModel):
    _id: str
    text: str

class TextBatchRequest(BaseModel):
    texts: List[TextItem]

class QueryRequest(BaseModel):
    table_name: str
    text: str
    top_k: int = 20

class EmbeddingData(BaseModel):
    table_name: str
    ids: List[int]
    embeddings: List[List[List[float]]]
