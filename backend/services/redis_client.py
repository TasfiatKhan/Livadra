import redis
from decouple import config

client = redis.from_url(config('REDIS_URL', default='redis://localhost:6379/0'))
