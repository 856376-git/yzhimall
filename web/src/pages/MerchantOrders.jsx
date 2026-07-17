import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { MerchantAPI } from '../api'

const ORDER_STATUS = { unpaid: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
const tone = (s) => (s === 'completed' ? 'g' : s === 'paid' || s === 'shipped' ? 'b' : s === 'unpaid' ? 'o' : 'm')

export default function MerchantOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [stat, setStat] = useState('all')

  useEffect(() => {
    setLoading(true)
    MerchantAPI.orders({ page: 1, per_page: 50 })
      .then((r) => setOrders((r.data && r.data.items) || r.data || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = stat === 'all' ? orders : orders.filter((o) => o.status === stat)
  const tabs = [['all', '全部'], ['unpaid', '待付款'], ['paid', '已付款'], ['shipped', '已发货'], ['completed', '已完成'], ['cancelled', '已取消']]

  return (
    <div className="mch-page">
      <div className="mch-bar"><h2>我的订单</h2></div>

      <div className="mch-tabs">
        {tabs.map(([k, t]) => (
          <button key={k} className={`mch-tab ${stat === k ? 'active' : ''}`} onClick={() => setStat(k)}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="mch-loading">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="mch-empty-big"><Icon name="truck" size={56} /><div className="mt-12">暂无相关订单</div></div>
      ) : (
        <div className="mch-table-wrap">
          <table className="mch-table mch-table-full">
            <thead><tr><th>订单号</th><th>商品</th><th>数量</th><th>金额</th><th>状态</th><th>下单时间</th></tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.order_no}</td>
                  <td>{(o.items || []).map((it) => it.name).join('、')}</td>
                  <td>{(o.items || []).reduce((a, it) => a + (it.quantity || 0), 0)}</td>
                  <td className="price">¥{o.total_amount}</td>
                  <td><span className={`badge badge-${tone(o.status)}`}>{ORDER_STATUS[o.status] || o.status}</span></td>
                  <td className="muted">{o.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
