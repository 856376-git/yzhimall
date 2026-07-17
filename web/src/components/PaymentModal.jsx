import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import Icon from './Icon'
import { PaymentAPI } from '../api'
import { toast } from '../store/useToastStore'

// 模拟沙箱支付弹窗：展示二维码 + 15分钟倒计时 + "我已完成支付"模拟回调 + 状态轮询
export default function PaymentModal({ open, sessionId, orderNo, amount, qrData, onPaid, onClose }) {
  const canvasRef = useRef(null)
  const [countdown, setCountdown] = useState(900)
  const [paying, setPaying] = useState(false)
  const [done, setDone] = useState(false)

  // 生成二维码到 canvas
  useEffect(() => {
    if (!open || !qrData || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, qrData, { width: 200, margin: 1 }, (err) => {
      if (err) console.error('二维码生成失败', err)
    })
  }, [open, qrData])

  // 倒计时（900s → 0）
  useEffect(() => {
    if (!open) return
    setCountdown(900)
    const t = setInterval(() => setCountdown((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [open])

  // 每 2s 轮询支付状态，命中 paid 自动关闭
  useEffect(() => {
    if (!open || !sessionId || done) return
    const t = setInterval(async () => {
      try {
        const r = await PaymentAPI.status(sessionId)
        if (r && r.data && r.data.paid) {
          clearInterval(t)
          setDone(true)
          toast('支付成功', 'success')
          onPaid && onPaid()
          setTimeout(() => onClose && onClose(), 800)
        }
      } catch (e) { /* 轮询失败静默忽略，等下一轮 */ }
    }, 2000)
    return () => clearInterval(t)
  }, [open, sessionId, done])

  if (!open) return null

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0')
  const ss = String(countdown % 60).padStart(2, '0')

  const handleSimPaid = async () => {
    if (!sessionId || done) return
    setPaying(true)
    try {
      await PaymentAPI.callback(sessionId)
      setDone(true)
      toast('支付成功', 'success')
      onPaid && onPaid()
      setTimeout(() => onClose && onClose(), 800)
    } catch (e) {
      toast(e.message || '模拟支付失败', 'error')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="pay-overlay" onClick={onClose}>
      <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pay-head">
          <span className="pay-title">扫码支付 · 模拟沙箱</span>
          <Icon name="close" size={20} className="pay-close" />
        </div>
        {done ? (
          <div className="pay-done">
            <Icon name="check" size={48} />
            <div className="pay-done-text">支付成功</div>
          </div>
        ) : (
          <>
            <div className="pay-order">订单号 {orderNo}</div>
            <div className="pay-amount">¥{Number(amount).toFixed(2)}</div>
            <div className="pay-qr"><canvas ref={canvasRef} /></div>
            <div className="pay-tip">请使用手机扫码完成支付（模拟沙箱）</div>
            <div className="pay-countdown">剩余支付时间 {mm}:{ss}</div>
            <div className="pay-actions">
              <button className="btn pay-sim" disabled={paying} onClick={handleSimPaid}>
                {paying ? '处理中…' : '我已完成支付(模拟)'}
              </button>
              <button className="btn line pay-cancel" onClick={onClose}>取消</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
