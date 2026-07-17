# 云智购项目进度记录

> 更新日期：2026-07-12（第三阶段完成）
> 项目路径：`C:\Users\朱烁楷\Documents\Codex\yzhimall`

---

## 一、后端改造（✅ 第一阶段完成）

### ✅ 已完成

#### 1. 用户模型（User）改造
- 新增 `role` 字段：`buyer`（买家） / `merchant`（商家） / `admin`（管理员）
- 新增 `merchant_name`：商家店铺名称
- 新增 `merchant_logo`：商家头像/Logo
- 新增 `verify_status`：商家认证状态
- 新增 `products` 关系：商家关联自己上架的商品

#### 2. 商品图片模型（ProductImage）
```python
ProductImage 模型
├── id (PK)
├── product_id (FK → Product)
├── image_url (图片URL)
├── sort_order (排序)
└── is_primary (是否主图)
```
- Product 模型新增 `product_images` 关系（一对多）
- 新增 `merchant_id` 字段：关联商家
- 新增 `primary_image` / `all_images` 属性

#### 3. 图片上传接口
- `POST /api/upload/image`（需商家或管理员）
- 支持 png/jpg/jpeg/gif/webp/svg，最大 5MB
- 文件保存到 `uploads/` 目录，返回 `/uploads/{filename}` URL

#### 4. 模拟支付接口（沙箱）
- `POST /api/payment/create` — 创建支付会话，生成二维码数据
- `GET /api/payment/status/<session_id>` — 轮询支付状态
- `POST /api/payment/callback/<session_id>` — 模拟回调，标记已支付
- `POST /api/payment/cancel/<session_id>` — 取消支付
- 内存存储支付会话（15分钟过期）

#### 5. 商家管理接口
- `GET /api/merchant/products` — 我的商品列表
- `POST /api/merchant/products` — 上架商品（支持多图）
- `GET /api/merchant/products/<id>` — 商品详情
- `PUT /api/merchant/products/<id>` — 编辑商品
- `DELETE /api/merchant/products/<id>` — 删除商品
- `POST /api/merchant/products/<id>/toggle` — 上下架切换
- `GET /api/merchant/orders` — 查看自己商品相关的订单
- `GET /api/merchant/stats` — 销售统计

#### 6. 认证接口扩展
- `POST /api/auth/register` — 支持 `role` 参数（buyer/merchant/admin）
- `POST /api/auth/login` — 买家登录（邮箱+密码）
- `POST /api/auth/login/merchant` — 商家登录（邮箱/手机号+密码）
- `POST /api/auth/login/admin` — 管理员登录（账号+密码）
- `AuthService.login_by_account()` — 支持商家手机号登录

#### 7. 并发保护（已有）
- ✅ 订单创建：FOR UPDATE 行锁防超卖
- ✅ 订单幂等：Idempotent Key 去重
- ✅ 支付幂等：同一 session 不重复处理
- ✅ 取消订单：事务回滚库存

### ⚠️ 后端待完成
- [ ] 买家验证码框架接入（后端短信接口）
- [ ] 商家验证码框架接入

---

## 二、前端改造（✅ 第一阶段完成）

### ✅ 三个登录页
| 页面 | 路径 | 风格 | 登录方式 |
|------|------|------|----------|
| 买家登录 | `/login` | 淘宝橙风（橙红渐变+圆角卡片） | 邮箱登录 + 验证码框架预留 |
| 商家登录 | `/merchant/login` | 商务蓝紫风 | 邮箱/手机号登录 + 验证码框架预留 |
| 管理员登录 | `/admin/login` | 暗黑科技风（深色背景+荧光蓝紫） | 账号+密码（无需验证码） |

### ✅ 全部页面
| 页面 | 路径 | 说明 |
|------|------|------|
| 买家登录 | `/login` | 邮箱+验证码登录，tab切换 |
| 商家登录 | `/merchant/login` | 邮箱/手机号切换，验证码框架预留 |
| 管理员登录 | `/admin/login` | 深色科技风 |
| 注册页 | `/register` | 角色选择（买家/商家），商家额外填店铺名 |
| 首页 | `/` | Bootstrap5风格，Hero横幅+分类图标+热门商品+销量榜 |
| 商品列表 | `/products` | 搜索+排序+分页 |
| 商品详情 | `/products/:id` | 图片切换+加入购物车+立即购买 |
| 购物车 | `/cart` | 数量修改+删除+结算 |
| 确认订单 | `/checkout` | 地址选择+商品清单+提交订单 |
| 支付页 | `/pay/:sessionId` | 二维码生成+轮询状态+自动回调跳转 |
| 订单列表 | `/orders` | 状态筛选+去支付+取消 |
| 订单详情 | `/orders/:id` | 订单信息+去支付 |
| 个人中心 | `/user` | 快捷导航+退出 |
| 收货地址 | `/user/addresses` | 增删改+弹窗表单 |
| 商家工作台 | `/merchant` | 统计卡片（商品数/订单数/销售额） |
| 商家商品管理 | `/merchant/products` | 列表+筛选+上架/下架+删除 |
| 商家上架商品 | `/merchant/products/add` | 表单+拖拽图片上传+多图预览 |
| 商家订单管理 | `/merchant/orders` | 查看买家订单+状态标识 |
| 管理员仪表盘 | `/admin` | 统计卡片（用户/商品/订单/收入） |
| 管理员用户管理 | `/admin/users` | 用户列表+角色标识 |
| 管理员订单管理 | `/admin/orders` | 订单列表+状态标识 |

### ⚠️ 前端待完成
- [ ] **重新设计前端风格**（当前与 GlobMall 过于相似）
- [ ] 买家验证码框架接入
- [ ] 商家验证码框架接入

---

## 三、测试账号（✅ 已创建）

| 角色 | 账号 | 密码 | 说明 |
|------|------|------|------|
| 买家 | buyer@test.com | 123456 | 普通买家 |
| 商家 | merchant@test.com | 123456 | 商家，可上架商品 |
| 管理员 | admin@yzhimall.com | admin123 | 系统管理员 |

---

## 四、技术要点（面试可讲）

1. **三角色体系**：User.role 字段区分买家/商家/管理员
2. **多图存储**：ProductImage 一对多模型，支持主图标记
3. **商家隔离**：商家只能管理自己的商品和订单（merchant_id 过滤）
4. **并发防超卖**：订单创建用 `with_for_update()` 行锁 + 事务
5. **幂等性**：Idempotent Key + 支付 session 去重
6. **模拟支付**：内存会话 + 二维码数据 + 轮询状态 + 延迟回调
