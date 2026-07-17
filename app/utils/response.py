# -*- coding: utf-8 -*-
"""
统一响应格式 + 全局异常处理
所有 API 接口统一返回：
{
    "code": 200,
    "msg": "success",
    "data": {...},
    "meta": {...}   # 分页信息（可选）
}
"""
from flask import jsonify
from typing import Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class ApiResponse:
    code: int
    msg: str
    data: Any = None
    meta: Optional[dict] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}

    def to_json(self):
        return jsonify(self.to_dict())


# ========================
# 工厂函数（快捷调用）
# ========================
def success(data: Any = None, msg: str = "success", meta: dict = None) -> ApiResponse:
    return ApiResponse(code=200, msg=msg, data=data, meta=meta).to_json()


def created(data: Any = None, msg: str = "created", meta: dict = None) -> ApiResponse:
    return ApiResponse(code=201, msg=msg, data=data, meta=meta).to_json()


def no_content() -> ApiResponse:
    return ApiResponse(code=204, msg="no content").to_json()


def error(code: int, msg: str, data: Any = None) -> ApiResponse:
    return ApiResponse(code=code, msg=msg, data=data).to_json()


def bad_request(msg: str = "参数错误") -> ApiResponse:
    return error(400, msg)


def unauthorized(msg: str = "未认证，请先登录") -> ApiResponse:
    return error(401, msg)


def forbidden(msg: str = "无权限访问") -> ApiResponse:
    return error(403, msg)


def not_found(msg: str = "资源不存在") -> ApiResponse:
    return error(404, msg)


def conflict(msg: str = "资源冲突") -> ApiResponse:
    return error(409, msg)


def server_error(msg: str = "服务器内部错误") -> ApiResponse:
    return error(500, msg)
