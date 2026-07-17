# -*- coding: utf-8 -*-
"""模拟支付 API - 沙箱环境"""
import uuid
import time
from decimal import Decimal
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Order
from app.models.base import OrderStatus, PaymentStatus
from app.utils.response import success, bad_request, not_found

ns = Namespace("payment", description="模拟支付")

# 内存中存储支付会话（沙箱模拟）
_payment_sessions = {}  # {session_id: {order_id, amount, created_at, status}}


def _generate_qr_data(session_id, amount, order_no):
    """生成二维码数据（模拟支付链接）"""
    return f"yzhimall://pay?session={session_id}&amount={amount}&order={order_no}"


_payment_create_in = ns.model("PaymentCreateIn", {
    "order_id": fields.Integer(required=True, description="待支付订单ID"),
})



@ns.route("/create")
class PaymentCreate(Resource):
    @jwt_required()
    @ns.expect(_payment_create_in)
    @ns.doc(responses={200: "支付会话创建成功", 400: "订单状态不允许支付", 404: "订单不存在"})
    def post(self):
        """创建支付会话，生成模拟二维码数据"""
        user_id = int(get_jwt_identity())
        data = request.json or {}
        order_id = data.get("order_id")

        if not order_id:
            return bad_request("缺少 order_id")

        order = Order.query.filter_by(id=order_id, user_id=user_id, is_deleted=False).first()
        if not order:
            return not_found("订单不存在")

        if order.status != OrderStatus.PENDING:
            return bad_request("订单状态不允许支付")

        # 生成支付会话
        session_id = uuid.uuid4().hex
        _payment_sessions[session_id] = {
            "order_id": order.id,
            "order_no": order.order_no,
            "amount": str(order.actual_amount),
            "created_at": time.time(),
            "status": "pending",  # pending / paid / cancelled
        }

        qr_data = _generate_qr_data(session_id, str(order.actual_amount), order.order_no)

        return success({
            "session_id": session_id,
            "order_id": order.id,
            "order_no": order.order_no,
            "amount": str(order.actual_amount),
            "qr_data": qr_data,  # 前端用这个生成二维码
            "pay_url": f"/payment/pay/{session_id}",  # 扫码支付页面
            "expire_seconds": 900,  # 15分钟过期
        })


@ns.route("/status/<session_id>")
class PaymentStatusResource(Resource):
    @ns.doc(responses={200: "支付状态", 404: "支付会话不存在或已过期"})
    def get(self, session_id):
        """查询支付状态（轮询用）"""
        session = _payment_sessions.get(session_id)
        if not session:
            return not_found("支付会话不存在或已过期")

        # 检查是否过期（15分钟）
        if time.time() - session["created_at"] > 900:
            session["status"] = "expired"
            return success({"status": "expired", "paid": False})

        return success({
            "status": session["status"],
            "paid": session["status"] == "paid",
        })


@ns.route("/callback/<session_id>")
class PaymentCallback(Resource):
    @ns.doc(responses={200: "支付成功", 404: "支付会话/关联订单不存在"})
    def post(self, session_id):
        """模拟回调：直接标记已支付（沙箱测试用）"""
        session = _payment_sessions.get(session_id)
        if not session:
            return not_found("支付会话不存在")

        if session["status"] == "paid":
            return success({"msg": "已支付", "status": "paid"})

        order = Order.query.get(session["order_id"])
        if not order or order.is_deleted:
            return not_found("关联订单不存在")

        # 更新订单状态（事务保护）
        order.status = OrderStatus.PAID
        order.payment_status = PaymentStatus.PAID
        order.paid_at = int(time.time())
        db.session.commit()

        session["status"] = "paid"

        return success({
            "msg": "支付成功",
            "status": "paid",
            "order_no": order.order_no,
        })


@ns.route("/cancel/<session_id>")
class PaymentCancel(Resource):
    @jwt_required()
    @ns.doc(responses={200: "已取消", 404: "支付会话不存在"})
    def post(self, session_id):
        """取消支付"""
        session = _payment_sessions.get(session_id)
        if not session:
            return not_found("支付会话不存在")
        session["status"] = "cancelled"
        return success({"msg": "已取消"})
