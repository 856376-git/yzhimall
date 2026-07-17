# -*- coding: utf-8 -*-
"""用户模型"""
from sqlalchemy import Column, Integer, String, Boolean, Table, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.models.base import BaseModel, UserStatus, UserGender
from app.extensions import db
import bcrypt


user_roles = Table(
    "user_roles",
    BaseModel.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class User(BaseModel):
    """用户表"""
    __tablename__ = "users"

    name = Column(String(80), nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    status = Column(Integer, nullable=False, default=UserStatus.ACTIVE, index=True)
    gender = Column(Integer, nullable=False, default=UserGender.UNKNOWN)
    oauth_provider = Column(String(20), nullable=True)
    oauth_uid = Column(String(255), nullable=True)

    # --- 三角色体系 ---
    role = Column(String(20), nullable=False, default="buyer", index=True)
    merchant_name = Column(String(200), nullable=True)
    merchant_logo = Column(String(500), nullable=True)
    verify_status = Column(Integer, nullable=False, default=0)
    last_login_at = Column(DateTime, nullable=True, comment="最后登录时间")

    roles = relationship("Role", secondary=user_roles, back_populates="users", lazy="joined")
    addresses = relationship("Address", back_populates="user", lazy="dynamic")
    orders = relationship("Order", back_populates="user", lazy="dynamic")
    cart = relationship("Cart", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", lazy="dynamic")
    notification_preferences = relationship("NotificationPreference", back_populates="user", lazy="dynamic")
    audit_logs = relationship("AuditLog", back_populates="user", lazy="dynamic")
    products = relationship("Product", back_populates="merchant", lazy="dynamic")

    def set_password(self, password: str):
        self.password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode(), self.password_hash.encode())

    def has_role(self, role_slugs):
        if isinstance(role_slugs, str):
            role_slugs = [role_slugs]
        return any(r.slug in role_slugs for r in self.roles)

    def has_permission(self, permission_slug: str) -> bool:
        if self.has_role("super-admin"):
            return True
        return any(
            p.slug == permission_slug
            for r in self.roles
            for p in r.permissions
        )

    @property
    def is_active(self):
        return self.status == UserStatus.ACTIVE

    @property
    def is_merchant(self):
        return self.role == "merchant"

    @property
    def is_admin(self):
        return self.role == "admin"

    def __repr__(self):
        return f"<User {self.email}>"


class Address(BaseModel):
    """收货地址表"""
    __tablename__ = "addresses"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    consignee = Column(String(80), nullable=False)
    phone = Column(String(20), nullable=False)
    province = Column(String(30), nullable=False)
    city = Column(String(30), nullable=False)
    district = Column(String(30), nullable=False)
    address = Column(String(255), nullable=False)
    zipcode = Column(String(10), nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="addresses")

    def __repr__(self):
        return f"<Address {self.consignee} {self.phone}>"

from sqlalchemy import Date, UniqueConstraint


class UserCheckIn(BaseModel):
    """用户每日签到表 - 记录连续签到天数与积分奖励"""
    __tablename__ = "user_checkins"
    __table_args__ = (UniqueConstraint("user_id", "check_date", name="uq_user_checkin_date"),)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    check_date = Column(Date, nullable=False)
    continuous_days = Column(Integer, nullable=False, default=1)
    reward_points = Column(Integer, nullable=False, default=0)

    user = relationship("User", backref="checkins")

    def __repr__(self):
        return f"<UserCheckIn uid={self.user_id} date={self.check_date} days={self.continuous_days}>"
