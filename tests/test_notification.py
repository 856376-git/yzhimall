# -*- coding: utf-8 -*-
"""Notification API Tests"""
import pytest
from app import create_app
from app.extensions import db
from app.models import User, Role, Notification, NotificationPreference, Permission
from app.services.notification_service import NotificationService, NotificationTemplates
from app.models.base import UserStatus


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        # Create test user
        user = User(name="Test User", email="test@example.com", status=UserStatus.ACTIVE)
        user.set_password("test123")
        db.session.add(user)
        db.session.commit()
        yield app
        db.session.delete(user)
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(client, app):
    """Get auth token for test user"""
    with app.app_context():
        from app.services.auth_service import AuthService
        token = AuthService.generate_access_token(1)
    return {"Authorization": f"Bearer {token}"}


class TestNotificationService:
    """Test NotificationService"""

    def test_send_notification(self, app):
        """Test basic notification sending"""
        with app.app_context():
            notif = NotificationService.send(
                user_id=1,
                title="Test Notification",
                content="Test content",
                notif_type="system"
            )
            assert notif is not None
            assert notif.title == "Test Notification"
            assert notif.user_id == 1
            assert notif.is_read == False

    def test_send_batch(self, app):
        """Test batch notification sending"""
        with app.app_context():
            # Create another user
            user2 = User(name="Test User 2", email="test2@example.com", status=UserStatus.ACTIVE)
            user2.set_password("test123")
            db.session.add(user2)
            db.session.commit()

            count = NotificationService.send_batch(
                user_ids=[1, 2],
                title="Batch Notification",
                content="Batch content",
                notif_type="system"
            )
            assert count == 2

    def test_preference_check(self, app):
        """Test user preference blocks notifications"""
        with app.app_context():
            # Disable order notifications
            NotificationService.update_preference(1, "order", False)

            # Try to send order notification - should be skipped
            notif = NotificationService.send(
                user_id=1,
                title="Order Update",
                content="Your order shipped",
                notif_type="order"
            )
            assert notif is None  # Skipped due to preference

            # Security notifications should still work (skip_preference=True)
            notif = NotificationService.send(
                user_id=1,
                title="Security Alert",
                content="New login detected",
                notif_type="security",
                skip_preference=True
            )
            assert notif is not None  # Not skipped

    def test_template_notification(self, app):
        """Test template-based notification"""
        with app.app_context():
            notif = NotificationService.send_with_template(
                user_id=1,
                template_id=NotificationTemplates.ORDER_CREATED,
                order_no="ORD123",
                amount="99.99"
            )
            assert notif is not None
            assert "ORD123" in notif.title

    def test_notify_order_status(self, app):
        """Test order status notification"""
        with app.app_context():
            notif = NotificationService.notify_order_status(1, "ORD456", "Shipped")
            assert notif is not None
            assert notif.type == "order"
            assert "ORD456" in notif.title


class TestNotificationAPI:
    """Test Notification API endpoints"""

    def test_get_notifications_empty(self, client, auth_headers):
        """Test getting empty notification list"""
        response = client.get("/api/notifications", headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["code"] == 200
        assert data["data"]["items"] == []

    def test_create_notification(self, client, auth_headers):
        """Test creating a notification via API"""
        response = client.post("/api/notifications",
            headers=auth_headers,
            json={"title": "API Test", "content": "API content", "type": "system"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["code"] == 200

    def test_get_unread_count(self, client, auth_headers):
        """Test unread count endpoint"""
        # Create a notification first
        with client.application.app_context():
            NotificationService.send(user_id=1, title="Unread", content="Test", notif_type="system")

        response = client.get("/api/notifications/unread-count", headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["data"]["unread_count"] >= 1

    def test_mark_all_read(self, client, auth_headers):
        """Test marking all as read"""
        response = client.post("/api/notifications/mark-all-read", headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["code"] == 200

    def test_notification_preference(self, client, auth_headers):
        """Test preference get/update"""
        response = client.get("/api/notifications/preference", headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "order" in data["data"]
        assert data["data"]["order"] == True  # Default enabled

        # Update preference
        response = client.post("/api/notifications/preference",
            headers=auth_headers,
            json={"notif_type": "order", "enabled": False}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["data"]["enabled"] == False

    def test_send_template_api(self, client, auth_headers):
        """Test sending template notification"""
        response = client.post("/api/notifications/send-template",
            headers=auth_headers,
            json={
                "template_id": "order_created",
                "order_no": "ORD789",
                "amount": "50.00"
            }
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["code"] == 200

    def test_delete_notification(self, client, auth_headers):
        """Test soft delete notification"""
        # Create notification
        with client.application.app_context():
            notif = NotificationService.send(user_id=1, title="To Delete", content="Test")
            notif_id = notif.id

        response = client.delete(f"/api/notifications/{notif_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["code"] == 200

        # Verify deleted
        with client.application.app_context():
            from app.models import Notification
            deleted = Notification.query.get(notif_id)
            assert deleted.is_deleted == True

    def test_get_notification_detail_auto_read(self, client, auth_headers):
        """Test that reading detail marks notification as read"""
        with client.application.app_context():
            notif = NotificationService.send(user_id=1, title="Unread Test", content="Test")
            notif_id = notif.id

        response = client.get(f"/api/notifications/{notif_id}", headers=auth_headers)
        assert response.status_code == 200

        # Verify is_read is True
        with client.application.app_context():
            from app.models import Notification
            notif = Notification.query.get(notif_id)
            assert notif.is_read == True
