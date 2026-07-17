# -*- coding: utf-8 -*-
"""商家管理 API"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Product, ProductImage, Category
from app.models.base import ProductStatus
from app.utils.response import success, created, bad_request, not_found, forbidden
from app.api.product.routes import invalidate_product_cache
from app.utils.validators import validate_required
import re

ns = Namespace("merchant", description="商家管理")

_product_in = ns.model("MerchantProductIn", {
    "name": fields.String(required=True, description="商品名称"),
    "subtitle": fields.String(description="副标题"),
    "description": fields.String(description="商品描述"),
    "price": fields.String(required=True, description="售价"),
    "original_price": fields.String(description="原价"),
    "stock": fields.Integer(description="库存", default=0),
    "category_id": fields.Integer(description="分类ID"),
    "images": fields.List(fields.String, description="图片URL列表"),
    "status": fields.Integer(description="上下架状态 0=下架 1=上架", default=ProductStatus.ON_SALE),
})


def _make_slug(name):
    import uuid
    s = re.sub(r'[^a-zA-Z0-9\u4e00-\u9fff]', '-', name)
    s = re.sub(r'-+', '-', s).strip('-')
    return f"{s[:80]}-{uuid.uuid4().hex[:6]}"


@ns.route("/products")
class MerchantProductList(Resource):
    @jwt_required()
    @ns.doc(responses={200: "我的商品列表"})
    def get(self):
        """商家：我的商品列表"""
        user_id = int(get_jwt_identity())
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        status = request.args.get("status", type=int)
        keyword = request.args.get("q", "")

        query = Product.query.filter_by(merchant_id=user_id, is_deleted=False)
        if status is not None:
            query = query.filter_by(status=status)
        if keyword:
            query = query.filter(Product.name.ilike(f"%{keyword}%"))

        pagination = query.order_by(Product.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        items = []
        for p in pagination.items:
            d = p.to_dict()
            d["images"] = p.all_images
            d["primary_image"] = p.primary_image
            items.append(d)

        return success(items, meta={"page": page, "per_page": per_page, "total": pagination.total})

    @jwt_required()
    @ns.expect(_product_in)
    @ns.doc(responses={201: "上架成功", 400: "参数错误"})
    def post(self):
        """商家：上架商品"""
        user_id = int(get_jwt_identity())
        data = request.json

        validate_required(data, ["name", "price"])

        slug = _make_slug(data["name"])
        product = Product(
            name=data["name"],
            slug=slug,
            subtitle=data.get("subtitle"),
            description=data.get("description"),
            price=data["price"],
            original_price=data.get("original_price"),
            stock=data.get("stock", 0),
            category_id=data.get("category_id"),
            merchant_id=user_id,
            status=data.get("status", ProductStatus.ON_SALE),
        )
        db.session.add(product)
        db.session.flush()

        # 保存多图
        images = data.get("images") or []
        for i, url in enumerate(images):
            db.session.add(ProductImage(
                product_id=product.id,
                image_url=url,
                sort_order=i,
                is_primary=(i == 0),
            ))

        db.session.commit()

        invalidate_product_cache()
        return created(product.to_dict())


@ns.route("/products/<int:pid>")
class MerchantProductItem(Resource):
    @jwt_required()
    @ns.doc(responses={200: "商品详情", 404: "商品不存在"})
    def get(self, pid):
        """商家：商品详情"""
        user_id = int(get_jwt_identity())
        product = Product.query.filter_by(id=pid, merchant_id=user_id, is_deleted=False).first_or_404()
        d = product.to_dict()
        d["images"] = product.all_images
        d["primary_image"] = product.primary_image
        return success(d)

    @jwt_required()
    @ns.expect(_product_in)
    @ns.doc(responses={200: "已更新", 404: "商品不存在"})
    def put(self, pid):
        """商家：编辑商品"""
        user_id = int(get_jwt_identity())
        product = Product.query.filter_by(id=pid, merchant_id=user_id, is_deleted=False).first_or_404()
        data = request.json

        for field in ["name", "subtitle", "description", "price", "original_price", "stock", "category_id", "status"]:
            if field in data:
                setattr(product, field, data[field])

        # 更新图片
        if "images" in data:
            ProductImage.query.filter_by(product_id=pid, is_deleted=False).update({"is_deleted": True})
            for i, url in enumerate(data["images"]):
                db.session.add(ProductImage(
                    product_id=pid,
                    image_url=url,
                    sort_order=i,
                    is_primary=(i == 0),
                ))

        db.session.commit()

        invalidate_product_cache()
        return success(product.to_dict())

    @jwt_required()
    @ns.doc(responses={200: "已删除", 404: "商品不存在"})
    def delete(self, pid):
        """商家：删除商品"""
        user_id = int(get_jwt_identity())
        product = Product.query.filter_by(id=pid, merchant_id=user_id, is_deleted=False).first_or_404()
        product.is_deleted = True
        db.session.commit()
        invalidate_product_cache()
        return success({"msg": "删除成功"})


@ns.route("/products/<int:pid>/toggle")
class MerchantProductToggle(Resource):
    @jwt_required()
    @ns.doc(responses={200: "已切换上下架", 404: "商品不存在"})
    def post(self, pid):
        """商家：上下架切换"""
        user_id = int(get_jwt_identity())
        product = Product.query.filter_by(id=pid, merchant_id=user_id, is_deleted=False).first_or_404()
        product.status = ProductStatus.OFF_SALE if product.status == ProductStatus.ON_SALE else ProductStatus.ON_SALE
        db.session.commit()
        invalidate_product_cache()
        return success({"msg": "操作成功", "status": product.status})


@ns.route("/orders")
class MerchantOrderList(Resource):
    @jwt_required()
    @ns.doc(responses={200: "商家订单列表"})
    def get(self):
        """商家：查看自己商品相关的订单"""
        user_id = int(get_jwt_identity())
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)

        from app.models import Order, OrderItem
        # 找到商家商品对应的订单
        subq = db.session.query(OrderItem.order_id).join(
            Product, OrderItem.product_id == Product.id
        ).filter(
            Product.merchant_id == user_id,
            Product.is_deleted == False
        ).distinct().subquery()

        pagination = Order.query.filter(
            Order.id.in_(subq),
            Order.is_deleted == False
        ).order_by(Order.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

        orders = []
        for o in pagination.items:
            d = o.to_dict()
            d["items"] = [i.to_dict() for i in o.items if i.product_id and i.product and i.product.merchant_id == user_id]
            orders.append(d)

        return success(orders, meta={"page": page, "per_page": per_page, "total": pagination.total})


@ns.route("/stats")
class MerchantStats(Resource):
    @jwt_required()
    @ns.doc(responses={200: "商家数据统计"})
    def get(self):
        """商家：销售统计"""
        user_id = int(get_jwt_identity())
        from app.models import Order, OrderItem
        from app.models.base import OrderStatus
        from sqlalchemy import func

        total_products = Product.query.filter_by(merchant_id=user_id, is_deleted=False).count()
        on_sale = Product.query.filter_by(merchant_id=user_id, status=ProductStatus.ON_SALE, is_deleted=False).count()

        subq = db.session.query(OrderItem.order_id).join(
            Product, OrderItem.product_id == Product.id
        ).filter(Product.merchant_id == user_id, Product.is_deleted == False).distinct().subquery()

        total_orders = Order.query.filter(Order.id.in_(subq), Order.is_deleted == False).count()
        total_revenue = db.session.query(func.sum(Order.actual_amount)).filter(
            Order.id.in_(subq), Order.is_deleted == False, Order.status == OrderStatus.COMPLETED
        ).scalar() or 0

        return success({
            "total_products": total_products,
            "on_sale": on_sale,
            "total_orders": total_orders,
            "total_revenue": str(total_revenue),
        })
