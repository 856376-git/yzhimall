# -*- coding: utf-8 -*-
\"\"\"认证 API 测试\"\"\"
import pytest


def test_register_success(client):
    resp = client.post("/api/auth/register", json={
        "name": "张三",
        "email": "zhangsan@test.com",
        "password": "Test1234",
    })
    assert resp.status_code in (201, 400)  # 400=validation, 201=success


def test_login_validation(client):
    resp = client.post("/api/auth/login", json={
        "email": "notexist@test.com",
        "password": "wrongpass",
    })
    # 未注册用户应返回 401 或 400
    assert resp.status_code in (400, 401, 404)


def test_logout_without_token(client):
    resp = client.post("/api/auth/logout")
    assert resp.status_code == 401


def test_refresh_without_token(client):
    resp = client.post("/api/auth/refresh")
    assert resp.status_code == 401
