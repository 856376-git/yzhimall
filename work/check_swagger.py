# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, os.path.abspath("."))
os.environ["FLASK_ENV"] = "testing"
from app import create_app
spec = create_app("testing").test_client().get("/api/swagger.json").get_json()
print("swagger version:", spec.get("swagger"))
paths = spec["paths"]
checks = ["/auth/register", "/payment/create", "/cart/items", "/orders", "/admin/roles", "/admin/users/{uid}", "/user/profile"]
for k in checks:
    op = paths.get(k, {})
    m = op.get("post") or op.get("put")
    if not m:
        print(k, "NO OP")
        continue
    body = [p for p in m.get("parameters", []) if p.get("in") == "body"]
    if body:
        ref = body[0].get("schema", {}).get("$ref", "?")
        print("%-24s body -> %s | responses=%s" % (k, ref, list(m.get("responses", {}).keys())))
    else:
        print("%-24s NO body param | params=%s" % (k, [p.get("in") for p in m.get("parameters", [])]))