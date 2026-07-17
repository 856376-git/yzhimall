# -*- coding: utf-8 -*-
import os, sys, argparse
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db
from app.models import (
    User, Role, Permission, AuditLog,
    Product, ProductSKU, Brand, Category,
    Order, OrderItem, Cart, CartItem,
    Notification,
)
from app.models.base import UserStatus, ProductStatus


def init_db():
    app = create_app()
    with app.app_context():
        db.create_all()
        print("[OK] Tables created")


def seed_data():
    app = create_app()
    with app.app_context():
        # Permissions
        perms = [
            Permission(name="User Manage", slug="user:manage", group_name="users", description="Manage users"),
            Permission(name="Role Manage", slug="role:manage", group_name="users", description="Manage roles"),
            Permission(name="Product Manage", slug="product:manage", group_name="products", description="Manage products"),
            Permission(name="Order Manage", slug="order:manage", group_name="orders", description="Manage orders"),
            Permission(name="Dashboard", slug="dashboard:view", group_name="dashboard", description="View dashboard"),
            Permission(name="Send Notification", slug="notification:send", group_name="notifications", description="Send notifications"),
        ]
        for p in perms:
            if not Permission.query.filter_by(slug=p.slug).first():
                db.session.add(p)
        db.session.commit()
        print(f"[OK] Permissions: {len(perms)}")

        # Roles
        roles_data = [
            {"name": "Super Admin", "slug": "super-admin", "perms": perms},
            {"name": "Admin", "slug": "admin", "perms": [p for p in perms if p.slug != "user:manage"]},
            {"name": "CS", "slug": "customer-service", "perms": [p for p in perms if p.slug in ("order:manage", "notification:send")]},
            {"name": "Warehouse", "slug": "warehouse", "perms": [p for p in perms if p.slug == "order:manage"]},
            {"name": "User", "slug": "user", "perms": []},
        ]
        for rd in roles_data:
            if not Role.query.filter_by(slug=rd["slug"]).first():
                role = Role(name=rd["name"], slug=rd["slug"], description=rd["name"])
                role.permissions = rd["perms"]
                db.session.add(role)
        db.session.commit()
        print(f"[OK] Roles: {len(roles_data)}")

        # Admin user
        admin = User.query.filter_by(email="admin@yzhimall.com").first()
        if not admin:
            admin = User(name="Admin", email="admin@yzhimall.com", phone="13800138000", status=UserStatus.ACTIVE)
            admin.set_password("admin123")
            r = Role.query.filter_by(slug="super-admin").first()
            if r:
                admin.roles.append(r)
            db.session.add(admin)
            db.session.commit()
        print("[OK] Admin: admin@yzhimall.com / admin123")

        # Categories
        cats = [
            Category(name="Phone", slug="phone", sort_order=1),
            Category(name="Computer", slug="computer", sort_order=2),
            Category(name="Appliance", slug="appliance", sort_order=3),
            Category(name="Fashion", slug="fashion", sort_order=4),
        ]
        for c in cats:
            if not Category.query.filter_by(slug=c.slug).first():
                db.session.add(c)
        db.session.commit()
        print(f"[OK] Categories: {len(cats)}")

        # Brands
        brands = [
            Brand(name="Apple", slug="apple", logo_url="https://cdn.yzhimall.com/apple.png"),
            Brand(name="Huawei", slug="huawei", logo_url="https://cdn.yzhimall.com/huawei.png"),
            Brand(name="Xiaomi", slug="xiaomi", logo_url="https://cdn.yzhimall.com/xiaomi.png"),
            Brand(name="Lenovo", slug="lenovo", logo_url="https://cdn.yzhimall.com/lenovo.png"),
        ]
        for b in brands:
            if not Brand.query.filter_by(slug=b.slug).first():
                db.session.add(b)
        db.session.commit()
        print(f"[OK] Brands: {len(brands)}")

        # Products
        products = [
            {"name": "iPhone 15 Pro", "slug": "iphone-15-pro", "price": 7999, "stock": 100, "category_id": 1, "brand_id": 1, "status": ProductStatus.ON_SALE},
            {"name": "Huawei Mate 60", "slug": "huawei-mate-60", "price": 6999, "stock": 80, "category_id": 1, "brand_id": 2, "status": ProductStatus.ON_SALE},
            {"name": "Xiaomi 14", "slug": "xiaomi-14", "price": 5999, "stock": 120, "category_id": 1, "brand_id": 3, "status": ProductStatus.ON_SALE},
            {"name": "MacBook Pro 14", "slug": "macbook-pro-14", "price": 14999, "stock": 50, "category_id": 2, "brand_id": 1, "status": ProductStatus.ON_SALE},
            {"name": "ThinkPad X1", "slug": "thinkpad-x1", "price": 9999, "stock": 60, "category_id": 2, "brand_id": 4, "status": ProductStatus.ON_SALE},
        ]
        for pd in products:
            if not Product.query.filter_by(slug=pd["slug"]).first():
                db.session.add(Product(**pd))
        db.session.commit()
        print(f"[OK] Products: {len(products)}")

        # Notifications
        notifs = [
            {"title": "Welcome to YZHiMall", "content": "You are now an admin!", "type": "system", "is_read": False},
            {"title": "System Upgrade", "content": "System upgrade scheduled Sunday 2:00-4:00 AM", "type": "system", "is_read": False},
            {"title": "New Order", "content": "New order: YZZG20260712001", "type": "order", "is_read": True},
            {"title": "Security Alert", "content": "Login from unusual location detected", "type": "security", "is_read": False},
        ]
        for nd in notifs:
            if not Notification.query.filter_by(title=nd["title"], user_id=admin.id).first():
                db.session.add(Notification(user_id=admin.id, **nd))
        db.session.commit()
        print(f"[OK] Notifications: {len(notifs)}")
        print("\n[SUCCESS] Database seeded!")


def reset_db():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("[OK] Database reset")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--seed", action="store_true")
    p.add_argument("--reset", action="store_true")
    args = p.parse_args()
    if args.reset:
        if input("Reset database? (yes/no): ").lower() == "yes":
            reset_db()
    else:
        init_db()
        if args.seed:
            seed_data()
