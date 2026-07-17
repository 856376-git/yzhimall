# 云智购 yzhimall · 变更日志 (2026-07-14)

> 配套 README 与 PROJECT_STATUS,仅记录本次会话 (第九轮) 之后新增 / 修复的功能与设计权衡。

## 本轮新增功能

### 1. 商家订单红点 (顶栏 TopBar Badge)
- 位置: `MainLayout.jsx` 顶栏的"我的订单"链接右上角
- 触发: 路由变更 + `window` 自定义事件 `orders-changed`
- 数据: 拉 `/api/orders?per_page=100`,过滤 `status === 'unpaid'`,渲染数字 / 9+ / 99+
- 性能: 单次 100 条上限拉一次,本地按状态过滤,不重复打订单详情接口

### 2. 左右侧活动栏 (Side Cards)
- 位置: `MainLayout.jsx` 中 `<aside class="side-col side-l">` + `<aside class="side-col side-r">`
- 实现: Flex 三栏布局 (`main-wrap-host` -> `side-col` + `main-col` + `side-col`)
- 内容: 左栏 (签到 / 限时秒杀 / 领券中心),右栏 (我的订单 / 购物车 / 售后保障)
- 交互: 点击 side-card 用 `useNavigate` 跳到对应页面,卡片 hover 有 translateY + shadow

### 3. 每日签到 (Check-In)
- 页面: `web/src/pages/CheckInPage.jsx`
- API: `GET /api/user/checkin/status`, `POST /api/user/checkin`
- 后端: 连续签到积分 7 天循环,记录入 `checkins` 表
- 样式: `.checkin-hero` (大字连续天数 + 大按钮), `.checkin-grid` (7 天奖励预览), `.checkin-records` (最近记录表)

### 4. 商品 SKU 联动 (新)
- 后端: `GET /api/products/<id>` 现在返回 `skus: [{id, sku_code, specs, price, stock}, ...]`
- 前端: `ProductDetailPage.jsx` 优先解析 `skus[].specs` (字符串"颜色:黑 / 容量:256G"),按维度聚合出按钮组
- 交互: 选 SKU 后价格 / 库存 / 数量上限同步更新,无匹配 SKU 提示"该规格暂无库存"
- 兼容: 没 SKU 的老商品仍走老的 `p.specs` JSON 渲染

## 本轮修复的 bug

| 序号 | 文件 | 现象 | 修复 |
|------|------|------|------|
| 1 | `web/src/api/index.js` :: `normProduct` | 后端 `specs` 为 JSON 字符串时详情页直接崩 | 增加 `JSON.parse` 容错,非数组兜底 `[]` |
| 2 | `app/api/order/routes.py` :: POST | 运费恒 0,实付金额与前端展示长期对不上 | 满 99 包邮否则 12 元,`actual_amount = total + shipping_fee` |
| 3 | `web/src/index.css` :: `.hero-main` | 渐变刺眼橙粉,整体偏廉价 | 改为深灰渐变,配合白字 |
| 4 | `web/src/index.css` :: 重复规则 | `.card .addbtn` x3, `.detail-actions .btn-buy` x3, `.checkin` padding 被覆盖 | 合并去重,保留生效的那一条 |
| 5 | `app/api/cart/routes.py` :: GET | `@ns.marshal_list_with` 与 `success()` 信封冲突,响应里的 list 被 marshal 兜底成 null 模板 | 去掉装饰器,与之前 auth/user/order 三处修复一致 |
| 6 | `app/api/product/routes.py` :: 详情 | `Product.query.get` SQLAlchemy 2.0 弃用告警 | 改 `db.session.get(Product, pid)` |
| 7 | `web/src/pages/CheckoutPage.jsx` 等 | 首页 `查看更多 >` 在 JSX 文本里裸写 `>`, esbuild 警告 | 改为 `<Icon name="chevron-right" size={12} />` |

## 本轮补充

- 后端 5000 端口之前没人监听 (你看到的"500 / 后端可能在重启"),用 `Start-Process -WindowStyle Hidden` 重启干净 Flask,Swagger 完整端点表覆盖 auth/user/products/cart/orders/payment/merchant/admin/notification/checkin/upload
- 写了 `work/buyer_repro.py`,端到端冒烟 11 步全绿 (注册 / 登录 / 地址 / 拉商品 / 下单 / 创建支付 / 回调 / 订单详情 / 签到 / 签到状态 / 订单列表),验证了 shipping_fee 实际计算
