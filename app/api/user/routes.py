# -*- coding: utf-8 -*-
"""用户 API"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.auth_service import AuthService
from app.services.rbac_service import RBACService
from app.extensions import db
from app.models import Address
from app.models import UserCheckIn
from app.utils.response import success, created, bad_request, not_found
from app.utils.validators import validate_phone, validate_required

ns = Namespace("user", description="用户接口")

_profile = ns.model("Profile", {
    "id": fields.Integer(readonly=True),
    "name": fields.String,
    "email": fields.String(readonly=True),
    "phone": fields.String,
    "avatar_url": fields.String,
    "gender": fields.Integer,
    "created_at": fields.String(readonly=True),
})

_address_in = ns.model("AddressIn", {
    "consignee": fields.String(required=True),
    "phone": fields.String(required=True),
    "province": fields.String(required=True),
    "city": fields.String(required=True),
    "district": fields.String(required=True),
    "address": fields.String(required=True),
    "zipcode": fields.String,
            "is_default": fields.Boolean(default=False),
        })

_checkin_rewards = [10, 15, 20, 25, 30, 35, 50]  # day 1..7 阶梯奖励,满签重置


@ns.route("/checkin/status")
class CheckInStatusResource(Resource):
    @jwt_required()
    @ns.doc(responses={200: "签到状态"})
    def get(self):
        """签到状态: 今日是否签到、连续天数、累计积分、最近记录"""
        from datetime import date as _date
        from sqlalchemy import func
        user_id = int(get_jwt_identity())
        today = _date.today()
        today_rec = UserCheckIn.query.filter_by(user_id=user_id, check_date=today).first()
        latest = UserCheckIn.query.filter_by(user_id=user_id)\
            .order_by(UserCheckIn.check_date.desc()).first()
        total = db.session.query(func.coalesce(func.sum(UserCheckIn.reward_points), 0))\
            .filter_by(user_id=user_id).scalar() or 0
        recent = UserCheckIn.query.filter_by(user_id=user_id)\
            .order_by(UserCheckIn.check_date.desc()).limit(7).all()
        return success({
            "checked_today": today_rec is not None,
            "continuous_days": (latest.continuous_days if latest else 0),
            "total_points": int(total),
            "last_checkin": (str(latest.check_date) if latest else None),
            "recent_records": [
                {"check_date": str(r.check_date), "continuous_days": r.continuous_days,
                 "reward_points": r.reward_points}
                for r in recent
            ],
        })


@ns.route("/checkin")
class CheckInResource(Resource):
    @jwt_required()
    @ns.doc(responses={200: "签到成功", 400: "今日已签到"})
    def post(self):
        """每日签到,重复签到返回错误"""
        from datetime import date as _date, timedelta
        user_id = int(get_jwt_identity())
        today = _date.today()
        if UserCheckIn.query.filter_by(user_id=user_id, check_date=today).first():
            return bad_request("今日已签到,明天再来吧")
        yesterday = today - timedelta(days=1)
        last = UserCheckIn.query.filter_by(user_id=user_id, check_date=yesterday).first()
        continuous = (last.continuous_days + 1) if last else 1
        reward = _checkin_rewards[(continuous - 1) % 7]
        record = UserCheckIn(user_id=user_id, check_date=today,
                             continuous_days=continuous, reward_points=reward)
        db.session.add(record)
        db.session.commit()
        return success({
            "check_date": str(today),
            "continuous_days": continuous,
            "reward_points": reward,
            "msg": "签到成功",
        })
_address_out = ns.inherit("AddressOut", _address_in, {
    "id": fields.Integer(readonly=True),
    "created_at": fields.String(readonly=True),
})


@ns.route("/profile")
class Profile(Resource):
    @jwt_required()
    @ns.doc(responses={200: "个人信息"})
    def get(self):
        """获取个人信息"""
        user_id = int(get_jwt_identity())
        user = AuthService.get_user_info(user_id)
        return success(user.to_dict())

    @jwt_required()
    @ns.expect(_profile)
    @ns.doc(responses={200: "已更新", 400: "参数错误"})
    def put(self):
        """更新个人信息"""
        user_id = int(get_jwt_identity())
        user = AuthService.get_user_info(user_id)
        data = request.json or {}

        if "name" in data:
            user.name = data["name"]
        if "phone" in data:
            validate_phone(data["phone"])
            user.phone = data["phone"]

        db.session.commit()
        return success(user.to_dict())


@ns.route("/addresses")
class AddressList(Resource):
    @jwt_required()
    @ns.doc(responses={200: "地址列表"})
    def get(self):
        """收货地址列表"""
        user_id = int(get_jwt_identity())
        addresses = Address.query.filter_by(user_id=user_id, is_deleted=False).all()
        return success([a.to_dict() for a in addresses])

    @jwt_required()
    @ns.expect(_address_in)
    @ns.doc(responses={201: "新增成功", 400: "参数错误"})
    def post(self):
        """新增收货地址"""
        user_id = int(get_jwt_identity())
        data = request.json

        if data.get("is_default"):
            Address.query.filter_by(user_id=user_id).update({"is_default": False})

        addr = Address(
            user_id=user_id,
            consignee=data["consignee"],
            phone=data["phone"],
            province=data["province"],
            city=data["city"],
            district=data["district"],
            address=data["address"],
            zipcode=data.get("zipcode"),
            is_default=data.get("is_default", False),
        )
        db.session.add(addr)
        db.session.commit()
        return created(addr.to_dict())


@ns.route("/addresses/<int:addr_id>")
class AddressItem(Resource):
    @jwt_required()
    @ns.expect(_address_in)
    @ns.doc(responses={200: "已更新", 404: "地址不存在"})
    def put(self, addr_id):
        """修改地址"""
        user_id = int(get_jwt_identity())
        addr = Address.query.filter_by(id=addr_id, user_id=user_id, is_deleted=False).first_or_404()
        data = request.json

        for field in ["consignee", "phone", "province", "city", "district", "address", "zipcode"]:
            if field in data:
                setattr(addr, field, data[field])

        if data.get("is_default"):
            Address.query.filter_by(user_id=user_id).update({"is_default": False})
            addr.is_default = True

        db.session.commit()
        return success(addr.to_dict())

    @jwt_required()
    @ns.doc(responses={200: "已删除", 404: "地址不存在"})
    def delete(self, addr_id):
        """删除地址"""
        user_id = int(get_jwt_identity())
        addr = Address.query.filter_by(id=addr_id, user_id=user_id, is_deleted=False).first_or_404()
        addr.is_deleted = True
        db.session.commit()
        return success({"msg": "删除成功"})
