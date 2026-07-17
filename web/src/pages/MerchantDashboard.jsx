import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { MerchantAPI } from '../api'

const STATUS = { active: { t: '在售', c: 'g' }, off: { t: '已下架', c: 'm' } }
const ORDER_STATUS = { unpaid: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
const orderTone = (s) => (s === 'completed' ? 'g' : s === 'paid' || s === 'shipped' ? 'b' : s === 'unpaid' ? 'o' : 'm')

export default function MerchantDashboard() {
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([MerchantAPI.stats(), MerchantAPI.products({ page: 1, per_page: 5 }), MerchantAPI.orders({ page: 1, per_page: 5 })])
      .then(([s, p, o]) => {
        setStats(s.data || null)
        setProducts((p.data && p.data.items) || p.data || [])
        setOrders((o.data && o.data.items) || o.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { label: '在售商品', value: stats.on_sale ?? 0, icon: 'box', tone: 'blue' },
    { label: '全部商品', value: stats.total_products ?? 0, icon: 'grid', tone: 'purple' },
    { label: '相关订单', value: stats.total_orders ?? 0, icon: 'truck', tone: 'orange' },
    { label: '预计收入', value: '¥' + Number(stats.total_revenue || 0).toLocaleString(), icon: 'price', tone: 'green' },
  ] : []

  return (
    <div className="mch-page">
      <div className="mch-bar">
        <h2>概览</h2>
        <Link className="btn ghost sm" to="/merchant/products"><Icon name="plus" size={16} />上架新商品</Link>
      </div>

      {loading ? (
        <div className="mch-loading">加载中...</div>
      ) : (
        <>
          <div className="mch-stats">
            {cards.map((c) => (
              <div className={`mch-stat mch-stat-${c.tone}`} key={c.label}>
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
              <div className="mch-panel-head"><h3>最近商品</h3><Link to="/merchant/products" className="mch-more">管理全部 <Icon name="chevron-right" size={14} /></Link></div>
              {products.length === 0 ? (
                <div className="mch-empty"><Icon name="box" size={40} /><div className="mt-12">暂无商品</div></div>
              ) : (
                <table className="mch-table">
                  <thead><tr><th>商品</th><th>价格</th><th>库存</th><th>状态</th></tr></thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="mch-cell-prod">
                          <img src={p.primary_image || (p.images && p.images[0])} alt="" />
                          <span className="mch-prod-name">{p.name}</span>
                        </td>
                        <td className="price">¥{p.price}</td>
                        <td>{p.stock}</td>
                        <td><span className={`badge badge-${(STATUS[p.status] || STATUS.active).c}`}>{(STATUS[p.status] || STATUS.active).t}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mch-panel">
              <div className="mch-panel-head"><h3>最近订单</h3><Link to="/merchant/orders" className="mch-more">查看全部 <Icon name="chevron-right" size={14} /></Link></div>
              {orders.length === 0 ? (
                <div className="mch-empty"><Icon name="truck" size={40} /><div className="mt-12">暂无订单</div></div>
              ) : (
                <table className="mch-table">
                  <thead><tr><th>订单号</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="mono">{o.order_no}</td>
                        <td className="price">¥{o.total_amount}</td>
                        <td><span className={`badge badge-${orderTone(o.status)}`}>{ORDER_STATUS[o.status] || o.status}</span></td>
                        <td className="muted">{o.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
