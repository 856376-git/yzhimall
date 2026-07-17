import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { UserAPI, OrderAPI } from '../api'
import { useCartStore, selectChecked, selectTotal } from '../store/useCartStore'
import { useUserStore } from '../store/useUserStore'
import { toast } from '../store/useToastStore'

const yuan = (n) => Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
const EMPTY_ADDR = { name: '', phone: '', province: '', city: '', district: '', detail: '', is_default: false }

export default function CheckoutPage() {
  const nav = useNavigate()
  const checked = useCartStore(selectChecked)
  const total = useCartStore(selectTotal)
  const clearChecked = useCartStore((s) => s.clearChecked)
  const { token } = useUserStore()
  const [addrs, setAddrs] = useState([])
  const [addrId, setAddrId] = useState(null)
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_ADDR)
  const [savingAddr, setSavingAddr] = useState(false)
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (checked.length === 0) { nav('/cart'); return }
    setLoading(true)
    UserAPI.addresses()
      .then((r) => {
        const list = r.data || []
        setAddrs(list)
        const def = list.find((a) => a.is_default) || list[0]
        if (def) setAddrId(def.id)
        if (!list.length) setShowForm(true)
      })
      .finally(() => setLoading(false))
  }, [])

  if (checked.length === 0) return null

  const selected = addrs.find((a) => a.id === addrId)
  const freight = total >= 99 || total === 0 ? 0 : 12
  const pay = total + freight

  const saveAddress = async () => {
    if (!form.name || !form.phone || !form.province || !form.city || !form.district || !form.detail) {
      toast('请填写完整的收货信息', 'error'); return
    }
    if (!token) { toast('请先登录', 'error'); nav('/login'); return }
    setSavingAddr(true)
    try {
      const res = await UserAPI.addAddress(form)
      if (res.code !== 200 && res.code !== 201) throw new Error(res.msg || '保存地址失败')
      const freshly = res.data
      setAddrs((prev) => {
        let next = freshly ? [...prev, freshly] : prev
        if (freshly && freshly.is_default) next = next.map((a) => (a.id === freshly.id ? a : { ...a, is_default: false }))
        return next
      })
      if (freshly) setAddrId(freshly.id)
      setForm(EMPTY_ADDR)
      setShowForm(false)
      toast('收货地址已保存', 'success')
    } catch (e) {
      toast(e.message || '保存地址失败', 'error')
    } finally {
      setSavingAddr(false)
    }
  }

  const submit = async () => {
    if (!selected) { toast('请选择收货地址', 'error'); return }
    if (!token) { toast('请先登录', 'error'); nav('/login'); return }
    setSubmitting(true)
    try {
      const items = checked.map((i) => ({ product_id: i.product_id, sku_text: i.skuText, quantity: i.quantity, name: i.name, price: i.price }))
     const res = await OrderAPI.create({ address_id: selected.id, items, remark, amount: pay })
     if (res.code !== 200 && res.code !== 201) throw new Error(res.msg || '下单失败')
     clearChecked()
      // 留在待支付态;在"我的订单"里点"去支付"进入收银台扫码付款
      toast('下单成功,请尽快支付', 'success')
     nav('/orders')
    } catch (e) {
      toast(e.message || '下单失败', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page"><div className="container">
      <div className="checkout">
        <div>
          <div className="ck-sec">
            <h3>
              <Icon name="location" size={20} /> 收货地址
              {!showForm && !loading && (
                <button className="btn sm line" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(true)}>
                  <Icon name="plus" size={14} /> 新增收货地址
                </button>
              )}
            </h3>
            {loading ? <div className="loading">加载中...</div> : (
              <>
                {addrs.length > 0 && (
                  <div className="addr-list">
                    {addrs.map((a) => (
                      <div key={a.id} className={`addr-card ${a.id === addrId ? 'sel' : ''}`} onClick={() => setAddrId(a.id)}>
                        <div className="n">{a.name}{a.tag && <span className="tag-mini">{a.tag}</span>}{a.is_default && <span className="tag-mini">默认</span>}</div>
                        <div className="a">{a.province}{a.city}{a.district} {a.detail}</div>
                        <div className="p">{a.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
                {showForm && (
                  <div className="addr-form">
                    <div className="af-grid2">
                      <div className="af-row"><label>收货人 *</label><input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="姓名" /></div>
                      <div className="af-row"><label>手机号 *</label><input value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="11 位手机号" /></div>
                    </div>
                    <div className="af-grid3">
                      <div className="af-row"><label>省 *</label><input value={form.province} onChange={(e) => setField('province', e.target.value)} placeholder="如 广东省" /></div>
                      <div className="af-row"><label>市 *</label><input value={form.city} onChange={(e) => setField('city', e.target.value)} placeholder="如 深圳市" /></div>
                      <div className="af-row"><label>区/县 *</label><input value={form.district} onChange={(e) => setField('district', e.target.value)} placeholder="如 南山区" /></div>
                    </div>
                    <div className="af-row full"><label>详细地址 *</label><input value={form.detail} onChange={(e) => setField('detail', e.target.value)} placeholder="街道、楼栋、门牌号" /></div>
                    <label className="af-check"><input type="checkbox" checked={form.is_default} onChange={(e) => setField('is_default', e.target.checked)} /> 设为默认地址</label>
                    <div className="af-actions">
                      <button className="btn sm" disabled={savingAddr} onClick={saveAddress}>{savingAddr ? '保存中...' : '保存地址'}</button>
                      {addrs.length > 0 && <button className="btn sm line" disabled={savingAddr} onClick={() => { setShowForm(false); setForm(EMPTY_ADDR) }}>取消</button>}
                    </div>
                  </div>
                )}
                {!showForm && addrs.length === 0 && (
                  <div className="muted">还没有收货地址,点击右上角"新增收货地址"添加一条。</div>
                )}
              </>
            )}
          </div>

          <div className="ck-sec">
            <h3><Icon name="cart" size={20} /> 订单商品</h3>
            {checked.map((it) => (
              <div className="order-item" key={it.key}>
                <img src={it.image} alt={it.name} />
                <div className="nm">{it.name}<div className="sku">{it.skuText}</div></div>
                <div className="pr">¥{yuan(it.price)} × {it.quantity}</div>
              </div>
            ))}
            <div className="mt-12">
              <label className="muted" style={{ fontSize: 13 }}>订单备注</label>
              <textarea className="remark mt-12" placeholder="选填,如配送时间等" value={remark} onChange={(e) => setRemark(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="ck-sum">
          <h3>结算明细</h3>
          <div className="row"><span>商品金额</span><span>¥{yuan(total)}</span></div>
          <div className="row"><span>运费</span><span>{freight === 0 ? '免运费' : `¥${yuan(freight)}`}</span></div>
          <div className="row"><span>优惠券</span><span>-¥0.00</span></div>
          <div className="pay">
            <span>实付款</span>
            <b>¥{yuan(pay)}</b>
          </div>
          <button className="btn btn-lg block" disabled={submitting} onClick={submit}>{submitting ? '提交中...' : '提交订单并支付'}</button>
        </div>
      </div>
    </div></div>
  )
}
