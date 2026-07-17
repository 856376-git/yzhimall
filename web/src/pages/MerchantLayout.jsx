import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import Icon from '../components/Icon'

const NAV = [
  { to: '/merchant/dashboard', label: '概览', icon: 'grid' },
  { to: '/merchant/products', label: '商品管理', icon: 'box' },
  { to: '/merchant/orders', label: '我的订单', icon: 'truck' },
]

export default function MerchantLayout() {
  const nav = useNavigate()
  const { user, logout } = useUserStore()

  // 未登录或非商家 → 回商家登录
  if (!user || user.role !== 'merchant') return <Navigate to="/merchant/login" replace />

  const onLogout = async () => {
    await logout()
    nav('/merchant/login')
  }

  return (
    <div className="mch-wrap">
      <aside className="mch-side">
        <div className="mch-brand"><Icon name="box" size={22} /><span>云智购 · 商家工作台</span></div>
        <nav className="mch-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="mch-nav-item">
              <Icon name={n.icon} size={18} /><span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mch-side-foot">
          <div className="mch-me">
            <Icon name="user" size={18} />
            <div className="mch-me-txt">
              <div className="mch-me-name">{user.nickname || user.username}</div>
              <div className="mch-me-role">商家</div>
            </div>
          </div>
          <button className="mch-link" onClick={onLogout}>退出登录</button>
          <button className="mch-link" onClick={() => nav('/')}>返回商城前台</button>
        </div>
      </aside>
      <main className="mch-main"><Outlet /></main>
    </div>
  )
}
