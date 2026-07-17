// 内置假数据:不需要启动后端即可预览整个商城
// 所有方法返回统一形态 { code, msg, data, meta } 与后端一致

const IMG = (seed, w = 400, h = 400) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

const categories = [
  { id: 1, name: '手机数码', icon: 'phone' },
  { id: 2, name: '家用电器', icon: 'home' },
  { id: 3, name: '电脑办公', icon: 'monitor' },
  { id: 4, name: '服饰鞋包', icon: 'shirt' },
  { id: 5, name: '美妆护肤', icon: 'heart' },
  { id: 6, name: '食品生鲜', icon: 'star' },
  { id: 7, name: '母婴玩具', icon: 'star' },
  { id: 8, name: '运动户外', icon: 'star' },
  { id: 9, name: '图书文具', icon: 'star' },
  { id: 10, name: '家居家装', icon: 'home' },
]

const SAMPLE = [
  { nm: '华为 Mate 60 Pro 旗舰卫星通信 12+512G', cat: 1, price: 6999, orig: 7999 },
  { nm: '小米14 Ultra 徕卡四摄 16+512G', cat: 1, price: 6499, orig: 6999 },
  { nm: 'Apple iPhone 15 Pro Max 256G 原色钛金属', cat: 1, price: 9999, orig: 10999 },
  { nm: 'OPPO Find X7 天玑9300 16+512G', cat: 1, price: 3999, orig: 4599 },
  { nm: 'vivo X100 Pro 蔡司长焦 16+512G', cat: 1, price: 5499, orig: 5999 },
  { nm: '荣耀 Magic6 至臻版 16+512G', cat: 1, price: 4899, orig: 5499 },
  { nm: 'Redmi K70 Pro 二代骁龙8 16+1T', cat: 1, price: 2999, orig: 3299 },
  { nm: 'realme GT5 Pro 骁龙8Gen3', cat: 1, price: 2199, orig: 2599 },
  { nm: '美的变频空调1.5匹 新一级能效挂机', cat: 2, price: 2299, orig: 2699 },
  { nm: '海尔波轮洗衣机10公斤全自动', cat: 2, price: 1899, orig: 2199 },
  { nm: '格力云逸II立式空调3匹柜机', cat: 2, price: 5999, orig: 6999 },
  { nm: '小米米家对开门冰箱486升风冷', cat: 2, price: 2999, orig: 3399 },
  { nm: '联想拯救者Y9000P RTX4060 游戏本', cat: 3, price: 8999, orig: 9999 },
  { nm: '戴尔灵越14 Plus 轻薄商务本 i7', cat: 3, price: 4599, orig: 5299 },
  { nm: '华为MateBook 14 触屏版 i5', cat: 3, price: 5199, orig: 5699 },
  { nm: '罗技MX Master 3S 无线鼠标', cat: 3, price: 599, orig: 699 },
  { nm: 'Nike Air Force 1 经典板鞋 男女款', cat: 4, price: 749, orig: 899 },
  { nm: '安踏男款跑步鞋减震运动鞋', cat: 4, price: 329, orig: 459 },
  { nm: '回力帆布鞋低帮男女同款', cat: 4, price: 129, orig: 199 },
  { nm: '兰蔻小黑瓶精华肌底液50ml', cat: 5, price: 880, orig: 1080 },
  { nm: '雅诗兰黛沁水粉底液30ml', cat: 5, price: 520, orig: 620 },
  { nm: '伊利金典纯牛奶整箱250ml*24', cat: 6, price: 79.9, orig: 99 },
  { nm: '三只松鼠每日坚果750g混合', cat: 6, price: 89.9, orig: 119 },
  { nm: '乐高城市系列警车积木拼装', cat: 7, price: 199, orig: 259 },
  { nm: '迪卡侬加厚瑜伽垫防滑健身垫', cat: 8, price: 99, orig: 139 },
]

