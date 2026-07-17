# -*- coding: utf-8 -*-
"""给所有 API 端点补 Swagger 文档：@ns.doc(responses=...) + 缺失的 @ns.expect"""
import io
import os
import re

ROOT = os.getcwd()


def _read(path):
    with io.open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return f.read()


def _write(path, s):
    with io.open(os.path.join(ROOT, path), "w", encoding="utf-8") as f:
        f.write(s)


def add_import_fields(path):
    s = _read(path)
    old = "from flask_restx import Namespace, Resource\n"
    new = "from flask_restx import Namespace, Resource, fields\n"
    c = s.count(old)
    assert c == 1, f"{path}: import anchor count={c}"
    s = s.replace(old, new)
    _write(path, s)
    print(f"  {path}: +fields import")


def add_model(path, anchor, text):
    s = _read(path)
    c = s.count(anchor)
    assert c == 1, f"{path}: model anchor count={c} for {anchor[:40]!r}"
    s = s.replace(anchor, text + "\n\n\n" + anchor)
    _write(path, s)
    print(f"  {path}: +model")


def decorate(path, inserts):
    """按 class 名 + 方法名定位，在 def 前插入装饰器（对乱码文件安全）。"""
    s = _read(path)
    lines = s.splitlines(True)
    out = []
    cur_class = None
    applied = set()
    for line in lines:
        st = line.rstrip("\n")
        m = re.match(r"^class\s+(\w+)\(Resource\)", st)
        if m:
            cur_class = m.group(1)
            out.append(line)
            continue
        m2 = re.match(r"^    def\s+(\w+)\(self", st)
        if m2 and cur_class:
            key = (cur_class, m2.group(1))
            if key in inserts:
                for dec in inserts[key]:
                    out.append("    " + dec + "\n")
                applied.add(key)
        out.append(line)
    missing = set(inserts) - applied
    assert not missing, f"{path}: NOT applied {missing}"
    _write(path, "".join(out))
    print(f"  {path}: +{len(applied)} endpoints")


# ===== 模型定义（缺失的补上）=====
PAYMENT_MODEL = (
    '_payment_create_in = ns.model("PaymentCreateIn", {\n'
    '    "order_id": fields.Integer(required=True, description="\u5f85\u652f\u4ed8\u8ba2\u5355ID"),\n'
    "})\n"
)
CART_MODEL = (
    '_item_update_in = ns.model("CartItemUpdateIn", {\n'
    '    "item_id": fields.Integer(required=True, description="\u8d2d\u7269\u8f66\u9879ID"),\n'
    '    "quantity": fields.Integer(required=True, min=0, description="\u6570\u91cf\uff0c0 \u8868\u793a\u5220\u9664"),\n'
    "})\n"
)
ADMIN_MODELS = (
    '_admin_role_in = ns.model("AdminRoleUpdateIn", {\n'
    '    "role": fields.String(required=True, description="\u89d2\u8272: buyer/merchant/admin"),\n'
    "})\n"
    '_admin_status_in = ns.model("AdminOrderStatusIn", {\n'
    '    "status": fields.Integer(required=True, description="\u8ba2\u5355\u72b6\u6001\u7801"),\n'
    "})\n"
    '_admin_product_in = ns.model("AdminProductIn", {\n'
    '    "name": fields.String(required=True),\n'
    '    "price": fields.String(required=True),\n'
    '    "category_id": fields.Integer(),\n'
    '    "brand_id": fields.Integer(),\n'
    '    "stock": fields.Integer(default=0),\n'
    '    "images": fields.Raw(description="\u56fe\u7247URL\uff0c\u9017\u53f7\u5206\u9694"),\n'
    '    "description": fields.String(),\n'
    "})\n"
    '_admin_role_create_in = ns.model("AdminRoleCreateIn", {\n'
    '    "name": fields.String(required=True),\n'
    '    "slug": fields.String(required=True),\n'
    '    "description": fields.String(),\n'
    '    "permission_ids": fields.List(fields.Integer()),\n'
    "})\n"
)

add_model("app/api/payment/routes.py", '@ns.route("/create")\nclass PaymentCreate(Resource):', PAYMENT_MODEL)
add_model("app/api/cart/routes.py", '@ns.route("")\nclass CartResource(Resource):', CART_MODEL)
add_import_fields("app/api/admin/routes.py")
add_model("app/api/admin/routes.py", '@ns.route("/stats")', ADMIN_MODELS)


