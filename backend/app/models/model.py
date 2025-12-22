from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from .node import Node
from .edge import Edge


class PyMCModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nodes: List[Node]
    edges: List[Edge]
    csv_metadata: Optional[Dict[str, Any]] = Field(None, alias='csvMetadata')