const products = SAMPLE.map((s, i) => {
  const id = i + 1
  const colorOpt = ['曜石黑', '冰川白', '远峰蓝', '沙漠金']
  return {
    id,
    name: s.nm,
    subtitle: '官方旗舰店正品赝后 全国联保 假一赔十',
    price: s.price,
    original_price: s.orig,
    stock: 200 - (i % 12) * 8,
    sold_count: 5000 - (i % 7) * 300,
    view_count: 20000 - i * 380,
    category_id: s.cat,
    merchant_id: i < 10 ? 2 : (10 + (i % 5)),
    merchant_name: '云智购自营',
    status: 'active',
    primary_image: IMG(`p${id}`),
    images: [IMG(`p${id}`), IMG(`p${id}-a`), IMG(`p${id}-b`), IMG(`p${id}-c`)],
    specs: [
      { name: '颜色', options: [colorOpt[i % 4], colorOpt[(i + 1) % 4], colorOpt[(i + 2) % 4]] },
      { name: '版本', options: ['标准版', '尊享版', '旗舰版'] },
    ],
    created_at: `2026-0${(i % 9) + 1}-1${i % 9}`,
  }
})

// 内存里的用户
const USERS = {
  demo: { id: 1, username: 'demo', password: '123456', nickname: '云智购用户', phone: '13800138000' },
  'buyer@test.com': { id: 11, username: 'buyer@test.com', email: 'buyer@test.com', password: '123456', nickname: '测试买家', phone: '13800000001', role: 'buyer' },
}
let MOCK_USER = null

// 商家与管理员演示账号（mock 模式下可直接登录，无需后端）
const MERCHANTS = {
  'merchant@test.com': { id: 2, account: 'merchant@test.com', password: '123456', nickname: '云智购自营店', role: 'merchant', phone: '13900139000' },
}
const ADMINS = {
  'admin@yzhimall.com': { id: 9, account: 'admin@yzhimall.com', password: 'admin123', nickname: '系统管理员', role: 'admin' },
}

const ADDRESSES = [
  { id: 1, name: '张三', phone: '13812345678', province: '广东省', city: '深圳市', district: '南山区', detail: '科技园云智大厦A座801室', is_default: true, tag: '公司' },
  { id: 2, name: '张三', phone: '13812345678', province: '广东省', city: '深圳市', district: '宝安区', detail: '西乡街道海湾新村8栋502', is_default: false, tag: '家' },
]

function ok(data, msg = 'success', meta) {
  return { code: 200, msg, data, meta }
}
function fail(code, msg, data) { return { code, msg, data } }

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms))

export async function getProducts(params = {}) {
  await delay(180)
  const { page = 1, per_page = 20, q, sort, category_id } = params
  let list = products
  if (category_id) list = list.filter((p) => p.category_id === Number(category_id))
  if (q) {
    const k = String(q).toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(k))
  }
  if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price)
  else if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price)
  else if (sort === 'sales') list = [...list].sort((a, b) => b.sold_count - a.sold_count)
  else if (sort === 'newest') list = [...list].sort((a, b) => b.id - a.id)
  const total = list.length
  const start = (page - 1) * per_page
  const items = list.slice(start, start + Number(per_page))
  return ok({ items, total }, 'success', { page: Number(page), per_page: Number(per_page), total, pages: Math.ceil(total / per_page) })
}

export async function getProduct(id) {
  await delay(150)
  const p = products.find((x) => x.id === Number(id))
  if (!p) return fail(404, '商品不存在')
  return ok(p)
}

export async function getCategories() { return ok(categories) }

export async function login(payload) {
  await delay(200)
  const { email, password } = payload
  const u = USERS[email]
  if (!u || u.password !== password) return { code: 401, msg: '用户名或密码错误' }
  MOCK_USER = { id: u.id, username: u.username, nickname: u.nickname, phone: u.phone }
  return ok({ access_token: 'mock-access-' + Date.now(), refresh_token: 'mock-refresh-' + Date.now(), user: MOCK_USER })
}

export async function register(payload) {
  await delay(200)
  const { name, email, password, phone } = payload
  if (!email || !password) return { code: 400, msg: '用户名或密码不能为空' }
  USERS[email] = { id: Object.keys(USERS).length + 100, username: email, email, password, nickname: name || email, phone: phone || '' }
  MOCK_USER = { ...USERS[email] }
  return ok({ access_token: 'mock-access-' + Date.now(), refresh_token: 'mock-refresh-' + Date.now(), user: MOCK_USER }, '注册成功')
}

