# -*- coding: utf-8 -*-
"""商品分类模型（支持多级）"""
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Category(BaseModel):
    """商品分类表（多级树形结构）"""
    __tablename__ = "categories"

    name = Column(String(80), nullable=False)
    slug = Column(String(80), unique=True, nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True, index=True)
    icon_url = Column(String(500), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_visible = Column(Boolean, default=True, nullable=False)

    # 自关联
    parent = relationship("Category", remote_side="Category.id", backref="children")

    def __repr__(self):
        return f"<Category {self.name}>"
