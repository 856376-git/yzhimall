import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { CheckInAPI } from '../api'
import { toast } from '../store/useToastStore'

// 第1~7天阶梯奖励,满7天重置回第1天
const REWARDS = [10, 15, 20, 25, 30, 35, 50]

export default function CheckInPage() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

  const load = () => {
    setLoading(true)
    CheckInAPI.status()
      .then((r) => setStatus(r.data || {}))
      .catch((e) => toast(e.message || '签到状态加载失败', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCheckIn = async () => {
    setSigning(true)
    try {
      const r = await CheckInAPI.checkin()
      toast('签到成功,获得 ' + ((r.data && r.data.reward_points) || 0) + ' 积分', 'success')
      load()
    } catch (e) {
      toast(e.message || '签到失败', 'error')
    } finally {
      setSigning(false)
    }
  }

  const continuous = (status && status.continuous_days) || 0
  const total = (status && status.total_points) || 0
  const checkedToday = !!(status && status.checked_today)
  const records = (status && status.recent_records) || []
  const doneCount = Math.min(continuous, 7)

  return (
    <div className="page"><div className="container checkin">
      <div className="crumb"><Link to="/">首页</Link><span className="sep">/</span><span className="muted">每日签到</span></div>

      <div className="panel checkin-hero">
        <div className="checkin-hero-main">
          <div className="checkin-hero-label">已连续签到</div>
          <div className="checkin-hero-num">{continuous}<span>天</span></div>
          <div className={'checkin-hero-sub' + (checkedToday ? ' ok' : '')}>
            {checkedToday ? '今日已签到' : '今日尚未签到,快去打卡吧'}
          </div>
        </div>
        <div className="checkin-hero-side">
          <div className="checkin-points">
            <span className="muted">累计积分</span>
            <b>{total}</b>
          </div>
          <button
            className={'btn btn-lg' + (checkedToday ? ' line' : '')}
            disabled={checkedToday || signing}
            onClick={handleCheckIn}
          >
            {checkedToday ? '今日已签到' : (signing ? '签到中…' : '立即签到')}
          </button>
        </div>
      </div>

      <div className="panel checkin-panel">
        <div className="section-head">
          <h2>签到奖励规则</h2>
          <span className="muted">连续签到 7 天循环奖励,断签重新计算</span>
        </div>
        <div className="checkin-grid">
          {REWARDS.map((rw, i) => (
            <div key={i} className={'checkin-cell' + (i < doneCount ? ' done' : '') + (i === 6 ? ' big' : '')}>
              <div className="checkin-cell-day">第{i + 1}天</div>
              <div className="checkin-cell-pts">+{rw}</div>
              {i === 6 && <div className="checkin-cell-flag">满签大奖</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="panel checkin-panel">
        <div className="section-head"><h2>最近签到记录</h2></div>
        {loading ? (
          <div className="loading">加载中…</div>
        ) : records.length === 0 ? (
          <div className="empty" style={{ padding: '48px 0' }}>
            <Icon name="box" size={48} />
            <div className="mt-12 muted">还没有签到记录,立即签到开启打卡吧</div>
          </div>
        ) : (
          <div className="checkin-records">
            <div className="checkin-rec-head muted">
              <span>签到日期</span><span>连续天数</span><span>获得积分</span>
            </div>
            {records.map((r, i) => (
              <div className="checkin-rec-row" key={i}>
                <span>{r.check_date}</span>
                <span>第 {r.continuous_days} 天</span>
                <span className="ck-pts">+{r.reward_points}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div></div>
  )
}
