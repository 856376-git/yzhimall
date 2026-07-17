# -*- coding: utf-8 -*-
"""通知模型"""
from sqlalchemy import Column, String, Text, Integer, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.extensions import db


class Notification(BaseModel):
    """站内通知表"""
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notif_user_created", "user_id", "created_at"),
        Index("ix_notif_user_unread", "user_id", "is_read"),
    )

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    type = Column(String(20), nullable=True, index=True)

    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification {self.id} to user:{self.user_id}>"


class NotificationPreference(BaseModel):
    """????????"""
    __tablename__ = "notification_preferences"
    __table_args__ = (
        Index("ix_pref_user_type", "user_id", "notif_type", unique=True),
    )

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notif_type = Column(String(20), nullable=False, index=True)  # order/system/security/promotion
    enabled = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="notification_preferences")

    def __repr__(self):
        return f"<NotificationPreference user:{self.user_id} type:{self.notif_type}>"
