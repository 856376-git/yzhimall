export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null
  const range = []
  const from = Math.max(1, page - 1)
  const to = Math.min(pages, page + 1)
  if (from > 1) { range.push(1); if (from > 2) range.push('...') }
  for (let i = from; i <= to; i++) range.push(i)
  if (to < pages) { if (to < pages - 1) range.push('...'); range.push(pages) }
  return (
    <div className="pager">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}>上一页</button>
      {range.map((n, i) =>
        typeof n === 'number' ? (
          <button key={i} className={n === page ? 'active' : ''} onClick={() => onChange(n)}>{n}</button>
        ) : (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', color: '#999' }}>{n}</span>
        ),
      )}
      <button onClick={() => onChange(page + 1)} disabled={page >= pages}>下一页</button>
    </div>
  )
}
