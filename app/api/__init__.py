# -*- coding: utf-8 -*-
"""API Blueprint 注册 + Swagger 文档注册"""
from flask import Blueprint
from flask_restx import Api

authorizations = {
    "Bearer": {
        "type": "apiKey",
        "in": "header",
        "name": "Authorization",
        "description": "JWT Token. 格式: Bearer {access_token}",
    }
}

api_bp = Blueprint("api", __name__, url_prefix="/api")

api = Api(
    api_bp,
    title="云智购电商平台 API",
    version="1.0",
    description="B2C 电商后端 API，支持用户认证、商品管理、购物车、订单、商家入驻、模拟支付",
    author="云智购技术团队",
    authorizations=authorizations,
    security="Bearer",
    doc="/docs",
)


def register_blueprints(app):
    """注册所有 Blueprint + 挂载 Swagger"""
    app.register_blueprint(api_bp)

    from app.api.auth import ns as auth_ns
    from app.api.user import ns as user_ns
    from app.api.product import ns as product_ns
    from app.api.cart import ns as cart_ns
    from app.api.order import ns as order_ns
    from app.api.notification import ns as notification_ns
    from app.api.admin import ns as admin_ns
    from app.api.upload import ns as upload_ns
    from app.api.payment import ns as payment_ns
    from app.api.merchant import ns as merchant_ns

    api.add_namespace(auth_ns)
    api.add_namespace(user_ns)
    api.add_namespace(product_ns)
    api.add_namespace(cart_ns)
    api.add_namespace(order_ns)
    api.add_namespace(notification_ns)
    api.add_namespace(admin_ns)
    api.add_namespace(upload_ns)
    api.add_namespace(payment_ns)
    api.add_namespace(merchant_ns)
