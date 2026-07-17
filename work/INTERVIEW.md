# 云智购 yzhimall · 面试话术

> 整理成问答,每个问题给一段连贯的"我会这样讲"。重点是体现做过 / 想过 / 能讲清楚权衡。

---

## Q1. 请介绍一下这个项目

我做了一个前后端分离的 B2C 电商后端 + 买家 / 商家 / 管理员三端前端。买家走 React + Vite,商家和
管理员是两套独立的工作台。技术栈: Flask 2 + SQLAlchemy 2 + Redis + Celery + JWT,前端 React 18 + Zustand + axios。

后端用 flask-restx 走 Swagger 自动出文档。前端用 mock-first 设计 (`VITE_USE_MOCK=true` 完整跑通
,改 `false` 切到真实后端) ,方便 Demo。

---

## Q2. 你在这个项目里最有技术含量的部分是什么?

下单的并发安全。我用 SQLAlchemy 的 `with_for_update()` 在事务里给 SKU / 商品行加悲观锁,防止超卖。
下单还加了幂等键 (`X-Idempotent-Key` header),防止用户狂点提交按钮产生重复单。

```python
product = Product.query.filter_by(id=pid, is_deleted=False).with_for_update().first()
if not product or product.stock < qty:
    return bad_request("商品库存不足")
product.stock -= qty
```

同时 Redis 缓存商品列表 (`cache_key` 按 page/sort/category 拼),60 秒 TTL,翻页快很多。

---

## Q3. 你的认证是怎么设计的？

JWT 双 token：access（15 分钟）+ refresh（7 天）。两者都存 localStorage，前端 axios 拦截器发请求时自动附带。

为什么不用 httpOnly cookie 存 token：httpOnly cookie 防源生XSS 确实更安全，但我项目是前后端分离、React 和 Flask 不同端口，跨域带 cookie 需要后端配 Secure、SameSite 和 CORS credentials，联调时容易踩。所以选了前端自己持有 token 的简单模式。一旦要上多端 SSO 或对安全性要求更高，再迁回 httpOnly cookie。

后端 flask-jwt-extended 配 JWT_BLACKLIST_TOKEN_CHECKS=access，登出时把 jti 写进 Redis 黑名单（TTL = token 剩余存活时间），这样登出的 access token 立刻失效。401 触发 silent refresh：前端拦截器识别到 401 后先用 refresh 换一个新 access，再把原请求 replay，用户无感。并发请求同时想 refresh 时用一个轻量 mutex（或 in-flight 标记）只放行第一个，其余等结果，避免一次登录风暴刷掉 refresh 额度。
---

## Q4. RBAC 是怎么做的?

`rbac_service.py` 里有 `require_role(*roles)` 和 `admin_required()` 两个装饰器。
`User.role` 是字符串 (buyer / merchant / admin),`@admin_required` 双保险 (装饰器 + 业务层判断)。
权限粒度再细分走 `Role` / `Permission` 两张表,`User.role` 是 quick path,细粒度走关联表查
permission。

---

## Q5. 你怎么保证数据库迁移安全？

Flask-Migrate（Alembic）。我实际跑过一遍三步：flask db init 生成 migrations 结构，flask db migrate -m "..." 基于 SQLAlchemy 模型自动 diff 生成 revision，flask db upgrade 应用到库。生产升级前在低峰期执行，revision 文件进版本控制，回滚靠 flask db downgrade。

迁移这块我踩过一个真实坑。我在加 User.last_login_at 字段跑 migrate 时，发现 Flask-Migrate 的 flask db 命令死活连不上库——根因是 config.py 的 SQLALCHEMY_DATABASE_URI 是在 from config import config_by_name 的 import 期就调 _get_db_uri() 算的，而我之前把 load_dotenv() 放在 create_app() 函数体里，import 在前、load 在后，os.getenv 拿到空就回退到了 MySQL URI。修法是把 load_dotenv() 提到模块顶层、在 import config 之前执行。这个坑好就好在它揭示了一个 Python 里很常见的"配置在 import 期被冻结"的时序问题，面试官追问能直接讲出来龙去脉。

平时开发我用 db.create_all() 快速迭代（表会自动建好），真正要上结构变更时走 Flask-Migrate 留 revision。表统一带 created_at / updated_at / is_deleted，软删除为主，物理删除走单独的清理 job
---

## Q6. 异步任务 / 消息队列？

Celery + Redis 做 broker 和 backend。最典型的任务：下单后 30 分钟未支付自动关单，Task 写 close_timeout_order.apply_async(args=[order.id], countdown=1800)，Celery Beat 定时扫超时单。重试 3 次、超限进死信队列。

但我的开发环境没启 Redis，所以下单链路里我做了个降级：用 threading.Thread(target=apply_async, daemon=True).start() 包住 apply_async，broker 连不上也只在后台 warning，下单请求不会被同步阻塞。这是个权衡——正常情况 Celery 异步执行，开发期 Redis 没起时也不会让用户下单卡死。要上生产就把 Redis 起起来，代码一行不用改，apply_async 自然就真异步了。

其它任务：通知发送、商品浏览量异步累计、订单 CSV 导出，都走同一个 Celery app
---

