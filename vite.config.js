import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://fundgz.1234567.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/fund': {
        target: 'http://fund.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fund/, '')
      },
      '/stock': {
        target: 'http://qt.gtimg.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/stock/, '')
      }
    }
  }
})