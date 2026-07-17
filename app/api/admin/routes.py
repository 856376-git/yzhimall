# -*- coding: utf-8 -*-
"""后台管理 API：直接吐前端 mock 串约定，页面 JSX 零改动。"""
from decimal import Decimal

from flask import request
from flask_restx import Namespace, Resource, fields
from sqlalchemy import func, or_

from app.extensions import db
from app.models import Order, Product, User, Role, Permission
from app.models.base import OrderStatus, ProductStatus, UserStatus
from app.utils.decorators import admin_required
from app.utils.response import success, created

ns = Namespace("admin", description="后台管理")

# 状态/角色映射：与前端 mock 串约定对齐，后端直接吐串
_ORDER_STATUS_STR = {
    OrderStatus.PENDING: "unpaid",
    OrderStatus.PAID: "paid",
    OrderStatus.SHIPPING: "shipped",
    OrderStatus.SHIPPED: "shipped",
    OrderStatus.COMPLETED: "completed",
    OrderStatus.CANCELLED: "cancelled",
    OrderStatus.REFUNDING: "cancelled",
    OrderStatus.REFUNDED: "cancelled",
}
_USER_STATUS_STR = {
    UserStatus.ACTIVE: "active",
    UserStatus.INACTIVE: "locked",
    UserStatus.BANNED: "locked",
}
_PRODUCT_STATUS_STR = {
    ProductStatus.ON_SALE: "active",
    ProductStatus.DRAFT: "off",
    ProductStatus.OFF_SALE: "off",
}
_ROLE_PRIORITY = ("admin", "merchant", "buyer")


def _dec2float(obj):
    """递归把 Decimal 转 float，避免 Flask jsonify 序列化失败。"""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: _dec2float(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_dec2float(x) for x in obj]
    return obj


def _fmt_dt(dt):
    return dt.strftime("%Y-%m-%d %H:%M") if dt else None


def _role_rank(u):
    """用户最高优先级单角色 slug（前端下拉 admin/merchant/buyer 三档）。"""
    role_col = getattr(u, "role", None)
    if role_col in _ROLE_PRIORITY:
        return role_col
    for slug in _ROLE_PRIORITY:
        try:
            if u.has_role(slug):
                return slug
        except Exception:
            pass
    return "buyer"


def _user_admin_view(u):
    return {
        "id": u.id,
        "account": u.email,
        "nickname": u.name,
        "role": _role_rank(u),
        "status": _USER_STATUS_STR.get(u.status, "locked"),
        "phone": u.phone,
        "created_at": _fmt_dt(u.created_at),
    }


def _merchant_display(m):
    if not m:
        return ""
    return getattr(m, "merchant_name", None) or m.name or m.email


def _order_merchant_name(o):
    for item in (getattr(o, "items", None) or []):
        p = getattr(item, "product", None)
        if p is not None:
            return _merchant_display(getattr(p, "merchant", None))
    return ""


def _order_admin_view(o):
    buyer = o.user
    return {
        "id": o.id,
        "order_no": o.order_no,
        "buyer": _merchant_display(buyer) if buyer else "",
        "merchant_name": _order_merchant_name(o),
        "total_amount": float(o.actual_amount if o.actual_amount is not None else (o.total_amount or 0)),
       "status": _ORDER_STATUS_STR.get(o.status, "unpaid"),
       "created_at": _fmt_dt(o.created_at),
        "items": [
            {
                "name": it.product_name,
                "quantity": it.quantity,
                "price": float(it.price or 0),
            }
            for it in (o.items or [])
        ],
   }


_admin_role_in = ns.model("AdminRoleUpdateIn", {
    "role": fields.String(required=True, description="角色: buyer/merchant/admin"),
})
_admin_status_in = ns.model("AdminOrderStatusIn", {
    "status": fields.Integer(required=True, description="订单状态码"),
})
_admin_product_in = ns.model("AdminProductIn", {
    "name": fields.String(required=True),
    "price": fields.String(required=True),
    "category_id": fields.Integer(),
    "brand_id": fields.Integer(),
    "stock": fields.Integer(default=0),
    "images": fields.Raw(description="图片URL，逗号分隔"),
    "description": fields.String(),
})
_admin_role_create_in = ns.model("AdminRoleCreateIn", {
    "name": fields.String(required=True),
    "slug": fields.String(required=True),
    "description": fields.String(),
    "permission_ids": fields.List(fields.Integer()),
})



