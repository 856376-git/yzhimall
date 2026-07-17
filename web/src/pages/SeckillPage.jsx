import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { toast } from '../store/useToastStore'

const yuan = (n) => Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })

// 纯前端模拟的秒杀场次，无后端依赖
const SESSIONS = [
  { id: 's10', label: '10:00 场', startH: 10, items: [
    { id: 61, name: 'Decathlon 瑜伽垫', seckill: 49, original: 89, stock: 18, soldPct: 64 },
    { id: 59, name: '美的电热水壶', seckill: 89, original: 159, stock: 6, soldPct: 88 },
    { id: 55, name: 'Sony WH-1000XM5', seckill: 1499, original: 2299, stock: 3, soldPct: 91 },
  ]},
  { id: 's14', label: '14:00 场', startH: 14, items: [
    { id: 57, name: 'vivo V15', seckill: 1299, original: 1899, stock: 12, soldPct: 55 },
    { id: 60, name: 'Redmi K70', seckill: 1799, original: 2499, stock: 9, soldPct: 70 },
  ]},
  { id: 's20', label: '20:00 场', startH: 20, items: [
    { id: 58, name: 'iPhone 15 Pro Max', seckill: 7999, original: 9999, stock: 2, soldPct: 96 },
    { id: 56, name: '华为 Mate 60 Pro+', seckill: 5499, original: 6999, stock: 4, soldPct: 85 },
  ]},
]

function pad(n) { return String(n).padStart(2, '0') }

// 距离某整点还剩多久（秒）
function secsToHour(h) {
  const now = new Date()
  const target = new Date(now)
  target.setHours(h, 0, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1) // 已过则算到明天
  return Math.floor((target.getTime() - now.getTime()) / 1000)
}

export default function SeckillPage() {
  // 默认选中当前最临近的场次
  const firstSession = useMemo(() => {
    let best = SESSIONS[0], bestSecs = Infinity
    SESSIONS.forEach((s) => {
      const secs = secsToHour(s.startH)
      if (secs < bestSecs) { bestSecs = secs; best = s }
    })
    return best
  }, [])
  const [activeId, setActiveId] = useState(firstSession.id)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const active = SESSIONS.find((s) => s.id === activeId) || SESSIONS[0]
  const remain = useMemo(() => secsToHour(active.startH), [activeId, now])
  const hh = Math.floor(remain / 3600), mm = Math.floor((remain % 3600) / 60), ss = remain % 60

  return (
    <div className="page">
      <div className="container">
        <div className="crumb">
          <Link to="/">首页</Link><span className="sep">/</span>
          <span className="muted">限时秒杀</span>
        </div>

        <div className="page-head">
          <h1><Icon name="time" /> 限时秒杀</h1>
          <p className="muted">每日整点开抢，手快有手慢无。本页为演示，下单跳转商品详情。</p>
        </div>

        <div className="seckill-tabs">
          {SESSIONS.map((s) => {
            const r = secsToHour(s.startH)
            const status = r > 0 && r < 3600 ? '抢购中' : (r > 0 ? '即将开始' : '已开抢')
            return (
              <button key={s.id} className={s.id === activeId ? 'active' : ''} onClick={() => setActiveId(s.id)}>
                <span className="t">{s.label}</span>
                <span className="s">{status}</span>
              </button>
            )
          })}
        </div>

        <div className="seckill-countdown">
          距 {active.label} 开抢 / 结束 还有：
          <code>{pad(hh)}</code> : <code>{pad(mm)}</code> : <code>{pad(ss)}</code>
        </div>

        <div className="seckill-list">
          {active.items.map((it) => (
            <div className="seckill-card" key={it.id}>
              <div className="pic" style={{ background: 'linear-gradient(135deg,#cb2521,#7a1410)' }}>
                <Icon name="tag" size={40} />
              </div>
              <div className="info">
                <div className="name">{it.name}</div>
                <div className="price">
                  <span className="now"><span className="y">¥</span>{yuan(it.seckill)}</span>
                  <span className="orig">¥{yuan(it.original)}</span>
                </div>
                <div className="stock-bar">
                  <div className="fill" style={{ width: it.soldPct + '%' }} />
                  <span>已抢 {it.soldPct}% · 剩 {it.stock} 件</span>
                </div>
              </div>
              <Link className="btn-buy" to={`/product/${it.id}`}>立即抢购</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
