import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import Pagination from '../components/Pagination'
import { ProductAPI } from '../api'

const SORTS = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'price_asc', label: '价格升序' },
  { key: 'price_desc', label: '价格降序' },
  { key: 'newest', label: '新品' },
]

export default function ProductsPage() {
  const loc = useLocation()
  const nav = useNavigate()
  const sp = new URLSearchParams(loc.search)
  const [cats, setCats] = useState([])
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const cid = sp.get('category_id') || ''
  const q = sp.get('q') || ''
  const sort = sp.get('sort') || 'default'
  const page = Number(sp.get('page') || 1)

  useEffect(() => { ProductAPI.categories().then((r) => setCats(r.data || [])).catch(() => {}) }, [])

  useEffect(() => {
    setLoading(true)
    ProductAPI.list({ page, per_page: 20, q, sort, category_id: cid })
      .then((r) => {
        setItems((r.data && r.data.items) || [])
        setMeta(r.meta || { page: 1, pages: 1, total: 0 })
      })
      .finally(() => setLoading(false))
    window.scrollTo(0, 0)
  }, [page, q, sort, cid])

  const go = (patch) => {
    const p = new URLSearchParams(loc.search)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null) p.delete(k)
      else p.set(k, v)
    })
    if (patch.page == null) p.delete('page')
    nav(`/products?${p.toString()}`)
  }

  const curCat = cats.find((c) => String(c.id) === String(cid))

  return (
    <div className="page">
      <div className="container">
        <div className="crumb">
          <a onClick={() => nav('/')}>首页</a><span className="sep">/</span>
          {curCat && (<><a onClick={() => go({ category_id: '' })}>{curCat.name}</a><span className="sep">/</span></>)}
          <span className="muted">{q ? `搜索"${q}"` : '全部商品'}</span>
        </div>

        <div className="shop-layout">
          <aside className="sidecats">
            <a className={!cid ? 'active' : ''} onClick={() => go({ category_id: '' })} style={{ fontWeight: 600 }}>全部分类</a>
            {cats.map((c) => (
              <a key={c.id} className={String(cid) === String(c.id) ? 'active' : ''} onClick={() => go({ category_id: c.id })}>{c.name}</a>
            ))}
          </aside>

          <div>
            <div className="filter-bar">
              <div className="sort-tabs">
                {SORTS.map((s) => (
                  <button key={s.key} className={sort === s.key ? 'active' : ''} onClick={() => go({ sort: s.key === 'default' ? '' : s.key })}>{s.label}</button>
                ))}
              </div>
              <div className="f">共 <b style={{ color: 'var(--red)' }}>{meta.total}</b> 件</div>
            </div>

            {loading ? (
              <div className="loading">加载中...</div>
            ) : items.length === 0 ? (
              <div className="empty">
                <Icon name="box" size={56} />
                <div className="mt-12">没有找到相关商品</div>
                <button className="btn mt-20" onClick={() => go({ q: '', category_id: '' })}>看看全部商品</button>
              </div>
            ) : (
              <>
                <div className="prod-grid">
                  {items.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                <Pagination page={meta.page || page} pages={meta.pages || 1} onChange={(n) => go({ page: n })} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
