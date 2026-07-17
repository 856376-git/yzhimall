import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import PaymentModal from '../components/PaymentModal'
import { OrderAPI, PaymentAPI } from '../api'
import { toast } from '../store/useToastStore'

const STATUS_BADGE = {
  unpaid: { cls: 'badge-o', text: '待付款' },
  paid: { cls: 'badge-b', text: '已付款' },
  shipped: { cls: 'badge-b', text: '已发货' },
  completed: { cls: 'badge-g', text: '已完成' },
  cancelled: { cls: 'badge-m', text: '已取消' },
}
const statusMeta = (s) => STATUS_BADGE[s] || { cls: 'badge-m', text: s || '未知' }

const fmtTime = (t) => {
  if (!t) return ''
  const n = typeof t === 'number' ? t * 1000 : new Date(t).getTime()
  const d = new Date(n)
  return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [pay, setPay] = useState(null)  // {sessionId, orderNo, amount, qrData}

  const load = () => {
    setLoading(true)
    OrderAPI.list({ page: 1, per_page: 20 })
      .then((r) => setOrders((r.data && r.data.items) || []))
      .catch((e) => toast(e.message || '订单加载失败', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handlePay = async (order) => {
    try {
      const r = await PaymentAPI.create(order.id)
      const d = r.data || {}
      setPay({ sessionId: d.session_id, orderNo: d.order_no || order.order_no, amount: d.amount != null ? d.amount : order.actual_amount, qrData: d.qr_data })
    } catch (e) {
      toast(e.message || '创建支付失败', 'error')
    }
  }

  const handleCancel = async (order) => {
    if (!window.confirm('确认取消该订单?')) return
    try {
      await OrderAPI.cancel(order.id)
      toast('订单已取消', 'success')
      load()
    } catch (e) {
      toast(e.message || '取消失败', 'error')
    }
  }

  const onPaid = () => { setPay(null); load(); window.dispatchEvent(new CustomEvent('orders-changed')) }

  return (
    <div className="page"><div className="container">
      <div className="crumb"><Link to="/">首页</Link><span className="sep">/</span><span className="muted">我的订单</span></div>
      <div className="panel" style={{ padding: '24px' }}>
        <div className="section-head"><h2>我的订单</h2></div>
        {loading ? (
          <div className="loading">加载中…</div>
        ) : orders.length === 0 ? (
          <div className="empty">
            <Icon name="box" size={56} />
            <div className="mt-12">暂无订单,下单后可在此查看</div>
            <Link className="btn mt-20" to="/products">去下单</Link>
          </div>
        ) : (
          <div className="order-list">
            {orders.map((o) => {
              const st = statusMeta(o.status)
              const items = o.items || []
              return (
                <div className="order-card panel" key={o.id}>
                  <div className="order-card-head">
                    <span className="order-no">订单号 {o.order_no}</span>
                    <span className="order-time muted">{fmtTime(o.created_at)}</span>
                    <span className={`badge ${st.cls}`}>{st.text}</span>
                  </div>
                  <div className="order-items">
                    {items.map((it, i) => (
                      <div className="order-item" key={i}>
                        <img src={it.product_image || it.image || ''} alt="" />
                        <div className="nm">
                          {it.name || it.product_name}
                          <div className="sku">{it.sku_desc || it.sku_text || ''} ×{it.quantity}</div>
                        </div>
                        <div className="pr">¥{Number(it.price || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="order-card-foot">
                    <span className="order-amount">共 {items.length} 件 合计 <b>¥{Number(o.actual_amount || o.total_amount).toFixed(2)}</b></span>
                    <div className="order-actions">
                      {o.status === 'unpaid' && (
                        <button className="btn sm" onClick={() => handlePay(o)}>去支付</button>
                      )}
                      {(o.status === 'unpaid' || o.status === 'paid') && (
                        <button className="btn line sm" onClick={() => handleCancel(o)}>取消订单</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <PaymentModal
        open={!!pay}
        sessionId={pay && pay.sessionId}
        orderNo={pay && pay.orderNo}
        amount={pay && pay.amount}
        qrData={pay && pay.qrData}
        onPaid={onPaid}
        onClose={() => setPay(null)}
      />
    </div></div>
  )
}
