import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

// 6 \u5927\u5206\u7c7b, \u6bcf\u4e2a\u5206\u7c7b 6 \u4e2a\u5e7f\u544a\u5361\u7247
const CATEGORIES = [
  { key: 'phone',   name: '\u624b\u673a\u6570\u7801', emoji: '\ud83d\udcf1' },
  { key: 'appliance', name: '\u5bb6\u7535',       emoji: '\ud83d\udda4' },
  { key: 'digital', name: '\u6570\u7801',         emoji: '\ud83d\udcbb' },
  { key: 'fashion', name: '\u670d\u9970\u978b\u5305', emoji: '\ud83d\udc5f' },
  { key: 'food',    name: '\u98df\u54c1\u9152\u6c34', emoji: '\ud83c\udf4e' },
  { key: 'beauty',  name: '\u7f8e\u5986\u4e2a\u62a4', emoji: '\ud83d\udc84' },
]

// \u6839\u636e category.key \u8fd4\u56de\u8be5\u5206\u7c7b\u4e0b\u7684 6 \u6761\u5e7f\u544a
const POOL = {
  phone: [
    { title: 'iPhone 16 Pro', price: '7999', orig: '8799', tag: '\u70ed\u5356', q: 'iPhone' },
    { title: '\u5c0f\u7c73 14 Ultra', price: '6499', orig: '6999', tag: '\u65b0\u54c1', q: '\u5c0f\u7c73' },
    { title: 'Huawei Mate 70 Pro', price: '6999', orig: '7499', tag: '\u9884\u8ba2', q: 'Mate' },
    { title: 'OPPO Find X8', price: '5299', orig: '5799', tag: '\u4f18\u60e0', q: 'OPPO' },
    { title: 'vivo X200', price: '4999', orig: '5499', tag: '\u70ed\u5356', q: 'vivo' },
    { title: '\u4e09\u661f Galaxy S25', price: '5999', orig: '6499', tag: '\u9650\u91cf', q: '\u4e09\u661f' },
  ],
  appliance: [
    { title: '\u6d77\u5c14 \u53cc\u95f8\u51b0\u7bb1 580L', price: '6499', orig: '7299', tag: '\u70ed\u5356', q: '\u51b0\u7bb1' },
    { title: '\u7f8e\u7684 \u53d8\u9891\u7a7a\u8c03 1.5\u4e70', price: '2999', orig: '3699', tag: '\u9650\u65f6', q: '\u7a7a\u8c03' },
    { title: '\u6d77\u5c14 \u6eda\u7bb1\u6d17\u8863\u673a 10kg', price: '3799', orig: '4899', tag: '\u70ed\u5356', q: '\u6d17\u8863\u673a' },
    { title: '\u4e1c\u829d \u591a\u95e8\u5bb9\u5668\u9171 600L', price: '8999', orig: '9999', tag: '\u9884\u8ba2', q: '\u51b0\u7bb1' },
    { title: '\u4e5d\u9633 \u7535\u996d\u7172 4L', price: '499', orig: '699', tag: '\u4f18\u60e0', q: '\u7535\u996d\u7172' },
    { title: '\u83b1\u5170\u4e07\u548c \u70ed\u6c34\u5668 60L', price: '1499', orig: '1899', tag: '\u70ed\u5356', q: '\u70ed\u6c34\u5668' },
  ],
  digital: [
    { title: 'MacBook Pro M4 14\"', price: '14999', orig: '15999', tag: '\u65b0\u54c1', q: 'MacBook' },
    { title: 'iPad Air M3', price: '4799', orig: '5199', tag: '\u4f18\u60e0', q: 'iPad' },
    { title: '\u8054\u60f3 \u5c0f\u65b0 Pro 14', price: '6999', orig: '7999', tag: '\u70ed\u5356', q: '\u8054\u60f3' },
    { title: 'AirPods Pro 2', price: '1399', orig: '1899', tag: '\u70ed\u5356', q: 'AirPods' },
    { title: 'Apple Watch S10', price: '3199', orig: '3499', tag: '\u9884\u8ba2', q: 'Apple Watch' },
    { title: 'Sony WH-1000XM6', price: '2899', orig: '3299', tag: '\u4f18\u60e0', q: 'Sony' },
  ],
  fashion: [
    { title: '\u5b63\u5e93 \u7537\u58eb\u8fde\u7ed3\u8863', price: '599', orig: '899', tag: '\u4f18\u60e0', q: '\u8fde\u7ed3\u8863' },
    { title: 'Nike Air Max 2026', price: '1299', orig: '1499', tag: '\u65b0\u54c1', q: 'Nike' },
    { title: 'Adidas Ultraboost', price: '1099', orig: '1399', tag: '\u70ed\u5356', q: 'Adidas' },
    { title: 'Uniqlo \u8f6f\u58f0\u7c7b T \u6064', price: '79', orig: '129', tag: '\u4f18\u60e0', q: 'T\u6064' },
    { title: 'Coach \u4ea4\u53c9\u5305', price: '2480', orig: '2980', tag: '\u9650\u91cf', q: '\u5305' },
    { title: '\u4f2f\u6c34\u4e66 \u9632\u6652\u670d\u88c5', price: '1290', orig: '1690', tag: '\u65b0\u54c1', q: '\u9632\u6652' },
  ],
  food: [
    { title: '\u4e09\u53ea\u677e\u9f20 \u65e5\u672c\u575a\u679c\u793c\u76d2', price: '198', orig: '298', tag: '\u70ed\u5356', q: '\u575a\u679c' },
    { title: '\u767d\u9152 \u6d46\u8d35 \u53d1\u9175 6 \u74f6', price: '699', orig: '899', tag: '\u4f18\u60e0', q: '\u767d\u9152' },
    { title: '\u963f\u5e03\u725b\u5976 \u949c\u8d28\u4e73\u949c 12 \u76d2', price: '99', orig: '129', tag: '\u9650\u91cf', q: '\u725b\u5976' },
    { title: '\u519c\u592a\u5c0f\u59d0 \u9633\u5149\u73cd\u73e0\u7c73 5kg', price: '128', orig: '168', tag: '\u70ed\u5356', q: '\u73cd\u73e0\u7c73' },
    { title: '\u6709\u673a\u51b7\u538b\u690d\u7269\u6cb9 1L', price: '189', orig: '229', tag: '\u4f18\u60e0', q: '\u690d\u7269\u6cb9' },
    { title: '\u6c81\u9633\u8fa3\u6912 \u8c46\u8c46\u9165 4 \u74f6', price: '88', orig: '128', tag: '\u65b0\u54c1', q: '\u8c46\u8c46\u9165' },
  ],
  beauty: [
    { title: 'SK-II \u795e\u4ed9\u6c34 230ml', price: '1690', orig: '2090', tag: '\u70ed\u5356', q: 'SK-II' },
    { title: 'Estee Lauder \u5c0f\u68d5\u74f6 50ml', price: '880', orig: '1180', tag: '\u4f18\u60e0', q: '\u5c0f\u68d5\u74f6' },
    { title: 'Lamer \u9762\u9716 30ml', price: '2600', orig: '3200', tag: '\u9650\u91cf', q: 'Lamer' },
    { title: 'YSL \u53e3\u7ea2 \u65b0\u54c1 13 \u8272', price: '320', orig: '420', tag: '\u65b0\u54c1', q: 'YSL' },
    { title: '\u83f2\u52d2\u96f7\u514b\u96f7 \u9632\u6652\u971c 50ml', price: '298', orig: '398', tag: '\u70ed\u5356', q: '\u9632\u6652' },
    { title: '\u4f0a\u838e\u829c \u7f8e\u9ed1\u8d34 \u9762\u819c 10 \u7247', price: '99', orig: '139', tag: '\u4f18\u60e0', q: '\u9762\u819c' },
  ],
}

