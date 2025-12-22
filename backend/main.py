from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import csv, validation, codegen, distributions, inference

app = FastAPI(
    title="PyMC Model Builder API",
    version="1.0.0",
    description="API for building PyMC models graphically"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルート登録
app.include_router(csv.router, prefix="/api/csv", tags=["csv"])
app.include_router(validation.router, prefix="/api/validation", tags=["validation"])
app.include_router(codegen.router, prefix="/api/codegen", tags=["codegen"])
app.include_router(distributions.router, prefix="/api/distributions", tags=["distributions"])
app.include_router(inference.router, prefix="/api/inference", tags=["inference"])


@app.get("/")
def read_root():
    return {
        "message": "PyMC Model Builder API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
