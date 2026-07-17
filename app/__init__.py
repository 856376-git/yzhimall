# -*- coding: utf-8 -*-
import os
from dotenv import load_dotenv
# .env 必须在 import config 之前加载——config.py 的类属性在 import 期就调用 _get_db_uri()
_ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(_ENV_PATH)
from flask import Flask, send_from_directory, g, request
from flask_cors import CORS
from app.extensions import (
    db, jwt, cache, limiter, setup_logging, intercept_flask_logging,
    logger, new_request_id, request_duration_ms,
)
from app.utils.exceptions import register_error_handlers
from config import config_by_name


def create_app(config_name: str = None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    cfg = config_by_name.get(config_name, config_by_name["default"])
    app.config.from_object(cfg)

    setup_logging(
        log_level=app.config.get("LOG_LEVEL", "INFO"),
        log_file=app.config.get("LOG_FILE"),
        json_logs=app.config.get("LOG_JSON", False),
    )
    intercept_flask_logging(app)
    logger.info("[yzhimall] Starting app in {} mode", config_name)

    db.init_app(app)
    from flask_migrate import Migrate
    Migrate(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    cache.init_app(app)

    limiter.storage_uri = app.config.get("RATELIMIT_STORAGE_URL", "memory://")
    limiter.init_app(app)

    register_error_handlers(app)

    from app.utils.decorators import register_jwt_handlers
    register_jwt_handlers(jwt)

    from app.api import register_blueprints
    register_blueprints(app)

    # ===== 请求追踪：request_id 贯穿全链路日志 =====
    @app.before_request
    def _attach_request_id():
        g.request_id = request.headers.get("X-Request-Id") or new_request_id()
        g.request_start = __import__("time").perf_counter()

    @app.after_request
    def _log_request(response):
        response.headers["X-Request-Id"] = getattr(g, "request_id", "-")
        logger.info(
            "{} {} {} {}ms",
            request.method, request.path, response.status_code, request_duration_ms(),
        )
        return response

    # 静态文件：uploads 目录
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        upload_dir = os.path.join(app.root_path, "..", "uploads")
        return send_from_directory(upload_dir, filename)

    @app.shell_context_processor
    def make_shell_context():
        from app import models
        return {"db": db, **vars(models)}

    return app