@ns.route("/stats")
@ns.route("/dashboard/stats")
class DashboardStats(Resource):
    @admin_required
    @ns.doc(responses={200: "数据统计"})
    def get(self):
        """数据统计"""
        total_users = User.query.filter_by(is_deleted=False).count()
        merchants = User.query.filter_by(is_deleted=False, role="merchant").count()
        total_products = Product.query.filter_by(is_deleted=False).count()
        on_sale = Product.query.filter_by(
            is_deleted=False, status=ProductStatus.ON_SALE
        ).count()
        total_orders = Order.query.filter_by(is_deleted=False).count()
        today_orders = (
            db.session.query(func.count(Order.id))
            .filter(Order.is_deleted == False, func.date(Order.created_at) == func.current_date())
            .scalar()
            or 0
        )
        gmv = (
            db.session.query(func.sum(Order.actual_amount))
            .filter(Order.is_deleted == False)
            .scalar()
            or 0
        )
        rows = (
            db.session.query(Order.status, func.count(Order.id))
            .filter(Order.is_deleted == False)
            .all()
        )
        sc = dict(rows)
        status_dist = {
            "paid": sc.get(OrderStatus.PAID, 0),
            "shipped": sc.get(OrderStatus.SHIPPING, 0) + sc.get(OrderStatus.SHIPPED, 0),
            "completed": sc.get(OrderStatus.COMPLETED, 0),
            "unpaid": sc.get(OrderStatus.PENDING, 0),
            "cancelled": (
                sc.get(OrderStatus.CANCELLED, 0)
                + sc.get(OrderStatus.REFUNDING, 0)
                + sc.get(OrderStatus.REFUNDED, 0)
            ),
        }
        return success({
            "total_users": total_users,
            "merchants": merchants,
            "total_products": total_products,
            "on_sale": on_sale,
            "total_orders": total_orders,
            "today_orders": today_orders,
            "gmv": float(gmv or 0),
            "status": status_dist,
        })


@ns.route("/users")
class AdminUserList(Resource):
    @admin_required
    @ns.doc(params={"page": "页码", "per_page": "每页数量", "status": "用户状态"}, responses={200: "用户列表"})
    def get(self):
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 100, type=int), 100)
        q = request.args.get("q", "", type=str).strip()
        role = request.args.get("role", "", type=str)
        query = User.query.filter_by(is_deleted=False)
        if role and role != "all":
            query = query.filter_by(role=role)
        if q:
            like = "%" + q + "%"
            query = query.filter(
                or_(User.email.ilike(like), User.name.ilike(like), User.phone.ilike(like))
            )
        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        items = [_user_admin_view(u) for u in pagination.items]
        return success(
            {"items": items, "total": pagination.total},
            meta={"page": page, "per_page": per_page},
        )


@ns.route("/users/<int:uid>/toggle")
class AdminUserToggle(Resource):
    @admin_required
    @ns.doc(responses={200: "已切换状态", 404: "用户不存在"})
    def post(self, uid):
        user = db.session.get(User, uid)
        if not user or user.is_deleted:
            return {"code": 404, "msg": "用户不存在"}, 404
        user.status = (
            UserStatus.BANNED if user.status == UserStatus.ACTIVE else UserStatus.ACTIVE
        )
        db.session.commit()
        return success({"status": _USER_STATUS_STR.get(user.status, "locked")})


@ns.route("/users/<int:uid>")
class AdminUserUpdate(Resource):
    @admin_required
    @ns.expect(_admin_role_in)
    @ns.doc(responses={200: "角色已更新", 400: "非法角色", 404: "用户不存在"})
    def put(self, uid):
        """编辑用户角色（单角色 admin/merchant/buyer）。"""
        data = request.json or {}
        role = data.get("role")
        if role not in _ROLE_PRIORITY:
            return {"code": 400, "msg": "role 非法"}, 400
        user = db.session.get(User, uid)
        if not user or user.is_deleted:
            return {"code": 404, "msg": "用户不存在"}, 404
        user.role = role
        db.session.commit()
        return success({"msg": "角色已更新", "role": role})