export async function getProfile() {
  if (!MOCK_USER) return { code: 401, msg: '未登录' }
  return ok(MOCK_USER)
}

export async function getAddresses() { return ok(ADDRESSES) }

export async function createOrder(payload) {
  await delay(400)
  const oid = 'YZ' + Date.now().toString().slice(-8)
  return ok({ id: oid, order_no: oid, status: 'unpaid', ...payload }, '下单成功')
}

export const mockImg = IMG

export async function merchantLogin(payload) {
  await delay(200)
  const u = MERCHANTS[payload.account]
  if (!u || u.password !== payload.password) return { code: 401, msg: '账号或密码错误' }
  MOCK_USER = { id: u.id, username: u.account, nickname: u.nickname, role: u.role, phone: u.phone }
  return ok({ access_token: 'mock-mch-' + Date.now(), refresh_token: 'mock-mch-r-' + Date.now(), user: MOCK_USER })
}

export async function adminLogin(payload) {
  await delay(200)
  const u = ADMINS[payload.account]
  if (!u || u.password !== payload.password) return { code: 401, msg: '账号或密码错误' }
  MOCK_USER = { id: u.id, username: u.account, nickname: u.nickname, role: u.role }
 return ok({ access_token: 'mock-adm-' + Date.now(), refresh_token: 'mock-adm-r-' + Date.now(), user: MOCK_USER })
}
/* ====== 商家工作台 mock ====== */
const MERCHANT_ID = 2
const merchantName = '云智购自营店'

// 商家相关订单（含本商家商品）
const merchantOrders = [
  { id: 9001, order_no: 'YZ202607130001', status: 'completed', total_amount: 6999, created_at: '2026-07-10 14:23', items: [{ name: '华为 Mate 60 Pro 旗舰卫星通信 12+512G', quantity: 1 }] },
  { id: 9002, order_no: 'YZ202607130002', status: 'paid', total_amount: 12998, created_at: '2026-07-11 09:08', items: [{ name: '华为 Mate 60 Pro 旗舰卫星通信 12+512G', quantity: 2 }] },
  { id: 9003, order_no: 'YZ202607130003', status: 'shipped', total_amount: 6499, created_at: '2026-07-11 18:42', items: [{ name: '小米14 Ultra 徕卡四摄 16+512G', quantity: 1 }] },
  { id: 9004, order_no: 'YZ202607130004', status: 'unpaid', total_amount: 9999, created_at: '2026-07-12 11:05', items: [{ name: 'Apple iPhone 15 Pro Max 256G 原色钛金属', quantity: 1 }] },
  { id: 9005, order_no: 'YZ202607130005', status: 'completed', total_amount: 2199, created_at: '2026-07-12 16:30', items: [{ name: 'realme GT5 Pro 骁龙8Gen3', quantity: 1 }] },
  { id: 9006, order_no: 'YZ202607130006', status: 'completed', total_amount: 749, created_at: '2026-07-12 20:11', items: [{ name: 'Nike Air Force 1 经典板鞋 男女款', quantity: 1 }] },
  { id: 9007, order_no: 'YZ202607130007', status: 'paid', total_amount: 1798, created_at: '2026-07-13 08:50', items: [{ name: 'Nike Air Force 1 经典板鞋 男女款', quantity: 2 }] },
  { id: 9008, order_no: 'YZ202607130008', status: 'cancelled', total_amount: 4599, created_at: '2026-07-13 10:22', items: [{ name: 'OPPO Find X7 天玑9300 16+512G', quantity: 1 }] },
]

export async function getMerchantProducts(params = {}) {
  await delay(160)
  const { q } = params
  let list = products.filter((p) => p.merchant_id === MERCHANT_ID)
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(String(q).toLowerCase()))
  return ok(list, 'success', { total: list.length })
}

