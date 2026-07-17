# -*- coding: utf-8 -*-
"""认证 API"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.auth_service import AuthService
from app.utils.response import success, created, bad_request, unauthorized

ns = Namespace("auth", description="认证相关接口")

# 注册
_register_model = ns.model("Register", {
    "name": fields.String(required=True, description="用户名"),
    "email": fields.String(required=True, description="邮箱"),
    "password": fields.String(required=True, description="密码"),
    "phone": fields.String(description="手机号"),
    "role": fields.String(description="角色 buyer/merchant/admin", default="buyer"),
    "merchant_name": fields.String(description="商家店铺名称（商家注册时必填）"),
})

# 买家登录
_login_model = ns.model("Login", {
    "email": fields.String(required=True, description="邮箱"),
    "password": fields.String(required=True, description="密码"),
})

# 商家/管理员登录
_account_login_model = ns.model("AccountLogin", {
    "account": fields.String(required=True, description="商家用邮箱或手机号，管理员用邮箱"),
    "password": fields.String(required=True, description="密码"),
    "role": fields.String(required=True, description="角色 merchant/admin"),
})

_user_out = ns.model("UserOut", {
    "id": fields.Integer,
    "name": fields.String,
    "email": fields.String,
    "phone": fields.String,
    "role": fields.String,
    "merchant_name": fields.String,
    "avatar_url": fields.String,
    "created_at": fields.String,
})

_token_out = ns.model("TokenOut", {
    "access_token": fields.String,
    "refresh_token": fields.String,
    "user": fields.Nested(_user_out),
})


@ns.route("/register")
class Register(Resource):
    @ns.expect(_register_model)
    @ns.doc(responses={201: "注册成功", 400: "参数错误/邮箱已注册"})
    def post(self):
        """用户注册（支持选择角色）"""
        data = request.json
        user = AuthService.register(
            name=data["name"],
            email=data["email"],
            password=data["password"],
            phone=data.get("phone"),
            role=data.get("role", "buyer"),
            merchant_name=data.get("merchant_name"),
        )
        return created(user.to_dict())


@ns.route("/login")
class Login(Resource):
    @ns.expect(_login_model)
    @ns.doc(responses={200: "登录成功，返回 token", 400: "账号或密码错误"})
    def post(self):
        """买家登录（邮箱+密码）"""
        data = request.json
        result = AuthService.login(
            email=data["email"],
            password=data["password"],
            ip_address=request.remote_addr,
        )
        return success(result)


@ns.route("/login/merchant")
class MerchantLogin(Resource):
    @ns.expect(_account_login_model)
    @ns.doc(responses={200: "登录成功，返回 token", 400: "账号或密码错误"})
    def post(self):
        """商家登录（邮箱/手机号+密码）"""
        data = request.json
        result = AuthService.login_by_account(
            account=data["account"],
            password=data["password"],
            role="merchant",
            ip_address=request.remote_addr,
        )
        return success(result)


@ns.route("/login/admin")
class AdminLogin(Resource):
    @ns.expect(_account_login_model)
    @ns.doc(responses={200: "登录成功，返回 token", 400: "账号或密码错误"})
    def post(self):
        """管理员登录（账号+密码）"""
        data = request.json
        result = AuthService.login_by_account(
            account=data["account"],
            password=data["password"],
            role="admin",
            ip_address=request.remote_addr,
        )
        return success(result)


@ns.route("/refresh")
class Refresh(Resource):
    @jwt_required(refresh=True)
    @ns.doc(responses={200: "新的 access_token", 401: "未认证/refresh token 无效"})
    def post(self):
        """刷新 Access Token"""
        result = AuthService.refresh_access_token()
        return success(result)


@ns.route("/logout")
class Logout(Resource):
    @jwt_required()
    @ns.doc(responses={200: "登出成功", 401: "未认证"})
    def post(self):
        """登出"""
        jwt_data = get_jwt()
        AuthService.logout(jwt_data, ip_address=request.remote_addr)
        return success({"msg": "登出成功"})
