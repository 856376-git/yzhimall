import { create } from 'zustand'

const CART_KEY = 'yz_cart'
const load = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]') } catch { return [] }
}
const save = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items))

export const useCartStore = create((set) => ({
  items: load(),

  add: (product, skuText, qty = 1) =>
    set((s) => {
      const key = `${product.id}__${skuText || ''}`
      const items = [...s.items]
      const idx = items.findIndex((i) => i.key === key)
      if (idx >= 0) {
        items[idx] = { ...items[idx], quantity: items[idx].quantity + qty }
      } else {
        items.push({
          key,
          product_id: product.id,
          name: product.name,
          price: product.price,
          image: product.primary_image || product.images?.[0],
          skuText: skuText || '默认',
          quantity: qty,
          checked: true,
          stock: product.stock,
        })
      }
      save(items)
      return { items }
    }),

  setQty: (key, qty) =>
    set((s) => {
      const items = s.items.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, qty) } : i))
      save(items)
      return { items }
    }),

  inc: (key) => set((s) => {
    const items = s.items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i))
    save(items); return { items }
  }),
  dec: (key) => set((s) => {
    const items = s.items.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))
    save(items); return { items }
  }),

  remove: (key) => set((s) => {
    const items = s.items.filter((i) => i.key !== key)
    save(items); return { items }
  }),

  toggleCheck: (key) => set((s) => {
    const items = s.items.map((i) => (i.key === key ? { ...i, checked: !i.checked } : i))
    save(items); return { items }
  }),

  toggleAll: (checked) => set((s) => {
    const items = s.items.map((i) => ({ ...i, checked }))
    save(items); return { items }
  }),

  clearChecked: () => set((s) => {
    const items = s.items.filter((i) => !i.checked)
    save(items); return { items }
  }),

  clear: () => { save([]); set({ items: [] }) },
}))

// 选择器:勾选商品 / 件数 / 总价
export const selectChecked = (s) => s.items.filter((i) => i.checked)
export const selectCount = (s) => s.items.reduce((n, i) => n + i.quantity, 0)
export const selectTotal = (s) =>
  s.items.filter((i) => i.checked).reduce((sum, i) => sum + i.price * i.quantity, 0)
export const selectAllChecked = (s) => s.items.length > 0 && s.items.every((i) => i.checked)
