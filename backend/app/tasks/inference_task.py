import traceback
from celery import shared_task
from ..models.model import PyMCModel
from ..models.inference import InferenceConfigMCMC, InferenceConfigVI
from ..services.inference import InferenceEngine
from ..services.job_store import save_job_status, save_job_result


def _publish_progress(job_id: str, status: str, progress: float, stage: str,
                      error: str = None):
    """進捗をRedisに保存・通知する"""
    save_job_status(job_id, status, progress, stage, error)


@shared_task(bind=True, name="inference.run")
def run_inference_task(self, model_dict: dict, config_dict: dict):
    """推論をバックグラウンドで実行するCeleryタスク"""
    job_id = self.request.id

    try:
        # モデルデータを復元
        _publish_progress(job_id, "BUILDING_MODEL", 0.05, "モデル構築中...")
        model = PyMCModel(**model_dict)
        engine = InferenceEngine(model)

        # 推論手法を判定
        method = config_dict.get("method")
        _publish_progress(job_id, "BUILDING_MODEL", 0.10, "モデル構築完了")

        # サンプリング実行
        _publish_progress(job_id, "SAMPLING", 0.15, "サンプリング開始...")
        if method == "MCMC":
            config = InferenceConfigMCMC(**config_dict)
            trace, pm_model = engine.run_mcmc(config)
            hdi_prob = config.hdi_prob
        elif method == "VI":
            config = InferenceConfigVI(**config_dict)
            trace, pm_model = engine.run_vi(config)
            hdi_prob = config.hdi_prob
        else:
            raise ValueError(f"Invalid inference method: {method}")

        _publish_progress(job_id, "SAMPLING", 0.70, "サンプリング完了")

        # プロット生成
        _publish_progress(job_id, "GENERATING_PLOTS", 0.75, "プロット生成中...")
        plots = engine.generate_plots(trace, hdi_prob=hdi_prob)
        _publish_progress(job_id, "GENERATING_PLOTS", 0.85, "プロット生成完了")

        # サマリー生成
        _publish_progress(job_id, "COMPUTING_METRICS", 0.87, "サマリー計算中...")
        summary = engine.generate_summary(trace, hdi_prob=hdi_prob)

        # トレースサンプル抽出
        _publish_progress(job_id, "COMPUTING_METRICS", 0.90, "トレースデータ抽出中...")
        trace_samples_csv = engine.extract_trace_samples(trace)

        # モデル比較指標計算
        _publish_progress(job_id, "COMPUTING_METRICS", 0.93, "LOO/WAIC計算中...")
        model_comparison = engine.compute_model_comparison(trace, pm_model)

        # 結果を組み立て
        result = {
            "success": True,
            "trace_plot": plots.get("trace_plot"),
            "forest_plot": plots.get("forest_plot"),
            "ppc_plot": plots.get("ppc_plot"),
            "summary": summary,
            "trace_samples_csv": trace_samples_csv,
            "loo": model_comparison.get("loo"),
            "waic": model_comparison.get("waic"),
            "error": None,
        }

        # 結果をRedisに保存
        save_job_result(job_id, result)
        _publish_progress(job_id, "SUCCESS", 1.0, "推論完了")

        return result

    except Exception as e:
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Inference task error: {error_detail}")

        result = {
            "success": False,
            "error": str(e),
        }
        save_job_result(job_id, result)
        _publish_progress(job_id, "FAILURE", 0.0, "推論失敗", error=str(e))

        return result
