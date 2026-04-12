import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 天天基金实时估值API
      '/api/js': {
        target: 'http://fundgz.1234567.com.cn/js',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/js/, '')
      },
      // 天天基金基本信息API
      '/fund/pingzhongdata': {
        target: 'http://fund.eastmoney.com/pingzhongdata',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fund\/pingzhongdata/, '')
      },
      // 腾讯财经股票API
      '/stock': {
        target: 'http://qt.gtimg.cn/q=sz',
        changeOrigin: true,
        rewrite: (path) => {
          // 将 /stock/sh123456 转换为 /q=sh123456
          if (path.startsWith('/stock/sh')) {
            return path.replace('/stock/sh', '/q=sh')
          }
          if (path.startsWith('/stock/sz')) {
            return path.replace('/stock/sz', '/q=sz')
          }
          return path.replace('/stock/', '/q=')
        }
      }
    }
  }
})