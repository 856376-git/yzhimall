import { create } from 'zustand'
import { AuthAPI } from '../api'
import { tokenStorage, refreshStorage } from '../lib/http'

const USER_KEY = 'yz_user'
const loadUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

function applyAuth(d, set) {
  if (!d) return
  tokenStorage.set(d.access_token)
  refreshStorage.set(d.refresh_token)
  localStorage.setItem(USER_KEY, JSON.stringify(d.user))
  set({ token: d.access_token, user: d.user })
}

export const useUserStore = create((set, get) => ({
  token: tokenStorage.get() || '',
  user: loadUser(),

  login: async (payload) => {
    const res = await AuthAPI.login(payload)
    if (res.code !== 200) throw new Error(res.msg || '登录失败')
    const d = res.data || {}
    tokenStorage.set(d.access_token)
    refreshStorage.set(d.refresh_token)
    localStorage.setItem(USER_KEY, JSON.stringify(d.user))
    set({ token: d.access_token, user: d.user })
    return d.user
  },

  register: async (payload) => {
    const res = await AuthAPI.register(payload)
    if (res.code !== 200 && res.code !== 201) throw new Error(res.msg || '注册失败')
    const d = res.data || {}
    if (d.access_token) {
      tokenStorage.set(d.access_token)
      refreshStorage.set(d.refresh_token)
      localStorage.setItem(USER_KEY, JSON.stringify(d.user))
      set({ token: d.access_token, user: d.user })
    }
    return d.user
  },

  merchantLogin: async (payload) => {
    const res = await AuthAPI.merchantLogin(payload)
    if (res.code !== 200) throw new Error(res.msg || '登录失败')
    applyAuth(res.data || {}, set)
    return (res.data || {}).user
  },

  adminLogin: async (payload) => {
    const res = await AuthAPI.adminLogin(payload)
    if (res.code !== 200) throw new Error(res.msg || '登录失败')
    applyAuth(res.data || {}, set)
    return (res.data || {}).user
  },

  logout: async () => {
    try { await AuthAPI.logout() } catch {}
    tokenStorage.clear()
    refreshStorage.clear()
    localStorage.removeItem(USER_KEY)
    set({ token: '', user: null })
  },

  get isLogin() {
    return !!get().token
  },
}))
