// 后端服务器
// 用于处理升级请求和其他API请求

const express = require('express')
const { exec } = require('child_process')
const path = require('path')
const app = express()
const port = 8888

// 中间件
app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

// 升级API
app.post('/api/upgrade', (req, res) => {
  console.log('收到升级请求')
  
  // 执行升级脚本
  exec('/app/scripts/upgrade.sh', (error, stdout, stderr) => {
    if (error) {
      console.error('升级失败:', error)
      res.json({
        success: false,
        message: `升级失败: ${error.message}`,
        stderr: stderr
      })
      return
    }
    
    console.log('升级成功:', stdout)
    res.json({
      success: true,
      message: '升级成功，请重启容器',
      stdout: stdout
    })
  })
})

// 升级状态API
app.get('/api/upgrade/status', (req, res) => {
  res.json({
    status: 'ready',
    message: '升级服务正常运行'
  })
})

// 版本API
app.get('/api/version', (req, res) => {
  const packageJson = require('./package.json')
  res.json({
    version: packageJson.version
  })
})

// 健康检查API
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// 处理所有其他请求，返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`)
  console.log('升级服务已就绪')
})
