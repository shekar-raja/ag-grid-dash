import faiss
import numpy as np
import os
import json
from typing import Dict, List

FAISS_INDEX_DIR = os.path.join(os.path.dirname(__file__), "..", "indexes")
os.makedirs(FAISS_INDEX_DIR, exist_ok=True)

table_indexes: Dict[str, faiss.Index] = {}
row_ids: Dict[str, List[int]] = {}
embedding_dim = 4096

def get_index_path(table_name):
    return os.path.join(FAISS_INDEX_DIR, f"{table_name}_faiss.bin")

def get_id_path(table_name):
    return os.path.join(FAISS_INDEX_DIR, f"{table_name}_row_ids.json")

def create_faiss_index(dim: int):
    return faiss.IndexFlatL2(dim)

def save_faiss_index(table_name: str):
    if table_name in table_indexes:
        faiss.write_index(table_indexes[table_name], get_index_path(table_name))
        with open(get_id_path(table_name), "w") as f:
            json.dump(row_ids.get(table_name, []), f)
        print(f"FAISS index and row IDs saved for '{table_name}'.")

def load_faiss_indexes():
    for file in os.listdir(FAISS_INDEX_DIR):
        if file.endswith("_faiss.bin"):
            table_name = file.replace("_faiss.bin", "")
            try:
                table_indexes[table_name] = faiss.read_index(get_index_path(table_name))
                if os.path.exists(get_id_path(table_name)):
                    with open(get_id_path(table_name), "r") as f:
                        row_ids[table_name] = json.load(f)
                else:
                    row_ids[table_name] = []
                print(f"Loaded FAISS index and row IDs for '{table_name}'")
            except Exception as e:
                print(f"ERROR loading FAISS index for '{table_name}': {e}")