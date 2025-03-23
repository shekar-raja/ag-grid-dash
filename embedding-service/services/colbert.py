ckpt = None

def load_colbert_model():
    global ckpt
    if ckpt is None:
        from colbert.infra import ColBERTConfig
        from colbert.modeling.checkpoint import Checkpoint
        print("Loading Jina ColBERT Model...")
        ckpt = Checkpoint("jinaai/jina-colbert-v2", colbert_config=ColBERTConfig())
        print("Jina ColBERT Model Loaded!")
    return ckpt