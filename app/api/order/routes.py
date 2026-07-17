# -*- coding: utf-8 -*-
"""订单 API - 含事务 + FOR UPDATE 行锁防超卖"""
import uuid
from decimal import Decimal
from datetime import datetime
from flask import request, current_app
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Order, OrderItem, Cart, CartItem, Product, ProductSKU, Address
from app.models.base import OrderStatus, PaymentStatus
from app.utils.response import success, created, bad_request
from app.services.notification_service import NotificationService

ns = Namespace("orders", description="订单接口")

_order_out = ns.model("OrderOut", {
    "id": fields.Integer(readonly=True),
    "order_no": fields.String(readonly=True),
    "status": fields.Integer,
    "total_amount": fields.String,
    "discount_amount": fields.String,
    "shipping_fee": fields.String,
    "actual_amount": fields.String,
    "created_at": fields.String(readonly=True),
    "paid_at": fields.Integer,
})


def _dec2float(obj):
    """递归把 Decimal 转 float，避免 jsonify 序列化失败。"""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: _dec2float(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_dec2float(x) for x in obj]
    return obj


def _status_text(order):
    return OrderStatus.choices().get(order.status, str(order.status))


@ns.route("")
class OrderList(Resource):
    @jwt_required()
    @ns.doc(responses={200: "订单列表"})
    def get(self):
        """我的订单列表"""
        user_id = int(get_jwt_identity())
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        status = request.args.get("status", type=int)
        query = Order.query.filter_by(user_id=user_id, is_deleted=False)
        if status:
            query = query.filter_by(status=status)
        pagination = query.order_by(Order.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        orders = []
        for o in pagination.items:
            d = _dec2float(o.to_dict())
            d["status_text"] = _status_text(o)
            d["items"] = [_dec2float(i.to_dict()) for i in o.items]
            orders.append(d)
        return success(orders, meta={"page": page, "per_page": per_page, "total": pagination.total})

    @jwt_required()
    @ns.expect(ns.model("CreateOrder", {
        "address_id": fields.Integer(required=True),
        "items": fields.List(fields.Nested(ns.model("Item", {
            "product_id": fields.Integer(required=True),
            "sku_id": fields.Integer,
            "quantity": fields.Integer(required=True, min=1),
        })), required=True),
        "remark": fields.String,
    }))
    @ns.doc(responses={201: "创建成功", 400: "创建失败/库存不足", 404: "地址不存在"})
    def post(self):
        """创建订单（幂等key + 事务行锁）"""
        user_id = int(get_jwt_identity())
        data = request.json
        idempotent_key = request.headers.get("X-Idempotent-Key") or str(uuid.uuid4())
        if Order.query.filter_by(idempotent_key=idempotent_key).first():
            return bad_request("请勿重复提交订单")

        try:
            items_data = data["items"]
            if not items_data:
                return bad_request("订单商品不能为空")

            total_amount = Decimal("0")
            order_items = []

            for item_data in items_data:
                pid = item_data["product_id"]
                qty = item_data["quantity"]
                sku_id = item_data.get("sku_id")

                if sku_id:
                    sku = ProductSKU.query.filter_by(id=sku_id, product_id=pid, is_deleted=False).with_for_update().first()
                    if not sku:
                        return bad_request("SKU 不存在")
                    if sku.stock < qty:
                        return bad_request("库存不足")
                    sku.stock -= qty
                    price = sku.price
                    sku_desc = sku.specs
                    product = sku.product
                else:
                    product = Product.query.filter_by(id=pid, is_deleted=False).with_for_update().first()
                    if not product or product.stock < qty:
                        return bad_request("商品库存不足")
                    product.stock -= qty
                    price = product.price
                    sku_desc = None

                subtotal = Decimal(str(price)) * qty
                total_amount += subtotal
                order_items.append({
                    "product_id": pid,
                    "sku_id": sku_id,
                    "product_name": product.name,
                    "product_image": (product.images.split(",")[0] if product.images else None),
                    "sku_desc": sku_desc,
                    "price": price,
                    "quantity": qty,
                    "subtotal": subtotal,
                })

            address = Address.query.filter_by(id=data["address_id"], user_id=user_id, is_deleted=False).first_or_404()
            order_no = uuid.uuid4().hex[:16].upper()

            # 运费: 满 99 包邮, 未满收 12 元 —— 与前端结账页展示一致,避免实付金额对不上
            shipping_fee = Decimal("0") if total_amount >= 99 else Decimal("12")
            actual_amount = total_amount + shipping_fee

            order = Order(
                order_no=order_no,
                user_id=user_id,
                total_amount=total_amount,
                discount_amount=Decimal("0"),
                # 运费: 满 99 包邮, 未满收 12 元 —— 与前端结账页展示一致,避免实付金额对不上
                shipping_fee=shipping_fee,
                actual_amount=actual_amount,
                consignee=address.consignee,
                phone=address.phone,
                province=address.province,
                city=address.city,
                district=address.district,
                address=address.address,
                zipcode=address.zipcode,
                remark=data.get("remark"),
                idempotent_key=idempotent_key,
                status=OrderStatus.PENDING,
            )
            db.session.add(order)
            db.session.flush()

            for item in order_items:
                db.session.add(OrderItem(order_id=order.id, **item))

            db.session.commit()

            # 异步延时关闭（broker 不可用时降级：仅记日志，不阻断下单）
            try:
                from app.tasks.order_tasks import close_timeout_order
                import threading
                threading.Thread(target=close_timeout_order.apply_async,
                    kwargs={"args": [order.id], "countdown": 1800},
                    daemon=True).start()
            except Exception as e:
                current_app.logger.warning("schedule order close failed (broker down?): %s", e)

            return created(_dec2float(order.to_dict()))

        except Exception as e:
            db.session.rollback()
            return bad_request(f"创建订单失败: {str(e)}")


@ns.route("/<int:oid>")
class OrderResource(Resource):
    @jwt_required()
    @ns.doc(responses={200: "订单详情", 404: "订单不存在"})
    def get(self, oid):
        """订单详情"""
        user_id = int(get_jwt_identity())
        order = Order.query.filter_by(id=oid, user_id=user_id, is_deleted=False).first_or_404()
        d = _dec2float(order.to_dict())
        d["status_text"] = _status_text(order)
        d["items"] = [_dec2float(i.to_dict()) for i in order.items]
        return success(d)

    @jwt_required()
    @ns.doc(responses={200: "支付成功", 400: "订单状态不允许支付"})
    def post(self, oid):
        """模拟支付"""
        user_id = int(get_jwt_identity())
        order = Order.query.filter_by(id=oid, user_id=user_id, is_deleted=False).first_or_404()
        if order.status != OrderStatus.PENDING:
            return bad_request("订单状态不允许支付")
        order.status = OrderStatus.PAID
        order.payment_status = PaymentStatus.PAID
        order.paid_at = int(datetime.utcnow().timestamp())
        db.session.commit()
        return success({"msg": "支付成功", "order_no": order.order_no})

    @jwt_required()
    @ns.doc(responses={200: "已取消", 400: "当前状态不允许取消"})
    def delete(self, oid):
        """取消订单"""
        user_id = int(get_jwt_identity())
        order = Order.query.filter_by(id=oid, user_id=user_id, is_deleted=False).first_or_404()
        if not OrderStatus.can_cancel(order.status):
            return bad_request("当前状态不允许取消")
        order.status = OrderStatus.CANCELLED
        for item in order.items:
            if item.sku_id:
                sku = db.session.get(ProductSKU, item.sku_id)
                if sku:
                    sku.stock += item.quantity
            else:
                product = db.session.get(Product, item.product_id)
                if product:
                    product.stock += item.quantity
        db.session.commit()
        return success({"msg": "已取消"})
