import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 前后端分离：开发时 /api 由 Vite 代理到 Flask(:5000)
// 后端就绪后，把 .env 里 VITE_USE_MOCK 改为 false 即可无缝切换到真实接口
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
})
