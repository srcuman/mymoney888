import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 显示版本信息
import { APP_VERSION } from './config/version.js'

const version = APP_VERSION
console.log('========================================')
console.log('  MyMoney888 个人记账系统')
console.log(`  版本: ${version}`)
console.log(`  启动时间: ${new Date().toLocaleString()}`)
console.log('========================================')

app.mount('#app')
