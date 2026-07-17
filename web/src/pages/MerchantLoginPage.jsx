import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useUserStore } from '../store/useUserStore'
import { toast } from '../store/useToastStore'

export default function MerchantLoginPage() {
  const nav = useNavigate()
  const { merchantLogin } = useUserStore()
  const [form, setForm] = useState({ account: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErr('') }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.account || !form.password) { setErr('请输入账号和密码'); return }
    setBusy(true)
    try {
      const u = await merchantLogin({ account: form.account, password: form.password })
      toast(`欢迎回来，${u.nickname || u.username || ''}`, 'success')
      nav('/merchant/dashboard')
   } catch (e2) {
      setErr(e2.message || '登录失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth auth-merchant">
      <div className="auth-card">
        <div className="mch-accent" />
        <div className="auth-inner">
          <h1>商家工作台</h1>
          <p className="sub">邮箱或手机号登录</p>
          <form onSubmit={submit}>
            <div className="field">
              <label>账号</label>
              <div className="inp"><Icon name="user" size={18} /><input value={form.account} onChange={set('account')} placeholder="邮箱或手机号" /></div>
            </div>
            <div className="field">
              <label>密码</label>
              <div className="inp"><Icon name="lock" size={18} /><input type="password" value={form.password} onChange={set('password')} placeholder="请输入密码" /></div>
            </div>
            {err && <div className="err-tip">{err}</div>}
            <button type="submit" className="btn btn-lg block" disabled={busy}>{busy ? '处理中...' : '登录'}</button>
          </form>
          <div className="auth-foot">演示账号：merchant@test.com / 123456</div>
          <div className="auth-foot"><Link to="/login">买家登录</Link> · <Link to="/admin/login">管理员后台</Link> · <Link to="/">返回首页</Link></div>
        </div>
      </div>
    </div>
  )
}
