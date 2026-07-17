import { useEffect, useState } from 'react'
import { useUserStore } from '../store/useUserStore'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { ProductAPI, OrderAPI } from '../api'
import { useCartStore, selectCount } from '../store/useCartStore'





export default function MainLayout() {
  const nav = useNavigate()
  const loc = useLocation()
  const [kw, setKw] = useState('')
  const [cats, setCats] = useState([])
  const count = useCartStore(selectCount)
  const { user } = useUserStore()

  const [unpaid, setUnpaid] = useState(0)

  useEffect(() => {
    ProductAPI.categories().then((r) => setCats(r.data || [])).catch(() => {})
    const p = new URLSearchParams(loc.search)
    if (p.get('q')) setKw(p.get('q'))
  }, [loc.search])


  useEffect(() => {
    const refresh = () => {
      if (!user) return
      OrderAPI.list({ page: 1, per_page: 100 })
        .then((r) => setUnpaid(((r.data && r.data.items) || []).filter((o) => o.status === 'unpaid').length))
        .catch(() => {})
    }
    window.addEventListener('orders-changed', refresh)
    return () => window.removeEventListener('orders-changed', refresh)
  }, [user])
  useEffect(() => {
    if (!user) { setUnpaid(0); return }
    OrderAPI.list({ page: 1, per_page: 100 })
      .then((r) => {
        const its = (r.data && r.data.items) || []
        setUnpaid(its.filter((o) => o.status === 'unpaid').length)
      })
      .catch(() => {})
  }, [user, loc.pathname])
  const onSearch = (e) => {
    e.preventDefault()
    nav(`/products?q=${encodeURIComponent(kw.trim())}`)
  }

  const activeCat = new URLSearchParams(loc.search).get('category_id')

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>云智购 —— 让购物更简单</span>
          <div className="topbar-right">
            {user ? (
              <span>您好,{user.nickname || user.username}</span>
            ) : (
              <><Link to="/login">你好,请登录</Link><Link to="/login">免费注册</Link></>
            )}
            <Link to="/orders">我的订单{unpaid > 0 && <sup className="top-badge">{unpaid > 9 ? '9+' : unpaid}</sup>}</Link>
            <Link to="/checkin">每日签到</Link>
            <Link to="/cart">我的购物车</Link>
          </div>
        </div>
      </div>

      <header className="header">
        <div className="container">
          <Link className="brand" to="/">云智购<small>yzhimall</small></Link>
          <div className="search-wrap">
            <form className="search" onSubmit={onSearch}>
              <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="搜索商品" aria-label="搜索" />
              <button type="submit">搜索</button>
            </form>
            <div className="search-hot">
              {['手机', '空调', '运动鞋', '坚果', '笔记本'].map((h) => (
                <a key={h} onClick={() => nav(`/products?q=${h}`)}>{h}</a>
              ))}
            </div>
          </div>
          <div className="header-actions">
            <Link className="header-cart" to="/cart">
              <Icon name="cart" size={26} />
              <span>购物车</span>
              {count > 0 && <span className="cart-badge">{count > 99 ? '99+' : count}</span>}
            </Link>
            <Link className="header-user" to="/login">
              <Icon name="user" size={20} />
              {user ? (user.nickname || user.username) : '登录'}
            </Link>
          </div>
        </div>
      </header>

      <nav className="catnav">
        <div className="container">
          <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>首页</Link>
          {cats.slice(0, 8).map((c) => (
            <Link key={c.id} to={`/products?category_id=${c.id}`}
              className={String(activeCat) === String(c.id) ? 'active' : ''}>{c.name}</Link>
          ))}
        </div>
      </nav>

      <main className="main-wrap-host">
        <aside className="side-col side-l">
          <div className="side-card" onClick={() => nav('/checkin')}><Icon name="star" size={22} /><div><b>每日签到</b><span>连签领积分</span></div></div>
          <div className="side-card" onClick={() => nav('/products?sort=sales')}><Icon name="price" size={22} /><div><b>限时秒杀</b><span>今日特价</span></div></div>
          <div className="side-card" onClick={() => nav('/products')}><Icon name="heart" size={22} /><div><b>领券中心</b><span>满99减20</span></div></div>
        </aside>
        <div className="main-col"><Outlet /></div>
        <aside className="side-col side-r">
          <div className="side-card" onClick={() => nav('/orders')}><Icon name="box" size={22} /><div><b>我的订单</b><span>查物流 / 去支付</span></div></div>
          <div className="side-card" onClick={() => nav('/cart')}><Icon name="cart" size={22} /><div><b>购物车</b><span>凑单更划算</span></div></div>
          <div className="side-card" onClick={() => nav('/products')}><Icon name="shield" size={22} /><div><b>售后保障</b><span>七天无理由</span></div></div>
        </aside>
      </main>

      <footer className="footer">
        <div className="footer-top">
          <div className="item"><Icon name="price" size={26} /><span>正品低价</span></div>
          <div className="item"><Icon name="truck" size={26} /><span>极速配送</span></div>
          <div className="item"><Icon name="return" size={26} /><span>七天无理由</span></div>
          <div className="item"><Icon name="shield" size={26} /><span>售后保障</span></div>
        </div>
        <div className="footer-bottom">
          <p>云智购 yzhimall —— 让购物更简单</p>
          <p>© 2026 云智购商城  前后端分离示例项目 · React + Vite + Flask</p>
        </div>
      </footer>
    </>
  )
}
