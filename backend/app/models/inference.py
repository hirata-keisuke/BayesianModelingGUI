from pydantic import BaseModel, Field
from typing import Literal, Optional
from .model import PyMCModel


class InferenceConfigMCMC(BaseModel):
    """MCMC推論の設定"""
    method: Literal["MCMC"] = "MCMC"
    sampler: Literal["NUTS", "Metropolis"] = "NUTS"
    draws: int = Field(default=1000, ge=100, le=100000)
    tune: int = Field(default=1000, ge=100, le=100000)
    chains: int = Field(default=4, ge=1, le=16)
    cores: int = Field(default=4, ge=1, le=16)
    hdi_prob: float = Field(default=0.95, ge=0.5, le=0.99)


class InferenceConfigVI(BaseModel):
    """変分推論の設定"""
    method: Literal["VI"] = "VI"
    vi_method: Literal["ADVI", "FullRankADVI"] = "ADVI"
    iterations: int = Field(default=10000, ge=1000, le=100000)
    draws: int = Field(default=1000, ge=100, le=100000)
    hdi_prob: float = Field(default=0.95, ge=0.5, le=0.99)


class InferenceRequest(BaseModel):
    """推論実行のリクエスト"""
    model: PyMCModel
    config: InferenceConfigMCMC | InferenceConfigVI


class InferenceResult(BaseModel):
    """推論結果"""
    success: bool
    trace_plot: Optional[str] = None  # base64 encoded image
    forest_plot: Optional[str] = None  # base64 encoded image
    ppc_plot: Optional[str] = None  # base64 encoded image
    summary: Optional[dict] = None  # summary statistics
    trace_samples_csv: Optional[str] = None  # base64 encoded CSV
    loo: Optional[dict] = None  # LOO (Leave-One-Out Cross-Validation) metrics
    waic: Optional[dict] = None  # WAIC (Watanabe-Akaike Information Criterion) metrics
    error: Optional[str] = None


class PriorPredictiveRequest(BaseModel):
    """事前予測チェックのリクエスト"""
    model: PyMCModel
    samples: int = Field(default=1000, ge=100, le=10000)


class PriorPredictiveResult(BaseModel):
    """事前予測チェックの結果"""
    success: bool
    prior_predictive_plot: Optional[str] = None  # base64 encoded image
    prior_trace_plot: Optional[str] = None  # base64 encoded image
    error: Optional[str] = None


# --- ジョブキュー関連モデル ---

class JobSubmitResponse(BaseModel):
    """ジョブ投入のレスポンス"""
    job_id: str


class JobStatusResponse(BaseModel):
    """ジョブ状態のレスポンス"""
    job_id: str
    status: str  # PENDING, BUILDING_MODEL, SAMPLING, GENERATING_PLOTS, COMPUTING_METRICS, SUCCESS, FAILURE
    progress: float  # 0.0 ~ 1.0
    stage: str
    error: Optional[str] = None
