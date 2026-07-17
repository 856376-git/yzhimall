import { useEffect, useState, useMemo } from 'react'
import Icon from '../components/Icon'
import { AdminAPI } from '../api'

const ORDER_STATUS = { unpaid: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
const orderTone = (s) => (s === 'completed' ? 'g' : s === 'paid' || s === 'shipped' ? 'b' : s === 'unpaid' ? 'o' : 'm')
const TABS = [
  { k: 'all', label: '全部' },
  { k: 'unpaid', label: '待付款' },
  { k: 'paid', label: '已付款' },
  { k: 'shipped', label: '已发货' },
  { k: 'completed', label: '已完成' },
  { k: 'cancelled', label: '已取消' },
]

export default function AdminOrders() {
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    AdminAPI.orders({ status: 'all' }).then((r) => setAll((r.data && r.data.items) || [])).finally(() => setLoading(false))
  }, [])

  const list = useMemo(() => {
    let l = all
    if (tab !== 'all') l = l.filter((o) => o.status === tab)
    if (q.trim()) {
      const k = q.trim().toLowerCase()
      l = l.filter((o) => o.order_no.toLowerCase().includes(k) || o.buyer.toLowerCase().includes(k))
    }
    return l
  }, [all, tab, q])

  return (
    <div className="mch-page adm-page">
      <div className="mch-bar"><h2>订单管理</h2><span className="mch-count">共 {list.length} 笔</span></div>

      <div className="mch-tabs">
        {TABS.map((t) => (
          <button key={t.k} className={`mch-tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}>{t.label}</button>
        ))}
      </div>

      <div className="mch-toolbar">
        <div className="mch-search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索订单号 / 买家" />
        </div>
      </div>

      {loading ? (
        <div className="mch-loading">加载中...</div>
      ) : list.length === 0 ? (
        <div className="mch-empty-big"><Icon name="truck" size={40} /><div className="mt-12">暂无订单</div></div>
      ) : (
        <div className="mch-table-wrap">
          <table className="mch-table mch-table-full">
            <thead><tr><th>订单号</th><th>买家</th><th>商家</th><th>商品</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
            <tbody>
              {list.map((o) => {
                const qty = o.items.reduce((a, i) => a + i.quantity, 0)
                return (
                  <tr key={o.id}>
                    <td className="mono">{o.order_no}</td>
                    <td>{o.buyer}</td>
                    <td className="muted">{o.merchant_name}</td>
                    <td>
                      <div className="mch-prod-meta">
                        <span className="mch-prod-name" style={{ maxWidth: 220 }}>{o.items[0] && o.items[0].name}</span>
                        <span className="muted">共 {qty} 件{o.items.length > 1 ? '（多商品）' : ''}</span>
                      </div>
                    </td>
                    <td className="price">¥{Number(o.total_amount).toLocaleString()}</td>
                    <td><span className={`badge badge-${orderTone(o.status)}`}>{ORDER_STATUS[o.status]}</span></td>
                    <td className="muted">{o.created_at}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
