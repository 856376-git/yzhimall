import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import QuantityStepper from '../components/QuantityStepper'
import { useCartStore, selectChecked, selectTotal, selectAllChecked } from '../store/useCartStore'
import { toast } from '../store/useToastStore'

const yuan = (n) => Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 })

export default function CartPage() {
  const nav = useNavigate()
  const items = useCartStore((s) => s.items)
  const setQty = useCartStore((s) => s.setQty)
  const inc = useCartStore((s) => s.inc)
  const dec = useCartStore((s) => s.dec)
  const remove = useCartStore((s) => s.remove)
  const toggleCheck = useCartStore((s) => s.toggleCheck)
  const toggleAll = useCartStore((s) => s.toggleAll)
  const checked = useCartStore(selectChecked)
  const total = useCartStore(selectTotal)
  const allChecked = useCartStore(selectAllChecked)

  if (items.length === 0) {
    return (
      <div className="page"><div className="container">
        <div className="empty">
          <Icon name="cart" size={64} />
          <div className="mt-12">购物车还是空的,去挑几件喜欢的吧</div>
          <button className="btn mt-20" onClick={() => nav('/products')}>去逛逛</button>
        </div>
      </div></div>
    )
  }

  const onCheckout = () => {
    if (checked.length === 0) { toast('请先选择要结算的商品', 'error'); return }
    nav('/checkout')
  }

  return (
    <div className="page"><div className="container">
      <div className="cart-page">
        <div className="cart-head">
          <span></span>
          <span></span>
          <span>商品信息</span>
          <span style={{ textAlign: 'center' }}>单价</span>
          <span style={{ textAlign: 'center' }}>数量</span>
          <span style={{ textAlign: 'center' }}>操作</span>
        </div>
        {items.map((it) => (
          <div className="cart-row" key={it.key}>
            <input className="cbox" type="checkbox" checked={it.checked} onChange={() => toggleCheck(it.key)} />
            <Link className="thumb" to={`/product/${it.product_id}`}><img src={it.image} alt={it.name} /></Link>
            <div className="desc">
              <Link className="name" to={`/product/${it.product_id}`}>{it.name}</Link>
              <div className="sku">{it.skuText}</div>
            </div>
            <div className="up">¥{yuan(it.price)}</div>
            <div style={{ justifySelf: 'center' }}>
              <QuantityStepper value={it.quantity} min={1} max={Math.max(1, it.stock || 99)} onChange={(n) => setQty(it.key, n)} />
            </div>
            <button className="del" style={{ justifySelf: 'center' }} onClick={() => { remove(it.key); toast('已删除') }}>删除</button>
          </div>
        ))}

        <div className="cart-bar">
          <input className="cbox" type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} />
          <span>全选</span>
          <span></span>
          <div className="total">
            已选 <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{checked.reduce((n, i) => n + i.quantity, 0)}</b> 件&nbsp;&nbsp;
            合计:<b>¥{yuan(total)}</b>&nbsp;&nbsp;
            <button className="btn" onClick={onCheckout}>去结算</button>
          </div>
        </div>
      </div>
    </div></div>
  )
}
