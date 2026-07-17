# -*- coding: utf-8 -*-
"""Notification Service - ????"""
from typing import Optional
from app.extensions import db
from app.models import Notification, NotificationPreference


# ========================
# Notification Templates
# ========================
class NotificationTemplates:
    """????"""
    
    ORDER_CREATED = "order_created"
    ORDER_PAID = "order_paid"
    ORDER_SHIPPED = "order_shipped"
    ORDER_DELIVERED = "order_delivered"
    ORDER_CANCELLED = "order_cancelled"
    ORDER_REFUNDED = "order_refunded"
    SECURITY_LOGIN = "security_login"
    SECURITY_PASSWORD_CHANGED = "security_password_changed"
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    
    @classmethod
    def get_template(cls, template_id: str, **kwargs) -> tuple:
        """??????? title, content?"""
        templates = {
            cls.ORDER_CREATED: (f"Order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} Created",
                                  f"Your order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} has been created. Amount: ${kwargs.get('"'"'amount'"'"', 0)}"),
            cls.ORDER_PAID: (f"Order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} Paid",
                             f"Payment received for order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')}. Processing..."),
            cls.ORDER_SHIPPED: (f"Order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} Shipped",
                                  f"Your order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} has been shipped. Tracking: {kwargs.get('"'"'tracking'"'"', '"'"'N/A'"'"')}"),
            cls.ORDER_DELIVERED: (f"Order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} Delivered",
                                    f"Order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} has been delivered. Please confirm receipt."),
            cls.ORDER_CANCELLED: (f"Order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} Cancelled",
                                    f"Order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} has been cancelled. Refund will be processed within 3-5 days."),
            cls.ORDER_REFUNDED: (f"Order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} Refunded",
                                  f"Refund of ${kwargs.get('"'"'amount'"'"', 0)} for order {kwargs.get('"'"'order_no'"'"', '"'"''"'"')} has been processed."),
            cls.SECURITY_LOGIN: ("Security Alert: New Login Detected",
                                  f"New login to your account from {kwargs.get('"'"'location'"'"', '"'"'Unknown'"'"')} at {kwargs.get('"'"'time'"'"', '"'"'N/A'"'"')}. If this wasn't you, please change your password immediately."),
            cls.SECURITY_PASSWORD_CHANGED: ("Password Changed Successfully",
                                             "Your password was changed successfully. If you didn't make this change, contact support immediately."),
            cls.SYSTEM_ANNOUNCEMENT: (kwargs.get('"'"'title'"'"', '"'"'System Notice'"'"'),
                                       kwargs.get('"'"'message'"'"', '"'"'System maintenance notice.'"'"')),
        }
        return templates.get(template_id, (kwargs.get('"'"'title'"'"', '"'"'Notification'"'"'), kwargs.get('"'"'message'"'"', '""')))


# ========================
# Notification Service
# ========================
class NotificationService:
    """?????"""

    @staticmethod
    def _check_preference(user_id: int, notif_type: str) -> bool:
        """?????????????"""
        pref = NotificationPreference.query.filter_by(
            user_id=user_id, notif_type=notif_type
        ).first()
        # ???????????????
        if pref is None:
            return True
        return pref.enabled

    @staticmethod
    def send(user_id: int, title: str, content: str = None,
             notif_type: str = "system", skip_preference: bool = False) -> Optional[Notification]:
        """
        ????
        
        Args:
            user_id: ????ID
            title: ????
            content: ????
            notif_type: ????
            skip_preference: ??????????????????
        """
        # ??????
        if not skip_preference and not NotificationService._check_preference(user_id, notif_type):
            return None
        
        notif = Notification(
            user_id=user_id,
            title=title,
            content=content,
            type=notif_type,
        )
        db.session.add(notif)
        db.session.commit()
        return notif

    @staticmethod
    def send_with_template(user_id: int, template_id: str, notif_type: str = "system", **kwargs) -> Optional[Notification]:
        """????????"""
        title, content = NotificationTemplates.get_template(template_id, **kwargs)
        return NotificationService.send(user_id, title, content, notif_type)

    @staticmethod
    def send_batch(user_ids: list, title: str, content: str = None,
                   notif_type: str = "system") -> int:
        """????????????????????"""
        count = 0
        for uid in user_ids:
            if NotificationService._check_preference(uid, notif_type):
                notif = Notification(
                    user_id=uid,
                    title=title,
                    content=content,
                    type=notif_type,
                )
                db.session.add(notif)
                count += 1
        if count > 0:
            db.session.commit()
        return count

    # ========================
    # ????
    # ========================
    @staticmethod
    def notify_order_status(user_id: int, order_no: str, status_text: str):
        """????????"""
        return NotificationService.send(
            user_id=user_id,
            title=f"Order {order_no} Update",
            content=f"Your order {order_no} has been updated to: {status_text}",
            notif_type="order",
        )

    @staticmethod
    def notify_security(user_id: int, message: str):
        """????????????"""
        return NotificationService.send(
            user_id=user_id,
            title="Security Alert",
            content=message,
            notif_type="security",
            skip_preference=True,  # ?????????
        )

    @staticmethod
    def notify_system_announcement(user_ids: list, title: str, message: str):
        """????????"""
        return NotificationService.send_batch(
            user_ids=user_ids,
            title=title,
            content=message,
            notif_type="system",
        )

    @staticmethod
    def update_preference(user_id: int, notif_type: str, enabled: bool) -> NotificationPreference:
        """????????"""
        pref = NotificationPreference.query.filter_by(
            user_id=user_id, notif_type=notif_type
        ).first()
        if not pref:
            pref = NotificationPreference(user_id=user_id, notif_type=notif_type)
            db.session.add(pref)
        pref.enabled = enabled
        db.session.commit()
        return pref

    @staticmethod
    def get_preference(user_id: int, notif_type: str) -> Optional[NotificationPreference]:
        """????????"""
        return NotificationPreference.query.filter_by(
            user_id=user_id, notif_type=notif_type
        ).first()
