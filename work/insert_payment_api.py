import io

p = r"C:\Users\朱烁楷\Documents\Codex\yzhimall\web\src\api\index.js"
with io.open(p, "r", encoding="utf-8") as f:
    s = f.read()

marker = "}\n\n// 商家工作台"
if "export const PaymentAPI" in s:
    print("already inserted; skipping")
else:
    assert marker in s, "anchor not found"
    insertion = (
        "}\n\n"
        "// 支付(模拟沙箱)与后端 /api/payment 一一对应: create 发起 -> 前端轮询 status -> 模拟付款触发 callback\n"
        "export const PaymentAPI = {\n"
        "  create: (order_id) => http.post('/payment/create', { order_id }),\n"
        "  status: (session_id) => http.get(`/payment/status/${session_id}`),\n"
        "  callback: (session_id) => http.post(`/payment/callback/${session_id}`),\n"
        "  cancel: (session_id) => http.post(`/payment/cancel/${session_id}`),\n"
        "}\n\n"
    )
    s2 = s.replace(marker, insertion + "// 商家工作台", 1)
    assert s2 != s, "no replacement made"
    with io.open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(s2)
    print("inserted PaymentAPI")
