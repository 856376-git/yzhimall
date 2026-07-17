# -*- coding: utf-8 -*-
"""买家下单全链路冒烟（test_client，不起 dev server，跑完自清理到 0 地址 0 单）。
验证：地址信封 / 地址新增 / 创建订单(Decimal float化) / 订单列表 / 订单详情 items[]。"""
import json
import uuid
import sys

sys.path.insert(0, ".")

from app import create_app
from app.extensions import db
from app.models import Order, Product

app = create_app()
ctx = app.app_context()
ctx.push()
client = app.test_client()

BUYER = {"email": "buyer@test.com", "password": "123456"}


def show(tag, resp):
    body = resp.get_json(silent=True)
    code = body.get("code") if isinstance(body, dict) else body
    preview = json.dumps(body, ensure_ascii=False)[:280] if body is not None else resp.data[:200]
    print(f"[{tag}] HTTP {resp.status_code} code={code} body={preview}")
    return body


created_order_id = None
created_addr_id = None
stock_before = None
product_id = None
H = {}
try:
    r = client.post("/api/auth/login", json=BUYER)
    b = show("login", r)
    token = b["data"]["access_token"] if b and b.get("code") == 200 else None
    assert token, "登录失败"
    H = {"Authorization": f"Bearer {token}", "X-Idempotent-Key": uuid.uuid4().hex}

    r = client.get("/api/user/addresses", headers=H)
    b = show("addr-list", r)
    assert b["code"] == 200 and isinstance(b["data"], list), "地址列表信封错"

    payload = {
        "consignee": "测试收货人", "phone": "13800000000",
        "province": "北京市", "city": "北京市", "district": "海淀区",
        "address": "中关村大街1号冒烟测试", "is_default": False,
    }
    r = client.post("/api/user/addresses", json=payload, headers=H)
    b = show("addr-create", r)
    assert b["code"] == 201, "地址新增应 201"
    created_addr_id = b["data"]["id"]
    assert b["data"].get("consignee") == payload["consignee"], "地址字段未回写"

    p = Product.query.filter_by(is_deleted=False, status=1).first()
    assert p, "无在售商品"
    product_id = p.id
    stock_before = p.stock
    print(f"[stock] product_id={product_id} stock_before={stock_before}")

    order_payload = {"address_id": created_addr_id, "items": [{"product_id": product_id, "quantity": 1}]}
    r = client.post("/api/orders", json=order_payload, headers=H)
    b = show("order-create", r)
    assert b["code"] == 201, "创建订单失败"
    created_order_id = b["data"]["id"]
    total = b["data"].get("total_amount")
    assert isinstance(total, (int, float)), f"total_amount 非 float: {type(total)}"
    print(f"[order] id={created_order_id} total_amount={total}（float，OK）")

    r = client.get("/api/orders", headers=H)
    b = show("order-list", r)
    assert b["code"] == 200 and isinstance(b["data"], list) and "meta" in b, "订单列表信封错"

    r = client.get(f"/api/orders/{created_order_id}", headers=H)
    b = show("order-detail", r)
    assert b["code"] == 200 and isinstance(b["data"].get("items"), list) and len(b["data"]["items"]) > 0, "详情缺 items[]"

    print("\n========== ALL PASS ==========")
except AssertionError as e:
    print(f"\n========== FAIL: {e} ==========")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"\n========== ERROR: {e} ==========")
finally:
    if created_order_id:
        client.delete(f"/api/orders/{created_order_id}", headers=H)  # 软取消 + 回补库存
        try:
            o = db.session.get(Order, created_order_id)
            if o:
                for it in list(o.items):
                    db.session.delete(it)
                db.session.delete(o)
                db.session.commit()
        except Exception as ex:
            db.session.rollback()
            print(f"[cleanup] order hard-delete skipped: {ex}")
        else:
            print(f"[cleanup] hard-deleted order {created_order_id}")
    if created_addr_id:
        client.delete(f"/api/user/addresses/{created_addr_id}", headers=H)  # 软删地址
        print(f"[cleanup] deleted address {created_addr_id}")
    if product_id is not None and stock_before is not None:
        p = db.session.get(Product, product_id)
        if p and p.stock != stock_before:
            p.stock = stock_before
            db.session.commit()
            print(f"[cleanup] restored stock product {product_id} -> {stock_before}")
    print("[done] buyer 回零：0 地址 0 单（stock 归位）")
    ctx.pop()
