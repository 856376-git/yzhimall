import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import Icon from '../components/Icon'

const NAV = [
  { to: '/admin/dashboard', label: '平台概览', icon: 'grid' },
  { to: '/admin/orders', label: '订单管理', icon: 'truck' },
  { to: '/admin/users', label: '用户管理', icon: 'user' },
  { to: '/admin/products', label: '商品管理', icon: 'box' },
]

export default function AdminLayout() {
  const nav = useNavigate()
  const { user, logout } = useUserStore()

  // 未登录或非管理员 → 回后台登录
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />

  const onLogout = async () => {
    await logout()
    nav('/admin/login')
  }

  return (
    <div className="adm-wrap">
      <aside className="adm-side">
        <div className="adm-brand"><Icon name="shield" size={22} /><span>云智购 · 管理后台</span></div>
        <nav className="adm-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="adm-nav-item">
              <Icon name={n.icon} size={18} /><span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="adm-side-foot">
          <div className="adm-me">
            <Icon name="user" size={18} />
            <div className="adm-me-txt">
              <div className="adm-me-name">{user.nickname || user.username}</div>
              <div className="adm-me-role">超级管理员</div>
            </div>
          </div>
          <button className="adm-link" onClick={onLogout}>退出登录</button>
          <button className="adm-link" onClick={() => nav('/')}>返回商城前台</button>
        </div>
      </aside>
      <main className="adm-main"><Outlet /></main>
    </div>
  )
}