export async function createMerchantProduct(p) {
  await delay(220)
  const id = products.length + 1000
  const cover = (p.images && p.images[0]) || IMG('new' + id)
  const np = {
    id, name: p.name, subtitle: p.subtitle || '', price: p.price,
    original_price: p.original_price || p.price, stock: Number(p.stock) || 0,
    sold_count: 0, view_count: 0, category_id: p.category_id || 1,
    merchant_id: MERCHANT_ID, merchant_name: merchantName,
    status: p.status === 'off' ? 'off' : 'active', primary_image: cover,
    images: (p.images && p.images.length) ? p.images : [cover],
    description: p.description || '', created_at: new Date().toISOString().slice(0, 10),
  }
  products.unshift(np)
  return ok(np, '上架成功')
}

export async function updateMerchantProduct(p) {
  await delay(200)
  const idx = products.findIndex((x) => x.id === Number(p.id))
  if (idx < 0) return fail(404, '商品不存在')
  products[idx] = { ...products[idx], ...p, id: products[idx].id, merchant_id: MERCHANT_ID }
  return ok(products[idx], '已更新')
}

export async function deleteMerchantProduct(id) {
  await delay(160)
  const idx = products.findIndex((x) => x.id === Number(id))
  if (idx < 0) return fail(404, '商品不存在')
  products.splice(idx, 1)
  return ok({ msg: '已删除' })
}

export async function toggleMerchantProduct(id) {
  await delay(120)
  const p = products.find((x) => x.id === Number(id))
  if (!p) return fail(404, '商品不存在')
  p.status = p.status === 'active' ? 'off' : 'active'
  return ok({ msg: '操作成功', status: p.status })
}

export async function getMerchantOrders() {
  await delay(160)
  return ok(merchantOrders, 'success', { total: merchantOrders.length })
}

export async function getMerchantStats() {
  await delay(140)
  const mine = products.filter((p) => p.merchant_id === MERCHANT_ID)
  const on_sale = mine.filter((p) => p.status === 'active').length
  const revenue = merchantOrders.filter((o) => o.status === 'completed').reduce((a, o) => a + o.total_amount, 0)
  return ok({ total_products: mine.length, on_sale, total_orders: merchantOrders.length, total_revenue: revenue })
}
/* ====== 管理员后台 mock ====== */
const MERCHANT_NAMES = {
  2: '云智购自营店', 11: '昊好数码专营', 12: '衣物家居馆',
  13: '环球美妆优选', 14: '活力运动旗舰店',
}

const platformUsers = [
  { id: 1, account: 'demo', nickname: '云智购用户', role: 'buyer', status: 'active', phone: '13800138000', created_at: '2026-05-20' },
  { id: 2, account: 'merchant@test.com', nickname: '云智购自营店', role: 'merchant', status: 'active', phone: '13900139000', created_at: '2026-04-01' },
  { id: 9, account: 'admin@yzhimall.com', nickname: '系统管理员', role: 'admin', status: 'active', phone: '18888888888', created_at: '2026-01-01' },
  { id: 101, account: 'linjie', nickname: '林杰', role: 'buyer', status: 'active', phone: '13511112222', created_at: '2026-03-12' },
  { id: 102, account: 'wangmin', nickname: '王敏', role: 'buyer', status: 'active', phone: '13622223333', created_at: '2026-04-25' },
  { id: 103, account: 'chenyu', nickname: '陈宇', role: 'buyer', status: 'locked', phone: '13733334444', created_at: '2026-06-02' },
  { id: 104, account: 'zhaolei', nickname: '赵蕾', role: 'buyer', status: 'active', phone: '13844445555', created_at: '2026-02-18' },
  { id: 105, account: 'sunhao', nickname: '孙浩', role: 'buyer', status: 'active', phone: '13955556666', created_at: '2026-06-30' },
  { id: 106, account: 'zhouqi', nickname: '周琪', role: 'buyer', status: 'active', phone: '13666667777', created_at: '2026-07-05' },
  { id: 201, account: 'mchaohao@yzhimall.com', nickname: '昊好数码专营', role: 'merchant', status: 'active', phone: '15900001111', created_at: '2026-03-01' },
  { id: 202, account: 'mcyiju@yzhimall.com', nickname: '衣物家居馆', role: 'merchant', status: 'active', phone: '15900002222', created_at: '2026-03-15' },
  { id: 203, account: 'mcbaobei@yzhimall.com', nickname: '宝贝玩具屋', role: 'merchant', status: 'locked', phone: '15900003333', created_at: '2026-05-08' },
]

