# -*- coding: utf-8 -*-
"""认证服务，JWT + RefreshToken + 黑名单"""
from datetime import datetime, timedelta
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    get_jwt, get_jwt_identity, get_jti
)
from app.extensions import db, cache
from app.models import User, Role, AuditLog
from app.utils.exceptions import ValidationError, UnauthorizedError, ConflictError, NotFoundError
from app.utils.validators import validate_email, validate_password, validate_required_fields


class AuthService:
    VALID_ROLES = ("buyer", "merchant", "admin")

    # ========================
    # 注册（支持角色选择）
    # ========================
    @staticmethod
    def register(name: str, email: str, password: str, phone: str = None, role: str = "buyer", **kwargs) -> User:
        validate_email(email)
        validate_password(password)

        if role not in AuthService.VALID_ROLES:
            raise ValidationError(f"无效的角色类型，可选：{', '.join(AuthService.VALID_ROLES)}")

        if User.query.filter_by(email=email, is_deleted=False).first():
            raise ConflictError("该邮箱已被注册")

        user = User(
            name=name,
            email=email,
            phone=phone,
            role=role,
            merchant_name=kwargs.get("merchant_name"),  # 商家入驻填店铺名
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    # ========================
    # 登录
    # ========================
    @staticmethod
    def login(email: str, password: str, ip_address: str = None) -> dict:
        user = User.query.filter_by(email=email, is_deleted=False).first()
        if not user or not user.check_password(password):
            raise UnauthorizedError("邮箱或密码错误")

        if not user.is_active:
            raise UnauthorizedError("账号已被禁用")

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        user.last_login_at = datetime.utcnow()
        db.session.commit()

        AuditLog.log(
            actor_id=user.id,
            target_user_id=user.id,
            action="user.login",
            subject_type="Auth",
            ip_address=ip_address,
        )

        return {
            "user": user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    # ========================
    # 商家/管理员登录（账号+密码，无邮箱限制）
    # ========================
    @staticmethod
    def login_by_account(account: str, password: str, role: str, ip_address: str = None) -> dict:
        """商家或管理员登录（支持邮箱或手机号登录）"""
        validate_required_fields({"account": account, "password": password, "role": role},
                                 ["account", "password", "role"])

        # 根据角色查询
        query = User.query.filter_by(role=role, is_deleted=False)
        if "@" in account:
            query = query.filter_by(email=account)
        else:
            query = query.filter_by(phone=account)
        user = query.first()

        if not user or not user.check_password(password):
            raise UnauthorizedError("账号或密码错误")

        if not user.is_active:
            raise UnauthorizedError("账号已被禁用")

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        user.last_login_at = datetime.utcnow()
        db.session.commit()

        AuditLog.log(
            actor_id=user.id,
            target_user_id=user.id,
            action=f"user.login.{role}",
            subject_type="Auth",
            ip_address=ip_address,
        )

        return {
            "user": user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    # ========================
    # 刷新 Access Token
    # ========================
    @staticmethod
    def refresh_access_token() -> dict:
        identity = get_jwt_identity()
        access_token = create_access_token(identity=identity)
        return {"access_token": access_token}

    # ========================
    # 登出，Token 加入黑名单
    # ========================
    @staticmethod
    def logout(jwt_data: dict, ip_address: str = None):
        jti = jwt_data["jti"]
        exp = jwt_data["exp"]

        remaining = exp - datetime.utcnow().timestamp()
        if remaining > 0:
            cache.set(f"jwt:blacklist:{jti}", True, timeout=int(remaining))

        user_id = jwt_data.get("sub")
        if user_id:
            AuditLog.log(
                actor_id=int(user_id),
                target_user_id=int(user_id),
                action="user.logout",
                subject_type="Auth",
                ip_address=ip_address,
            )

    # ========================
    # 获取用户信息
    # ========================
    @staticmethod
    def get_user_info(user_id: int) -> User:
        user = User.query.get(user_id)
        if not user or user.is_deleted:
            raise NotFoundError("用户不存在")
        return user
