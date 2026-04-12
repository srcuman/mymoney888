import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 天天基金实时估值API
      // URL格式: /api/js/000001.js -> http://fundgz.1234567.com.cn/js/000001.js
      '/api/js': {
        target: 'http://fundgz.1234567.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/js/, '/js')
      },
      
      // 腾讯财经股票API
      // URL格式: /stock/sh600519 -> http://qt.gtimg.cn/q=sh600519
      '/stock': {
        target: 'http://qt.gtimg.cn',
        changeOrigin: true,
        rewrite: (path) => {
          // /stock/sh600519 -> /q=sh600519
          if (path.startsWith('/stock/sh')) {
            return path.replace('/stock/sh', '/q=sh')
          }
          // /stock/sz000001 -> /q=sz000001
          if (path.startsWith('/stock/sz')) {
            return path.replace('/stock/sz', '/q=sz')
          }
          return path
        }
      },
      
      // 新浪财经股票API
      // URL格式: /sina/sh600519 -> https://hq.sinajs.cn/list=sh600519
      '/sina': {
        target: 'https://hq.sinajs.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sina/, '/list=')
      }
    }
  }
})