const platformOrders = [
  { id: 9001, order_no: 'YZ202607130001', status: 'completed', total_amount: 6999, created_at: '2026-07-10 14:23', buyer: '云智购用户', merchant_name: '云智购自营店', items: [{ name: '华为 Mate 60 Pro 卫星通话 12+512G', quantity: 1 }] },
  { id: 9002, order_no: 'YZ202607130002', status: 'paid', total_amount: 12998, created_at: '2026-07-11 09:08', buyer: '林杰', merchant_name: '云智购自营店', items: [{ name: '华为 Mate 60 Pro 卫星通话 12+512G', quantity: 2 }] },
  { id: 9003, order_no: 'YZ202607130003', status: 'shipped', total_amount: 6499, created_at: '2026-07-11 18:42', buyer: '王敏', merchant_name: '云智购自营店', items: [{ name: '小米14 Ultra 徕卡四摄 16+512G', quantity: 1 }] },
  { id: 9004, order_no: 'YZ202607130004', status: 'unpaid', total_amount: 9999, created_at: '2026-07-12 11:05', buyer: '赵蕾', merchant_name: '云智购自营店', items: [{ name: 'Apple iPhone 15 Pro Max 256G', quantity: 1 }] },
  { id: 9005, order_no: 'YZ202607130005', status: 'completed', total_amount: 2199, created_at: '2026-07-12 16:30', buyer: '孙浩', merchant_name: '云智购自营店', items: [{ name: 'realme GT5 Pro 骁龙8Gen3', quantity: 1 }] },
  { id: 9006, order_no: 'YZ202607130006', status: 'completed', total_amount: 749, created_at: '2026-07-12 20:11', buyer: '周琪', merchant_name: '云智购自营店', items: [{ name: 'Nike Air Force 1 经典板鞋', quantity: 1 }] },
  { id: 9007, order_no: 'YZ202607130007', status: 'paid', total_amount: 1798, created_at: '2026-07-13 08:50', buyer: '林杰', merchant_name: '云智购自营店', items: [{ name: 'Nike Air Force 1 经典板鞋', quantity: 2 }] },
  { id: 9008, order_no: 'YZ202607130008', status: 'cancelled', total_amount: 4599, created_at: '2026-07-13 10:22', buyer: '陈宇', merchant_name: '云智购自营店', items: [{ name: 'OPPO Find X7 天玑9300 16+512G', quantity: 1 }] },
  { id: 9101, order_no: 'YZ202607120101', status: 'completed', total_amount: 5199, created_at: '2026-07-09 10:11', buyer: '林杰', merchant_name: '昊好数码专营', items: [{ name: '华为MateBook 14 触屏版', quantity: 1 }] },
  { id: 9102, order_no: 'YZ202607120102', status: 'shipped', total_amount: 599, created_at: '2026-07-09 15:33', buyer: '王敏', merchant_name: '昊好数码专营', items: [{ name: '罗技MX Master 3S 无线鼠标', quantity: 1 }] },
  { id: 9103, order_no: 'YZ202607120103', status: 'paid', total_amount: 8999, created_at: '2026-07-10 09:20', buyer: '赵蕾', merchant_name: '昊好数码专营', items: [{ name: '联想拯救者Y9000P RTX4060', quantity: 1 }] },
  { id: 9201, order_no: 'YZ202607110201', status: 'completed', total_amount: 258, created_at: '2026-07-08 20:05', buyer: '周琪', merchant_name: '衣物家居馆', items: [{ name: '回力帆布低帮鞋', quantity: 2 }] },
  { id: 9202, order_no: 'YZ202607110202', status: 'unpaid', total_amount: 129, created_at: '2026-07-12 13:40', buyer: '孙浩', merchant_name: '衣物家居馆', items: [{ name: '回力布鞋低帮', quantity: 1 }] },
  { id: 9301, order_no: 'YZ202607100301', status: 'completed', total_amount: 880, created_at: '2026-07-07 11:18', buyer: '王敏', merchant_name: '环球美妆优选', items: [{ name: '兰蔻小黑瓶精华肌底液50ml', quantity: 1 }] },
  { id: 9302, order_no: 'YZ202607100302', status: 'paid', total_amount: 1040, created_at: '2026-07-11 19:25', buyer: '赵蕾', merchant_name: '环球美妆优选', items: [{ name: '雅诗兰黛沁水粉底液30ml', quantity: 2 }] },
  { id: 9401, order_no: 'YZ202607090401', status: 'shipped', total_amount: 278, created_at: '2026-07-09 08:10', buyer: '林杰', merchant_name: '活力运动旗舰店', items: [{ name: '安德踏减震跑步鞋', quantity: 2 }] },
]

