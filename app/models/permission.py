# -*- coding: utf-8 -*-
"""权限模型"""
from sqlalchemy import Column, String, Table, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Permission(BaseModel):
    """权限表（33条权限）"""
    __tablename__ = "permissions"

    name = Column(String(80), nullable=False)         # 显示名称：查看商品
    slug = Column(String(80), unique=True, nullable=False, index=True)  # 唯一标识：product.view
    group_name = Column(String(80), nullable=False, index=True)  # 分组：products
    description = Column(String(255), nullable=True)

    # 关系
    roles = relationship(
        "Role", secondary="role_permissions", back_populates="permissions"
    )

    def __repr__(self):
        return f"<Permission {self.slug}>"
