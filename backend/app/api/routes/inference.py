from fastapi import APIRouter, HTTPException
from ...models.inference import (
    InferenceRequest,
    InferenceResult,
    InferenceConfigMCMC,
    InferenceConfigVI,
    PriorPredictiveRequest,
    PriorPredictiveResult,
    JobSubmitResponse,
    JobStatusResponse,
)
from ...services.inference import InferenceEngine
from ...tasks.inference_task import run_inference_task
from ...services.job_store import get_job_status, get_job_result

router = APIRouter()


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_inference(request: InferenceRequest):
    """推論ジョブを投入し、即座にjob_idを返す"""
    task = run_inference_task.delay(
        request.model.model_dump(),
        request.config.model_dump(),
    )
    return JobSubmitResponse(job_id=task.id)


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_inference_status(job_id: str):
    """ジョブの状態を取得する（ポーリング用フォールバック）"""
    status = get_job_status(job_id)
    if status is None:
        return JobStatusResponse(
            job_id=job_id,
            status="PENDING",
            progress=0.0,
            stage="キューで待機中...",
        )
    return JobStatusResponse(**status)


@router.get("/result/{job_id}", response_model=InferenceResult)
async def get_inference_result(job_id: str):
    """ジョブの結果を取得する"""
    result = get_job_result(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="結果が見つかりません")
    return InferenceResult(**result)


@router.post("/cancel/{job_id}")
async def cancel_inference(job_id: str):
    """推論ジョブをキャンセルする"""
    from ...celery_app import celery_app
    celery_app.control.revoke(job_id, terminate=True, signal="SIGTERM")
    return {"job_id": job_id, "status": "cancelled"}


@router.post("/run", response_model=InferenceResult, deprecated=True)
async def run_inference(request: InferenceRequest):
    """推論を同期実行（後方互換用、非推奨）"""
    try:
        engine = InferenceEngine(request.model)

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

        plots = engine.generate_plots(trace, hdi_prob=hdi_prob)
        summary = engine.generate_summary(trace, hdi_prob=hdi_prob)
        trace_samples_csv = engine.extract_trace_samples(trace)
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
