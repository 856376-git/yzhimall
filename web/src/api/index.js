import http from '../lib/http'
import * as mock from './mock'

// VITE_USE_MOCK 默认 true:无需后端即可完整预览;改为 false 则走真实 Flask 接口
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export const useMock = () => USE_MOCK

// ====== 真实后端字段适配层 ======
// 后端用整数表示状态,前端/mock 用字符串约定,这里做双向转换,页面组件无需改动。
const PROD_STR = (n) => (n === 1 ? 'active' : 'off')        // 商品: 1=上架, 0/2=草稿/下架
const PROD_INT = (s) => (s === 'off' ? 2 : 1)
const ORDER_STR = (n) => (({ 10: 'unpaid', 20: 'paid', 30: 'shipped', 40: 'shipped', 50: 'completed', 60: 'cancelled', 70: 'cancelled', 80: 'cancelled' })[n] || n)
const num = (v) => (v == null ? v : Number(v))
// specs 后端是 JSON 字符串或 null,统一解析成 [{name,options[]}],否则详情页解读会崩
const normProduct = (p) => {
  if (!p) return p
  let specs = p.specs
  if (typeof specs === 'string') { try { specs = JSON.parse(specs) } catch { specs = [] } }
  if (!Array.isArray(specs)) specs = []
  return { ...p, status: PROD_STR(p.status), price: num(p.price), original_price: num(p.original_price), specs }
}
const normOrder = (o) => o && ({
  ...o, status: ORDER_STR(o.status), total_amount: num(o.total_amount),
  items: (o.items || []).map((it) => ({ ...it, name: it.name || it.product_name, quantity: it.quantity, price: num(it.price) })),
})
const normUser = (u) => {
  if (!u) return u
  const { password_hash, ...rest } = u
  return { ...rest, nickname: rest.nickname || rest.name, username: rest.username || rest.email }
}
const authRes = (r) => (r && r.data ? { ...r, data: { ...r.data, user: normUser(r.data.user) } } : r)

// 商品
export const ProductAPI = {
  list: (params) =>
    USE_MOCK ? mock.getProducts(params) : http.get('/products', { params }).then((r) => {
      const d = r.data
      const items = Array.isArray(d) ? d.map(normProduct) : ((d && d.items) ? d.items.map(normProduct) : [])
      return { ...r, data: { items } }
    }),
  detail: (id) =>
    USE_MOCK ? mock.getProduct(id) : http.get(`/products/${id}`).then((r) => ({ ...r, data: normProduct(r.data) })),
  categories: () => (USE_MOCK ? mock.getCategories() : http.get('/products/categories')),
}

// 认证
export const AuthAPI = {
  register: (p) => (USE_MOCK ? mock.register(p) : http.post('/auth/register', p)),
  login: (p) => (USE_MOCK ? mock.login(p) : http.post('/auth/login', p).then(authRes)),
  merchantLogin: (p) => (USE_MOCK ? mock.merchantLogin(p) : http.post('/auth/login/merchant', p).then(authRes)),
  adminLogin: (p) => (USE_MOCK ? mock.adminLogin(p) : http.post('/auth/login/admin', p).then(authRes)),
  logout: () => (USE_MOCK ? Promise.resolve({ code: 200, msg: 'success' }) : http.post('/auth/logout')),
}

// 用户资料 / 地址
// 后端地址用 consignee/address,前端/mock 用 name/detail;normAddress 做一次映射,页面无需感知差异。
const normAddress = (a) => a && ({ ...a, name: a.name || a.consignee, detail: a.detail || a.address })
export const UserAPI = {
  profile: () => (USE_MOCK ? mock.getProfile() : http.get('/user/profile')),
  addresses: () => (USE_MOCK ? mock.getAddresses() : http.get('/user/addresses').then((r) => ({ ...r, data: ((r.data || []).map(normAddress)) }))),
  addAddress: (p) => (USE_MOCK
    ? Promise.resolve({ code: 200, msg: 'success', data: { ...p, id: Date.now() } })
    : http.post('/user/addresses', {
        consignee: p.name || p.consignee,
        phone: p.phone,
        province: p.province,
        city: p.city,
        district: p.district,
        address: p.detail || p.address,
        is_default: !!p.is_default,
      }).then((r) => ({ ...r, data: normAddress(r.data) }))),
}

// 每日签到（连续签到积分,7天循环）
export const CheckInAPI = {
  status: () => (USE_MOCK ? Promise.resolve({ code: 200, msg: 'success', data: { checked_today: false, continuous_days: 0, total_points: 0, last_checkin: null, recent_records: [] } }) : http.get('/user/checkin/status')),
  checkin: () => (USE_MOCK ? Promise.resolve({ code: 200, msg: 'success', data: { check_date: 'mock', continuous_days: 1, reward_points: 10 } }) : http.post('/user/checkin')),
}

