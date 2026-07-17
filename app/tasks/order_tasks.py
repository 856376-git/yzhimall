# -*- coding: utf-8 -*-
"""Celery 异步任务"""
from celery import Celery
from app.extensions import db

celery_app = Celery("yzhimall")

celery_app.config_from_object({
    "broker_url": "redis://127.0.0.1:6379/0",
    "result_backend": "redis://127.0.0.1:6379/1",
    "task_serializer": "json",
    "result_serializer": "json",
    "accept_content": ["json"],
    "timezone": "Asia/Shanghai",
    "enable_utc": True,
    # 开发环境无 Redis 时下单不应卡死：连接不重试、快速失败
    "broker_connection_retry_on_startup": False,
    "broker_connection_retry": False,
    "broker_connection_timeout": 2,
})


class ContextTask(celery_app.Task):
    """带 Flask 应用上下文的 Task"""
    def __call__(self, *args, **kwargs):
        from app import create_app
        app = create_app()
        with app.app_context():
            return self.run(*args, **kwargs)


celery_app.Task = ContextTask


# ========================
# 1. 订单超时自动关闭
# ========================
@celery_app.task(name="order.close_timeout", bind=True, max_retries=3)
def close_timeout_order(self, order_id: int):
    """订单 30 分钟未支付自动关闭，恢复库存"""
    from app.models import Order, OrderItem, Product, ProductSKU
    from app.models.base import OrderStatus

    order = Order.query.get(order_id)
    if not order or order.status != OrderStatus.PENDING:
        return {"msg": "订单已处理，跳过"}

    try:
        order.status = OrderStatus.CANCELLED
        for item in order.items:
            if item.sku_id:
                sku = ProductSKU.query.get(item.sku_id)
                if sku:
                    sku.stock += item.quantity
            else:
                product = Product.query.get(item.product_id)
                if product:
                    product.stock += item.quantity
        db.session.commit()
        return {"msg": f"订单 {order_id} 已超时关闭"}
    except Exception as e:
        db.session.rollback()
        raise self.retry(exc=e, countdown=60)


def schedule_order_close(order_id: int, countdown: int = 1800):
    """延时任务：30分钟后执行超时关闭"""
    close_timeout_order.apply_async(args=[order_id], countdown=countdown)


# ========================
# 2. 发送通知
# ========================
@celery_app.task(name="notification.send", bind=True, max_retries=3)
def send_notification(self, user_id: int, title: str, content: str):
    """异步发送站内通知"""
    from app.models import Notification

    try:
        notif = Notification(
            user_id=user_id,
            title=title,
            content=content,
        )
        db.session.add(notif)
        db.session.commit()
        return {"msg": "通知已发送"}
    except Exception as e:
        db.session.rollback()
        raise self.retry(exc=e, countdown=30)


# ========================
# 3. 订单导出 CSV
# ========================
@celery_app.task(name="order.export_csv", bind=True)
def export_order_csv(self, order_ids: list[int], file_path: str):
    """导出订单 CSV"""
    import csv
    from app.models import Order

    orders = Order.query.filter(Order.id.in_(order_ids)).all()
    with open(file_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["订单号","用户","金额","状态","时间"])
        for o in orders:
            writer.writerow([o.order_no, o.consignee, o.actual_amount, o.status, o.created_at])
    return {"msg": f"导出完成: {file_path}"}


# ========================
# 定时任务（Celery Beat）
# ========================
@celery_app.task(name="cleanup.expired_carts")
def cleanup_expired_carts():
    """每日清理过期购物车（可配置 Celery Beat 定时执行）"""
    from app.models import Cart, CartItem
    from datetime import timedelta
    from datetime import datetime

    threshold = datetime.utcnow() - timedelta(days=30)
    old_carts = Cart.query.filter(Cart.created_at < threshold).all()
    for cart in old_carts:
        cart.is_deleted = True
    db.session.commit()
    return {"msg": f"清理了 {len(old_carts)} 个过期购物车"}
