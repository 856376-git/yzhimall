# -*- coding: utf-8 -*-
"""文件上传 API"""
import os
import uuid
from flask import request, current_app
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User
from app.utils.response import success, created, bad_request, forbidden

ns = Namespace("upload", description="文件上传")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_upload_folder():
    folder = os.path.join(current_app.root_path, "..", "uploads")
    os.makedirs(folder, exist_ok=True)
    return folder


@ns.route("/image")
class ImageUpload(Resource):
    @jwt_required()
    @ns.doc(responses={201: "上传成功", 400: "文件无效/超限", 403: "无权限"})
    def post(self):
        """上传商品图片（需商家或管理员）"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role not in ("merchant", "admin"):
            return forbidden("仅商家或管理员可上传图片")

        if "file" not in request.files:
            return bad_request("未找到文件字段 'file'")

        file = request.files["file"]
        if file.filename == "":
            return bad_request("未选择文件")

        if not allowed_file(file.filename):
            return bad_request(f"不支持的文件类型，仅支持：{', '.join(ALLOWED_EXTENSIONS)}")

        file.seek(0, 2)
        size = file.tell()
        file.seek(0)
        if size > MAX_FILE_SIZE:
            return bad_request("文件大小超过5MB限制")

        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(get_upload_folder(), filename)
        file.save(filepath)

        url = f"/uploads/{filename}"
        return created({"url": url, "filename": filename})