@ns.route("/orders")
class AdminOrderList(Resource):
    @admin_required
    @ns.doc(params={"page": "页码", "per_page": "每页数量", "status": "订单状态"}, responses={200: "订单列表"})
    def get(self):
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        query = Order.query.filter_by(is_deleted=False)
        st = request.args.get("status", "", type=str)
        if st and st != "all":
            try:
                query = query.filter_by(status=int(st))
            except (ValueError, TypeError):
                pass
        pagination = query.order_by(Order.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        items = [_order_admin_view(o) for o in pagination.items]
        return success(
            {"items": items, "total": pagination.total},
            meta={"page": page, "per_page": per_page},
        )


@ns.route("/orders/<int:oid>/status")
class AdminOrderStatus(Resource):
    @admin_required
    @ns.expect(_admin_status_in)
    @ns.doc(responses={200: "状态已更新", 400: "status 非法", 404: "订单不存在"})
    def put(self, oid):
        data = request.json or {}
        order = db.session.get(Order, oid)
        if not order:
            return {"code": 404, "msg": "订单不存在"}, 404
        if "status" in data:
            try:
                order.status = int(data["status"])
            except (ValueError, TypeError):
                return {"code": 400, "msg": "status 非法"}, 400
        db.session.commit()
        return success({"msg": "状态已更新"})


@ns.route("/products")
class AdminProductList(Resource):
    @admin_required
    @ns.doc(params={"page": "页码", "per_page": "每页数量", "q": "搜索关键词", "status": "商品状态"}, responses={200: "商品列表"})
    def get(self):
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        q = request.args.get("q", "", type=str).strip()
        st = request.args.get("status", "", type=str)
        query = Product.query.filter_by(is_deleted=False)
        if q:
            query = query.filter(Product.name.ilike("%" + q + "%"))
        if st and st != "all":
            try:
                query = query.filter_by(status=int(st))
            except (ValueError, TypeError):
                pass
        pagination = query.order_by(Product.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        items = []
        for p in pagination.items:
            d = _dec2float(p.to_dict())
            d["status"] = _PRODUCT_STATUS_STR.get(p.status, "off")
            d["merchant_name"] = _merchant_display(getattr(p, "merchant", None))
            d["created_at"] = _fmt_dt(p.created_at)
            items.append(d)
        return success(
            {"items": items, "total": pagination.total},
            meta={"page": page, "per_page": per_page},
        )

    @admin_required
    @ns.expect(_admin_product_in)
    @ns.doc(responses={201: "创建成功", 400: "参数错误"})
    def post(self):
        data = request.json
        product = Product(
            name=data["name"],
            price=data["price"],
            category_id=data.get("category_id"),
            brand_id=data.get("brand_id"),
            stock=data.get("stock", 0),
            images=data.get("images"),
            description=data.get("description"),
        )
        db.session.add(product)
        db.session.commit()
        d = _dec2float(product.to_dict())
        d["status"] = _PRODUCT_STATUS_STR.get(product.status, "off")
        return created(d)


@ns.route("/products/<int:pid>/toggle")
class AdminProductToggle(Resource):
    @admin_required
    @ns.doc(responses={200: "已切换上下架", 404: "商品不存在"})
    def post(self, pid):
        product = db.session.get(Product, pid)
        if not product or product.is_deleted:
            return {"code": 404, "msg": "商品不存在"}, 404
        product.status = (
            ProductStatus.OFF_SALE
            if product.status == ProductStatus.ON_SALE
            else ProductStatus.ON_SALE
        )
        db.session.commit()
        return success({"status": _PRODUCT_STATUS_STR.get(product.status, "off")})


@ns.route("/roles")
class RoleList(Resource):
    @admin_required
    @ns.doc(responses={200: "角色列表"})
    def get(self):
        roles = Role.query.filter_by(is_deleted=False).order_by(Role.sort_order).all()
        return success([{
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "description": r.description,
            "is_system": r.is_system,
            "permissions": [p.slug for p in r.permissions],
            "users_count": len(r.users),
        } for r in roles])

    @admin_required
    @ns.expect(_admin_role_create_in)
    @ns.doc(responses={201: "创建成功", 400: "参数错误"})
    def post(self):
        data = request.json
        role = Role(
            name=data["name"], slug=data["slug"], description=data.get("description")
        )
        if data.get("permission_ids"):
            role.permissions = Permission.query.filter(
                Permission.id.in_(data["permission_ids"])
            ).all()
        db.session.add(role)
        db.session.commit()
        return created(role.to_dict())
