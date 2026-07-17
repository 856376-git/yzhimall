import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { AdminAPI } from '../api'

const ORDER_STATUS = { unpaid: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
const orderTone = (s) => (s === 'completed' ? 'g' : s === 'paid' || s === 'shipped' ? 'b' : s === 'unpaid' ? 'o' : 'm')
const ROLE_LABEL = { buyer: '买家', merchant: '商家', admin: '管理员' }
const roleTone = (r) => (r === 'merchant' ? 'b' : r === 'admin' ? 'g' : 'm')

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([AdminAPI.stats(), AdminAPI.orders({ status: 'all' }), AdminAPI.users({ role: 'all' })])
      .then(([s, o, u]) => {
        setStats(s.data || null)
        setOrders(((o.data && o.data.items) || []).slice(0, 6))
        setUsers(((u.data && u.data.items) || []).slice(0, 6))
      })
      .finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { label: '注册用户', value: stats.total_users ?? 0, icon: 'user', tone: 'teal' },
    { label: '入驻商家', value: stats.merchants ?? 0, icon: 'box', tone: 'orange' },
    { label: '在售商品', value: stats.on_sale ?? 0, icon: 'grid', tone: 'blue' },
    { label: '平台GMV', value: '¥' + Number(stats.gmv || 0).toLocaleString(), icon: 'price', tone: 'green' },
  ] : []

  const statusRows = stats && stats.status
    ? ['paid', 'shipped', 'completed', 'unpaid', 'cancelled'].map((k) => ({ k, label: ORDER_STATUS[k], count: stats.status[k] || 0, tone: orderTone(k) }))
    : []

  return (
    <div className="mch-page adm-page">
      <div className="mch-bar">
        <h2>平台概览</h2>
        <Link className="btn ghost sm" to="/admin/orders"><Icon name="truck" size={16} />查看全部订单</Link>
      </div>

      {loading ? (
        <div className="mch-loading">加载中...</div>
      ) : (
        <>
          <div className="mch-stats">
            {cards.map((c) => (
              <div className={`mch-stat adm-stat adm-stat-${c.tone}`} key={c.label}>
                <div className="mch-stat-ic"><Icon name={c.icon} size={22} /></div>
                <div className="mch-stat-bd">
                  <div className="mch-stat-val">{c.value}</div>
                  <div className="mch-stat-lab">{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mch-panels">
            <div className="mch-panel">
              <div className="mch-panel-head"><h3>订单状态分布</h3><Link to="/admin/orders" className="mch-more">订单管理 <Icon name="chevron-right" size={14} /></Link></div>
              <div className="adm-status">
                {statusRows.map((r) => (
                  <div className="adm-status-row" key={r.k}>
                    <span className={`badge badge-${r.tone}`}>{r.label}</span>
                    <span className="adm-status-num">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mch-panel">
              <div className="mch-panel-head"><h3>最新入驻用户</h3><Link to="/admin/users" className="mch-more">用户管理 <Icon name="chevron-right" size={14} /></Link></div>
              <table className="mch-table">
                <thead><tr><th>用户</th><th>角色</th><th>状态</th><th>注册时间</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="adm-user-cell">
                          <span className="adm-user-name">{u.nickname}</span>
                          <span className="muted mono">{u.account}</span>
                        </div>
                      </td>
                      <td><span className={`badge badge-${roleTone(u.role)}`}>{ROLE_LABEL[u.role]}</span></td>
                      <td><span className={`badge badge-${u.status === 'active' ? 'g' : 'm'}`}>{u.status === 'active' ? '正常' : '已锁定'}</span></td>
                      <td className="muted">{u.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mch-panel adm-panel-full">
            <div className="mch-panel-head"><h3>最近订单</h3><Link to="/admin/orders" className="mch-more">查看全部 <Icon name="chevron-right" size={14} /></Link></div>
            <table className="mch-table">
              <thead><tr><th>订单号</th><th>买家</th><th>商家</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">{o.order_no}</td>
                    <td>{o.buyer}</td>
                    <td className="muted">{o.merchant_name}</td>
                    <td className="price">¥{Number(o.total_amount).toLocaleString()}</td>
                    <td><span className={`badge badge-${orderTone(o.status)}`}>{ORDER_STATUS[o.status]}</span></td>
                    <td className="muted">{o.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
