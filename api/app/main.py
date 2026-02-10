from fastapi import FastAPI

app = FastAPI(title="FakeBiz API")

@app.get("/health")
def health():
    return {"status": "ok"}

