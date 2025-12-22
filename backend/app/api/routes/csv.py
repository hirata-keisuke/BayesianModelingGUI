from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
from pathlib import Path
import uuid
import os

router = APIRouter()

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/bayesian_gui_uploads"))
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """CSVファイルをアップロード"""
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    # アップロードディレクトリが存在することを確認
    UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

    # ファイル保存
    file_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{file_id}.csv"

    content = await file.read()
    file_path.write_bytes(content)

    # メタデータ抽出
    df = pd.read_csv(file_path)

    metadata = {
        "file_id": file_id,
        "filename": file.filename,
        "columns": [
            {
                "name": col,
                "dtype": str(df[col].dtype),
                "role": "unused"
            }
            for col in df.columns
        ],
        "rows": len(df)
    }

    return metadata


@router.get("/preview/{file_id}")
async def get_csv_preview(file_id: str):
    """CSVファイルのプレビューを取得"""
    file_path = UPLOAD_DIR / f"{file_id}.csv"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    df = pd.read_csv(file_path, nrows=10)

    return {
        "columns": df.columns.tolist(),
        "data": df.to_dict(orient='records')
    }
