# -*- coding: utf-8 -*-
"""初始化测试账号"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models import User, Category, Product, ProductImage

app = create_app()

def init():
    with app.app_context():
        # 创建表
        db.create_all()

        # 1. 买家账号
        buyer = User.query.filter_by(email="buyer@test.com", is_deleted=False).first()
        if not buyer:
            buyer = User(name="测试买家", email="buyer@test.com", role="buyer", phone="13800000001")
            buyer.set_password("123456")
            db.session.add(buyer)
            print("✅ 买家账号已创建: buyer@test.com / 123456")
        else:
            print("ℹ️  买家账号已存在: buyer@test.com")

        # 2. 商家账号
        merchant = User.query.filter_by(email="merchant@test.com", is_deleted=False).first()
        if not merchant:
            merchant = User(name="测试商家", email="merchant@test.com", role="merchant",
                          phone="13800000002", merchant_name="优品数码旗舰店")
            merchant.set_password("123456")
            db.session.add(merchant)
            print("✅ 商家账号已创建: merchant@test.com / 123456")
        else:
            print("ℹ️  商家账号已存在: merchant@test.com")

        # 3. 管理员账号
        admin = User.query.filter_by(email="admin@yzhimall.com", is_deleted=False).first()
        if not admin:
            admin = User(name="超级管理员", email="admin@yzhimall.com", role="admin")
            admin.set_password("admin123")
            db.session.add(admin)
            print("✅ 管理员账号已创建: admin@yzhimall.com / admin123")
        else:
            print("ℹ️  管理员账号已存在: admin@yzhimall.com")

        db.session.commit()

        # 给商家加几个测试商品
        if merchant:
            existing = Product.query.filter_by(merchant_id=merchant.id).first()
            if not existing:
                for i, name in enumerate([
                    "小米 Redmi K70 至尊版 5G智能手机",
                    "Apple iPhone 15 Pro Max 256GB",
                    "华为 Mate 60 Pro+ 旗舰手机",
                    "索尼 WH-1000XM5 无线降噪耳机",
                    "戴森 V15 智能吸尘器",
                ]):
                    p = Product(
                        name=name,
                        slug=f"product-{i+1}-{merchant.id}",
                        price=str([2499, 8999, 6999, 2499, 4999][i]),
                        original_price=str([2999, 9999, 7999, 2999, 5999][i]),
                        stock=100,
                        sold_count=i * 23 + 5,
                        merchant_id=merchant.id,
                        category_id=1,
                    )
                    db.session.add(p)
                    db.session.flush()
                    db.session.add(ProductImage(
                        product_id=p.id,
                        image_url=f"https://picsum.photos/seed/prod{i+1}/400/400",
                        sort_order=0,
                        is_primary=True,
                    ))
                print(f"✅ 已为商家创建 5 个测试商品")
            else:
                print("ℹ️  商家已有测试商品，跳过")

        # 创建测试分类
        if not Category.query.first():
            cats = ["数码电子", "手机通讯", "智能穿戴", "影音娱乐", "母婴用品", "家居生活"]
            for i, name in enumerate(cats):
                c = Category(name=name, slug=f"cat-{i+1}", sort_order=i)
                db.session.add(c)
            print(f"✅ 已创建 {len(cats)} 个测试分类")

        db.session.commit()
        print("\n🎉 初始化完成！")


if __name__ == "__main__":
    init()