const PREF_KEY = 'yz_ad_pref_category'

export default function AdRail({ title = '\u4eca\u65e5\u63a8\u8350' }) {
  const nav = useNavigate()
  const [pref, setPref] = useState(() => localStorage.getItem(PREF_KEY) || '')
  const [dismissed, setDismissed] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // \u9009\u4e2d\u7684\u5206\u7c7b: \u82e5\u672a\u9009, \u9ed8\u8ba4\u624b\u673a\u6570\u7801
  const activeKey = pref || 'phone'
  const items = useMemo(() => POOL[activeKey] || POOL.phone, [activeKey])

  // \u70b9 × -> \u5f39\u51fa\u5206\u7c7b\u9009\u62e9
  const onClose = () => setPickerOpen(true)

  // \u9009\u62e9\u5206\u7c7b -> \u8bb0\u4f4f\u4f18\u5148 + \u9690\u85cf\u5e7f\u544a
  const onPick = (key) => {
    localStorage.setItem(PREF_KEY, key)
    setPref(key)
    setPickerOpen(false)
    setDismissed(true)
  }
  const onClear = () => {
    localStorage.removeItem(PREF_KEY)
    setPref('')
    setPickerOpen(false)
    setDismissed(false)
  }

  if (dismissed) return null

  return (
    <div className="ad-rail">
      <div className="ad-rail-head">
        <div className="ad-rail-title">
          <span className="ad-rail-dot"></span>
          <h2>{title}</h2>
          <span className="ad-rail-cat">{CATEGORIES.find((c) => c.key === activeKey)?.name}</span>
        </div>
        <button className="ad-rail-close" onClick={onClose} aria-label="\u4e0d\u611f\u5174\u8da3">
          <Icon name="close" size={14} />
          <span>\u4e0d\u611f\u5174\u8da3</span>
        </button>
      </div>

      <div className="ad-rail-row">
        {items.map((it, i) => (
          <a key={i} className="ad-card" onClick={() => nav(`/products?q=${encodeURIComponent(it.q)}`)}>
            <span className={`ad-card-tag tag-${i % 4}`}>{it.tag}</span>
            <div className="ad-card-name">{it.title}</div>
            <div className="ad-card-price">\u00a5{it.price} <s>\u00a5{it.orig}</s></div>
          </a>
        ))}
      </div>

      {pickerOpen && (
        <div className="ad-modal-mask" onClick={() => setPickerOpen(false)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-head">
              <h3>\u9009\u4e00\u4e2a\u4f60\u66f4\u5173\u5fc3\u7684\u5206\u7c7b</h3>
              <button className="ad-modal-x" onClick={() => setPickerOpen(false)} aria-label="\u5173\u95ed">\u00d7</button>
            </div>
            <div className="ad-modal-grid">
              {CATEGORIES.map((c) => (
                <button key={c.key}
                  className={'ad-modal-item' + (activeKey === c.key ? ' active' : '')}
                  onClick={() => onPick(c.key)}>
                  <span className="ad-modal-emoji">{c.emoji}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
            <div className="ad-modal-foot">
              <button className="btn line sm" onClick={onClear}>\u4e0d\u9009\uff0c\u91cd\u7f6e</button>
              <span className="muted">\u9009\u62e9\u540e\u4e0b\u6b21\u4f1a\u6309\u8be5\u5206\u7c7b\u63a8\u9001</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}