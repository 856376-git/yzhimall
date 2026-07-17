# -*- coding: utf-8 -*-
"""商品 API"""
from flask import request, current_app
from flask_restx import Namespace, Resource, fields
from app.extensions import db, cache
from app.models import Product, ProductImage, Category
from app.models.base import ProductStatus
from app.utils.response import success, not_found

ns = Namespace("products", description="商品接口")

_product_out = ns.model("ProductOut", {
    "id": fields.Integer(readonly=True),
    "name": fields.String,
    "subtitle": fields.String,
    "price": fields.String,
    "original_price": fields.String,
    "stock": fields.Integer,
    "sold_count": fields.Integer,
    "view_count": fields.Integer,
    "images": fields.List(fields.String),
    "primary_image": fields.String,
    "status": fields.Integer,
    "merchant_id": fields.Integer,
    "merchant_name": fields.String,
    "created_at": fields.String(readonly=True),
})

_product_in = ns.model("ProductIn", {
    "name": fields.String(required=True),
    "price": fields.String(required=True),
    "category_id": fields.Integer,
    "brand_id": fields.Integer,
    "stock": fields.Integer(default=0),
    "images": fields.List(fields.String),
    "description": fields.String,
})


@ns.route("")
class ProductList(Resource):
    @ns.doc(params={"page": "页码", "per_page": "每页数量", "q": "搜索关键词", "sort": "排序: created_at/price_asc/price_desc/sold", "category_id": "分类ID"}, responses={200: "商品列表"})
    def get(self):
        """商品列表，Redis 缓存"""
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        keyword = request.args.get("q", "")
        sort = request.args.get("sort", "created_at")
        category_id = request.args.get("category_id", type=int)

        cache_key = f"product:list:p{page}:s{per_page}:q{keyword}:sort{sort}:cat{category_id or 0}"
        cached = cache.get(cache_key)
        if cached:
            return success(cached["items"], meta=cached["meta"])

        query = Product.query.filter_by(status=ProductStatus.ON_SALE, is_deleted=False)
        if keyword:
            query = query.filter(Product.name.ilike(f"%{keyword}%"))
        if category_id:
            query = query.filter_by(category_id=category_id)
        if sort == "price_asc":
            query = query.order_by(Product.price.asc())
        elif sort == "price_desc":
            query = query.order_by(Product.price.desc())
        elif sort == "sold":
            query = query.order_by(Product.sold_count.desc())
        else:
            query = query.order_by(Product.created_at.desc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        items = []
        for p in pagination.items:
            d = p.to_dict()
            d["images"] = p.all_images
            d["primary_image"] = p.primary_image
            if p.merchant:
                d["merchant_name"] = p.merchant.merchant_name or p.merchant.name
            items.append(d)

        meta = {"page": page, "per_page": per_page, "total": pagination.total}
        cache.set(cache_key, {"items": items, "meta": meta}, timeout=300)
        return success(items, meta=meta)


@ns.route("/<int:pid>")
class ProductItem(Resource):
    @ns.doc(responses={200: "商品详情", 404: "商品不存在"})
    def get(self, pid):
        """商品详情（浏览量+1）"""
        cache_key = f"product:{pid}"
        cached = cache.get(cache_key)
        if cached:
            return success(cached)

        product = db.session.get(Product, pid)
        if not product or product.is_deleted:
            return not_found("商品不存在")

        product.view_count = (product.view_count or 0) + 1
        db.session.commit()

        d = product.to_dict()
        d["images"] = product.all_images
        d["primary_image"] = product.primary_image
        if product.merchant:
            d["merchant_name"] = product.merchant.merchant_name or product.merchant.name
        skus = product.skus.filter_by(is_deleted=False).all() if hasattr(product, "skus") else []
        d["skus"] = [
            {"id": s.id, "sku_code": s.sku_code, "specs": s.specs,
             "price": float(s.price) if s.price is not None else None,
             "stock": s.stock}
            for s in skus
        ]

        cache.set(cache_key, d, timeout=3600)
        return success(d)


@ns.route("/categories")
class CategoryList(Resource):
    @ns.doc(responses={200: "分类列表"})
    def get(self):
        """分类列表"""
        cache_key = "category:tree"
        cached = cache.get(cache_key)
        if cached:
            return success(cached)

        categories = Category.query.filter_by(is_deleted=False, is_visible=True).order_by(Category.sort_order).all()
        result = [c.to_dict() for c in categories]
        cache.set(cache_key, result, timeout=86400)
        return success(result)



def invalidate_product_cache(product_id=None, category_id=None):
    """商品写操作后调用, 清除相关缓存."""
    try:
        # 清详情缓存
        if product_id:
            cache.delete(f"product:{product_id}")
        # 清列表缓存 (SimpleCache 没有.scan, 用一个固定 prefix 集合记录)
        # SimpleCache 不支持 scan, 这里用维护一个 known list keys 的简单方式
        keys = cache.get("__product_list_keys__") or set()
        for k in list(keys):
            cache.delete(k)
        cache.set("__product_list_keys__", set(), timeout=86400)
        cache.delete("category:tree")
    except Exception as e:
        current_app.logger.warning("invalidate_product_cache failed: %s", e)
