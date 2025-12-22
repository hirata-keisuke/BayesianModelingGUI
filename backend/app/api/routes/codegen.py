from fastapi import APIRouter
from ...models.model import PyMCModel
from ...services.code_generator import PyMCCodeGenerator

router = APIRouter()


@router.post("/generate")
async def generate_code(model: PyMCModel):
    """PyMCコードを生成"""
    generator = PyMCCodeGenerator(model)
    code = generator.generate()

    return {
        "code": code,
        "success": True
    }
