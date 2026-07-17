import Icon from './Icon'

export default function QuantityStepper({ value, onChange, min = 1, max = 99 }) {
  const set = (v) => {
    const n = Math.max(min, Math.min(max, Number(v) || min))
    onChange?.(n)
  }
  return (
    <div className="stepper">
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label="减少"><Icon name="minus" /></button>
      <input value={value} onChange={(e) => set(e.target.value)} aria-label="数量" />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label="增加"><Icon name="plus" /></button>
    </div>
  )
}