# ===== 装饰器插入表 =====
D = lambda *xs: list(xs)

INSERTS = {
    "app/api/auth/routes.py": {
        ("Register", "post"): D('@ns.doc(responses={201: "\u6ce8\u518c\u6210\u529f", 400: "\u53c2\u6570\u9519\u8bef/\u90ae\u7bb1\u5df2\u6ce8\u518c"})'),
        ("Login", "post"): D('@ns.doc(responses={200: "\u767b\u5f55\u6210\u529f\uff0c\u8fd4\u56de token", 400: "\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef"})'),
        ("MerchantLogin", "post"): D('@ns.doc(responses={200: "\u767b\u5f55\u6210\u529f\uff0c\u8fd4\u56de token", 400: "\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef"})'),
        ("AdminLogin", "post"): D('@ns.doc(responses={200: "\u767b\u5f55\u6210\u529f\uff0c\u8fd4\u56de token", 400: "\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef"})'),
        ("Refresh", "post"): D('@ns.doc(responses={200: "\u65b0\u7684 access_token", 401: "\u672a\u8ba4\u8bc1/refresh token \u65e0\u6548"})'),
        ("Logout", "post"): D('@ns.doc(responses={200: "\u767b\u51fa\u6210\u529f", 401: "\u672a\u8ba4\u8bc1"})'),
    },
    "app/api/product/routes.py": {
        ("ProductList", "get"): D('@ns.doc(params={"page": "\u9875\u7801", "per_page": "\u6bcf\u9875\u6570\u91cf", "q": "\u641c\u7d22\u5173\u952e\u8bcd", "sort": "\u6392\u5e8f: created_at/price_asc/price_desc/sold", "category_id": "\u5206\u7c7bID"}, responses={200: "\u5546\u54c1\u5217\u8868"})'),
        ("ProductItem", "get"): D('@ns.doc(responses={200: "\u5546\u54c1\u8be6\u60c5", 404: "\u5546\u54c1\u4e0d\u5b58\u5728"})'),
        ("CategoryList", "get"): D('@ns.doc(responses={200: "\u5206\u7c7b\u5217\u8868"})'),
    },
    "app/api/payment/routes.py": {
        ("PaymentCreate", "post"): D('@ns.expect(_payment_create_in)', '@ns.doc(responses={200: "\u652f\u4ed8\u4f1a\u8bdd\u521b\u5efa\u6210\u529f", 400: "\u8ba2\u5355\u72b6\u6001\u4e0d\u5141\u8bb8\u652f\u4ed8", 404: "\u8ba2\u5355\u4e0d\u5b58\u5728"})'),
        ("PaymentStatusResource", "get"): D('@ns.doc(responses={200: "\u652f\u4ed8\u72b6\u6001", 404: "\u652f\u4ed8\u4f1a\u8bdd\u4e0d\u5b58\u5728\u6216\u5df2\u8fc7\u671f"})'),
        ("PaymentCallback", "post"): D('@ns.doc(responses={200: "\u652f\u4ed8\u6210\u529f", 404: "\u652f\u4ed8\u4f1a\u8bdd/\u5173\u8054\u8ba2\u5355\u4e0d\u5b58\u5728"})'),
        ("PaymentCancel", "post"): D('@ns.doc(responses={200: "\u5df2\u53d6\u6d88", 404: "\u652f\u4ed8\u4f1a\u8bdd\u4e0d\u5b58\u5728"})'),
    },
    "app/api/cart/routes.py": {
        ("CartResource", "get"): D('@ns.doc(responses={200: "\u8d2d\u7269\u8f66\u5217\u8868"})'),
        ("CartResource", "delete"): D('@ns.doc(responses={200: "\u5df2\u6e05\u7a7a"})'),
        ("CartItems", "post"): D('@ns.expect(_item_in)', '@ns.doc(responses={200: "\u5df2\u52a0\u5165\u8d2d\u7269\u8f66", 400: "\u5546\u54c1\u4e0d\u53ef\u7528/\u5e93\u5b58\u4e0d\u8db3"})'),
        ("CartItems", "put"): D('@ns.expect(_item_update_in)', '@ns.doc(responses={200: "\u5df2\u66f4\u65b0", 400: "\u8d2d\u7269\u8f66\u4e3a\u7a7a"})'),
        ("CartItems", "delete"): D('@ns.doc(responses={200: "\u5df2\u5220\u9664"})'),
    },
    "app/api/user/routes.py": {
        ("CheckInStatusResource", "get"): D('@ns.doc(responses={200: "\u7b7e\u5230\u72b6\u6001"})'),
        ("CheckInResource", "post"): D('@ns.doc(responses={200: "\u7b7e\u5230\u6210\u529f", 400: "\u4eca\u65e5\u5df2\u7b7e\u5230"})'),
        ("Profile", "get"): D('@ns.doc(responses={200: "\u4e2a\u4eba\u4fe1\u606f"})'),
        ("Profile", "put"): D('@ns.expect(_profile)', '@ns.doc(responses={200: "\u5df2\u66f4\u65b0", 400: "\u53c2\u6570\u9519\u8bef"})'),
        ("AddressList", "get"): D('@ns.doc(responses={200: "\u5730\u5740\u5217\u8868"})'),
        ("AddressList", "post"): D('@ns.doc(responses={201: "\u65b0\u589e\u6210\u529f", 400: "\u53c2\u6570\u9519\u8bef"})'),
        ("AddressItem", "put"): D('@ns.expect(_address_in)', '@ns.doc(responses={200: "\u5df2\u66f4\u65b0", 404: "\u5730\u5740\u4e0d\u5b58\u5728"})'),
        ("AddressItem", "delete"): D('@ns.doc(responses={200: "\u5df2\u5220\u9664", 404: "\u5730\u5740\u4e0d\u5b58\u5728"})'),
    },
    "app/api/order/routes.py": {
        ("OrderList", "get"): D('@ns.doc(responses={200: "\u8ba2\u5355\u5217\u8868"})'),
        ("OrderList", "post"): D('@ns.doc(responses={201: "\u521b\u5efa\u6210\u529f", 400: "\u521b\u5efa\u5931\u8d25/\u5e93\u5b58\u4e0d\u8db3", 404: "\u5730\u5740\u4e0d\u5b58\u5728"})'),
        ("OrderResource", "get"): D('@ns.doc(responses={200: "\u8ba2\u5355\u8be6\u60c5", 404: "\u8ba2\u5355\u4e0d\u5b58\u5728"})'),
        ("OrderResource", "post"): D('@ns.doc(responses={200: "\u652f\u4ed8\u6210\u529f", 400: "\u8ba2\u5355\u72b6\u6001\u4e0d\u5141\u8bb8\u652f\u4ed8"})'),
        ("OrderResource", "delete"): D('@ns.doc(responses={200: "\u5df2\u53d6\u6d88", 400: "\u5f53\u524d\u72b6\u6001\u4e0d\u5141\u8bb8\u53d6\u6d88"})'),
    },
    "app/api/merchant/routes.py": {
        ("MerchantProductList", "get"): D('@ns.doc(responses={200: "\u6211\u7684\u5546\u54c1\u5217\u8868"})'),
        ("MerchantProductList", "post"): D('@ns.doc(responses={201: "\u4e0a\u67b6\u6210\u529f", 400: "\u53c2\u6570\u9519\u8bef"})'),
        ("MerchantProductItem", "get"): D('@ns.doc(responses={200: "\u5546\u54c1\u8be6\u60c5", 404: "\u5546\u54c1\u4e0d\u5b58\u5728"})'),
        ("MerchantProductItem", "put"): D('@ns.expect(_product_in)', '@ns.doc(responses={200: "\u5df2\u66f4\u65b0", 404: "\u5546\u54c1\u4e0d\u5b58\u5728"})'),
        ("MerchantProductItem", "delete"): D('@ns.doc(responses={200: "\u5df2\u5220\u9664", 404: "\u5546\u54c1\u4e0d\u5b58\u5728"})'),
        ("MerchantProductToggle", "post"): D('@ns.doc(responses={200: "\u5df2\u5207\u6362\u4e0a\u4e0b\u67b6", 404: "\u5546\u54c1\u4e0d\u5b58\u5728"})'),
        ("MerchantOrderList", "get"): D('@ns.doc(responses={200: "\u5546\u5bb6\u8ba2\u5355\u5217\u8868"})'),
        ("MerchantStats", "get"): D('@ns.doc(responses={200: "\u5546\u5bb6\u6570\u636e\u7edf\u8ba1"})'),
    },
    "app/api/admin/routes.py": {
        ("DashboardStats", "get"): D('@ns.doc(responses={200: "\u6570\u636e\u7edf\u8ba1"})'),
        ("AdminUserList", "get"): D('@ns.doc(params={"page": "\u9875\u7801", "per_page": "\u6bcf\u9875\u6570\u91cf", "status": "\u7528\u6237\u72b6\u6001"}, responses={200: "\u7528\u6237\u5217\u8868"})'),
        ("AdminUserToggle", "post"): D('@ns.doc(responses={200: "\u5df2\u5207\u6362\u72b6\u6001", 404: "\u7528\u6237\u4e0d\u5b58\u5728"})'),
        ("AdminUserUpdate", "put"): D('@ns.expect(_admin_role_in)', '@ns.doc(responses={200: "\u89d2\u8272\u5df2\u66f4\u65b0", 400: "\u975e\u6cd5\u89d2\u8272", 404: "\u7528\u6237\u4e0d\u5b58\u5728"})'),
        ("AdminOrderList", "get"): D('@ns.doc(params={"page": "\u9875\u7801", "per_page": "\u6bcf\u9875\u6570\u91cf", "status": "\u8ba2\u5355\u72b6\u6001"}, responses={200: "\u8ba2\u5355\u5217\u8868"})'),
        ("AdminOrderStatus", "put"): D('@ns.expect(_admin_status_in)', '@ns.doc(responses={200: "\u72b6\u6001\u5df2\u66f4\u65b0", 400: "status \u975e\u6cd5", 404: "\u8ba2\u5355\u4e0d\u5b58\u5728"})'),
        ("AdminProductList", "get"): D('@ns.doc(params={"page": "\u9875\u7801", "per_page": "\u6bcf\u9875\u6570\u91cf", "q": "\u641c\u7d22\u5173\u952e\u8bcd", "status": "\u5546\u54c1\u72b6\u6001"}, responses={200: "\u5546\u54c1\u5217\u8868"})'),
        ("AdminProductList", "post"): D('@ns.expect(_admin_product_in)', '@ns.doc(responses={201: "\u521b\u5efa\u6210\u529f", 400: "\u53c2\u6570\u9519\u8bef"})'),
        ("AdminProductToggle", "post"): D('@ns.doc(responses={200: "\u5df2\u5207\u6362\u4e0a\u4e0b\u67b6", 404: "\u5546\u54c1\u4e0d\u5b58\u5728"})'),
        ("RoleList", "get"): D('@ns.doc(responses={200: "\u89d2\u8272\u5217\u8868"})'),
        ("RoleList", "post"): D('@ns.expect(_admin_role_create_in)', '@ns.doc(responses={201: "\u521b\u5efa\u6210\u529f", 400: "\u53c2\u6570\u9519\u8bef"})'),
    },
    "app/api/notification/routes.py": {
        ("NotificationList", "get"): D('@ns.doc(params={"page": "\u9875\u7801", "per_page": "\u6bcf\u9875\u6570\u91cf"}, responses={200: "\u901a\u77e5\u5217\u8868"})'),
        ("NotificationList", "post"): D('@ns.doc(responses={200: "\u5df2\u53d1\u9001"})'),
        ("NotificationDetail", "get"): D('@ns.doc(responses={200: "\u901a\u77e5\u8be6\u60c5", 404: "\u901a\u77e5\u4e0d\u5b58\u5728"})'),
        ("NotificationDetail", "delete"): D('@ns.doc(responses={200: "\u5df2\u5220\u9664", 404: "\u901a\u77e5\u4e0d\u5b58\u5728"})'),
        ("UnreadCount", "get"): D('@ns.doc(responses={200: "\u672a\u8bfb\u6570\u91cf"})'),
        ("MarkAllRead", "post"): D('@ns.doc(responses={200: "\u5168\u90e8\u5df2\u8bfb"})'),
        ("Preference", "post"): D('@ns.doc(responses={200: "\u5df2\u66f4\u65b0"})'),
        ("Preference", "get"): D('@ns.doc(responses={200: "\u901a\u77e5\u504f\u597d"})'),
        ("SendTemplate", "post"): D('@ns.doc(responses={200: "\u5df2\u53d1\u9001"})'),
    },
    "app/api/upload/routes.py": {
        ("ImageUpload", "post"): D('@ns.doc(responses={201: "\u4e0a\u4f20\u6210\u529f", 400: "\u6587\u4ef6\u65e0\u6548/\u8d85\u9650", 403: "\u65e0\u6743\u9650"})'),
    },
}

for path, ins in INSERTS.items():
    decorate(path, ins)

print("ALL DONE")