from arq.connections import RedisSettings

from app.config import settings
from app.workers.ingestion import enqueue_document


class WorkerSettings:
    functions = [enqueue_document]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
