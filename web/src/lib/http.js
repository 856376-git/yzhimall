import axios from 'axios'

// 统一响应格式:后端返回 { code, msg, data, meta }
// 业务层只关心 data/meta,错误以 reject 抛出(Error 带 code/msg)

export const tokenStorage = {
  get: () => localStorage.getItem('yz_access_token'),
  set: (t) => localStorage.setItem('yz_access_token', t || ''),
  clear: () => localStorage.removeItem('yz_access_token'),
}
export const refreshStorage = {
  get: () => localStorage.getItem('yz_refresh_token'),
  set: (t) => localStorage.setItem('yz_refresh_token', t || ''),
  clear: () => localStorage.removeItem('yz_refresh_token'),
}

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// 请求拦截:自动带上 JWT,并补一个幂等键
http.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (!config.headers['X-Idempotent-Key']) {
    config.headers['X-Idempotent-Key'] = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
  return config
})

let refreshing = false
let waiters = []

function onLogout() {
  tokenStorage.clear()
  refreshStorage.clear()
  window.dispatchEvent(new CustomEvent('auth-expired'))
}

// 响应拦截:解开 { code, msg, data, meta },并对 401 做一次 refresh
http.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code >= 200 && res.code < 300) return res
      const err = new Error(res.msg || '请求失败')
      err.code = res.code
      err.biz = true
      return Promise.reject(err)
    }
    return res
  },
  async (error) => {
    const original = error.config || {}
    const status = error.response?.status
    const body = error.response?.data

    if (status === 401 && !original._retry && refreshStorage.get()) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          waiters.push({ resolve, reject })
        }).then((t) => {
          original.headers.Authorization = `Bearer ${t}`
          return http(original)
        })
      }
      original._retry = true
      refreshing = true
      try {
        const r = await axios.post(
          '/api/auth/refresh',
          {},
          { headers: { Authorization: `Bearer ${refreshStorage.get()}` } },
        )
        const d = (r.data && r.data.data) || {}
        const access = d.access_token || d.token
        if (access) {
          tokenStorage.set(access)
          if (d.refresh_token) refreshStorage.set(d.refresh_token)
          waiters.forEach((w) => w.resolve(access))
          waiters = []
          original.headers.Authorization = `Bearer ${access}`
          return http(original)
        }
        throw new Error('refresh failed')
      } catch (e) {
        waiters.forEach((w) => w.reject(e))
        waiters = []
        onLogout()
        return Promise.reject(e)
      } finally {
        refreshing = false
      }
    }

    if (body && typeof body === 'object' && 'code' in body) {
      const err = new Error(body.msg || '请求失败')
      err.code = body.code
      err.status = status
      err.biz = true
      return Promise.reject(err)
    }
    if (status === 401 || status === 403) onLogout()
    // 后端返回了非标准信封的真实 HTTP 错误(如 Flask 500 traceback 页 / 网关错误),给出可读提示
    let msg = error.message || '网络异常'
    if (status === 500) {
      if (typeof body === 'string' && body.includes('<')) {
        const m = body.match(/<title>(.*?)<\/title>/i)
        msg = '服务器内部错误(500),' + (m ? m[1].replace(/\s+/g, ' ').slice(0, 80) : '后端可能正在重启或抛异常,请稍后重试')
      } else if (body && typeof body === 'object') {
        msg = '服务器内部错误(500),' + (body.message || body.error || '后端抛异常,请稍后重试')
      } else {
        msg = '服务器内部错误(500),后端可能正在重启,请稍后重试'
      }
    } else if (status === 502 || status === 503 || status === 504) {
      msg = '后端服务不可用(' + status + '),可能未启动或正在重启'
    } else if (!status) {
      msg = '网络连接失败,请检查后端是否启动(:5000)'
    }
    const err = new Error(msg)
    err.status = status
    return Promise.reject(err)
  },
)

export default http
