import os
import json
from typing import Optional, Dict, Any
import redis

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


# キー名のプレフィックス
JOB_STATUS_PREFIX = "job:status:"
JOB_RESULT_PREFIX = "job:result:"
JOB_CHANNEL_PREFIX = "job:progress:"

# 結果の有効期限（秒）
RESULT_TTL = 3600


def save_job_status(job_id: str, status: str, progress: float, stage: str,
                    error: Optional[str] = None) -> None:
    """ジョブの状態をRedisに保存し、pub/subで通知する"""
    r = get_redis_client()
    data = {
        "job_id": job_id,
        "status": status,
        "progress": progress,
        "stage": stage,
        "error": error,
    }
    r.set(f"{JOB_STATUS_PREFIX}{job_id}", json.dumps(data), ex=RESULT_TTL)
    # WebSocket向けにpub/sub通知
    r.publish(f"{JOB_CHANNEL_PREFIX}{job_id}", json.dumps(data))


def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """ジョブの状態をRedisから取得する"""
    r = get_redis_client()
    data = r.get(f"{JOB_STATUS_PREFIX}{job_id}")
    if data is None:
        return None
    return json.loads(data)


def save_job_result(job_id: str, result: Dict[str, Any]) -> None:
    """ジョブの結果をRedisに保存する"""
    r = get_redis_client()
    r.set(f"{JOB_RESULT_PREFIX}{job_id}", json.dumps(result), ex=RESULT_TTL)


def get_job_result(job_id: str) -> Optional[Dict[str, Any]]:
    """ジョブの結果をRedisから取得する"""
    r = get_redis_client()
    data = r.get(f"{JOB_RESULT_PREFIX}{job_id}")
    if data is None:
        return None
    return json.loads(data)
