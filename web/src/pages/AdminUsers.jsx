import { useEffect, useState, useMemo } from 'react'
import Icon from '../components/Icon'
import { AdminAPI } from '../api'
import { toast } from '../store/useToastStore'

const ROLE_LABEL = { buyer: '买家', merchant: '商家', admin: '管理员' }
const ROLES = [
  { k: 'all', label: '全部' },
  { k: 'buyer', label: '买家' },
  { k: 'merchant', label: '商家' },
  { k: 'admin', label: '管理员' },
]
const roleTone = (r) => (r === 'merchant' ? 'b' : r === 'admin' ? 'g' : 'm')

export default function AdminUsers() {
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')

  const reload = () => {
    setLoading(true)
    AdminAPI.users({ role: 'all' }).then((r) => setAll((r.data && r.data.items) || [])).finally(() => setLoading(false))
  }
  useEffect(() => { reload() }, [])

  const list = useMemo(() => {
    let l = all
    if (tab !== 'all') l = l.filter((u) => u.role === tab)
    if (q.trim()) {
      const k = q.trim().toLowerCase()
      l = l.filter((u) => u.account.toLowerCase().includes(k) || u.nickname.toLowerCase().includes(k))
    }
    return l
  }, [all, tab, q])

  const onToggle = async (u) => {
    const r = await AdminAPI.toggleUser(u.id)
    if (r.code === 200) { toast(u.status === 'active' ? '已锁定该用户' : '已解锁该用户', 'success'); reload() }
    else toast(r.msg || '操作失败', 'error')
  }
  const onRole = async (u, role) => {
    const r = await AdminAPI.setRole(u.id, role)
    if (r.code === 200) { toast('角色已更新', 'success'); reload() }
    else toast(r.msg || '操作失败', 'error')
  }

  return (
    <div className="mch-page adm-page">
      <div className="mch-bar"><h2>用户管理</h2><span className="mch-count">共 {list.length} 人</span></div>

      <div className="mch-tabs">
        {ROLES.map((t) => (
          <button key={t.k} className={`mch-tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}>{t.label}</button>
        ))}
      </div>

      <div className="mch-toolbar">
        <div className="mch-search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索账号 / 昵称" />
        </div>
      </div>

      {loading ? (
        <div className="mch-loading">加载中...</div>
      ) : list.length === 0 ? (
        <div className="mch-empty-big"><Icon name="user" size={40} /><div className="mt-12">暂无用户</div></div>
      ) : (
        <div className="mch-table-wrap">
          <table className="mch-table mch-table-full">
            <thead><tr><th>账号</th><th>昵称</th><th>角色</th><th>状态</th><th>手机号</th><th>注册时间</th><th>操作</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td className="mono">{u.account}</td>
                  <td>{u.nickname}</td>
                  <td><span className={`badge badge-${roleTone(u.role)}`}>{ROLE_LABEL[u.role]}</span></td>
                  <td><span className={`badge badge-${u.status === 'active' ? 'g' : 'm'}`}>{u.status === 'active' ? '正常' : '已锁定'}</span></td>
                  <td className="muted mono">{u.phone}</td>
                  <td className="muted">{u.created_at}</td>
                  <td>
                    <div className="mch-ops">
                      <select className="adm-role-sel" value={u.role} onChange={(e) => onRole(u, e.target.value)}>
                        <option value="buyer">买家</option>
                        <option value="merchant">商家</option>
                        <option value="admin">管理员</option>
                      </select>
                      <button className={`mch-op ${u.status === 'active' ? 'mch-op-danger' : ''}`} title={u.status === 'active' ? '锁定' : '解锁'} onClick={() => onToggle(u)}>
                        <Icon name={u.status === 'active' ? 'lock' : 'eye'} size={16} />
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
