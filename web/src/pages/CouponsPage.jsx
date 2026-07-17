import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { toast } from '../store/useToastStore'

const yuan = (n) => Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })

const COUPONS = [
  { id: 'c1', type: 'fullcut', label: '满 99 减 12', threshold: 99, amount: 12, desc: '全场满 99 元可用', expiry: '2026-12-31', tag: '通用券' },
  { id: 'c2', type: 'fullcut', label: '满 199 减 30', threshold: 199, amount: 30, desc: '全场满 199 元可用', expiry: '2026-12-31', tag: '通用券' },
  { id: 'c3', type: 'fullcut', label: '满 499 减 80', threshold: 499, amount: 80, desc: '手机数码专享', expiry: '2026-10-31', tag: '品类券' },
  { id: 'c4', type: 'discount', label: '8.5 折券', threshold: 0, amount: 0.85, desc: '单商品最高减 100 元', expiry: '2026-09-30', tag: '折扣券' },
  { id: 'c5', type: 'fullcut', label: '满 299 减 50', threshold: 299, amount: 50, desc: '新人专享，仅限首单', expiry: '2026-12-31', tag: '新人券' },
  { id: 'c6', type: 'fullcut', label: '满 999 减 150', threshold: 999, amount: 150, desc: '大额满减券', expiry: '2026-12-31', tag: '大额券' },
]

const STORE_KEY = 'yzhao_coupons_taken'

export default function CouponsPage() {
  const [taken, setTaken] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORE_KEY) || '[]')) }
    catch { return new Set() }
  })

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(taken)))
  }, [taken])

  const claim = (c) => {
    if (taken.has(c.id)) return
    setTaken((prev) => {
      const next = new Set(prev); next.add(c.id); return next
    })
    toast(`已领取「${c.label}」`, 'success')
  }

  return (
    <div className="page">
      <div className="container">
        <div className="crumb">
          <Link to="/">首页</Link><span className="sep">/</span>
          <span className="muted">领券中心</span>
        </div>

        <div className="page-head">
          <h1><Icon name="ticket" /> 领券中心</h1>
          <p className="muted">点击立即领取，下单时自动可选。本页为演示，已领券存于浏览器本地。</p>
        </div>

        <div className="coupon-grid">
          {COUPONS.map((c) => {
            const isTaken = taken.has(c.id)
            return (
              <div className={'coupon-card' + (isTaken ? ' taken' : '')} key={c.id}>
                <div className="left">
                  {c.type === 'fullcut' ? (
                    <div className="amt"><span className="y">¥</span>{c.amount}<span className="u">元</span></div>
                  ) : (
                    <div className="amt"><span className="u">折</span>{(c.amount * 10).toFixed(0)}<span className="u">折</span></div>
                  )}
                  <div className="cond">{c.threshold > 0 ? `满 ${yuan(c.threshold)} 可用` : '无门槛'}</div>
                </div>
                <div className="right">
                  <div className="tag">{c.tag}</div>
                  <div className="label">{c.label}</div>
                  <div className="desc">{c.desc}</div>
                  <div className="exp">有效期至 {c.expiry}</div>
                  <button className="claim" disabled={isTaken} onClick={() => claim(c)}>
                    {isTaken ? '已领取' : '立即领取'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="coupon-foot muted">
          已领取 {taken.size} / {COUPONS.length} 张 · <Link to="/">回首页购物</Link>
        </div>
      </div>
    </div>
  )
}
