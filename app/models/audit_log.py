# -*- coding: utf-8 -*-
"""Audit log model"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.extensions import db


def action_label(action: str) -> str:
    """Operation label mapping"""
    labels = {
        "create": "Create",
        "update": "Update",
        "delete": "Delete",
        "login": "Login",
        "logout": "Logout",
        "assign_role": "Assign Role",
        "revoke_role": "Revoke Role",
        "permission_sync": "Permission Sync",
    }
    return labels.get(action, action)


class AuditLog(BaseModel):
    """Audit log table"""
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_user_action", "user_id", "action"),
        Index("ix_audit_created", "created_at"),
    )

    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    resource = Column(String(100), nullable=True)
    resource_id = Column(Integer, nullable=True)
    detail = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    user = relationship("User", back_populates="audit_logs")

    @classmethod
    def log(cls, actor_id=None, action=None, resource=None, resource_id=None,
            detail=None, ip_address=None, user_agent=None, **kwargs):
        """Log an audit event"""
        log_entry = cls(
            user_id=actor_id,
            action=action,
            resource=resource or kwargs.get("subject_type"),
            resource_id=resource_id,
            detail=detail,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(log_entry)
        db.session.commit()
        return log_entry

    def __repr__(self):
        return f"<AuditLog {self.id} {self.action}>"
