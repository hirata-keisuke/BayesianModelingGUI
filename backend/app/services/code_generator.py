from typing import List, Dict
import pymc as pm
import re
from ..models.model import PyMCModel
from ..models.node import Node
from .utils.model_utils import topological_sort, infer_shape_from_parameters
from .utils.model_builder import build_pymc_model


class PyMCCodeGenerator:
    def __init__(self, model_data: PyMCModel):
        self.model_data = model_data
        self.indent = "    "

    def generate(self) -> str:
        """PyMCコード生成"""
        lines = []

        lines.extend(self._generate_imports())
        lines.append("")

        if self.model_data.csv_metadata:
            lines.extend(self._generate_data_loading())
            lines.append("")

        lines.append("# Model definition")
        lines.append("with pm.Model() as model:")

        sorted_nodes = topological_sort(self.model_data)

        for node in sorted_nodes:
            if node.type == "data":
                continue

            node_code = self._generate_node_code(node)
            if node_code:
                lines.append(f"{self.indent}{node_code}")

        lines.append("")
        lines.append("# Model created successfully!")
        lines.append("# You can now run inference with:")
        lines.append("# with model:")
        lines.append("#     trace = pm.sample(2000, tune=1000)")

        return "\n".join(lines)

    def _generate_imports(self) -> List[str]:
        """インポート文を生成"""
        imports = [
            "import pymc as pm",
            "import numpy as np"
        ]
        if self.model_data.csv_metadata:
            imports.append("import pandas as pd")
        return imports

    def _generate_data_loading(self) -> List[str]:
        """データ読み込みコードを生成"""
        lines = ["# Data loading"]
        csv_meta = self.model_data.csv_metadata

        if not csv_meta:
            return lines

        lines.append(f"data = pd.read_csv('{csv_meta.get('filename', 'data.csv')}')")

        used_columns = set()
        for node in self.model_data.nodes:
            if node.observed and hasattr(node, 'observed_data_source') and node.observed_data_source:
                data_node = next((n for n in self.model_data.nodes
                                 if n.id == node.observed_data_source and n.type == "data"), None)
                if data_node:
                    column_name = data_node.parameters.get('column')
                    if column_name:
                        used_columns.add((node.name, column_name))

        for node_name, column_name in used_columns:
            lines.append(f"{node_name}_data = data['{column_name}'].values")

        return lines

    def _generate_node_code(self, node: Node) -> str:
        """単一ノードのコード生成"""
        var_name = node.name

        if node.type == "computed":
            if not node.expression:
                return ""
            expression = self._resolve_expression(node.expression)
            return f"{var_name} = {expression}"

        is_feature_data = False
        observed_str = ""

        if node.observed and hasattr(node, 'observed_data_source') and node.observed_data_source:
            if self.model_data.csv_metadata:
                columns = self.model_data.csv_metadata.get('columns', [])
                data_node = next((n for n in self.model_data.nodes
                                 if n.id == node.observed_data_source and n.type == "data"), None)
                if data_node:
                    column_name = data_node.parameters.get('column')
                    for col_info in columns:
                        if col_info.get('name') == column_name:
                            role = col_info.get('role', 'unused')
                            if role == 'feature':
                                is_feature_data = True
                            elif role == 'observed':
                                observed_str = f", observed={var_name}_data"
                            break

        if is_feature_data:
            return f"{var_name} = pm.Data('{var_name}', {var_name}_data)"

        if not node.distribution:
            return ""

        dist_name = node.distribution
        param_strs = self._build_param_strings(node, dist_name)
        params = ", ".join(param_strs)

        shape_str = self._build_shape_string(node)

        if dist_name == "LKJCholeskyCov":
            return f"{var_name}, {var_name}_corr, {var_name}_stds = pm.{dist_name}('{var_name}', {params}{shape_str}{observed_str})"

        return f"{var_name} = pm.{dist_name}('{var_name}', {params}{shape_str}{observed_str})"

    def _build_param_strings(self, node: Node, dist_name: str) -> List[str]:
        """パラメータ文字列のリストを構築"""
        param_strs = []
        for param, value in node.parameters.items():
            if dist_name == "LKJCholeskyCov" and param == "sd_dist":
                if isinstance(value, str) and value.startswith("@"):
                    ref_node_name = value[1:]
                    ref_node = next((n for n in self.model_data.nodes if n.name == ref_node_name), None)
                    if ref_node and ref_node.distribution:
                        dist_call = self._generate_dist_call(ref_node)
                        param_strs.append(f"{param}={dist_call}")
                continue

            if isinstance(value, str):
                if value.startswith("@"):
                    param_strs.append(f"{param}={value[1:]}")
                else:
                    param_strs.append(f"{param}={value}")
            elif isinstance(value, list):
                param_strs.append(f"{param}={value}")
            else:
                param_strs.append(f"{param}={value}")

        return param_strs

    def _build_shape_string(self, node: Node) -> str:
        """Shapeの構築 - node.shapeを優先、なければparametersから推論"""
        # まずnode.shapeを確認
        if hasattr(node, 'shape') and node.shape:
            if len(node.shape) == 1:
                return f", shape={node.shape[0]}"
            else:
                return f", shape={tuple(node.shape)}"

        # node.shapeがなければparametersから推論
        inferred_shape = infer_shape_from_parameters(node.parameters)
        if not inferred_shape:
            return ""

        if len(inferred_shape) == 1:
            return f", shape={inferred_shape[0]}"
        else:
            return f", shape={tuple(inferred_shape)}"

    def _generate_dist_call(self, node: Node) -> str:
        """ノードから.dist()形式の分布呼び出しを生成"""
        dist_name = node.distribution

        param_strs = []
        for param, value in node.parameters.items():
            if isinstance(value, str):
                if value.startswith("@"):
                    param_strs.append(f"{param}={value[1:]}")
                else:
                    param_strs.append(f"{param}={value}")
            elif isinstance(value, list):
                param_strs.append(f"{param}={value}")
            else:
                param_strs.append(f"{param}={value}")

        params = ", ".join(param_strs)

        # node.shapeを優先、なければparametersから推論
        shape_to_use = None
        if hasattr(node, 'shape') and node.shape:
            shape_to_use = node.shape
        else:
            shape_to_use = infer_shape_from_parameters(node.parameters)

        if shape_to_use:
            if len(shape_to_use) == 1:
                params += f", shape={shape_to_use[0]}"
            else:
                params += f", shape={tuple(shape_to_use)}"

        return f"pm.{dist_name}.dist({params})"

    def _resolve_expression(self, expression: str) -> str:
        """式中の@node_nameをnode_nameに変換し、関数をpm.math形式に変換"""
        # @node_nameをnode_nameに変換
        expr = re.sub(r'@(\w+)', r'\1', expression)

        # NumPy/Python関数をpm.math形式に変換
        math_functions = {
            'sigmoid': 'pm.math.sigmoid',
            'exp': 'pm.math.exp',
            'log': 'pm.math.log',
            'log10': 'pm.math.log10',
            'log1p': 'pm.math.log1p',
            'sqrt': 'pm.math.sqrt',
            'abs': 'pm.math.abs_',
            'sin': 'pm.math.sin',
            'cos': 'pm.math.cos',
            'tan': 'pm.math.tan',
            'sum': 'pm.math.sum',
            'mean': 'pm.math.mean',
            'std': 'pm.math.std',
            'var': 'pm.math.var',
            'dot': 'pm.math.dot',
            'matmul': 'pm.math.matmul',
            'max': 'pm.math.maximum',
            'min': 'pm.math.minimum',
        }

        # 関数呼び出しを置換（単語境界を考慮）
        for func, pm_func in math_functions.items():
            expr = re.sub(rf'\b{func}\(', f'{pm_func}(', expr)

        return expr

    def _build_pymc_model(self) -> pm.Model:
        """実際のPyMCモデルを構築して返す（推論実行用）"""
        return build_pymc_model(self.model_data)


CodeGenerator = PyMCCodeGenerator
