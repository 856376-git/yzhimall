import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Icon from '../components/Icon'
import QuantityStepper from '../components/QuantityStepper'
import { ProductAPI } from '../api'
import { useCartStore } from '../store/useCartStore'
import { toast } from '../store/useToastStore'

const yuan = (n) => Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })

// 从 SKU.specs 字符串("颜色:黑 / 容量:256G")里解析出 {颜色:'黑', 容量:'256G'}
function parseSkuSpecs(s) {
  if (!s) return {}
  const out = {}
  String(s).split('/').map((x) => x.trim()).filter(Boolean).forEach((kv) => {
    const idx = kv.indexOf(':')
    if (idx > 0) out[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim()
    else out[kv] = kv
  })
  return out
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [p, setP] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [selectedSku, setSelectedSku] = useState(null) // 选中的 sku 对象
  const [qty, setQty] = useState(1)
  const add = useCartStore((s) => s.add)

  useEffect(() => {
    setLoading(true); setImgIdx(0); setQty(1); setSelectedSku(null)
    ProductAPI.detail(id)
      .then((r) => {
        const d = r.data
        setP(d)
        if (d && Array.isArray(d.skus) && d.skus.length > 0) {
          setSelectedSku(d.skus[0]) // 默认选第一个 SKU
        }
      })
      .finally(() => setLoading(false))
    window.scrollTo(0, 0)
  }, [id])

  // 当前展示价 / 库存: 选中 SKU 用 SKU 的, 否则用 SPU 主表
  const displayPrice = selectedSku ? Number(selectedSku.price) : Number(p?.price || 0)
  const displayStock = selectedSku ? selectedSku.stock : (p?.stock || 0)
  const skuText = selectedSku ? selectedSku.sku_code : (p?.specs ? '' : '')

  // SKU 规格聚合: 必须在 early return 之前定义, 否则破坏 Hook 顺序
  const skusEarly = Array.isArray(p?.skus) ? p.skus : []
  const specGroups = useMemo(() => {
    if (skusEarly.length === 0) return []
    const map = {}
    skusEarly.forEach((s) => {
      const parsed = parseSkuSpecs(s.specs)
      Object.entries(parsed).forEach(([k, v]) => {
        if (!map[k]) map[k] = new Set()
        map[k].add(v)
      })
    })
    return Object.entries(map).map(([k, set]) => ({ name: k, options: Array.from(set) }))
  }, [p && p.id, skusEarly.length])

  const currentSelection = useMemo(() => {
    if (!selectedSku) return {}
    return parseSkuSpecs(selectedSku.specs)
  }, [selectedSku])

  const onAdd = () => {
    add({ ...p, price: displayPrice }, skuText || '默认', qty)
    toast('已加入购物车', 'success')
  }
  const onBuy = () => {
    add({ ...p, price: displayPrice }, skuText || '默认', qty)
    nav('/checkout')
  }

  if (loading) return <div className="page"><div className="container"><div className="loading">加载中...</div></div></div>
  if (!p) return (
    <div className="page"><div className="container">
      <div className="empty"><Icon name="box" size={56} /><div className="mt-12">商品不存在或已下架</div><Link className="btn mt-20" to="/">回首页</Link></div>
    </div></div>
  )

  return (
    <div className="page">
      <div className="container">
        <div className="crumb">
          <Link to="/">首页</Link><span className="sep">/</span>
          <Link to="/products">全部商品</Link><span className="sep">/</span>
          <span className="muted">{p.name}</span>
        </div>

        <div className="detail">
          <div className="gallery">
            <div className="main-img"><img src={(p.images || [p.primary_image])[imgIdx]} alt={p.name} /></div>
            <div className="thumbs">
              {(p.images || [p.primary_image]).map((src, i) => (
                <img key={i} src={src} alt="" className={i === imgIdx ? 'active' : ''} onClick={() => setImgIdx(i)} />
              ))}
            </div>
          </div>

          <div className="info">
            <h1>{p.name}</h1>
            <p className="subtitle">{p.subtitle || '官方旗舰店 正品保障'}</p>
            <div className="price-box">
              <span className="now"><span className="y">¥</span>{yuan(displayPrice)}</span>
              {p.original_price > displayPrice && <span className="orig">¥{yuan(p.original_price)}</span>}
              <span className="badge">自营</span>
            </div>
            <div className="stat-row">
              <span>库存 <b>{displayStock}</b> 件</span>
              <span>已售 <b>{p.sold_count}</b> 件</span>
              <span>浏览 <b>{p.view_count}</b> 次</span>
              <span>商家 <span className="muted">{p.merchant_name || '云智购自营'}</span></span>
            </div>

            {specGroups.length > 0 ? (
              specGroups.map((g) => (
                <div className="spec-group" key={g.name}>
                  <div className="lab">{g.name}</div>
                  <div className="spec-opts">
                    {g.options.map((opt) => {
                      const active = currentSelection[g.name] === opt
                      return (
                        <button key={opt} className={active ? 'active' : ''}
                          onClick={() => {
                            // 找 specs 里这维等于 opt 且其它维度等于 currentSelection 其它项的 sku
                            const wanted = { ...currentSelection, [g.name]: opt }
                            const hit = skus.find((s) => {
                              const ps = parseSkuSpecs(s.specs)
                              return Object.entries(wanted).every(([k, v]) => ps[k] === v)
                            })
                            if (hit) { setSelectedSku(hit); setQty(1) }
                            else toast('该规格暂无库存', 'error')
                          }}>{opt}</button>
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              // 无 SKU, 兼容老的 specs JSON 渲染
              (Array.isArray(p.specs) ? p.specs : []).map((g) => (
                <div className="spec-group" key={g.name}>
                  <div className="lab">{g.name}</div>
                  <div className="spec-opts">
                    {(g.options || []).map((opt) => (
                      <button key={opt} className="" onClick={() => toast(`已选 ${g.name}: ${opt}`, 'success')}>{opt}</button>
                    ))}
                  </div>
                </div>
              ))
            )}

            <div className="buy-row">
              <span className="lab">数量</span>
              <QuantityStepper value={qty} onChange={setQty} max={Math.min(99, displayStock || 99)} />
              {skuText && <span className="muted" style={{ fontSize: 12 }}>已选:{skuText}</span>}
            </div>

            <div className="detail-actions">
              <button className="btn-cart" onClick={onAdd}><Icon name="cart" /> 加入购物车</button>
              <button className="btn-buy" onClick={onBuy}>立即购买</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
