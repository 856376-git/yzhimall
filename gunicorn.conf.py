# -*- coding: utf-8 -*-
"""
Gunicorn 生产配置
"""
import multiprocessing
import os

bind = "0.0.0.0:5000"
workers = int(os.getenv("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "gevent"
worker_connections = 1000
keepalive = 65
timeout = 120
graceful_timeout = 30
max_requests = 1000
max_requests_jitter = 50

accesslog = os.path.join(os.path.dirname(__file__), "logs", "access.log")
errorlog = os.path.join(os.path.dirname(__file__), "logs", "error.log")
loglevel = "info"

# 重启 worker 前最多处理 1000 个请求，防止内存泄漏
preload_app = True
