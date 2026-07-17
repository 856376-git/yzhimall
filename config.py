# -*- coding: utf-8 -*-
import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


def _get_db_uri():
    uri = os.getenv("SQLALCHEMY_DATABASE_URI", "")
    if uri:
        return uri
    return (
        "mysql+pymysql://" + os.getenv("MYSQL_USER", "root") + ":" +
        os.getenv("MYSQL_PASSWORD", "123456") + "@" +
        os.getenv("MYSQL_HOST", "127.0.0.1") + ":" +
        os.getenv("MYSQL_PORT", "3306") + "/" +
        os.getenv("MYSQL_DB", "yzhimall") + "?charset=utf8mb4"
    )


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
    DEBUG = False
    TESTING = False

    SQLALCHEMY_DATABASE_URI = _get_db_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 10,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
        "max_overflow": 20,
    }

    REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "") or None
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TTL = 3600

    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://127.0.0.1:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379/1")
    CELERY_TASK_SERIALIZER = "json"
    CELERY_RESULT_SERIALIZER = "json"
    CELERY_ACCEPT_CONTENT = ["json"]
    CELERY_TIMEZONE = "Asia/Shanghai"
    CELERY_ENABLE_UTC = True

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 900)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 604800)))
    JWT_BLACKLIST_TOKEN_CHECKS = {"access", "refresh"}
    JWT_BLACKLIST_ENABLED = True

    RATELIMIT_STORAGE_URL = os.getenv("RATELIMIT_STORAGE_URL", "memory://")
    RATELIMIT_DEFAULT = "60 per minute"
    RATELIMIT_HEADERS_ENABLED = True

    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.path.join(basedir, "logs", "app.log")
    LOG_JSON = False  # 开发默认彩色可读；生产置 True 输出结构化 JSON

    PAGE_DEFAULT_SIZE = 20
    PAGE_MAX_SIZE = 100


class DevelopmentConfig(Config):
    DEBUG = True
    LOG_LEVEL = "DEBUG"


class StagingConfig(Config):
    DEBUG = False
    LOG_LEVEL = "INFO"
    LOG_JSON = True


class ProductionConfig(Config):
    DEBUG = False
    LOG_LEVEL = "INFO"
    LOG_JSON = True


config_by_name = {
    "development": DevelopmentConfig,
    "staging": StagingConfig,
    "production": ProductionConfig,
    "testing": Config,
    "default": DevelopmentConfig,
}
