# -*- coding: utf-8 -*-
"""商品 + SKU + 图片 模型"""
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Text, DECIMAL, Boolean,
    ForeignKey, Index, func
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel, ProductStatus
from app.extensions import db


class ProductImage(BaseModel):
    """商品图片表（一对多，支持多图）"""
    __tablename__ = "product_images"

    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    is_primary = Column(Boolean, nullable=False, default=False)

    product = relationship("Product", back_populates="product_images")

    def __repr__(self):
        return f"<ProductImage {self.image_url}>"


class Product(BaseModel):
    """商品表（SPU）"""
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_product_status_category", "status", "category_id"),
        Index("ix_product_name_search", "name"),
    )

    name = Column(String(200), nullable=False, index=True)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    subtitle = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False, index=True)
    original_price = Column(DECIMAL(10, 2), nullable=True)
    cost_price = Column(DECIMAL(10, 2), nullable=True)
    stock = Column(Integer, nullable=False, default=0)
    sold_count = Column(Integer, nullable=False, default=0)
    view_count = Column(Integer, nullable=False, default=0)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)

    # images 保留兼容，新图片走 ProductImage 表
    images = Column(Text, nullable=True)
    specs = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    status = Column(Integer, nullable=False, default=ProductStatus.ON_SALE, index=True)

    # 商家关联
    merchant_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # 关系
    category = relationship("Category", backref="products")
    brand = relationship("Brand", backref="products")
    merchant = relationship("User", back_populates="products")
    skus = relationship("ProductSKU", back_populates="product", lazy="dynamic")
    items = relationship("OrderItem", back_populates="product")
    product_images = relationship("ProductImage", back_populates="product", order_by="ProductImage.sort_order", lazy="dynamic")

    @property
    def primary_image(self):
        """获取主图"""
        primary = self.product_images.filter_by(is_primary=True, is_deleted=False).first()
        if primary:
            return primary.image_url
        first = self.product_images.filter_by(is_deleted=False).order_by(ProductImage.sort_order).first()
        return first.image_url if first else None

    @property
    def all_images(self):
        """获取所有图片URL列表"""
        imgs = self.product_images.filter_by(is_deleted=False).order_by(ProductImage.sort_order).all()
        if imgs:
            return [img.image_url for img in imgs]
        if self.images:
            import json
            try:
                return json.loads(self.images)
            except Exception:
                return [self.images]
        return []

    def __repr__(self):
        return f"<Product {self.name}>"


class ProductSKU(BaseModel):
    """商品规格表（SKU）"""
    __tablename__ = "product_skus"
    __table_args__ = (
        Index("ix_sku_product_stock", "product_id", "stock"),
    )

    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    sku_code = Column(String(64), unique=True, nullable=False, index=True)
    specs = Column(String(500), nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    stock = Column(Integer, nullable=False, default=0)

    product = relationship("Product", back_populates="skus")
    cart_items = relationship("CartItem", back_populates="sku")
    order_items = relationship("OrderItem", back_populates="sku")

    def __repr__(self):
        return f"<SKU {self.sku_code}>"


class Brand(BaseModel):
    """品牌表"""
    __tablename__ = "brands"

    name = Column(String(80), unique=True, nullable=False)
    slug = Column(String(80), unique=True, nullable=False)
    logo_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)

    def __repr__(self):
        return f"<Brand {self.name}>"
