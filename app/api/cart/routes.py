# -*- coding: utf-8 -*-
"""购物车 API"""
from decimal import Decimal
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Cart, CartItem, Product, ProductSKU
from app.utils.response import success, bad_request, not_found

ns = Namespace("cart", description="购物车接口")

_item_in = ns.model("CartItemIn", {
    "product_id": fields.Integer(required=True),
    "sku_id": fields.Integer,
    "quantity": fields.Integer(required=True, min=1),
})

_item_out = ns.model("CartItemOut", {
    "id": fields.Integer(readonly=True),
    "product_id": fields.Integer,
    "product_name": fields.String,
    "sku_id": fields.Integer,
    "sku_desc": fields.String,
    "price": fields.String,
    "quantity": fields.Integer,
    "subtotal": fields.String,
})


def _get_or_create_cart(user_id: int) -> Cart:
    cart = Cart.query.filter_by(user_id=user_id, is_deleted=False).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.commit()
    return cart


_item_update_in = ns.model("CartItemUpdateIn", {
    "item_id": fields.Integer(required=True, description="购物车项ID"),
    "quantity": fields.Integer(required=True, min=0, description="数量，0 表示删除"),
})



@ns.route("")
class CartResource(Resource):
    @jwt_required()
    # no marshal: returns success() envelope, see app/utils/response.py
    @ns.doc(responses={200: "购物车列表"})
    def get(self):
        """获取购物车列表"""
        user_id = int(get_jwt_identity())
        cart = Cart.query.filter_by(user_id=user_id, is_deleted=False).first()
        if not cart:
            return success([])
        items = CartItem.query.filter_by(cart_id=cart.id, is_deleted=False).all()
        return success([i.to_dict() for i in items])

    @jwt_required()
    @ns.doc(responses={200: "已清空"})
    def delete(self):
        """清空购物车"""
        user_id = int(get_jwt_identity())
        cart = Cart.query.filter_by(user_id=user_id, is_deleted=False).first()
        if cart:
            CartItem.query.filter_by(cart_id=cart.id).update({"is_deleted": True})
            db.session.commit()
        return success({"msg": "已清空"})


@ns.route("/items")
class CartItems(Resource):
    @jwt_required()
    @ns.expect(_item_in)
    @ns.doc(responses={200: "已加入购物车", 400: "商品不可用/库存不足"})
    def post(self):
        """添加商品到购物车"""
        user_id = int(get_jwt_identity())
        data = request.json
        product_id = data["product_id"]
        quantity = data.get("quantity", 1)
        sku_id = data.get("sku_id")

        # 检查商品
        product = Product.query.get(product_id)
        if not product or product.is_deleted or product.status != 1:
            return bad_request("商品不可用")

        # 检查库存
        if sku_id:
            sku = ProductSKU.query.filter_by(id=sku_id, product_id=product_id, is_deleted=False).first()
            if not sku or sku.stock < quantity:
                return bad_request("库存不足")
            price = sku.price
            sku_desc = sku.specs
        else:
            if product.stock < quantity:
                return bad_request("库存不足")
            price = product.price
            sku_desc = None

        cart = _get_or_create_cart(user_id)

        # 检查是否已存在
        exist = CartItem.query.filter_by(
            cart_id=cart.id, product_id=product_id,
            sku_id=sku_id, is_deleted=False
        ).first()

        if exist:
            exist.quantity += quantity
            exist.subtotal = Decimal(str(exist.price)) * exist.quantity
        else:
            item = CartItem(
                cart_id=cart.id,
                product_id=product_id,
                sku_id=sku_id,
                quantity=quantity,
                price=price,
                subtotal=Decimal(str(price)) * quantity,
            )
            db.session.add(item)

        db.session.commit()
        return success({"msg": "已加入购物车"})

    @jwt_required()
    @ns.expect(_item_update_in)
    @ns.doc(responses={200: "已更新", 400: "购物车为空"})
    def put(self):
        """更新购物车商品数量"""
        user_id = int(get_jwt_identity())
        data = request.json
        item_id = data.get("item_id")
        quantity = data.get("quantity")

        cart = Cart.query.filter_by(user_id=user_id, is_deleted=False).first()
        if not cart:
            return bad_request("购物车为空")

        item = CartItem.query.filter_by(id=item_id, cart_id=cart.id, is_deleted=False).first_or_404()
        if quantity <= 0:
            item.is_deleted = True
        else:
            item.quantity = quantity
            item.calc_subtotal()
        db.session.commit()
        return success({"msg": "已更新"})

    @jwt_required()
    @ns.doc(responses={200: "已删除"})
    def delete(self):
        """删除购物车商品"""
        user_id = int(get_jwt_identity())
        data = request.json or {}
        item_id = data.get("item_id")

        cart = Cart.query.filter_by(user_id=user_id, is_deleted=False).first()
        if not cart:
            return success({"msg": "购物车为空"})

        if item_id:
            CartItem.query.filter_by(id=item_id, cart_id=cart.id).update({"is_deleted": True})
        db.session.commit()
        return success({"msg": "已删除"})