export async function getAdminStats() {
  await delay(140)
  const buyers = platformUsers.filter((u) => u.role === 'buyer').length
  const merchants = platformUsers.filter((u) => u.role === 'merchant').length
  const on_sale = products.filter((p) => p.status === 'active').length
  const status = {}
  platformOrders.forEach((o) => { status[o.status] = (status[o.status] || 0) + 1 })
  const paidStates = ['paid', 'shipped', 'completed']
  const gmv = platformOrders.filter((o) => paidStates.includes(o.status)).reduce((a, o) => a + o.total_amount, 0)
  const completed = platformOrders.filter((o) => o.status === 'completed').reduce((a, o) => a + o.total_amount, 0)
  return ok({
    total_users: platformUsers.length, buyers, merchants,
    total_products: products.length, on_sale,
    total_orders: platformOrders.length, gmv, completed_revenue: completed, status,
    today_orders: platformOrders.filter((o) => String(o.created_at).startsWith('2026-07-13')).length,
  })
}

export async function getAdminUsers(params = {}) {
  await delay(160)
  const { q, role } = params
  let list = platformUsers.slice()
  if (role && role !== 'all') list = list.filter((u) => u.role === role)
  if (q) {
    const k = String(q).toLowerCase()
    list = list.filter((u) => u.account.toLowerCase().includes(k) || u.nickname.toLowerCase().includes(k))
  }
  list = list.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  return ok({ items: list, total: list.length })
}

export async function toggleUserStatus(id) {
  await delay(120)
  const u = platformUsers.find((x) => x.id === Number(id))
  if (!u) return fail(404, '用户不存在')
  u.status = u.status === 'active' ? 'locked' : 'active'
  return ok({ msg: '操作成功', status: u.status })
}

export async function setUserRole(id, role) {
  await delay(120)
  const u = platformUsers.find((x) => x.id === Number(id))
  if (!u) return fail(404, '用户不存在')
  u.role = role
  return ok({ msg: '角色已更新', role })
}

export async function getAdminOrders(params = {}) {
  await delay(160)
  const { q, status } = params
  let list = platformOrders.slice()
  if (status && status !== 'all') list = list.filter((o) => o.status === status)
  if (q) {
    const k = String(q).toLowerCase()
    list = list.filter((o) => o.order_no.toLowerCase().includes(k) || o.buyer.toLowerCase().includes(k))
  }
  list = list.sort((a, b) => b.id - a.id)
  return ok({ items: list, total: list.length })
}

export async function getAdminProducts(params = {}) {
  await delay(160)
  const { q, status } = params
  let list = products.map((p) => ({ ...p, merchant_name: MERCHANT_NAMES[p.merchant_id] || p.merchant_name || '云智购自营店' }))
  if (status && status !== 'all') list = list.filter((p) => p.status === status)
  if (q) {
    const k = String(q).toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(k))
  }
  return ok({ items: list, total: list.length })
}

export async function toggleAdminProduct(id) {
  await delay(120)
  const p = products.find((x) => x.id === Number(id))
  if (p) p.status = p.status === 'active' ? 'off' : 'active'
  return p ? ok({ msg: '操作成功', status: p.status }) : fail(404, '商品不存在')
}
