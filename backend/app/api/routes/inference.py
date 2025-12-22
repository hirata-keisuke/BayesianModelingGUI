from fastapi import APIRouter, HTTPException
from ...models.inference import (
    InferenceRequest,
    InferenceResult,
    InferenceConfigMCMC,
    InferenceConfigVI,
    PriorPredictiveRequest,
    PriorPredictiveResult
)
from ...services.inference import InferenceEngine

router = APIRouter()


@router.post("/run", response_model=InferenceResult)
async def run_inference(request: InferenceRequest):
    """推論を実行"""
    try:
        engine = InferenceEngine(request.model)

        # 推論手法に応じて実行
        if isinstance(request.config, InferenceConfigMCMC):
            trace, pm_model = engine.run_mcmc(request.config)
            hdi_prob = request.config.hdi_prob
        elif isinstance(request.config, InferenceConfigVI):
            trace, pm_model = engine.run_vi(request.config)
            hdi_prob = request.config.hdi_prob
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid inference configuration"
            )

        # プロットを生成
        plots = engine.generate_plots(trace, hdi_prob=hdi_prob)

        # サマリーを生成
        summary = engine.generate_summary(trace, hdi_prob=hdi_prob)

        # トレースサンプルをCSV形式で抽出
        trace_samples_csv = engine.extract_trace_samples(trace)

        # モデル比較指標（LOO、WAIC）を計算
        model_comparison = engine.compute_model_comparison(trace, pm_model)

        return InferenceResult(
            success=True,
            trace_plot=plots.get('trace_plot'),
            forest_plot=plots.get('forest_plot'),
            ppc_plot=plots.get('ppc_plot'),
            summary=summary,
            trace_samples_csv=trace_samples_csv,
            loo=model_comparison.get('loo'),
            waic=model_comparison.get('waic')
        )

    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Inference error: {error_detail}")

        return InferenceResult(
            success=False,
            error=str(e)
        )


@router.post("/prior-predictive", response_model=PriorPredictiveResult)
async def run_prior_predictive(request: PriorPredictiveRequest):
    """事前予測チェックを実行"""
    try:
        engine = InferenceEngine(request.model)

        # 事前予測サンプリングを実行
        prior_predictive, plots = engine.run_prior_predictive(samples=request.samples)

        return PriorPredictiveResult(
            success=True,
            prior_predictive_plot=plots.get('prior_predictive_plot'),
            prior_trace_plot=plots.get('prior_trace_plot')
        )

    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Prior predictive check error: {error_detail}")

        return PriorPredictiveResult(
            success=False,
            error=str(e)
        )
