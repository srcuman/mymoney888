import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 显示版本信息
const version = '3.2.0'
console.log('========================================')
console.log('  MyMoney888 个人记账系统')
console.log(`  版本: ${version}`)
console.log(`  启动时间: ${new Date().toLocaleString()}`)
console.log('========================================')

app.mount('#app')
