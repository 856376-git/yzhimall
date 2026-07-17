import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import AdRail from '../components/AdRail'
import { ProductAPI } from '../api'

const FALLBACK_CATEGORIES = [
  { name: '手机' }, { name: '电脑' }, { name: '家电' }, { name: '数码' },
  { name: '服饰' }, { name: '美妆' }, { name: '食品' }, { name: '母婴' },
  { name: '运动' }, { name: '家居' }, { name: '图书' }, { name: '汽车' },
  { name: '鲜花' }, { name: '医药' }, { name: '玩具' }, { name: '宠物' },
]

const FLOORS = [
  { key: 'phone',     cat: 2, title: '手机通讯', sub: '新品上架 · 正品保障' },
  { key: 'computer',  cat: 3, title: '电脑办公', sub: '高效办公 · 全网低价' },
  { key: 'appliance', cat: 8, title: '家用电器', sub: '品质生活 · 全国联保' },
  { key: 'fashion',   cat: 4, title: '服饰鞋包', sub: '时尚百搭 · 渠道授权' },
  { key: 'beauty',    cat: 7, title: '美妆个护', sub: '全网低价 · 正品保障' },
  { key: 'food',      cat: 9, title: '食品酒水', sub: '源头直采 · 包邮到家' },
]

export default function HomePage() {
  const nav = useNavigate()
  const [cats, setCats] = useState([])
  const [seckill, setSeckill] = useState([])
  const [hotList, setHotList] = useState([])
  const [recs, setRecs] = useState([])
  const [floorData, setFloorData] = useState({})
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

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
        const items = (r) => (r && r.data && (r.data.items || (Array.isArray(r.data) ? r.data : []))) || []
        setCats(c.data || [])
        setSeckill(items(hotR))
        setHotList(items(hotR))
        setRecs(items(recR))
        setFloorData({
          phone: items(f2),
          computer: items(f3),
          appliance: items(f8),
          fashion: items(f4),
          beauty: items(f7),
          food: items(f9),
        })
        // 品牌名聚合：从热销商品里抓取 merchant_name 作为品牌展示
        try {
          const seen = new Set()
          const bs = []
          items(hotR).forEach((p) => {
            const b = p.merchant_name || (p.name || '').split(' ')[0]
            if (b && !seen.has(b)) { seen.add(b); bs.push(b) }
          })
          setBrands(bs.slice(0, 12))
        } catch { /* noop */ }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><div className="container"><div className="loading">加载中...</div></div></div>

  return (
    <div className="page">
      <div className="container">
        {/* 分类导航 + 搜索主区 */}
        <section className="section hero-wrap">
          <div className="hero-side">
            <div className="side-title">全部分类</div>
            <div className="side-list">
              {[...cats, ...FALLBACK_CATEGORIES]
                .filter((v, i, arr) => arr.findIndex((x) => x.name === v.name) === i)
                .slice(0, 14)
                .map((c, i) => (
                  <a key={c.id || (c.name + i)} onClick={() => c.id && nav(`/products?category_id=${c.id}`)}>
                    <span>{c.name}</span>
                  </a>
                ))}
            </div>
          </div>
          <div className="hero-main" style={{ backgroundImage: 'url(https://picsum.photos/seed/yzhero/760/420)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(40,40,40,.5), rgba(40,40,40,.05))' }} />
            <h1>云智购 盛夏焕新</h1>
            <p>正品低价 · 极速配送 · 七天无理由退换</p>
            <button className="btn" onClick={() => nav('/products')}>立即抢购</button>
          </div>
          <div className="hero-right">
            <div className="box" style={{ background: 'var(--orange, #ff6a3d)', color: '#fff' }}>
              <div className="t">领券中心</div>
              <div className="s">新人专享 满99减20</div>
            </div>
            <div className="box">
              <div className="t"><Icon name="time" size={20} /> 限时秒杀</div>
              <div className="s">每日10点 整点开抢</div>
            </div>
          </div>
        </section>

        {/* 全部分类网格 */}
        <section className="section">
          <div className="section-head">
            <h2>全部分类</h2>
            <span className="muted">点击进入分类速达</span>
          </div>
          <div className="catgrid">
            {[...cats, ...FALLBACK_CATEGORIES]
              .filter((v, i, arr) => arr.findIndex((x) => x.name === v.name) === i)
              .slice(0, 16)
              .map((c, i) => (
                <a key={(c.id || '') + c.name + i} onClick={() => c.id && nav(`/products?category_id=${c.id}`)}>
                  <div className="pic"><Icon name={c.icon || 'box'} size={20} /></div>
                  <div className="name">{c.name}</div>
                </a>
              ))}
          </div>
        </section>

        {/* 促销横幅 */}
        <div className="promo-strip">
          <div className="promo-item"><span className="promo-ic red">券</span><span className="promo-tx">满99减20 · 新人专享</span></div>
          <div className="promo-item"><span className="promo-ic red">秒</span><span className="promo-tx">限时秒杀 每天10点开抢</span></div>
          <div className="promo-item"><span className="promo-ic red">白</span><span className="promo-tx">百亿补贴 · 真低价不套路</span></div>
          <div className="promo-item"><span className="promo-ic red">包</span><span className="promo-tx">包邮到家 · 全场满99包邮</span></div>
        </div>

        {/* 活动双入口：限时秒杀 / 领券中心 */}
        <section className="section act-banner">
          <a className="act-card act-seckill" onClick={() => nav('/seckill')}>
            <span className="act-emoji">⚡</span>
            <span className="act-text"><b>限时秒杀</b><span className="muted">整点开抢，手快有手慢无</span></span>
            <span className="act-go">前往 <Icon name="chevron-right" size={14} /></span>
          </a>
          <a className="act-card act-coupon" onClick={() => nav('/coupons')}>
            <span className="act-emoji">🎫</span>
            <span className="act-text"><b>领券中心</b><span className="muted">满减+折扣，下单更省</span></span>
            <span className="act-go">前往 <Icon name="chevron-right" size={14} /></span>
          </a>
        </section>

        {/* 限时秒杀楼层（来自热销商品） */}
        {seckill.length > 0 && (
          <section className="section floor floor-seckill">
            <div className="section-head">
              <h2><span className="floor-tag tag-red">限时秒杀</span> 水手抢到赚到</h2>
              <span className="muted">快走 · 可剩 4 小时</span>
            </div>
            <div className="seckill-row">
              {seckill.slice(0, 6).map((p) => {
                const cut = p.original_price && p.original_price > p.price ? Math.round((1 - p.price / p.original_price) * 100) : 0
                return (
                  <a key={p.id} className="seckill-card" onClick={() => nav(`/products/${p.id}`)}>
                    <div className="sk-img"><img src={p.primary_image || (p.images && p.images[0]) || ''} alt="" /></div>
                    <div className="sk-name">{p.name}</div>
                    <div className="sk-price">¥{Number(p.price).toFixed(2)} <s>¥{Number(p.original_price || 0).toFixed(2)}</s></div>
                    <div className="sk-cut">直降 {cut}%</div>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* 今日推荐广告位 */}
        <AdRail title="今日推荐" />

        {/* 品牌专区 */}
        {brands.length > 0 && (
          <section className="section">
            <div className="section-head"><h2>品牌专区</h2><span className="muted">授权直营 · 保证源头</span></div>
            <div className="brand-wall">
              {brands.map((b, i) => (
                <a key={i} className="brand-cell" onClick={() => nav(`/products?q=${encodeURIComponent(b)}`)}>
                  <span className="brand-name">{b}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 热销榜 */}
        <section className="section">
          <div className="section-head">
            <h2>热销榜单</h2>
            <a className="more" onClick={() => nav('/products?sort=sales')}>查看更多 <Icon name="chevron-right" size={12} /></a>
          </div>
          <div className="hot-row">
            {hotList.slice(0, 5).map((p, i) => (
              <a key={p.id} className="hot-card" onClick={() => nav(`/products/${p.id}`)}>
                <span className={'hot-rank rank-' + (i + 1)}>{i + 1}</span>
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

        {/* 各品类楼层 */}
        {FLOORS.map((f) => {
          const prods = floorData[f.key] || []
          if (prods.length === 0) return null
          return (
            <section className="section floor" key={f.key}>
              <div className="section-head">
                <h2>{f.title}</h2>
                <a className="more" onClick={() => nav(`/products?category_id=${f.cat}`)}>查看更多 <Icon name="chevron-right" size={12} /></a>
              </div>
              <div className="prod-grid">
                {prods.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )
        })}

        {/* 更多好物 */}
        {recs.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2>更多好物</h2>
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
            <div className="footer-col"><h4>客服中心</h4><a>在线客服</a><a>售后申请</a><a>反馈投诉</a><a>帮助中心</a></div>
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
