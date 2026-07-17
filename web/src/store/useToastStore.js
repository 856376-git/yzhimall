import { create } from 'zustand'

let uid = 0

export const useToastStore = create((set) => ({
  toasts: [],
  show: (msg, type = 'info') =>
    set((s) => {
      const id = ++uid
      const toasts = [...s.toasts, { id, msg, type }]
      setTimeout(() => {
        set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) }))
      }, 2200)
      return { toasts }
    }),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = (msg, type) => useToastStore.getState().show(msg, type)
