import os
from celery import Celery

broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

celery_app = Celery(
    "bayesian_gui",
    broker=broker_url,
    backend=result_backend,
    include=["app.tasks.inference_task"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Tokyo",
    enable_utc=True,
    # CPUバウンドタスク向け設定
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
    # タスク結果の有効期限（1時間）
    result_expires=3600,
)
