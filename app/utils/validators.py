# -*- coding: utf-8 -*-
"""业务校验器（与 HTTP 分离，可在 service 层复用）"""
import re
from app.utils.exceptions import ValidationError


def validate_email(email: str) -> str:
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        raise ValidationError("邮箱格式不正确")
    return email


def validate_password(password: str, min_length: int = 8) -> str:
    if len(password) < min_length:
        raise ValidationError(f"密码长度至少 {min_length} 位")
    if not re.search(r"[A-Za-z]", password):
        raise ValidationError("密码必须包含字母")
    if not re.search(r"[0-9]", password):
        raise ValidationError("密码必须包含数字")
    return password


def validate_phone(phone: str) -> str:
    pattern = r"^1[3-9]\d{9}$"
    if phone and not re.match(pattern, phone):
        raise ValidationError("手机号格式不正确")
    return phone


def validate_required(value, field_name: str):
    """校验单个字段必填"""
    if value is None or value == "":
        raise ValidationError(f"{field_name} 不能为空")


def validate_required_fields(data: dict, required_fields: list):
    """批量校验必填字段"""
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == "":
            raise ValidationError(f"缺少必填字段：{field}")


def validate_range(value, min_val, max_val, field_name: str):
    if value < min_val or value > max_val:
        raise ValidationError(f"{field_name} 必须在 {min_val} ~ {max_val} 之间")
    return value