## Q7. 你项目里遇到最难解决的 bug 是什么?

两个同源的"信封" bug: 用 `@ns.marshal_with` 装饰器时,如果方法返回的是 flask `Response` 对象
(`success()` / `created()` helper),marshal 会跳过序列化,导致返回的 list 里每一项都是 null 模板。

定位过程: 看后端日志没有 traceback,响应 200 但数据全是 null。最后对比 axios 拦截器收到的
`{code, data, meta}` 信封,发现 `data` 是个 list 但里面都是 `null`。flask-restx 文档没明确说
`marshal_with` 不能和 `Response` 一起用,这是个"silent fail"。

修复: 把装饰器去掉,直接返回 `success([...])`,与项目里其他 5 个 endpoint 保持一致。

---

## Q8. 你这套架构怎么部署？

Docker Compose 我配好了：Flask（Dockerfile.flask）、Celery worker（Dockerfile.celery）、MySQL + Redis 四个服务，docker compose up -d 一把起。生产用 Gunicorn（gunicorn.conf.py 里 pre-fork + max-requests 回收 worker）替代 flask run，FLASK_ENV=production 关掉 debug 重载，前面再挂 Nginx 反代静态资源和 Flask。

实话讲：这套 compose 我配置文件都写了、本地也跑过 Flask 这一头，但 MySQL/Redis 容器我个人开发机没起 Docker Desktop（WSL2 没装），平时直接用 SQLite + 内存限流跑 Flask dev server 方便调试。容器的意义是真上生产时一键起，自己平时改代码用 dev server 更快。这个边界我心里清楚，不会讲成"我天天 docker compose up"
---

## Q9. 接下来你会怎么演进这个项目？

短期（最近在做）：
- 商家端 SKU 上传做成可视化编辑，现在详情页还是手填 JSON，体验差
- 商品搜索从 LIKE %kw% 换成对 ElasticSearch 或至少加全文索引，搜索是当前最慢的一环
- 通知从 polling 换 SSE，省轮询带宽

中期：
- 拆微服务：用户 / 商品 / 订单独立部署，API gateway + JWT 透传
- 引入 ElasticSearch 做商品搜索
- 支付换真实通道（微信 / 支付宝）+ 对账 job

长期：
- 多租户（商家独立二级域）
- 推荐系统（协同过滤 + 用户画像）

我下一步会先动手 SKU 可视化编辑这一块——它既是用户能直接感知体验提升的点，也能逼我把 ProductSKU 模型真正接进前端，补上现在详情页库存判断还走 Product.stock 的短板
---

## Q10. 为什么 Flask 而不是 Django / FastAPI?

Flask 灵活,组件按需引入。我需要的是 flask-restx 出 Swagger 文档 (Django 还要 drf-yasg 之类的
套件) ,以及 SQLAlchemy 2 的现代 ORM (Django ORM 在跨库 / 复杂 join 上没那么灵活)。
FastAPI 我下一个项目会用,异步 + Pydantic 校验很香,但生态上 Flask + flask-restx 写接口更顺手。

---

## Q11. 你们数据库表怎么设计的? 哪些字段加了索引?

- `products`: `(status, category_id)` 联合索引 (前台列表最常用查询)
- `products.name`: 普通索引 (后台搜索 LIKE '%kw%')
- `product_skus`: `(product_id, stock)` 联合索引 (下单查库存)
- `orders`: `user_id` + `created_at desc` 索引 (我的订单分页)
- `users.email`: unique 索引 (登录查重)
- 软删字段 `is_deleted` 上都有索引

外键都是 `ON DELETE SET NULL` (用户删了订单留着) 或 `CASCADE` (商品删了 SKU 也清掉)。

---

## Q12. 你前端状态管理怎么做的?

Zustand,不用 Redux。本项目状态不复杂,只有:
- `useUserStore`: 当前用户 + token 持久化
- `useCartStore`: 购物车 (localStorage 持久化,跨刷新)
- `useToastStore`: 全局消息队列 (订阅式)

为什么不用 Context: Context 触发全树 re-render,大列表场景扛不住。Zustand 用 selector 订阅,
只 re-render 用到的那部分。

---

## Q13. 性能上你怎么优化?

后端:
- Redis 缓存商品列表 (60s TTL)
- 订单详情接口用 `joinedload` 一次性把 order + items + products 拉出来,避免 N+1
- 分页 limit 上限 100,offset 大于 1000 自动切到 keyset 分页

前端:
- 商品列表虚拟滚动 (超过 100 条时下)
- 图片懒加载 (`loading="lazy"`)
- axios 拦截器统一处理 401 (silent refresh,避免重复打 refresh 接口)
- 路由层 code-split (`React.lazy`)

---

## Q14. 你这个项目里哪些地方想重构?

- notification 那一块: 现在用 polling,想换成 SSE / WebSocket
- 支付接口的内存存储换成 Redis (现在重启会丢 session)
- merchant 后台商品列表的批量操作 (目前只能单条 toggle)
- 鉴权装饰器拆出来一个独立的 `app/utils/auth.py`,目前散落在三个文件

---

## Q15. 离职原因 / 这个项目持续多久 / 你一个人做的吗?

按实际情况讲。
