import pymc as pm
from typing import Dict, List, Any
from ..models.model import PyMCModel
from ..models.node import Node
from ..utils.distributions import DISTRIBUTIONS


class ModelValidator:
    def __init__(self, model_data: PyMCModel):
        self.model_data = model_data
        self.errors: List[Dict[str, Any]] = []
        self.warnings: List[Dict[str, Any]] = []

    def validate(self) -> Dict[str, Any]:
        """全体バリデーション"""
        self._check_cycles()
        self._check_node_validity()
        self._check_dimension_compatibility()

        return {
            "valid": len(self.errors) == 0,
            "errors": self.errors,
            "warnings": self.warnings
        }

    def _check_cycles(self):
        """循環依存チェック"""
        adj_list = {node.id: [] for node in self.model_data.nodes}
        for edge in self.model_data.edges:
            adj_list[edge.source].append(edge.target)

        visited = set()
        rec_stack = set()

        def has_cycle(node_id: str) -> bool:
            visited.add(node_id)
            rec_stack.add(node_id)

            for neighbor in adj_list[node_id]:
                if neighbor not in visited:
                    if has_cycle(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True

            rec_stack.remove(node_id)
            return False

        for node_id in adj_list:
            if node_id not in visited:
                if has_cycle(node_id):
                    self.errors.append({
                        "type": "cycle",
                        "message": "Cyclic dependency detected in the model graph"
                    })
                    break

    def _check_node_validity(self):
        """各ノードの妥当性チェック"""
        for node in self.model_data.nodes:
            # Shapeのバリデーション
            if node.shape is not None and len(node.shape) > 0:
                # Shapeの各要素が正の整数であることを確認
                for i, dim in enumerate(node.shape):
                    if not isinstance(dim, int) or dim <= 0:
                        self.errors.append({
                            "node_id": node.id,
                            "type": "invalid_shape",
                            "message": f"Shape dimension {i} must be a positive integer, got {dim}"
                        })

            if node.distribution:
                dist_info = DISTRIBUTIONS.get(node.distribution)
                if not dist_info:
                    self.errors.append({
                        "node_id": node.id,
                        "type": "invalid_distribution",
                        "message": f"Unknown distribution: {node.distribution}"
                    })
                    continue

                # 必須パラメータチェック
                for param, meta in dist_info["params"].items():
                    if meta["required"] and param not in node.parameters:
                        self.errors.append({
                            "node_id": node.id,
                            "type": "missing_parameter",
                            "message": f"Required parameter '{param}' is missing"
                        })

                    # パラメータの型チェック
                    if param in node.parameters:
                        param_value = node.parameters[param]
                        param_type = meta.get("type")

                        # 参照の場合は型チェックをスキップ
                        if isinstance(param_value, str) and param_value.startswith("@"):
                            # 参照先ノードの型をチェック
                            ref_node_name = param_value[1:]
                            ref_node = next((n for n in self.model_data.nodes if n.name == ref_node_name), None)

                            if ref_node and ref_node.distribution:
                                ref_dist_info = DISTRIBUTIONS.get(ref_node.distribution)
                                if ref_dist_info:
                                    ref_support = ref_dist_info.get("support")

                                    # 整数パラメータに連続分布を参照している場合はエラー
                                    if param_type == "int" and ref_support == "continuous":
                                        self.errors.append({
                                            "node_id": node.id,
                                            "type": "type_mismatch",
                                            "message": f"Parameter '{param}' requires integer type, but references '{ref_node_name}' which is continuous (returns float values). Please use a discrete distribution instead."
                                        })
                        else:
                            # 値が直接指定されている場合は制約をチェック
                            constraint = meta.get("constraint")
                            if constraint:
                                self._check_constraint(node, param, param_value, constraint, param_type)

    def _check_constraint(self, node, param: str, value, constraint: str, param_type: str):
        """パラメータの制約をチェック"""
        # 配列の場合はスキップ（複雑なチェックが必要なため）
        if isinstance(value, list):
            return

        # 文字列を数値に変換
        try:
            if param_type == "int":
                num_value = int(value)
            elif param_type == "float":
                num_value = float(value)
            else:
                # 数値型でない場合はスキップ
                return
        except (ValueError, TypeError):
            # 変換できない場合はスキップ（別の型エラーで捕捉される）
            return

        # 制約文字列をパースして評価
        constraint_violated = False
        constraint_message = constraint

        try:
            # 制約の種類を判定して評価
            if constraint == "> 0":
                constraint_violated = not (num_value > 0)
            elif constraint == ">= 0":
                constraint_violated = not (num_value >= 0)
            elif constraint == ">= 2":
                constraint_violated = not (num_value >= 2)
            elif constraint == "0 <= p <= 1":
                constraint_violated = not (0 <= num_value <= 1)
            elif "sum to 1" in constraint:
                # 配列の合計が1になる制約は配列チェックが必要なのでスキップ
                return
            else:
                # その他の制約形式は警告として記録
                self.warnings.append({
                    "node_id": node.id,
                    "type": "unknown_constraint",
                    "message": f"Parameter '{param}' has constraint '{constraint}' which cannot be automatically validated"
                })
                return

            if constraint_violated:
                self.errors.append({
                    "node_id": node.id,
                    "type": "constraint_violation",
                    "message": f"Parameter '{param}' = {num_value} violates constraint: {constraint_message}"
                })
        except Exception as e:
            # 制約評価中のエラーは警告として記録
            self.warnings.append({
                "node_id": node.id,
                "type": "constraint_check_error",
                "message": f"Failed to check constraint for parameter '{param}': {str(e)}"
            })

    def _check_dimension_compatibility(self):
        """次元整合性チェック（簡易版）"""
        # 実際のPyMCモデル構築は後のフェーズで実装
        # ここでは基本的なチェックのみ
        try:
            sorted_nodes = self._topological_sort()
            if not sorted_nodes:
                self.errors.append({
                    "type": "topology_error",
                    "message": "Failed to sort nodes topologically"
                })
        except Exception as e:
            self.errors.append({
                "type": "dimension_mismatch",
                "message": f"Model structure error: {str(e)}"
            })

    def _topological_sort(self) -> List[Node]:
        """トポロジカルソート (Kahn's algorithm)"""
        in_degree = {node.id: 0 for node in self.model_data.nodes}
        for edge in self.model_data.edges:
            in_degree[edge.target] += 1

        queue = [node for node in self.model_data.nodes if in_degree[node.id] == 0]
        sorted_nodes = []

        while queue:
            node = queue.pop(0)
            sorted_nodes.append(node)

            for edge in self.model_data.edges:
                if edge.source == node.id:
                    in_degree[edge.target] -= 1
                    if in_degree[edge.target] == 0:
                        target_node = next(n for n in self.model_data.nodes if n.id == edge.target)
                        queue.append(target_node)

        return sorted_nodes
