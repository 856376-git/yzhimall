# -*- coding: utf-8 -*-
"""应用级扩展实例 + 结构化日志（JSON / request_id 贯穿）"""
import os
import sys
import json
import time
import uuid
import logging
import traceback

from flask import has_request_context, g, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from loguru import logger

db = SQLAlchemy()
jwt = JWTManager()
cache = Cache()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60 per minute"],
)


# ---------------------------------------------------------------------------
# 结构化日志：request_id 注入 + JSON sink + 标准库日志拦截
# ---------------------------------------------------------------------------
def _request_id_patcher(record):
    """把当前请求的 request_id 注入每条日志；请求上下文外记为 '-'。"""
    if has_request_context():
        record["extra"]["request_id"] = getattr(g, "request_id", "-")
    else:
        record["extra"]["request_id"] = "-"
    return record


def _json_sink(stream):
    """生成结构化 JSON 日志 sink，输出到给定流。"""

    def _write(message):
        record = message.record
        entry = {
            "ts": record["time"].isoformat(),
            "level": record["level"].name,
            "logger": record["name"],
            "func": record["function"],
            "line": record["line"],
            "request_id": record["extra"].get("request_id", "-"),
            "msg": record["message"],
        }
        extra = {k: v for k, v in record["extra"].items() if k != "request_id"}
        if extra:
            entry["extra"] = extra
        if record["exception"]:
            exc = record["exception"]
            entry["exc"] = "".join(
                traceback.format_exception(exc.type, exc.value, exc.traceback)
            )
        stream.write(json.dumps(entry, ensure_ascii=False, default=str) + "\n")

    return _write


class InterceptHandler(logging.Handler):
    """把 Flask / Werkzeug / SQLAlchemy 等标准库 logging 拦截进 loguru，统一格式。"""

    def emit(self, record):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def setup_logging(log_level="INFO", log_file=None, json_logs=False):
    logger.remove()
    logger.configure(patcher=_request_id_patcher)

    if json_logs:
        # 生产：stderr 输出结构化 JSON，便于日志采集
        logger.add(_json_sink(sys.stderr), level=log_level)
    else:
        # 开发：彩色可读格式，带 request_id
        logger.add(
            sys.stderr,
            level=log_level,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | "
                   "<cyan>{name}</cyan>:<cyan>{function}</cyan> | <dim>rid={extra[request_id]}</dim> - "
                   "<level>{message}</level>",
        )

    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        # 文件日志始终结构化 JSON（serialize），支持滚动/保留
        logger.add(
            log_file,
            level=log_level,
            serialize=True,
            rotation="10 MB",
            retention="30 days",
            encoding="utf-8",
        )

    # 把标准库 logging 一并收口到 loguru
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    return logger


def intercept_flask_logging(app):
    """让 Flask app.logger 的输出也走 loguru（统一 request_id / JSON）。"""
    app.logger.handlers = [InterceptHandler()]
    app.logger.propagate = False


def new_request_id():
    """生成短 request_id（16 位 hex）。"""
    return uuid.uuid4().hex[:16]


def request_duration_ms():
    """当前请求已耗时（毫秒），无上下文返回 '-'。"""
    if has_request_context():
        start = getattr(g, "request_start", None)
        if start is not None:
            return round((time.perf_counter() - start) * 1000, 2)
    return "-"