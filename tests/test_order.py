# -*- coding: utf-8 -*-
\"\"\"订单业务测试\"\"\"
import pytest


def test_order_status_text():
    from app.models.base import OrderStatus
    choices = OrderStatus.choices()
    assert OrderStatus.PENDING == 10
    assert OrderStatus.PAID == 20
    assert OrderStatus.can_cancel(OrderStatus.PENDING) == True
    assert OrderStatus.can_cancel(OrderStatus.SHIPPED) == False


def test_product_status():
    from app.models.base import ProductStatus
    assert ProductStatus.ON_SALE == 1
    assert ProductStatus.OFF_SALE == 2


def test_user_roles():
    from app.models.user import User
    u = User(name="test", email="t@t.com", password_hash="x")
    assert u.has_role([]) == False
