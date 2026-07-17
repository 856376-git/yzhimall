import { useEffect, useState, useMemo } from 'react'
import Icon from '../components/Icon'
import { AdminAPI } from '../api'
import { toast } from '../store/useToastStore'

const STATUS = { active: { t: '在售', c: 'g' }, off: { t: '已下架', c: 'm' } }
const TABS = [
  { k: 'all', label: '全部' },
  { k: 'active', label: '在售' },
  { k: 'off', label: '已下架' },
]

export default function AdminProducts() {
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')

  const reload = () => {
    setLoading(true)
    AdminAPI.products({ status: 'all' }).then((r) => setAll((r.data && r.data.items) || [])).finally(() => setLoading(false))
  }
  useEffect(() => { reload() }, [])

  const list = useMemo(() => {
    let l = all
    if (tab !== 'all') l = l.filter((p) => p.status === tab)
    if (q.trim()) {
      const k = q.trim().toLowerCase()
      l = l.filter((p) => p.name.toLowerCase().includes(k))
    }
    return l
  }, [all, tab, q])

  const onToggle = async (p) => {
    const r = await AdminAPI.toggleProduct(p.id)
    if (r.code === 200) { toast(p.status === 'active' ? '已强制下架' : '已恢复上架', 'success'); reload() }
    else toast(r.msg || '操作失败', 'error')
  }

  return (
    <div className="mch-page adm-page">
      <div className="mch-bar"><h2>商品管理</h2><span className="mch-count">共 {list.length} 件商品</span></div>

      <div className="mch-tabs">
        {TABS.map((t) => (
          <button key={t.k} className={`mch-tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}>{t.label}</button>
        ))}
      </div>

      <div className="mch-toolbar">
        <div className="mch-search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索商品名称" />
        </div>
      </div>

      {loading ? (
        <div className="mch-loading">加载中...</div>
      ) : list.length === 0 ? (
        <div className="mch-empty-big"><Icon name="box" size={40} /><div className="mt-12">暂无商品</div></div>
      ) : (
        <div className="mch-table-wrap">
          <table className="mch-table mch-table-full">
            <thead><tr><th>商品</th><th>所属商家</th><th>价格</th><th>库存</th><th>销量</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="mch-cell-prod">
                    <img src={p.primary_image || (p.images && p.images[0])} alt="" />
                    <span className="mch-prod-name">{p.name}</span>
                  </td>
                  <td className="muted">{p.merchant_name}</td>
                  <td className="price">¥{p.price}</td>
                  <td>{p.stock}</td>
                  <td>{p.sold_count}</td>
                  <td><span className={`badge badge-${(STATUS[p.status] || STATUS.active).c}`}>{(STATUS[p.status] || STATUS.active).t}</span></td>
                  <td>
                    <div className="mch-ops">
                      <button className={`mch-op ${p.status === 'active' ? 'mch-op-danger' : ''}`} title={p.status === 'active' ? '强制下架' : '恢复上架'} onClick={() => onToggle(p)}>
                        <Icon name={p.status === 'active' ? 'eye' : 'check'} size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
