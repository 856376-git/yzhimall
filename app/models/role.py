# -*- coding: utf-8 -*-
"""角色模型"""
from sqlalchemy import Column, String, Boolean, Table, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Role(BaseModel):
    """角色表"""
    __tablename__ = "roles"

    name = Column(String(80), unique=True, nullable=False)
    slug = Column(String(80), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    is_system = Column(Boolean, default=False, nullable=False)   # 系统内置不可删
    sort_order = Column(Integer, default=0, nullable=False)

    # 关系
    users = relationship("User", secondary="user_roles", back_populates="roles")
    permissions = relationship(
        "Permission", secondary="role_permissions", back_populates="roles", lazy="joined"
    )

    def has_permission(self, permission_slug: str) -> bool:
        return any(p.slug == permission_slug for p in self.permissions)

    def __repr__(self):
        return f"<Role {self.slug}>"


# 中间表：角色-权限
role_permissions = Table(
    "role_permissions",
    BaseModel.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)
