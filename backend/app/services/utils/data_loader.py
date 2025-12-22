from typing import Optional, Dict
import pandas as pd
from pathlib import Path
import os
from ...models.model import PyMCModel


def load_csv_data(model_data: PyMCModel) -> Optional[pd.DataFrame]:
    """CSVファイルを読み込む"""
    if not model_data.csv_metadata:
        return None

    csv_meta = model_data.csv_metadata
    file_id = csv_meta.get('file_id')

    if not file_id:
        return None

    upload_dir = Path(os.getenv("UPLOAD_DIR", "/tmp/bayesian_gui_uploads"))
    file_path = upload_dir / f"{file_id}.csv"

    if not file_path.exists():
        return None

    return pd.read_csv(file_path)


def get_data_node_column(model_data: PyMCModel, data_node_id: str) -> Optional[str]:
    """Data nodeのIDから対応する列名を取得"""
    for node in model_data.nodes:
        if node.id == data_node_id and node.type == "data":
            return node.parameters.get('column')
    return None


def build_data_node_map(model_data: PyMCModel) -> tuple[Dict[str, str], Dict[str, str]]:
    """ノードIDから列名とroleへのマッピングを作成

    Returns:
        (data_node_map, data_node_roles):
            - data_node_map: ノードIDから列名へのマッピング
            - data_node_roles: ノードIDからroleへのマッピング
    """
    data_node_map: Dict[str, str] = {}
    data_node_roles: Dict[str, str] = {}

    for node in model_data.nodes:
        if node.type == "data":
            column = node.parameters.get('column')
            if column:
                data_node_map[node.id] = column
                if model_data.csv_metadata:
                    columns = model_data.csv_metadata.get('columns', [])
                    for col_info in columns:
                        if col_info.get('name') == column:
                            data_node_roles[node.id] = col_info.get('role', 'unused')
                            break

    return data_node_map, data_node_roles
