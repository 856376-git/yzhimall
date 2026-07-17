import io

with io.open('work/INTERVIEW.md','r',encoding='utf-8') as f:
    t = f.read()

def replace_section(t, qkey, newbody):
    start = t.find('## ' + qkey)
    if start < 0:
        raise SystemExit('not found ' + qkey)
    end = t.find('\n---\n', start)
    if end < 0:
        end = t.find('\n---', start)
    return t[:start] + newbody.rstrip() + t[end:]

q3 = """## Q3. 你的认证是怎么设计的？

JWT 双 token：access（15 分钟）+ refresh（7 天）。两者都存 localStorage，前端 axios 拦截器发请求时自动附带。

为什么不用 httpOnly cookie 存 token：httpOnly cookie 防源生XSS 确实更安全，但我项目是前后端分离、React 和 Flask 不同端口，跨域带 cookie 需要后端配 Secure、SameSite 和 CORS credentials，联调时容易踩。所以选了前端自己持有 token 的简单模式。一旦要上多端 SSO 或对安全性要求更高，再迁回 httpOnly cookie。

后端 flask-jwt-extended 配 JWT_BLACKLIST_TOKEN_CHECKS=access，登出时把 jti 写进 Redis 黑名单（TTL = token 剩余存活时间），这样登出的 access token 立刻失效。401 触发 silent refresh：前端拦截器识别到 401 后先用 refresh 换一个新 access，再把原请求 replay，用户无感。并发请求同时想 refresh 时用一个轻量 mutex（或 in-flight 标记）只放行第一个，其余等结果，避免一次登录风暴刷掉 refresh 额度。"""

q5 = """## Q5. 你怎么保证数据库迁移安全？

Flask-Migrate（Alembic）。我实际跑过一遍三步：flask db init 生成 migrations 结构，flask db migrate -m "..." 基于 SQLAlchemy 模型自动 diff 生成 revision，flask db upgrade 应用到库。生产升级前在低峰期执行，revision 文件进版本控制，回滚靠 flask db downgrade。

迁移这块我踩过一个真实坑。我在加 User.last_login_at 字段跑 migrate 时，发现 Flask-Migrate 的 flask db 命令死活连不上库——根因是 config.py 的 SQLALCHEMY_DATABASE_URI 是在 from config import config_by_name 的 import 期就调 _get_db_uri() 算的，而我之前把 load_dotenv() 放在 create_app() 函数体里，import 在前、load 在后，os.getenv 拿到空就回退到了 MySQL URI。修法是把 load_dotenv() 提到模块顶层、在 import config 之前执行。这个坑好就好在它揭示了一个 Python 里很常见的"配置在 import 期被冻结"的时序问题，面试官追问能直接讲出来龙去脉。

平时开发我用 db.create_all() 快速迭代（表会自动建好），真正要上结构变更时走 Flask-Migrate 留 revision。表统一带 created_at / updated_at / is_deleted，软删除为主，物理删除走单独的清理 job"""

q6 = """## Q6. 异步任务 / 消息队列？

Celery + Redis 做 broker 和 backend。最典型的任务：下单后 30 分钟未支付自动关单，Task 写 close_timeout_order.apply_async(args=[order.id], countdown=1800)，Celery Beat 定时扫超时单。重试 3 次、超限进死信队列。

但我的开发环境没启 Redis，所以下单链路里我做了个降级：用 threading.Thread(target=apply_async, daemon=True).start() 包住 apply_async，broker 连不上也只在后台 warning，下单请求不会被同步阻塞。这是个权衡——正常情况 Celery 异步执行，开发期 Redis 没起时也不会让用户下单卡死。要上生产就把 Redis 起起来，代码一行不用改，apply_async 自然就真异步了。

其它任务：通知发送、商品浏览量异步累计、订单 CSV 导出，都走同一个 Celery app"""

q8 = """## Q8. 你这套架构怎么部署？

Docker Compose 我配好了：Flask（Dockerfile.flask）、Celery worker（Dockerfile.celery）、MySQL + Redis 四个服务，docker compose up -d 一把起。生产用 Gunicorn（gunicorn.conf.py 里 pre-fork + max-requests 回收 worker）替代 flask run，FLASK_ENV=production 关掉 debug 重载，前面再挂 Nginx 反代静态资源和 Flask。

实话讲：这套 compose 我配置文件都写了、本地也跑过 Flask 这一头，但 MySQL/Redis 容器我个人开发机没起 Docker Desktop（WSL2 没装），平时直接用 SQLite + 内存限流跑 Flask dev server 方便调试。容器的意义是真上生产时一键起，自己平时改代码用 dev server 更快。这个边界我心里清楚，不会讲成"我天天 docker compose up\""""

q9 = """## Q9. 接下来你会怎么演进这个项目？

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

我下一步会先动手 SKU 可视化编辑这一块——它既是用户能直接感知体验提升的点，也能逼我把 ProductSKU 模型真正接进前端，补上现在详情页库存判断还走 Product.stock 的短板"""

t = replace_section(t, 'Q3.', q3)
t = replace_section(t, 'Q5.', q5)
t = replace_section(t, 'Q6.', q6)
t = replace_section(t, 'Q8.', q8)
t = replace_section(t, 'Q9.', q9)

with io.open('work/INTERVIEW.md','w',encoding='utf-8',newline='\n') as f:
    f.write(t)
print('rewrote 5 questions, new_len', len(t))
