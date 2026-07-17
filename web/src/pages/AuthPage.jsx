import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useUserStore } from '../store/useUserStore'
import { toast } from '../store/useToastStore'

export default function AuthPage() {
  const nav = useNavigate()
  const { login, register } = useUserStore()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', phone: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErr('') }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (tab === 'login') {
      if (!form.email || !form.password) { setErr('请输入邮箱和密码'); return }
    } else {
      if (!form.username || !form.email || !form.password) { setErr('请输入用户名、邮箱和密码'); return }
    }
    if (tab === 'register') {
      if (form.password !== form.confirm) { setErr('两次密码不一致'); return }
      if (form.password.length < 6) { setErr('密码至少6位'); return }
    }
    setBusy(true)
    try {
      if (tab === 'login') {
        await login({ email: form.email, password: form.password })
        toast('登录成功', 'success')
      } else {
        await register({
          name: form.username,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role: 'buyer',
        })
        toast('注册成功，已自动登录', 'success')
      }
      nav('/')
    } catch (e2) {
      setErr(e2.message || '操作失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <h1>云智购</h1>
        <p className="sub">让购物更简单</p>
        <div className="auth-tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>登录</button>
          <button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>注册</button>
        </div>

        <form onSubmit={submit}>
          {tab === 'register' && (
            <div className="field">
              <label>用户名</label>
              <div className="inp"><Icon name="user" size={18} /><input value={form.username} onChange={set('username')} placeholder="请输入用户名" /></div>
            </div>
          )}
          <div className="field">
            <label>邮箱</label>
            <div className="inp"><Icon name="mail" size={18} /><input value={form.email} onChange={set('email')} placeholder="请输入邮箱" /></div>
          </div>
          <div className="field">
            <label>密码</label>
            <div className="inp"><Icon name="shield" size={18} /><input type="password" value={form.password} onChange={set('password')} placeholder="请输入密码" /></div>
          </div>
          {tab === 'register' && (
            <>
              <div className="field">
                <label>确认密码</label>
                <div className="inp"><Icon name="shield" size={18} /><input type="password" value={form.confirm} onChange={set('confirm')} placeholder="再次输入密码" /></div>
              </div>
              <div className="field">
                <label>手机号(选填)</label>
                <div className="inp"><Icon name="phone" size={18} /><input value={form.phone} onChange={set('phone')} placeholder="选填" /></div>
              </div>
            </>
          )}

          {err && <div className="err-tip">{err}</div>}

          <button type="submit" className="btn btn-lg block" disabled={busy}>{busy ? '处理中...' : (tab === 'login' ? '登录' : '注册')}</button>
        </form>

        {tab === 'login' && (
          <div className="auth-foot">演示账号：buyer@test.com / 123456</div>
        )}
        <div className="auth-foot">
          <Link to="/">返回首页</Link>
        </div>

        {tab === 'login' && (
          <div className="auth-role-list">
            <Link to="/merchant/login" className="auth-role-item"><Icon name="box" size={18} /><span>商家登录</span><Icon name="chevron-right" size={16} /></Link>
            <Link to="/admin/login" className="auth-role-item auth-role-admin"><Icon name="shield" size={18} /><span>管理员后台</span><Icon name="chevron-right" size={16} /></Link>
          </div>
        )}
      </div>
    </div>
  )
}