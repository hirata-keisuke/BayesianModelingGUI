import pymc as pm
import numpy as np
import re
from typing import Dict
from ...models.model import PyMCModel
from ...models.node import Node
from ...utils.distributions import DISTRIBUTIONS
from .model_utils import topological_sort, infer_shape_from_parameters
from .data_loader import load_csv_data, build_data_node_map


def build_pymc_model(model_data: PyMCModel) -> pm.Model:
    """実際のPyMCモデルを構築して返す（推論実行用）"""
    df = load_csv_data(model_data)
    data_node_map, data_node_roles = build_data_node_map(model_data)

    model = pm.Model()

    with model:
        sorted_nodes = topological_sort(model_data)
        node_vars = {}

        for node in sorted_nodes:
            if node.type == "data":
                continue

            var_name = node.name

            if node.type == "computed":
                if not node.expression:
                    continue
                expression = _resolve_expression_for_exec(node.expression, node_vars)
                node_vars[var_name] = expression
                continue

            # featureロールのデータノード処理（複数列対応）
            if node.observed:
                # 複数列のfeature指定
                if hasattr(node, 'observed_data_sources') and node.observed_data_sources:
                    columns = []
                    all_features = True
                    for source_id in node.observed_data_sources:
                        column_name = data_node_map.get(source_id)
                        role = data_node_roles.get(source_id, 'unused')
                        if role != 'feature':
                            all_features = False
                            break
                        if column_name and df is not None and column_name in df.columns:
                            columns.append(df[column_name].values)

                    if all_features and len(columns) > 0:
                        data_values = np.column_stack(columns)
                        node_vars[var_name] = pm.Data(var_name, data_values)
                        continue

                # 単一列のfeature指定（後方互換性）
                elif hasattr(node, 'observed_data_source') and node.observed_data_source:
                    column_name = data_node_map.get(node.observed_data_source)
                    role = data_node_roles.get(node.observed_data_source, 'unused')

                    if column_name and df is not None and column_name in df.columns:
                        data_values = df[column_name].values

                        if role == 'feature':
                            node_vars[var_name] = pm.Data(var_name, data_values)
                            continue

            if not node.distribution:
                continue

            dist_name = node.distribution
            params = _build_distribution_params(node, model_data, node_vars)
            observed = _get_observed_data(node, data_node_map, data_node_roles, df)

            # shapeの処理: node.shapeがあれば使用、observedがある場合はshapeを指定しない
            shape_kwargs = {}
            if node.shape and not observed:
                shape_kwargs['shape'] = tuple(node.shape) if len(node.shape) > 1 else node.shape[0]

            dist_class = getattr(pm, dist_name)

            if dist_name == "LKJCholeskyCov":
                chol, corr, stds = dist_class(var_name, observed=observed, **params, **shape_kwargs)
                node_vars[var_name] = chol
                node_vars[f"{var_name}_corr"] = corr
                node_vars[f"{var_name}_stds"] = stds
            else:
                node_vars[var_name] = dist_class(var_name, observed=observed, **params, **shape_kwargs)

    return model


def _build_distribution_params(node: Node, model_data: PyMCModel, node_vars: dict) -> dict:
    """分布のパラメータを構築"""
    dist_name = node.distribution
    params = {}

    for param, value in node.parameters.items():
        if dist_name == "LKJCholeskyCov" and param == "sd_dist":
            if isinstance(value, str) and value.startswith("@"):
                ref_node_name = value[1:]
                ref_node = next((n for n in model_data.nodes if n.name == ref_node_name), None)
                if ref_node and ref_node.distribution:
                    params[param] = _eval_dist_from_node(ref_node)
            continue

        if isinstance(value, str):
            if value.startswith("@"):
                ref_name = value[1:]
                if ref_name in node_vars:
                    params[param] = node_vars[ref_name]
            else:
                try:
                    params[param] = float(value)
                except:
                    params[param] = value
        else:
            params[param] = value

    return params


def _get_observed_data(node: Node, data_node_map: dict, data_node_roles: dict, df):
    """観測データを取得（単一列または複数列）"""
    if not node.observed:
        return None

    # 複数列指定の場合（多変量分布用）
    if hasattr(node, 'observed_data_sources') and node.observed_data_sources:
        columns = []
        for source_id in node.observed_data_sources:
            column_name = data_node_map.get(source_id)
            role = data_node_roles.get(source_id, 'unused')

            if column_name and df is not None and column_name in df.columns and role == 'observed':
                columns.append(df[column_name].values)
            else:
                return None

        if len(columns) > 0:
            return np.column_stack(columns)
        return None

    # 単一列指定の場合（後方互換性）
    if hasattr(node, 'observed_data_source') and node.observed_data_source:
        column_name = data_node_map.get(node.observed_data_source)
        role = data_node_roles.get(node.observed_data_source, 'unused')

        if column_name and df is not None and column_name in df.columns:
            data_values = df[column_name].values
            if role == 'observed':
                return data_values

    return None


def _eval_dist_from_node(node: Node):
    """ノードから.dist()オブジェクトを生成（モデル構築用）"""
    dist_name = node.distribution
    dist_class = getattr(pm, dist_name)

    params = {}
    for param, value in node.parameters.items():
        if isinstance(value, str):
            if value.startswith("@"):
                raise ValueError(f"Cannot use node reference in sd_dist parameter")
            else:
                try:
                    params[param] = float(value)
                except:
                    params[param] = value
        else:
            params[param] = value

    inferred_shape = infer_shape_from_parameters(node.parameters)
    if inferred_shape:
        params['shape'] = tuple(inferred_shape) if len(inferred_shape) > 1 else inferred_shape[0]

    return dist_class.dist(**params)


def _resolve_expression_for_exec(expression: str, node_vars: dict):
    """式を評価して実行可能な形式に変換"""
    def replace_ref(match):
        var_name = match.group(1)
        if var_name in node_vars:
            return f"node_vars['{var_name}']"
        return var_name

    expr = re.sub(r'@(\w+)', replace_ref, expression)

    # Sigmoid関数の定義
    def sigmoid(x):
        return 1 / (1 + np.exp(-x))

    # よく使う配列操作関数を追加
    local_vars = {
        'node_vars': node_vars,
        'np': np,
        'pm': pm,
        # 配列操作
        'sum': np.sum,
        'mean': np.mean,
        'std': np.std,
        'var': np.var,
        'dot': np.dot,
        'matmul': np.matmul,
        'transpose': np.transpose,
        'concatenate': np.concatenate,
        'stack': np.stack,
        'vstack': np.vstack,
        'hstack': np.hstack,
        'column_stack': np.column_stack,
        'reshape': np.reshape,
        'flatten': np.ndarray.flatten,
        # 数学関数
        'exp': np.exp,
        'log': np.log,
        'log10': np.log10,
        'log1p': np.log1p,
        'sqrt': np.sqrt,
        'abs': np.abs,
        'power': np.power,
        'square': np.square,
        'sigmoid': sigmoid,  # シグモイド関数
        # 三角関数
        'sin': np.sin,
        'cos': np.cos,
        'tan': np.tan,
        # 集約関数
        'max': np.max,
        'min': np.min,
        'median': np.median,
        'percentile': np.percentile,
        # その他
        'zeros': np.zeros,
        'ones': np.ones,
        'arange': np.arange,
        'linspace': np.linspace,
        'eye': np.eye,
    }
    local_vars.update(node_vars)
    return eval(expr, {"__builtins__": {}}, local_vars)
