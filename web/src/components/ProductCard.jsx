import { Link } from 'react-router-dom'
import Icon from './Icon'
import { useCartStore } from '../store/useCartStore'
import { toast } from '../store/useToastStore'

const yuan = (n) => Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 })

export default function ProductCard({ product }) {
  const add = useCartStore((s) => s.add)
  const onAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    add(product, '', 1)
    toast('已加入购物车', 'success')
  }
  const img = product.primary_image || product.images?.[0]
  const hot = product.sold_count > 4500 || product.id % 9 === 0
  return (
    <Link className="card" to={`/product/${product.id}`}>
      {hot && <span className="tag">热卖</span>}
      <div className="thumb"><img src={img} alt={product.name} loading="lazy" /></div>
      <div className="body">
        <div className="name">{product.name}</div>
        <div className="price">
          <span className="y">¥</span>{yuan(product.price)}
          {product.original_price > product.price && <span className="orig">¥{yuan(product.original_price)}</span>}
        </div>
        <div className="meta">
          <span>{product.merchant_name || '自营'}</span>
          <span>已售 {product.sold_count}</span>
        </div>
        <button className="addbtn" onClick={onAdd}><Icon name="cart" /> 加入购物车</button>
      </div>
    </Link>
  )
}
