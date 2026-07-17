import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { MerchantAPI, ProductAPI } from '../api'
import { toast } from '../store/useToastStore'

const STATUS = { active: { t: '在售', c: 'g' }, off: { t: '已下架', c: 'm' } }
const EMPTY = { name: '', subtitle: '', price: '', original_price: '', stock: '', category_id: '', images: [], description: '', status: 'active' }

export default function MerchantProducts() {
  const [list, setList] = useState([])
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [imgUrl, setImgUrl] = useState('')

  const load = () => {
    setLoading(true)
    MerchantAPI.products({ page: 1, per_page: 50, q })
      .then((r) => setList((r.data && r.data.items) || r.data || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [q])
  useEffect(() => { ProductAPI.categories().then((r) => setCats(r.data || [])) }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const openNew = () => { setForm(EMPTY); setEditId(null); setShowModal(true) }
  const openEdit = (p) => { setForm({ ...EMPTY, ...p, stock: p.stock ?? '', category_id: p.category_id ?? '', images: p.images || [] }); setEditId(p.id); setShowModal(true) }
  const addImg = () => { if (imgUrl.trim()) { set('images', [...form.images, imgUrl.trim()]); setImgUrl('') } }
  const rmImg = (i) => set('images', form.images.filter((_, j) => j !== i))

  const save = async () => {
    if (!form.name || form.price === '') { toast('请填写商品名称和价格', 'error'); return }
    try {
      if (editId) await MerchantAPI.updateProduct(editId, form)
      else await MerchantAPI.createProduct(form)
      toast(editId ? '商品已更新' : '上架成功', 'success')
      setShowModal(false)
      load()
    } catch (e) { toast(e.message || '保存失败', 'error') }
  }

  const toggle = async (p) => {
    try { await MerchantAPI.toggleProduct(p.id); toast(p.status === 'active' ? '已下架' : '已上架', 'success'); load() }
    catch (e) { toast(e.message || '操作失败', 'error') }
  }
  const del = async (p) => {
    if (!window.confirm(`确认删除「${p.name}」？`)) return
    try { await MerchantAPI.deleteProduct(p.id); toast('已删除', 'success'); load() }
    catch (e) { toast(e.message || '删除失败', 'error') }
  }

  return (
    <div className="mch-page">
      <div className="mch-bar">
        <h2>商品管理</h2>
        <button className="btn sm" onClick={openNew}><Icon name="plus" size={16} />上架新商品</button>
      </div>

      <div className="mch-toolbar">
        <div className="mch-search"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索商品名称" /></div>
        <div className="mch-count">共 {list.length} 件商品</div>
      </div>

      {loading ? (
        <div className="mch-loading">加载中...</div>
      ) : list.length === 0 ? (
        <div className="mch-empty-big"><Icon name="box" size={56} /><div className="mt-12">还没有商品，上架第一件吧</div><button className="btn mt-20" onClick={openNew}>上架新商品</button></div>
      ) : (
        <div className="mch-table-wrap">
          <table className="mch-table mch-table-full">
            <thead><tr><th>商品</th><th>价格</th><th>库存</th><th>销量</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="mch-cell-prod">
                    <img src={p.primary_image || (p.images && p.images[0])} alt="" />
                    <div className="mch-prod-meta"><div className="mch-prod-name">{p.name}</div><div className="muted">{p.subtitle}</div></div>
                  </td>
                  <td className="price">¥{p.price}</td>
                  <td>{p.stock}</td>
                  <td>{p.sold_count ?? 0}</td>
                  <td><span className={`badge badge-${(STATUS[p.status] || STATUS.active).c}`}>{(STATUS[p.status] || STATUS.active).t}</span></td>
                  <td>
                    <div className="mch-ops">
                      <button className="mch-op" title="编辑" onClick={() => openEdit(p)}><Icon name="edit" size={16} /></button>
                      <button className="mch-op" title={p.status === 'active' ? '下架' : '上架'} onClick={() => toggle(p)}><Icon name="eye" size={16} /></button>
                      <button className="mch-op mch-op-danger" title="删除" onClick={() => del(p)}><Icon name="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="mch-modal" onClick={(e) => { if (e.target.className === 'mch-modal') setShowModal(false) }}>
          <div className="mch-modal-card">
            <div className="mch-modal-head"><h3>{editId ? '编辑商品' : '上架新商品'}</h3><button className="mch-op" onClick={() => setShowModal(false)}><Icon name="close" size={18} /></button></div>
            <div className="mch-modal-body">
              <div className="mch-form-row"><label>商品名称 *</label><input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="请输入商品名称" /></div>
              <div className="mch-form-row"><label>副标题</label><input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="一句话卖点" /></div>
              <div className="mch-form-grid">
                <div className="mch-form-row"><label>售价 *</label><input value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="¥ 0.00" /></div>
                <div className="mch-form-row"><label>原价</label><input value={form.original_price} onChange={(e) => set('original_price', e.target.value)} placeholder="¥ 0.00" /></div>
                <div className="mch-form-row"><label>库存</label><input value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" /></div>
                <div className="mch-form-row"><label>分类</label>
                  <select value={form.category_id} onChange={(e) => set('category_id', Number(e.target.value))}>
                    <option value="">请选择</option>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="mch-form-row"><label>商品图片</label>
                <div className="mch-imgs">
                  {form.images.map((u, i) => (
                    <div className="mch-img-thumb" key={i}><img src={u} alt="" /><button className="mch-img-rm" onClick={() => rmImg(i)}><Icon name="close" size={12} /></button>{i === 0 && <span className="mch-img-cover">主图</span>}</div>
                  ))}
                  <div className="mch-img-add"><Icon name="plus" size={20} /></div>
                </div>
                <div className="mch-img-inp"><input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="粘贴图片地址" /><button className="btn sm line" onClick={addImg}>添加</button></div>
              </div>
              <div className="mch-form-row"><label>商品描述</label><textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="详细介绍商品特色" /></div>
              <div className="mch-form-row"><label>上架状态</label>
                <div className="mch-radio">
                  <label><input type="radio" checked={form.status === 'active'} onChange={() => set('status', 'active')} /> 立即上架</label>
                  <label><input type="radio" checked={form.status === 'off'} onChange={() => set('status', 'off')} /> 暂不上架</label>
                </div>
              </div>
            </div>
            <div className="mch-modal-foot">
              <button className="btn line" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn" onClick={save}>{editId ? '保存修改' : '上架'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
