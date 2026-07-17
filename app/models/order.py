# -*- coding: utf-8 -*-
"""订单模型（含快照 + 行锁防超卖）"""
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Text, DECIMAL,
    ForeignKey, Index, func
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel, OrderStatus, PaymentStatus
from app.extensions import db


class Order(BaseModel):
    """订单主表"""
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_order_user_status", "user_id", "status"),
        Index("ix_order_no", "order_no", unique=True),
        Index("ix_order_created", "created_at"),
    )

    order_no = Column(String(32), unique=True, nullable=False, index=True)  # 订单号
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 金额
    total_amount = Column(DECIMAL(10, 2), nullable=False)   # 商品总价
    discount_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    shipping_fee = Column(DECIMAL(10, 2), nullable=False, default=0)
    actual_amount = Column(DECIMAL(10, 2), nullable=False)   # 实付金额

    # 收货信息快照（下单时快照，防止用户改地址）
    consignee = Column(String(80), nullable=False)
    phone = Column(String(20), nullable=False)
    province = Column(String(30), nullable=False)
    city = Column(String(30), nullable=False)
    district = Column(String(30), nullable=False)
    address = Column(String(255), nullable=False)
    zipcode = Column(String(10), nullable=True)

    # 状态
    status = Column(Integer, nullable=False, default=OrderStatus.PENDING, index=True)
    payment_status = Column(Integer, nullable=False, default=PaymentStatus.UNPAID)
    payment_method = Column(String(20), nullable=True)         # alipay / wechat / balance
    paid_at = Column(Integer, nullable=True)                  # 支付时间戳

    # 用户备注
    remark = Column(String(500), nullable=True)
    # 快递信息
    tracking_no = Column(String(64), nullable=True)
    shipping_at = Column(Integer, nullable=True)

    # 幂等 key（支付回调用）
    idempotent_key = Column(String(64), unique=True, nullable=True, index=True)

    # 关系
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", lazy="joined", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order {self.order_no}>"


class OrderItem(BaseModel):
    """订单明细表"""
    __tablename__ = "order_items"
    __table_args__ = (
        Index("ix_item_order", "order_id"),
    )

    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    sku_id = Column(Integer, ForeignKey("product_skus.id", ondelete="SET NULL"), nullable=True)

    # 商品快照（下单时价格，防止商家改价）
    product_name = Column(String(200), nullable=False)
    product_image = Column(String(500), nullable=True)
    sku_desc = Column(String(500), nullable=True)   # 规格描述
    sku_code = Column(String(64), nullable=True)

    price = Column(DECIMAL(10, 2), nullable=False)  # 下单时单价
    quantity = Column(Integer, nullable=False, default=1)
    subtotal = Column(DECIMAL(10, 2), nullable=False)  # 小计

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="items")
    sku = relationship("ProductSKU", back_populates="order_items")

    def __repr__(self):
        return f"<OrderItem {self.product_name} x{self.quantity}>"
