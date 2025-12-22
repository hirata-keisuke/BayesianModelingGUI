from fastapi import APIRouter
from ...models.model import PyMCModel
from ...services.validator import ModelValidator
from ...utils.distributions import DISTRIBUTIONS

router = APIRouter()


@router.post("/model")
async def validate_model(model: PyMCModel):
    """モデル全体のバリデーション"""
    validator = ModelValidator(model)
    result = validator.validate()
    return result


@router.post("/node")
async def validate_node(node: dict):
    """単一ノードのバリデーション"""
    errors = []

    if "distribution" in node and node["distribution"]:
        dist_info = DISTRIBUTIONS.get(node["distribution"])

        if not dist_info:
            errors.append({
                "type": "invalid_distribution",
                "message": f"Unknown distribution: {node['distribution']}"
            })
        else:
            # 必須パラメータチェック
            for param, meta in dist_info["params"].items():
                if meta["required"] and param not in node.get("parameters", {}):
                    errors.append({
                        "type": "missing_parameter",
                        "message": f"Required parameter '{param}' is missing"
                    })

    return {
        "valid": len(errors) == 0,
        "errors": errors
    }
