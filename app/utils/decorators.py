# -*- coding: utf-8 -*-
"""
自定义装饰器
- JWT 验证
- 角色权限检查
- 审计日志装饰器
"""
from functools import wraps
from flask import request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.utils.response import forbidden, unauthorized
from app.utils.exceptions import ForbiddenError
from app.extensions import db


def admin_required(fn):
    """管理员鉴权装饰器：认单角色列 role == admin，或多对多 admin/super-admin 角色。"""
    @wraps(fn)
    def decorator(*args, **kwargs):
        verify_jwt_in_request()
        from app.models.user import User
        user = db.session.get(User, int(get_jwt_identity()))
        if not user:
            return forbidden("用户不存在")
        if not (user.is_admin or user.has_role(("admin", "super-admin"))):
            return forbidden("需要管理员权限")
        return fn(*args, **kwargs)
    return decorator


def role_required(*role_slugs):
    """
    角色权限装饰器
    用法：
        @role_required("admin", "operations")
        def my_view():
            ...
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            from app.models.user import User, Role
            identity = get_jwt_identity()
            user = db.session.get(User, int(identity))
            if not user:
                return unauthorized("用户不存在")
            if not user.has_role(role_slugs):
                return forbidden("需要角色: " + ", ".join(role_slugs))
            return fn(*args, **kwargs)
        return decorator
    return wrapper


def audit_log(action: str, subject_type: str = "API"):
    """
    审计日志装饰器
    用法：
        @audit_log("user.login", "Auth")
        def login():
            ...
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            result = fn(*args, **kwargs)
            _write_audit(action, subject_type)
            return result
        return decorator
    return wrapper


def _write_audit(action: str, subject_type: str):
    """写入审计日志"""
    try:
        from flask import g
        from app.models.audit_log import AuditLog
        verify_jwt_in_request(optional=True)
        actor_id = get_jwt_identity() if verify_jwt_in_request(optional=True) else None
        AuditLog.log(
            actor_id=actor_id,
            target_user_id=getattr(g, "current_user_id", None),
            action=action,
            subject_type=subject_type,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string[:255],
        )
    except Exception:
        pass


def register_jwt_handlers(jwt):
    """注册 JWT 全局事件钩子"""

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return unauthorized("Token 已过期，请刷新")

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return unauthorized("无效的 Token")

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return unauthorized("缺少 Token")

    @jwt.token_in_blocklist_loader
    def token_in_blocklist_callback(jwt_header, jwt_data):
        jti = jwt_data["jti"]
        from app.extensions import cache
        return cache.get(f"jwt:blacklist:{jti}") is True

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_data):
        return forbidden("Token 已被吊销")
