# -*- coding: utf-8 -*-
"""购物车模型"""
from decimal import Decimal
from sqlalchemy import Column, Integer, DECIMAL, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Cart(BaseModel):
    """购物车表（一用户一购物车）"""
    __tablename__ = "carts"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_cart_user"),
    )

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0)

    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", lazy="joined", cascade="all, delete-orphan")

    def calc_total(self):
        self.total_amount = Decimal(
            sum(item.subtotal for item in self.items)
        )
        return self.total_amount

    def __repr__(self):
        return f"<Cart user:{self.user_id} items:{len(self.items)}>"


class CartItem(BaseModel):
    """购物车商品表"""
    __tablename__ = "cart_items"
    __table_args__ = (
        Index("ix_cart_item_user_product", "cart_id", "product_id", "sku_id"),
    )

    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    sku_id = Column(Integer, ForeignKey("product_skus.id", ondelete="SET NULL"), nullable=True)

    quantity = Column(Integer, nullable=False, default=1)
    price = Column(DECIMAL(10, 2), nullable=False)   # 选中时价格
    subtotal = Column(DECIMAL(10, 2), nullable=False)

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
    sku = relationship("ProductSKU", back_populates="cart_items")

    def calc_subtotal(self):
        self.subtotal = Decimal(str(self.price)) * self.quantity
        return self.subtotal

    def __repr__(self):
        return f"<CartItem product:{self.product_id} sku:{self.sku_id} x{self.quantity}>"
