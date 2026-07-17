# -*- coding: utf-8 -*-
"""Notification API - User Notification Management"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Notification, NotificationPreference
from app.services.notification_service import NotificationService, NotificationTemplates
from app.utils.response import success, not_found, bad_request

ns = Namespace("notifications", description="Notification Management")

# ========================
# Swagger Models
# ========================
_notification_out = ns.model("NotificationOut", {
    "id": fields.Integer(readonly=True),
    "title": fields.String,
    "content": fields.String,
    "type": fields.String,
    "is_read": fields.Boolean,
    "created_at": fields.String,
})

_send_in = ns.model("SendIn", {
    "user_id": fields.Integer(description="Receiver user ID (admin only)"),
    "title": fields.String(required=True, max_length=255),
    "content": fields.String,
    "type": fields.String(description="order/system/security/promotion", default="system"),
})

_send_template_in = ns.model("SendTemplateIn", {
    "user_id": fields.Integer(description="Receiver user ID"),
    "template_id": fields.String(required=True, description="Template ID"),
    "type": fields.String(default="system"),
})

_preference_in = ns.model("PreferenceIn", {
    "notif_type": fields.String(required=True, description="Notification type"),
    "enabled": fields.Boolean(required=True, description="Enable or disable"),
})


# ========================
# Routes
# ========================

@ns.route("")
class NotificationList(Resource):
    """Notification List / Create"""

    @jwt_required()
    @ns.param("page", "Page", type=int, default=1)
    @ns.param("page_size", "Page size", type=int, default=20)
    @ns.param("is_read", "Filter: all/true/false", type=str, default="all")
    @ns.param("type", "Type filter", type=str)
    @ns.doc(params={"page": "页码", "per_page": "每页数量"}, responses={200: "通知列表"})
    def get(self):
        """Get current user's notifications (paginated)"""
        user_id = int(get_jwt_identity())
        page = request.args.get("page", 1, type=int)
        page_size = min(request.args.get("page_size", 20, type=int), 100)

        query = Notification.query.filter_by(user_id=user_id, is_deleted=False)

        notif_type = request.args.get("type")
        if notif_type:
            query = query.filter_by(type=notif_type)

        is_read = request.args.get("is_read", "all")
        if is_read == "true":
            query = query.filter_by(is_read=True)
        elif is_read == "false":
            query = query.filter_by(is_read=False)

        total = query.count()
        unread_count = Notification.query.filter_by(
            user_id=user_id, is_deleted=False, is_read=False
        ).count()

        items = query.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

        return success({
            "items": [n.to_dict() for n in items],
            "meta": {"total": total, "unread_count": unread_count, "page": page, "page_size": page_size}
        })

    @jwt_required()
    @ns.expect(_send_in)
    @ns.doc(responses={200: "已发送"})
    def post(self):
        """Send notification (internal / admin)"""
        data = request.json
        title = data["title"]
        content = data.get("content")
        notif_type = data.get("type", "system")
        user_id = data.get("user_id")

        if user_id:
            # Admin sending to specific user
            notif = NotificationService.send(user_id, title, content, notif_type)
            if notif:
                return success({"id": notif.id}, msg="Notification sent")
            return success({"msg": "Notification skipped (user preference)"})
        else:
            # Self notification
            user_id = int(get_jwt_identity())
            notif = NotificationService.send(user_id, title, content, notif_type)
            return success({"id": notif.id}, msg="Notification sent")


@ns.route("/<int:notif_id>")
@ns.param("notif_id", "Notification ID")
class NotificationDetail(Resource):
    @jwt_required()
    @ns.doc(responses={200: "通知详情", 404: "通知不存在"})
    def get(self, notif_id):
        """Get notification detail (auto mark as read)"""
        user_id = int(get_jwt_identity())
        notif = Notification.query.filter_by(
            id=notif_id, user_id=user_id, is_deleted=False
        ).first_or_404()
        if not notif.is_read:
            notif.is_read = True
            db.session.commit()
        return success(notif.to_dict())

    @jwt_required()
    @ns.doc(responses={200: "已删除", 404: "通知不存在"})
    def delete(self, notif_id):
        """Delete notification (soft delete)"""
        user_id = int(get_jwt_identity())
        notif = Notification.query.filter_by(
            id=notif_id, user_id=user_id, is_deleted=False
        ).first_or_404()
        notif.is_deleted = True
        db.session.commit()
        return success({"msg": "Deleted"})


@ns.route("/unread-count")
class UnreadCount(Resource):
    @jwt_required()
    @ns.doc(responses={200: "未读数量"})
    def get(self):
        """Get unread notification count"""
        user_id = int(get_jwt_identity())
        count = Notification.query.filter_by(
            user_id=user_id, is_deleted=False, is_read=False
        ).count()
        return success({"unread_count": count})


@ns.route("/mark-all-read")
class MarkAllRead(Resource):
    @jwt_required()
    @ns.doc(responses={200: "全部已读"})
    def post(self):
        """Mark all as read"""
        user_id = int(get_jwt_identity())
        updated = Notification.query.filter_by(
            user_id=user_id, is_deleted=False, is_read=False
        ).update({"is_read": True})
        db.session.commit()
        return success({"msg": f"Marked {updated} as read"})


@ns.route("/preference")
class Preference(Resource):
    @jwt_required()
    @ns.expect(_preference_in)
    @ns.doc(responses={200: "已更新"})
    def post(self):
        """Update notification preference"""
        user_id = int(get_jwt_identity())
        data = request.json
        pref = NotificationService.update_preference(
            user_id, data["notif_type"], data["enabled"]
        )
        return success({"notif_type": pref.notif_type, "enabled": pref.enabled}, msg="Preference updated")

    @jwt_required()
    @ns.doc(responses={200: "通知偏好"})
    def get(self):
        """Get all notification preferences"""
        user_id = int(get_jwt_identity())
        prefs = NotificationPreference.query.filter_by(user_id=user_id).all()
        all_types = ["order", "system", "security", "promotion"]
        result = {}
        for p in prefs:
            result[p.notif_type] = p.enabled
        # Fill missing with default (True)
        for t in all_types:
            if t not in result:
                result[t] = True
        return success(result)


@ns.route("/send-template")
class SendTemplate(Resource):
    @jwt_required()
    @ns.expect(_send_template_in)
    @ns.doc(responses={200: "已发送"})
    def post(self):
        """Send notification using a predefined template"""
        data = request.json
        user_id = data.get("user_id", int(get_jwt_identity()))
        template_id = data["template_id"]
        notif_type = data.get("type", "system")

        # Extract extra kwargs (order_no, amount, etc.)
        kwargs = {k: v for k, v in data.items() 
                   if k not in ("user_id", "template_id", "type")}
        
        notif = NotificationService.send_with_template(
            user_id, template_id, notif_type, **kwargs
        )
        if notif:
            return success({"id": notif.id}, msg="Template notification sent")
        return success({"msg": "Notification skipped (user preference)"})
