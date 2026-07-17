import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import { ProductAPI } from '../api'
import AdRail from '../components/AdRail'

const FALLBACK_CATEGORIES = [
  { emoji: '📱', name: '手机' },
  { emoji: '💻', name: '电脑' },
  { emoji: '❄️', name: '家电' },
  { emoji: '🎮', name: '数码' },
  { emoji: '👔', name: '服饰' },
  { emoji: '💄', name: '美妆' },
  { emoji: '🍎', name: '食品' },
  { emoji: '👶', name: '母婴' },
  { emoji: '⚽', name: '运动' },
  { emoji: '🏠', name: '家居' },
  { emoji: '📚', name: '图书' },
  { emoji: '🚗', name: '汽车' },
  { emoji: '🌸', name: '鲜花' },
  { emoji: '💊', name: '医药' },
  { emoji: '🎉', name: '玩具' },
  { emoji: '🐶', name: '宠牧' },
]

export default function HomePage() {
  const nav = useNavigate()
  const [cats, setCats] = useState([])
  const [hot, setHot] = useState([])
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [seckill, setSeckill] = useState([])
  const [hotList, setHotList] = useState([])
  const [floorData, setFloorData] = useState({})
  const [brands, setBrands] = useState([])

  useEffect(() => {
    Promise.all([
      ProductAPI.categories(),
      ProductAPI.list({ page: 1, per_page: 10, sort: 'sold' }),
      ProductAPI.list({ page: 1, per_page: 10, sort: 'sales' }),
      ProductAPI.list({ page: 1, per_page: 20, sort: 'newest' }),
      ProductAPI.list({ page: 1, per_page: 8, sort: 'sold', category_id: 2 }),
      ProductAPI.list({ page: 1, per_page: 8, sort: 'sold', category_id: 3 }),
      ProductAPI.list({ page: 1, per_page: 8, sort: 'sold', category_id: 8 }),
      ProductAPI.list({ page: 1, per_page: 8, sort: 'sold', category_id: 4 }),
      ProductAPI.list({ page: 1, per_page: 8, sort: 'sold', category_id: 7 }),
      ProductAPI.list({ page: 1, per_page: 8, sort: 'sold', category_id: 9 }),
    ])
      .then(([c, seckillR, hotR, recR, f2, f3, f8, f4, f7, f9]) => {
        setCats(c.data || [])
        setSeckill((seckillR.data && seckillR.data.items) || [])
        setHotList((hotR.data && hotR.data.items) || [])
        setHot((hotR.data && hotR.data.items) || [])
        setRecs((recR.data && recR.data.items) || [])
        setFloorData({
          phone: (f2.data && f2.data.items) || [],
          computer: (f3.data && f3.data.items) || [],
          appliance: (f8.data && f8.data.items) || [],
          fashion: (f4.data && f4.data.items) || [],
          beauty: (f7.data && f7.data.items) || [],
          food: (f9.data && f9.data.items) || [],
        })
        const allProducts = [
          ...((seckillR.data && seckillR.data.items) || []),
          ...((hotR.data && hotR.data.items) || []),
          ...((recR.data && recR.data.items) || []),
        ]
        const bs = Array.from(new Set(allProducts.map((p) => p.merchant_name).filter(Boolean))).slice(0, 12)
        setBrands(bs)
      })
      .catch((e) => console.error('HomePage load error:', e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="page">
      <div className="container">

        <section className="hero section">
          <div className="hero-side">
            {cats.slice(0, 12).map((c) => (
              <a key={c.id} onClick={() => nav(`/products?category_id=${c.id}`)}>
                {c.name}<span><Icon name="chevron-right" size={12} /></span>
              </a>
            ))}
          </div>
          <div className="hero-main" style={{ backgroundImage: 'url(https://picsum.photos/seed/yzhero/760/420)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(40,40,40,.5), rgba(40,40,40,.05))' }} />
            <h1>云智购 盛夏焕新</h1>
            <p>正品低价 · 极速配送 · 七天无理由退换</p>
            <button className="btn" onClick={() => nav('/products')}>立即逝逝</button>
          </div>
          <div className="hero-right">
            <div className="box" style={{ background: 'var(--orange)', color: '#fff' }}>
              <div className="t">领券中心</div>
              <div className="s">新人专享 满99减20</div>
            </div>
            <div className="box">
              <div className="t"><Icon name="phone" size={20} /> 限时秒杀</div>
              <div className="s">每日10点 整点开抢</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2>全部分类</h2><span className="muted">点击进入分类速递</span></div>
          <div className="catgrid">
            {[...cats, ...FALLBACK_CATEGORIES]
              .filter((v, i, arr) => arr.findIndex((x) => x.name === v.name) === i)
              .slice(0, 16)
              .map((c) => (
              <a key={c.id || c.name} onClick={() => c.id && nav(`/products?category_id=${c.id}`)}>
                <div className="pic">{c.emoji ? c.emoji : <Icon name={c.icon || 'box'} size={20} />}</div>
                <div className="name">{c.name}</div>
              </a>
            ))}
          </div>
        </section>

        <div className="promo-strip">
          <div className="promo-item"><span className="promo-ic">券</span><span className="promo-tx">满99减20 · 新人专享</span></div>
          <div className="promo-item"><span className="promo-ic">秒</span><span className="promo-tx">限时秒杀 每日10点开抢</span></div>
          <div className="promo-item"><span className="promo-ic">百</span><span className="promo-tx">百亿补贴 · 真低价不套路</span></div>
          <div className="promo-item"><span className="promo-ic">包</span><span className="promo-tx">包邮到家 · 全场满29包邮</span></div>
        </div>

        {seckill.length > 0 && (
          <section className="section floor floor-seckill">
            <div className="section-head">
              <h2><span className="floor-tag tag-red">限时秒杀</span> 港水价抢到就赚到</h2>
              <span className="muted">快走 · 只剩 4 小时</span>
            </div>
            <div className="seckill-row">
              {seckill.map((p) => {
                const cut = p.original_price && p.original_price > p.price ? Math.round((1 - p.price / p.original_price) * 100) : 0
                return (
                  <a key={p.id} className="seckill-card" onClick={() => nav(`/products/${p.id}`)}>
                    <div className="sk-img"><img src={p.primary_image || (p.images && p.images[0]) || ''} alt="" /></div>
                    <div className="sk-name">{p.name}</div>
                    <div className="sk-price">¥{Number(p.price).toFixed(2)} <s>¥{Number(p.original_price).toFixed(2)}</s></div>
                    <div className="sk-cut">直降 {cut}%</div>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        <AdRail title="今日推荐" />

        {brands.length > 0 && (
          <section className="section">
            <div className="section-head"><h2>品牌专区</h2><span className="muted">授权授牌 · 保障源头</span></div>
            <div className="brand-wall">
              {brands.map((b, i) => (
                <a key={i} className="brand-cell" onClick={() => nav(`/products?q=${encodeURIComponent(b)}`)}>
                  <span className="brand-name">{b}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {hotList.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2>热卖榜单</h2>
              <a className="more" onClick={() => nav('/products?sort=sales')}>查看更多 <Icon name="chevron-right" size={12} /></a>
            </div>
            <div className="hot-row">
              {hotList.slice(0, 5).map((p, i) => (
                <a key={p.id} className="hot-card" onClick={() => nav(`/products/${p.id}`)}>
                  <span className={'hot-rank rank-' + (i+1)}>{i+1}</span>
                  <img src={p.primary_image || (p.images && p.images[0]) || ''} alt="" className="hot-img" />
                  <div className="hot-info">
                    <div className="hot-name">{p.name}</div>
                    <div className="hot-price">¥{Number(p.price).toFixed(2)}</div>
                    <div className="hot-sold">已售 {p.sold_count || 0} 件</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {[
          { key: 'phone',     cat: 2, title: '手机通讯', sub: '新品上架 · 正品保障', emoji: '📱' },
          { key: 'computer',  cat: 3, title: '电脑办公', sub: '高性价比 · 全场包邮', emoji: '💻' },
          { key: 'appliance', cat: 8, title: '家用电器', sub: '品质生活 · 七天无理由', emoji: '❄️' },
          { key: 'fashion',   cat: 4, title: '服饰鞋包', sub: '时尚便装 · 渠道授权', emoji: '👔' },
          { key: 'beauty',    cat: 7, title: '美妆个护', sub: '全网低价 · 正品保障', emoji: '💄' },
          { key: 'food',      cat: 9, title: '食品酒水', sub: '源头直供 · 包邮到家', emoji: '🍎' },
        ].map((f) => floorData[f.key] && floorData[f.key].length > 0 ? (
          <section className="section floor" key={f.key}>
            <div className="section-head">
              <h2><span className="floor-emoji">{f.emoji}</span> {f.title}</h2>
              <a className="more" onClick={() => nav(`/products?category_id=${f.cat}`)}>查看更多 <Icon name="chevron-right" size={12} /></a>
            </div>
            <div className="prod-grid">
              {floorData[f.key].map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        ) : null)}

        {recs.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2>为你推荐</h2>
              <a className="more" onClick={() => nav('/products')}>更多好物 <Icon name="chevron-right" size={12} /></a>
            </div>
            <div className="prod-grid">
              {recs.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

      </div>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-cols">
            <div className="footer-col"><h4>购物指南</h4><a>注册流程</a><a>下单流程</a><a>付款方式</a><a>会员优惠</a></div>
            <div className="footer-col"><h4>商家服务</h4><a>商家入驻</a><a>商家后台</a><a>企业合作</a><a>代运营</a></div>
            <div className="footer-col"><h4>客服中心</h4><a>在线客服</a><a>售后申请</a><a>反馈诉求</a><a>帮助中心</a></div>
            <div className="footer-col"><h4>关于云智购</h4><a>关于我们</a><a>联系我们</a><a>加入我们</a><a>广告合作</a></div>
            <div className="footer-col"><h4>服务热线</h4><div className="hotline">400-888-8888</div><div className="muted">7×24小时客服</div></div>
          </div>
          <div className="footer-bottom">
            <p>云智购 yzhimall —— 让购物更简单</p>
            <p>© 2026 云智购商城 · 前后端分离示例项目 · React + Vite + Flask + SQLite</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
