import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ...services.job_store import get_redis_client, JOB_CHANNEL_PREFIX, get_job_status

router = APIRouter()


@router.websocket("/ws/inference/{job_id}")
async def inference_websocket(websocket: WebSocket, job_id: str):
    """推論ジョブの進捗をWebSocketでリアルタイム通知する"""
    await websocket.accept()

    r = get_redis_client()
    pubsub = r.pubsub()
    channel = f"{JOB_CHANNEL_PREFIX}{job_id}"
    pubsub.subscribe(channel)

    try:
        # 接続時点の状態を即座に送信
        current_status = get_job_status(job_id)
        if current_status:
            await websocket.send_text(json.dumps(current_status))
            # すでに完了・失敗している場合はそのまま終了
            if current_status.get("status") in ("SUCCESS", "FAILURE"):
                return

        # Redis pub/subからメッセージを受信してWebSocketに中継
        while True:
            message = pubsub.get_message(ignore_subscribe_messages=True, timeout=0.5)
            if message and message["type"] == "message":
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                await websocket.send_text(data)

                # SUCCESS/FAILUREを送ったら終了
                try:
                    parsed = json.loads(data)
                    if parsed.get("status") in ("SUCCESS", "FAILURE"):
                        break
                except json.JSONDecodeError:
                    pass

            # WebSocketからのメッセージ（キャンセル要求等）をチェック
            try:
                client_msg = await asyncio.wait_for(
                    websocket.receive_text(), timeout=0.1
                )
                if client_msg == "cancel":
                    from ...celery_app import celery_app
                    celery_app.control.revoke(job_id, terminate=True, signal="SIGTERM")
                    await websocket.send_text(json.dumps({
                        "job_id": job_id,
                        "status": "CANCELLED",
                        "progress": 0.0,
                        "stage": "キャンセルされました",
                    }))
                    break
            except asyncio.TimeoutError:
                pass

    except WebSocketDisconnect:
        pass
    finally:
        pubsub.unsubscribe(channel)
        pubsub.close()
