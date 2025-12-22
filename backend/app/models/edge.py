from pydantic import BaseModel
from typing import Optional


class Edge(BaseModel):
    id: str
    source: str
    target: str
    source_param: Optional[str] = None
