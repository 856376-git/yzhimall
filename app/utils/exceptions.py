# -*- coding: utf-8 -*-
"""
自定义业务异常（ BizException ）
所有业务异常统一用这个，HTTP 状态码统一返回 400/401/403/404
在 app/__init__.py 全局注册
"""
from flask import jsonify


class BizException(Exception):
    """业务异常基类"""

    status_code = 400
    default_message = "业务错误"

    def __init__(self, message: str = None, payload: dict = None):
        super().__init__(self.default_message)
        self.message = message or self.default_message
        self.payload = payload or {}

    def to_dict(self):
        rv = dict(payload=(self.payload or {}))
        rv["code"] = self.status_code
        rv["msg"] = self.message
        return rv


class ValidationError(BizException):
    """参数校验失败"""
    status_code = 400
    default_message = "参数校验失败"


class UnauthorizedError(BizException):
    """未认证"""
    status_code = 401
    default_message = "未认证，请先登录"


class ForbiddenError(BizException):
    """无权限"""
    status_code = 403
    default_message = "无权限访问"


class NotFoundError(BizException):
    """资源不存在"""
    status_code = 404
    default_message = "资源不存在"


class ConflictError(BizException):
    """资源冲突（如重复提交）"""
    status_code = 409
    default_message = "资源冲突"


class InternalServerError(BizException):
    """服务器内部错误"""
    status_code = 500
    default_message = "服务器内部错误"


# ========================
# 全局异常处理器
# ========================
def register_error_handlers(app):
    from app.utils.response import ApiResponse

    @app.errorhandler(BizException)
    def handle_biz_exception(e: BizException):
        return jsonify(e.to_dict()), e.status_code

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"code": 400, "msg": str(e.description)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"code": 401, "msg": "未认证"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"code": 403, "msg": "无权限"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"code": 404, "msg": "资源不存在"}), 404

    @app.errorhandler(422)
    def unprocessable_entity(e):
        return jsonify({"code": 422, "msg": "无法处理的实体"}), 422

    @app.errorhandler(500)
    def server_error(e):
        app.logger.error(f"Server error: {e}")
        return jsonify({"code": 500, "msg": "服务器内部错误"}), 500
