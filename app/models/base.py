# -*- coding: utf-8 -*-
"""
SQLAlchemy 企业级基类
- 统一 id / created_at / updated_at / is_deleted
- 枚举类型定义
- 软删除 Mixin
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, DateTime, Boolean,
    Enum as SAEnum, Index, func
)
from sqlalchemy.orm import declarative_base
from app.extensions import db

Base = declarative_base()


class SoftDeleteMixin:
    """软删除 Mixin，所有模型继承此基类"""
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)


class TimestampMixin:
    """时间戳 Mixin"""
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        default=datetime.utcnow
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class IdMixin:
    """主键 Mixin"""
    id = Column(Integer, primary_key=True, autoincrement=True)


class BaseModel(IdMixin, TimestampMixin, SoftDeleteMixin, db.Model):
    """所有模型的基类，继承此类的模型自动获得以下字段：
    - id (int, PK)
    - created_at (datetime)
    - updated_at (datetime)
    - is_deleted (bool, 软删除标志)
    - deleted_at (datetime, 软删除时间)
    """
    __abstract__ = True

    def to_dict(self):
        """转字典（排除软删除字段）"""
        return {
            c.name: getattr(self, c.name)
           for c in self.__table__.columns
            if c.name not in ("is_deleted", "deleted_at", "password_hash")
        }


# ========================
# 枚举类型常量
# ========================

class UserStatus:
    ACTIVE = 1
    INACTIVE = 2
    BANNED = 3

    @classmethod
    def choices(cls):
        return {
            cls.ACTIVE: "正常",
            cls.INACTIVE: "停用",
            cls.BANNED: "封禁",
        }


class UserGender:
    UNKNOWN = 0
    MALE = 1
    FEMALE = 2

    @classmethod
    def choices(cls):
        return {
            cls.UNKNOWN: "未知",
            cls.MALE: "男",
            cls.FEMALE: "女",
        }


class OrderStatus:
    PENDING = 10       # 待支付
    PAID = 20          # 已支付
    SHIPPING = 30      # 发货中
    SHIPPED = 40       # 已发货
    COMPLETED = 50     # 已完成
    CANCELLED = 60     # 已取消
    REFUNDING = 70     # 退款中
    REFUNDED = 80      # 已退款

    @classmethod
    def choices(cls):
        return {
            cls.PENDING: "待支付",
            cls.PAID: "已支付",
            cls.SHIPPING: "发货中",
            cls.SHIPPED: "已发货",
            cls.COMPLETED: "已完成",
            cls.CANCELLED: "已取消",
            cls.REFUNDING: "退款中",
            cls.REFUNDED: "已退款",
        }

    @classmethod
    def can_cancel(cls, status):
        """哪些状态可以取消"""
        return status in (cls.PENDING, cls.PAID)

    @classmethod
    def can_refund(cls, status):
        """哪些状态可以退款"""
        return status in (cls.SHIPPED, cls.COMPLETED)


class ProductStatus:
    DRAFT = 0     # 草稿
    ON_SALE = 1   # 上架
    OFF_SALE = 2   # 下架

    @classmethod
    def choices(cls):
        return {
            cls.DRAFT: "草稿",
            cls.ON_SALE: "上架",
            cls.OFF_SALE: "下架",
        }


class PaymentStatus:
    UNPAID = 0
    PAID = 1
    REFUNDED = 2

    @classmethod
    def choices(cls):
        return {
            cls.UNPAID: "未支付",
            cls.PAID: "已支付",
            cls.REFUNDED: "已退款",
        }
