# -*- coding: utf-8 -*-
"""RBAC 权限服务：角色 + 权限 + 审计"""
from flask import request
from app.extensions import db, cache
from app.models import Role, Permission, User, AuditLog
from app.utils.exceptions import ValidationError, ForbiddenError


class RBACService:
    # ========================
    # 获取用户权限列表（带缓存）
    # ========================
    @staticmethod
    def get_user_permissions(user_id: int) -> list:
        cache_key = f"user:{user_id}:permissions"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        user = db.session.get(User, user_id)
        if not user:
            return []

        perms = []
        for role in user.roles:
            for p in role.permissions:
                perms.append(p.slug)

        cache.set(cache_key, list(set(perms)), timeout=1800)  # 30分钟
        return list(set(perms))

    # ========================
    # 分配角色（写入审计日志）
    # ========================
    @staticmethod
    def assign_roles(
        user_id: int,
        role_ids: list[int],
        actor_id: int = None,
        ip_address: str = None,
    ) -> User:
        if actor_id is None:
            try:
                from flask_jwt_extended import get_jwt_identity
                actor_id = int(get_jwt_identity())
            except Exception:
                actor_id = None

        user = db.session.get(User, user_id)
        if not user:
            raise ValidationError("用户不存在")

        old_role_ids = {r.id for r in user.roles}
        new_role_ids = set(role_ids)

        # 防止移除最后一个 super-admin
        removed = old_role_ids - new_role_ids
        for rid in removed:
            role = db.session.get(Role, rid)
            if role and role.slug == "super-admin":
                super_admin_count = User.query.join(User.roles).filter(
                    Role.slug == "super-admin",
                    User.is_deleted == False,
                    User.id != user_id
                ).count()
                if super_admin_count == 0:
                    raise ForbiddenError("不能移除最后一个超级管理员")

        user.roles = Role.query.filter(Role.id.in_(role_ids)).all()

        # 写审计日志
        for rid in new_role_ids - old_role_ids:
            role = db.session.get(Role, rid)
            AuditLog.log(
                actor_id=actor_id,
                target_user_id=user_id,
                action="role_assigned",
                subject_type="Role",
                subject_id=rid,
                subject_name=role.name if role else None,
                ip_address=ip_address,
                user_agent=request.user_agent.string[:255] if request else None,
            )

        for rid in old_role_ids - new_role_ids:
            role = db.session.get(Role, rid)
            AuditLog.log(
                actor_id=actor_id,
                target_user_id=user_id,
                action="role_removed",
                subject_type="Role",
                subject_id=rid,
                subject_name=role.name if role else None,
                ip_address=ip_address,
                user_agent=request.user_agent.string[:255] if request else None,
            )

        # 清除权限缓存
        cache.delete(f"user:{user_id}:permissions")

        db.session.commit()
        return user

    # ========================
    # 同步权限定义到数据库（Seeder 用）
    # ========================
    @staticmethod
    def sync_permissions():
        definitions = PermissionService.definitions()
        for group_name, perms in definitions.items():
            for p in perms:
                Permission.query.filter_by(slug=p["slug"]).update_or_create(
                    {"slug": p["slug"]},
                    {
                        "name": p["name"],
                        "group_name": group_name,
                        "description": p.get("description"),
                    }
                )
        db.session.commit()

    @staticmethod
    def sync_roles():
        RBACService.sync_permissions()
        for role_def in PermissionService.default_roles():
            perms = role_def.pop("permissions", [])
            role, _ = Role.query.filter_by(slug=role_def["slug"]).update_or_create(
                {"slug": role_def["slug"]},
                role_def
            )
            if perms == "*":
                all_perms = Permission.query.all()
                role.permissions = all_perms
            else:
                role.permissions = Permission.query.filter(
                    Permission.slug.in_(perms)
                ).all()
            db.session.add(role)
        db.session.commit()


class PermissionService:
    """权限定义（集中管理 33 条权限）"""
    @classmethod
    def definitions(cls) -> dict:
        return {
            "dashboard": [
                {"name": "查看仪表盘", "slug": "dashboard.view"},
            ],
            "products": [
                {"name": "查看商品", "slug": "product.view"},
                {"name": "创建商品", "slug": "product.create"},
                {"name": "编辑商品", "slug": "product.edit"},
                {"name": "删除商品", "slug": "product.delete"},
            ],
            "categories": [
                {"name": "查看分类", "slug": "category.view"},
                {"name": "创建分类", "slug": "category.create"},
                {"name": "编辑分类", "slug": "category.edit"},
                {"name": "删除分类", "slug": "category.delete"},
            ],
            "orders": [
                {"name": "查看订单", "slug": "order.view"},
                {"name": "更新订单", "slug": "order.update"},
                {"name": "删除订单", "slug": "order.delete"},
                {"name": "导出订单", "slug": "order.export"},
            ],
            "users": [
                {"name": "查看用户", "slug": "user.view"},
                {"name": "编辑用户", "slug": "user.edit"},
                {"name": "删除用户", "slug": "user.delete"},
            ],
            "roles": [
                {"name": "查看角色", "slug": "role.view"},
                {"name": "管理角色", "slug": "role.manage"},
            ],
            "system": [
                {"name": "系统配置", "slug": "system.manage"},
            ],
        }

    @classmethod
    def default_roles(cls) -> list:
        all_slugs = [p["slug"] for perms in cls.definitions().values() for p in perms]
        return [
            {
                "name": "超级管理员", "slug": "super-admin",
                "description": "全部权限", "is_system": True,
                "permissions": "*",
            },
            {
                "name": "管理员", "slug": "admin",
                "description": "除角色管理外的全部权限", "is_system": True,
                "permissions": [s for s in all_slugs if s != "role.manage"],
            },
            {
                "name": "运营", "slug": "operations",
                "description": "商品与订单管理", "is_system": True,
                "permissions": [
                    "dashboard.view",
                    "product.view", "product.create", "product.edit",
                    "category.view", "category.create", "category.edit",
                    "order.view", "order.update",
                ],
            },
            {
                "name": "客服", "slug": "customer-service",
                "description": "订单与退款处理", "is_system": True,
                "permissions": [
                    "dashboard.view",
                    "order.view", "order.update",
                    "user.view",
                ],
            },
            {
                "name": "查看者", "slug": "viewer",
                "description": "只读权限", "is_system": True,
                "permissions": [
                    "dashboard.view",
                    "product.view",
                    "category.view",
                    "order.view",
                    "user.view",
                ],
            },
        ]
