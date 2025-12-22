from fastapi import APIRouter
from ...utils.distributions import get_all_distributions, get_distribution_params

router = APIRouter()


@router.get("")
async def get_distributions():
    """利用可能な全分布のリストを取得"""
    return get_all_distributions()


@router.get("/{dist_name}/params")
async def get_params(dist_name: str):
    """特定の分布のパラメータ情報を取得"""
    params = get_distribution_params(dist_name)
    if not params:
        return {"error": f"Distribution '{dist_name}' not found"}
    return params