// 订单
// 后端 GET /orders 的 data 是数组,OrdersPage 读 data.items;这里统一拍平成 {items,total}。
// create/detail 用 normOrder 把后端整数状态转成前端字符串状态,与 mock 约定一致。
export const OrderAPI = {
  create: (p) => (USE_MOCK ? mock.createOrder(p) : http.post('/orders', p).then((r) => ({ ...r, data: normOrder(r.data) }))),
  list: (params) => (USE_MOCK
    ? Promise.resolve({ code: 200, msg: 'success', data: { items: [], total: 0 }, meta: { ...(params || {}), total: 0, pages: 0 } })
    : http.get('/orders', { params }).then((r) => {
        const d = r.data
        const items = Array.isArray(d) ? d.map(normOrder) : ((d && d.items) || []).map(normOrder)
        const total = (r.meta && r.meta.total != null) ? r.meta.total : items.length
        return { ...r, data: { items, total } }
      })),
  detail: (id) => (USE_MOCK ? Promise.resolve({ code: 200, msg: 'success', data: null }) : http.get(`/orders/${id}`).then((r) => ({ ...r, data: normOrder(r.data) }))),
  pay: (id) => (USE_MOCK ? Promise.resolve({ code: 200, msg: 'success' }) : http.post(`/orders/${id}`)),
  cancel: (id) => (USE_MOCK ? Promise.resolve({ code: 200, msg: 'success' }) : http.delete(`/orders/${id}`)),
}

// 模拟支付（沙箱）：创建支付会话、轮询状态、模拟回调、取消
export const PaymentAPI = {
  create: (order_id) => (USE_MOCK ? Promise.resolve({ code: 200, msg: 'success', data: { session_id: 'mock-' + Date.now(), order_id, order_no: '', amount: '0.01', qr_data: 'yzhimall://pay?session=mock', pay_url: '/payment', expire_seconds: 900 } }) : http.post('/payment/create', { order_id })),
  status: (session_id) => (USE_MOCK ? Promise.resolve({ code: 200, msg: 'success', data: { status: 'pending', paid: false } }) : http.get(`/payment/status/${session_id}`)),
  callback: (session_id) => (USE_MOCK ? Promise.resolve({ code: 200, msg: 'success' }) : http.post(`/payment/callback/${session_id}`)),
  cancel: (session_id) => (USE_MOCK ? Promise.resolve({ code: 200, msg: 'success' }) : http.post(`/payment/cancel/${session_id}`)),
}

// 商家工作台
export const MerchantAPI = {
  products: (params) => (USE_MOCK ? mock.getMerchantProducts(params) : http.get('/merchant/products', { params }).then((r) => ({ ...r, data: ((r.data || []).map(normProduct)) }))),
  createProduct: (p) => (USE_MOCK ? mock.createMerchantProduct(p) : http.post('/merchant/products', { ...p, status: PROD_INT(p.status) }).then((r) => ({ ...r, data: normProduct(r.data) }))),
  updateProduct: (id, p) => (USE_MOCK ? mock.updateMerchantProduct({ ...p, id }) : http.put(`/merchant/products/${id}`, { ...p, status: PROD_INT(p.status) }).then((r) => ({ ...r, data: normProduct(r.data) }))),
  deleteProduct: (id) => (USE_MOCK ? mock.deleteMerchantProduct(id) : http.delete(`/merchant/products/${id}`)),
  toggleProduct: (id) => (USE_MOCK ? mock.toggleMerchantProduct(id) : http.post(`/merchant/products/${id}/toggle`)),
  orders: (params) => (USE_MOCK ? mock.getMerchantOrders(params) : http.get('/merchant/orders', { params }).then((r) => ({ ...r, data: ((r.data || []).map(normOrder)) }))),
  stats: () => (USE_MOCK ? mock.getMerchantStats() : http.get('/merchant/stats').then((r) => ({ ...r, data: r.data && { ...r.data, total_revenue: num(r.data.total_revenue) } }))),
}

// 管理员后台
export const AdminAPI = {
  stats: () => (USE_MOCK ? mock.getAdminStats() : http.get('/admin/stats')),
  users: (params) => (USE_MOCK ? mock.getAdminUsers(params) : http.get('/admin/users', { params })),
  toggleUser: (id) => (USE_MOCK ? mock.toggleUserStatus(id) : http.post(`/admin/users/${id}/toggle`)),
  setRole: (id, role) => (USE_MOCK ? mock.setUserRole(id, role) : http.put(`/admin/users/${id}`, { role })),
  orders: (params) => (USE_MOCK ? mock.getAdminOrders(params) : http.get('/admin/orders', { params })),
  products: (params) => (USE_MOCK ? mock.getAdminProducts(params) : http.get('/admin/products', { params })),
  toggleProduct: (id) => (USE_MOCK ? mock.toggleAdminProduct(id) : http.post(`/admin/products/${id}/toggle`)),
}
