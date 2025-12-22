from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from enum import Enum


class NodeType(str, Enum):
    VARIABLE = "variable"
    DATA = "data"
    COMPUTED = "computed"


class Node(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
        populate_by_name=True  # Allow both snake_case and camelCase
    )

    id: str
    type: NodeType
    name: str
    distribution: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    expression: Optional[str] = None  # 計算ノード用の式
    shape: Optional[List[int]] = None
    observed: bool = False
    observed_data_source: Optional[str] = Field(None, alias='observedDataSource')  # 単一列参照（後方互換性）
    observed_data_sources: Optional[List[str]] = Field(None, alias='observedDataSources')  # 複数列参照（多変量分布用）
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
