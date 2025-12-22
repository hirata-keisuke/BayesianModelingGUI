from typing import List, Dict, Optional
from ...models.model import PyMCModel
from ...models.node import Node


def topological_sort(model_data: PyMCModel) -> List[Node]:
    """トポロジカルソート (Kahn's algorithm)"""
    in_degree = {node.id: 0 for node in model_data.nodes}
    for edge in model_data.edges:
        in_degree[edge.target] += 1

    queue = [node for node in model_data.nodes if in_degree[node.id] == 0]
    sorted_nodes = []

    while queue:
        node = queue.pop(0)
        sorted_nodes.append(node)

        for edge in model_data.edges:
            if edge.source == node.id:
                in_degree[edge.target] -= 1
                if in_degree[edge.target] == 0:
                    target_node = next(n for n in model_data.nodes if n.id == edge.target)
                    queue.append(target_node)

    return sorted_nodes


def infer_shape(value: any) -> Optional[List[int]]:
    """単一の値から形状を推論"""
    if not isinstance(value, list):
        return None

    shape = []
    current = value

    while isinstance(current, list):
        if len(current) == 0:
            break
        shape.append(len(current))
        current = current[0]

    return shape if shape else None


def infer_shape_from_parameters(parameters: Dict[str, any]) -> Optional[List[int]]:
    """パラメータから形状を推論"""
    shapes = []

    for value in parameters.values():
        if isinstance(value, str) and (value.startswith('@') or value == ''):
            continue

        shape = infer_shape(value)
        if shape:
            shapes.append(shape)

    if not shapes:
        return None

    return max(shapes, key=lambda s: (len(s), s))
