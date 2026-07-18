# 云智购 yzhimall · 企业级 B2C 电商平台

> 基于 **Flask 3.0 + React 18** 的前后端分离 B2C 电商系统。覆盖买家 / 商家 / 管理员三角色，端到端打通「注册登录 → 浏览 → 购物车 → 下单 → 支付 → 订单」全链路，后端具备 JWT 双 Token、RBAC 基础设施、订单状态机、行锁防超卖、幂等支付回调等企业级特性。本仓库可直接作为中型 Python 后端 / 全栈岗位的面试作品集。

<p align="center">
  <sub>买家 · 商家 · 管理员 三端 · 10 个 API 模块 · 10 张数据表 · 19 个前端页面</sub>
</p>

---

## 目录

1. [快速启动](#1-快速启动)
2. [项目架构](#2-项目架构)
3. [技术栈](#3-技术栈)
4. [数据库设计](#4-数据库设计)
5. [后端 API 清单](#5-后端-api-清单)
6. [前端页面与三角色链路](#6-前端页面与三角色链路)
7. [核心业务设计](#7-核心业务设计)
8. [测试账号](#8-测试账号)
9. [测试](#9-测试)
10. [容器化部署](#10-容器化部署)
11. [开发历程与踩坑](#11-开发历程与踩坑)
12. [面试要点](#12-面试要点)
13. [后续计划](#13-后续计划)

---

## 1. 快速启动

仓库提供两种启动方式：本地开发与 Docker Compose。开发默认使用 SQLite，不依赖任何外部服务即可跑通全流程。

### 1.1 环境依赖

- Python **3.10+**（推荐 3.12，开发机用 3.12.8 验证通过）
- Node.js **18+**
- Git

### 1.2 后端

```bash
# 克隆仓库
git clone https://github.com/856376-git/yzhimall.git
cd yzhimall

# 创建并激活虚拟环境（Windows / PowerShell）
py -3.12 -m venv venv
.\venv\Scripts\activate
# macOS / Linux: source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量（开发默认 SQLite，无需 MySQL/Redis 也能跑）
copy .env.example .env        # Windows
cp .env.example .env          # macOS/Linux

# 初始化数据库（首次运行会建表并写入种子数据）
flask db upgrade
python run.py                 # 后端起在 http://127.0.0.1:5000
```

### 1.3 前端

```bash
cd web
npm install
# 默认连真实后端（VITE_USE_MOCK=false），如需纯前端预览改为 true
npm run dev                   # 前端起在 http://localhost:3001，代理 /api → 后端 5000
```

打开浏览器：

| 入口 | 地址 |
|------|------|
| 商城前台 | http://localhost:3001/ |
| 买家登录 | http://localhost:3001/login |
| 商家登录 | http://localhost:3001/merchant/login |
| 管理员登录 | http://localhost:3001/admin/login |

---

## 1.x 截图预览

> 在此替换为本地运行截图。先把图片放到 `docs/screenshots/` 目录，然后 `git add .`
> → `git commit -m "docs: add screenshots"` → `git push`。如果改了图片文件名，
> 把下面 `docs/screenshots/...` 路径替换成最终文件名即可。

### 买家端

**商城首页**

![商城首页]<img width="2549" height="1352" alt="8252ebd1ed6ce07db8c2b551ec8b83b3" src="https://github.com/user-attachments/assets/71798149-54d4-4710-8440-261c57b3f348" />


**商品详情**

![商品详情]<img width="2549" height="1352" alt="21bbca63351c3004cd38ec90ffbec6a6" src="https://github.com/user-attachments/assets/a8d8909e-53f2-4343-b2d8-d0c9a69d229e" />


**购物车**

![购物车]<img width="2549" height="1352" alt="4fb02bacd6146bea951ad5ea5de87922" src="https://github.com/user-attachments/assets/7785bd08-aded-4413-a7f0-f71fca47aad6" />


**结算页（收货地址表单）**

![结算页（收货地址表单）]<img width="2549" height="1352" alt="8a98eb8dbe146ac2b477883d91b0daf5" src="https://github.com/user-attachments/assets/2f819798-3ca7-4c9b-952a-2b4235069cab" />


**模拟支付（二维码 + 倒计时）**

![模拟支付（二维码 + 倒计时）]<img width="2549" height="1352" alt="cfd19c09632ad787dd45daae388f666b" src="https://github.com/user-attachments/assets/6b8381be-5267-4d6c-8082-169bc2f45116" />


**订单列表**

![订单列表]<img width="2549" height="1352" alt="c0fe605eef0319eda23157ca1f49a790" src="https://github.com/user-attachments/assets/aa180f8b-20e1-4d40-b82a-53b7ce711532" />


**每日签到**

![每日签到]<img width="2549" height="1352" alt="bc56e9835358e440bcca61007fceaebb" src="https://github.com/user-attachments/assets/85a53ee6-58f0-45b2-b63e-fc324346fbcd" />


### 商家工作台

**商家登录**

![商家登录]<img width="2549" height="1352" alt="55175dec3ea41638d58a804f3e5f6011" src="https://github.com/user-attachments/assets/73b629b1-8d02-433a-9480-b8b991d6fc1a" />


**商家概览**

![商家概览]<img width="2549" height="1352" alt="ed6f5aaac45f9f94ae24b4c2befbe42b" src="https://github.com/user-attachments/assets/797df221-c6b0-4f55-8a03-81537b90eece" />




**商家商品管理**

![商家商品管理]<img width="2549" height="1352" alt="59ba497c2f821b1e2c058f0cb5b58a4c" src="https://github.com/user-attachments/assets/2811c7c5-21c8-435e-8296-4bf1610372cc" />


**商家订单**

![商家订单]<img width="2549" height="1352" alt="76749be70719916c0c8ca0dba4442105" src="https://github.com/user-attachments/assets/29d0ce49-8cbc-4045-9938-5c20aa5bf171" />


### 管理员后台

**管理员登录**

![管理员登录]<img width="2549" height="1352" alt="a4cfb42cb4388c495eeb604fa9ea9e7c" src="https://github.com/user-attachments/assets/b9d899c2-2748-429d-a50d-800f31429f83" />


**管理员概览（看板统计）**

![管理员概览（看板统计）]<img width="2549" height="1352" alt="1227c431d9a1b4ada7a6ff00864f6c13" src="https://github.com/user-attachments/assets/da3e8818-f5ed-4e9b-b752-048e4e242693" />


**管理员 - 用户管理**

![管理员 - 用户管理]<img width="2549" height="1352" alt="a40faebf8efd03bd1ce887f238ae7d3f" src="https://github.com/user-attachments/assets/ed7a64dc-f6c5-40cd-a5de-b0da6ed0ce73" />


**管理员 - 订单管理**

![管理员 - 订单管理]<img width="2549" height="1352" alt="25433952f46abc3c501f427130c5b146" src="https://github.com/user-attachments/assets/b0dffc59-e4db-4a26-9589-c4eb18e51936" />


**管理员 - 商品管理**

![管理员 - 商品管理]<img width="2549" height="1352" alt="414079609f3479997b377577e8fc8a90" src="https://github.com/user-attachments/assets/580ada48-55ee-49a6-805a-dc397a5174da" />


---

## 3. 技术栈

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.10+ | 运行时 |
| Flask | 3.0.0 | Web 框架 |
| SQLAlchemy | 2.0.23 | ORM |
| Flask-SQLAlchemy | 3.1.1 | Flask 集成 |
| Flask-Migrate | 4.0.5 | 数据库迁移（Alembic 封装） |
| Alembic | 1.13.1 | 迁移底层 |
| Flask-RESTX | 1.3.0 | REST API + Swagger UI |
| marshmallow | 3.20.2 | 请求/响应序列化 |
| Flask-JWT-Extended | 4.6.0 | JWT 双 Token（Access + Refresh） |
| bcrypt | 4.1.2 | 密码哈希 |
| Flask-Limiter | 3.5.0 | 接口限流 |
| Flask-Caching | 2.1.0 | 缓存（目标 Redis，开发用 SimpleCache） |
| redis | 5.0.1 | 缓存 / Celery broker |
| celery | 5.3.6 | 异步任务（超时关单 / 通知） |
| loguru | 0.7.2 | 结构化日志 |
| PyMySQL / cryptography | · | MySQL 驱动 |
| gunicorn + gevent | · | 生产 WSGI |
| pytest + pytest-cov | · | 测试 |

### 前端

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| Vite 6 | 构建工具 + 开发服务器（:3001） |
| react-router-dom 6 | 路由（三角色独立路由组 + 布局守卫） |
| Zustand 4 | 状态管理 |
| Axios 1.7 | HTTP 客户端（Token 自动刷新 + 统一响应解析） |
| qrcode | 模拟支付二维码 |

### 当前运行态（与设计目标的差异，以代码为准）

> 项目设计目标是 MySQL 8.0 + Redis + Celery + Gunicorn 全栈生产配置；**开发环境以「能独立跑通、便于演示」为优先**，默认 SQLite + Flask dev server + 限流用 memory。切到生产配置只需改 `.env` + `docker-compose up`，代码层面零改动。各模块的代码已全部就绪，只是当前没有挂上外部服务。

- **数据库**：默认 SQLite（`yzhimall.db`），设计目标 MySQL 8.0（驱动已装、docker-compose 已就绪）
- **缓存/限流**：开发用 `memory://` 兜底，目标 Redis（`RATELIMIT_STORAGE_URL` 一行切换）
- **异步任务**：Celery 任务代码已写（`app/tasks/order_tasks.py`），未连 Redis 时不跑，下单超时关单用 `threading.Thread` 兜底
- **鉴权**：登录走 3-role 主链路（`User.role` 单列：buyer/merchant/admin）；RBAC 5 角色（super-admin/admin/operations/cs/viewer）基础设施（模型 + 关联表 + 审计日志）已在，未接入实际登录流程

---

## 4. 数据库设计

### 4.1 表清单（10 张）

| 表名 | 说明 |
|------|------|
| users | 用户表（含软删除 / 状态 / 角色枚举 / 商家信息字段） |
| roles | RBAC 角色表（系统角色） |
| permissions | 权限表（33 条 slug） |
| user_roles | 用户-角色关联表 |
| audit_logs | RBAC 审计日志表 |
| products | 商品 SPU（含价格历史、规格 Text、状态枚举） |
| product_skus | SKU 规格表（已建模，前端未完全联动） |
| product_images | 商品图片表（一对多 + 主图标记） |
| categories | 商品分类（多级树形） |
| brands | 品牌表 |
| orders | 订单表（状态机 + 商品快照 + 幂等 key） |
| order_items | 订单明细（保留下单时的商品名/数量/价格快照） |
| carts | 购物车表 |
| cart_items | 购物车商品表 |
| notifications | 用户通知（数据库 channel） |
| user_check_ins | 每日签到表（user_id + check_date 唯一约束） |

### 4.2 企业级设计要点

- 统一软删除基类：所有模型继承 `BaseModel`，自带 `created_at` / `updated_at` / `is_deleted`
- 金额一律 `DECIMAL(10, 2)`，经手时转 float 才进 JSON，杜绝精度漂移
- 状态字段用整数枚举（`ProductStatus` / `OrderStatus` / `PaymentStatus`），避免字符串比较
- 高频查询走联合索引（如 `ix_product_status_category` 覆盖「在售 + 分类」筛选）
- 订单明细含商品快照（`product_name` / `quantity` / `price`），商品改名不影响历史订单
- 支付幂等：`idempotent_key` 防止回调重复入账

---

## 5. 后端 API 清单

统一响应封装（`app/utils/response.py`）：

```json
{ "code": 200, "msg": "success", "data": { }, "meta": { "page": 1, "per_page": 20, "total": 100 } }
```

`code = 200` 为成功，`400/401/403/500` 为各类错误；前端 `http.js` 按 `body.code` 判成败。

### 5.1 认证（auth）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 买家登录（返回 access + refresh token） |
| POST | /api/auth/login/merchant | 商家登录（role=merchant） |
| POST | /api/auth/login/admin | 管理员登录（role=admin） |
| POST | /api/auth/refresh | 刷新 access token |
| POST | /api/auth/logout | 登出（access token 加入黑名单） |

### 5.2 用户 / 签到

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / PUT | /api/user/profile | 查询 / 更新个人信息 |
| GET / POST / PUT / DELETE | /api/user/addresses[/{id}] | 收货地址 CRUD |
| GET | /api/user/checkin/status | 签到状态 |
| POST | /api/user/checkin | 每日签到（7 天阶梯积分，断签重置） |

### 5.3 商品

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/products | 商品列表（分页 / 筛选 / 排序 + Redis 缓存） |
| GET | /api/products/{id} | 商品详情（含 SKU + 浏览量+1） |
| GET | /api/products/categories | 分类树 |

### 5.4 购物车

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/cart | 获取购物车 |
| POST / PUT / DELETE | /api/cart/items[/{id}] | 增 / 改 / 删 |
| DELETE | /api/cart | 清空购物车 |

### 5.5 订单

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/orders | 创建订单（事务 + FOR UPDATE 行锁 + 幂等 key） |
| GET | /api/orders[/{id}] | 订单列表 / 详情 |
| POST | /api/orders/{id}/pay | 模拟支付 |
| POST | /api/orders/{id}/cancel | 取消订单 |

### 5.6 支付（沙箱模拟）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/payment/create | 创建支付会话（返回 qr_data） |
| GET | /api/payment/status | 查询支付状态 |
| POST | /api/payment/callback | 支付完成回调（模拟） |
| POST | /api/payment/cancel | 取消支付 |

### 5.7 商家工作台

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/merchant/stats | 商家统计 |
| GET | /api/merchant/orders | 商家订单 |
| GET / POST / PUT | /api/merchant/products[/{id}] | 商家商品 CRUD |

### 5.8 后台管理（10 路由均 `@admin_required`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/stats | 看板聚合统计 |
| GET | /api/admin/users | 用户列表（排除 password_hash） |
| POST | /api/admin/users/{id}/toggle | 锁/解锁用户 |
| PUT | /api/admin/users/{id}/role | 改用户角色 |
| GET | /api/admin/orders | 订单列表 |
| PUT | /api/admin/orders/{id}/status | 改订单状态 |
| GET | /api/admin/products | 商品列表 |
| POST | /api/admin/products/{id}/toggle | 商品上下架 |
| GET / POST | /api/admin/roles | 角色列表 / 创建角色 |

---

## 6. 前端页面与三角色链路

### 6.1 三角色入口 → 工作区

| 角色 | 登录入口 | 落地页 | 工作区 |
|------|---------|--------|--------|
| 买家 | /login | / | 商城前台：浏览 / 购物车 / 结算 / 下单 / 支付 / 订单 / 签到 |
| 商家 | /merchant/login | /merchant/dashboard | 概览 / 商品管理 / 我的订单 |
| 管理员 | /admin/login | /admin/dashboard | 概览 / 订单 / 用户 / 商品管理 |

架构采用「路由组 + 布局守卫」：每个角色一套独立 Layout + 一组受守卫路由，登录后只能进自己的工作区。

### 6.2 19 个页面组件

- **前台 7**：HomePage / ProductsPage / ProductDetailPage / CartPage / CheckoutPage / AuthPage / OrdersPage
- **活动 1**：CheckInPage（/checkin）
- **商家 5**：MerchantLoginPage / MerchantLayout / MerchantDashboard / MerchantProducts / MerchantOrders
- **管理员 6**：AdminLoginPage / AdminLayout / AdminDashboard / AdminOrders / AdminUsers / AdminProducts

### 6.3 已落地前端体验

- 三角色登录入口 + 三工作区（路由守卫 + 布局隔离）
- 商城前台完整链路：浏览 / 筛选 / 详情 / 购物车 / 结算 / 下单 / 支付 / 订单
- 模拟支付：二维码 + 15min 倒计时 + 2s 轮询 + 回调
- 每日签到：7 天阶梯积分 + 连续断签重置 + 最近记录
- 订单未付红点：顶栏 `我的订单` 挂红点徽标
- 三栏活动栏：左签到/秒杀/领券 + 中主内容 + 右订单/购物车/售后（≤1260px 自动单列）
- AdRail 广告位：6 分类 × 6 条，X 不感兴趣 + 分类选择 Modal（localStorage 存偏好）
- Checkout 收货地址真表单：空态自动展开、保存入列表、设默认清其它、必填校验
- mock / 真实后端可切：`web/.env` 的 `VITE_USE_MOCK` 一行切换

---

## 7. 核心业务设计

### 7.1 订单状态机

```
待支付 (unpaid) ──pay──▶ 已支付 (paid) ──ship──▶ 已发货 (shipped)
                                                       │
                                                       ▼
取消 (cancelled) ◀──cancel── 待支付            已完成 (completed)
```

- 创建订单：DB 事务包住「减库存 + 写订单 / 明细」
- 防超卖：`SELECT ... FOR UPDATE` 行锁 + 库存校验
- 幂等：`idempotent_key` 去重，支付回调重复请求不重复入账
- 超时关单：目标用 Celery 定时任务，未接 Redis 时用 `threading.Thread(daemon).start` 兜底，不阻塞下单请求

### 7.2 认证：JWT 双 Token

- 登录返回 `access_token`（15min） + `refresh_token`（7 天）
- access 失效 → 前端 `http.js` 拦截器自动调 `/api/auth/refresh` 续期，原请求重放
- 黑名单：登出时把 access token 加入黑名单，logout 后不可再用

### 7.3 缓存策略（Cache-Aside）

- 商品列表、详情、分类树走 `cache.get` → 未命中查库 → 写 cache 带 TTL
- 商品写操作后调 `invalidate_product_cache` 清缓存
- 开发用 `SimpleCache`（内存），生产切 Redis 仅需改 `CACHE_TYPE=RedisCache`

### 7.4 RBAC 基础设施

- 5 角色模型：super-admin / admin / operations / cs / viewer
- 权限按模块分组（products / orders / users / coupons / notifications / system），共 33 条 slug
- 审计日志：actor / target / action / subject_type / subject_name / ip / user_agent / 时间
- `User.has_role()` 支持单列 `role` + 多对多 RBAC 双路鉴权
- 说明：当前登录主链路走单列 `role`；RBAC 基础设施可平滑升级接入，无需重写鉴权栈

### 7.5 统一响应 + 全局异常

- 所有接口经 `success()` / `created()` / `not_found()` 等返回统一信封
- 全局异常处理器把 `ValidationError` / `AuthError` / SQLAlchemy 异常映射到对应 code/msg
- 无鉴权端点返回 HTTP 200 + body.code=401，而非 HTTP 403——前端拦截器只需看 body.code

---

## 8. 测试账号

| 角色 | 邮箱 | 密码 | 入口 |
|------|------|------|------|
| 买家 | buyer@test.com | 123456 | /login |
| 商家 | merchant@test.com | 123456 | /merchant/login |
| 管理员 | admin@yzhimall.com | admin123 | /admin/login |

> 测试账号与种子数据由初始化脚本写入；首次 `flask db upgrade` 后即可登录使用。`.env` 中的 `SECRET_KEY` / `JWT_SECRET_KEY` 当前为占位值，生产环境请替换为随机字符串。

---

## 9. 测试

```bash
pytest -v --cov
```

测试覆盖：

- `tests/test_auth.py`：注册 / 登录 / Token 刷新 / 黑名单
- `tests/test_order.py`：下单 / 状态流转 / 行锁
- `tests/test_notification.py`：通知投递

另在工作目录保存端到端冒烟脚本（`work/buyer_repro.py`、`work/smoke_test.py`），跨三角色造单 → 校验 → 自清理，覆盖 11 步全链路绿。

---

## 10. 容器化部署

```bash
docker-compose up -d --build
```

`docker-compose.yml` 启动：

- `mysql` MySQL 8.0
- `redis` Redis 7
- `flask` 后端（Gunicorn + gevent，端口 5000）
- `celery` Worker（消费订单超时关闭 / 通知任务）

镜像：

- `docker/Dockerfile.flask` 后端生产镜像
- `docker/Dockerfile.celery` Celery Worker 镜像
- `gunicorn.conf.py` 已配置 gevent 协程 + worker 数量

切到生产只需 `.env` 指向 `docker-compose` 起的 MySQL/Redis 即可。

---

## 11. 开发历程与踩坑

项目历时 10+ 轮迭代完成。典型的「真实级」坑（面试讲排查思路的好素材）：

1. **`@ns.marshal_with` 与 `success()` 信封冲突**：Flask-RESTX 的 marshal 装饰器按 model 字段过滤响应，与 `{code,msg,data}` 信封叠加时 token / user 全部被滤成 null。排查路径：抓包看响应 body → 对照 marshal model 字段 → 去装饰器靠统一信封。该问题在 auth / user / order 多轮重复出现。
2. **路由类名遮蔽模型类名**：`class PaymentStatus(Resource)` 与顶部 import 的枚举 `PaymentStatus` 同名，访问 `order.payment_status = PaymentStatus.PAID` 拿到的是 Resource 类。改名 `PaymentStatusResource` 解决。`OrderItem` 同款坑此后才暴露。
3. **前后端字段不对齐致 500**：早期 AuthPage 发 `{username, password}`，后端读 `data["email"]` 抛 KeyError → 500；商家/管理员页发 `account`、后端读 `account`，对得上所以从没 500——bug 只咬买家页。统一前端字段名并打错误日志修复。
4. **库 0 单时冒烟侥幸过**：旧 `_order_admin_view` 没吐 `items[]`，前端 `o.items.reduce(...)` 依赖之；0 单时无伤，真实有单即 TypeError 崩页。给 view 补 `items[]`，并返造一单的冒烟守住。
5. **Celery `apply_async` 等不存在的 Redis 同步阻塞**：下单请求里同步调 `apply_async`，连不上 broker 时整个请求线程被挂死。改用 `threading.Thread(daemon).start` 包住，broker 不通也只后台 warning。
6. **`normProduct.specs` 非数组时直接 `forEach` 崩**：后端 `Product.specs` 是 Text 列，可能是 JSON 字符串、可能是 null。加容错：`JSON.parse` 失败兜底 `[]`，非数组也兜底 `[]`。
7. **`joinedload` 加在 `lazy="dynamic"` 关系上**：SQLAlchemy 2.0 报 `does not support object population - eager loading cannot be applied`。dynamic 关系只能用 `.filter().all()` 显式查，去掉 `joinedload` 即修。

---

## 12. 面试要点

可作为面试讲解的切入点：

- **三角色分离的前端架构**：路由组 + 布局守卫，各自独立工作区，鉴权失败只回自己登录页
- **mock / 真实后端双路径 API 层**：`VITE_USE_MOCK` 一行切换，前端不依赖后端起服务就能开发/预览
- **JWT 双 Token + 黑名单 + 自动刷新**：access 短、refresh 长，前端拦截器无感续期
- **订单系统的事务 + 行锁 + 幂等 key**：超卖防护、支付回调重放安全
- **RBAC 基础设施 vs 实际鉴权**：为什么先落地单列 role，基础设施留作扩展（务实取舍）
- **统一响应信封 + 全局异常**：为什么无鉴权端点也返回 HTTP 200（前端拦截器只看 body.code）
- **dynamic 关系为什么不能 eager load**：SQLAlchemy 2.0 的行为差异
- **Docker Compose 一键部署**：开发（SQLite/memory）→ 生产（MySQL/Redis/Celery）零代码改动的切换路径
- **迭代过程中的踩坑**：见第 11 节

更细的话术与延伸问题见 `work/INTERVIEW.md`。

---

## 13. 后续计划

按优先级：

1. **前端打磨**：三工作区的空 / loading / 错误态完善；响应式与交互细节；旧 Vue 工程 `frontend/` 清理
2. **商家端 SKU 联动**：ProductSKU 模型已建，前端商品详情页 SKU 价格 / 库存选择联动
3. **切到 MySQL + Redis**：`.env` 切换 + `docker-compose up`，验证生产配置下的缓存与异步任务
4. **RBAC 接入登录**：把 5 角色 + 审计日志接进实际登录流程，单列 role 降级为兼容字段
5. **测试加强**：pytest 覆盖率提升、CI 接 GitHub Actions

---

## License

本项目当前未附加开源协议。如需使用请先联系作者。
