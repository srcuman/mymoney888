// MyMoney888 数据同步服务器
// 版本: 3.6.0
// 支持本地数据与MySQL数据库的双向同步

import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8888

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'mymoney888',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mymoney888',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
})

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ 数据库连接成功')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    return false
  }
}

// 允许同步的表列表
const SYNC_TABLES = [
  'users',
  'accounts',
  'categories',
  'transactions',
  'credit_cards',
  'credit_card_bills',
  'loans',
  'loan_payments',
  'installment_templates',
  'installments',
  'merchants',
  'projects',
  'members',
  'investment_accounts',
  'investment_details',
  'net_value_history',
  'dimensions',
  'ledgers',
  'user_defaults',
  'user_settings',
  'sync_logs'
]

// 同步日志
async function logSync(userId, tableName, type, recordCount, status, errorMessage = null) {
  try {
    await pool.execute(
      `INSERT INTO sync_logs (user_id, sync_type, table_name, record_count, status, error_message) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, tableName, recordCount, status, errorMessage]
    )
  } catch (error) {
    console.error('记录同步日志失败:', error.message)
  }
}

// ============================================
// API 路由
// ============================================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 版本信息
app.get('/api/version', (req, res) => {
  res.json({ version: '3.6.0', name: 'MyMoney888' })
})

// 数据库连接测试
app.get('/api/db/test', async (req, res) => {
  try {
    const connection = await pool.getConnection()
    connection.release()
    res.json({ status: 'connected', message: '数据库连接正常' })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
})

// ============================================
// 数据同步 API
// ============================================

// 获取同步表列表
app.get('/api/sync/tables', (req, res) => {
  res.json({ tables: SYNC_TABLES })
})

// 同步数据到数据库 (Local -> MySQL)
app.post('/api/sync', async (req, res) => {
  const { userId, table, data } = req.body
  
  if (!userId || !table || !data) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数: userId, table, data' 
    })
  }
  
  if (!SYNC_TABLES.includes(table)) {
    return res.status(400).json({ 
      success: false, 
      error: `不支持的表: ${table}` 
    })
  }
  
  try {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      let successCount = 0
      let errorCount = 0
      const errors = []
      
      for (const item of data) {
        try {
          // 构建 UPSERT 语句
          const id = item.id
          const fields = Object.keys(item).filter(k => k !== 'id')
          const values = fields.map(k => item[k])
          
          // 检查记录是否存在
          const [existing] = await connection.execute(
            `SELECT id FROM ${table} WHERE id = ?`,
            [id]
          )
          
          if (existing.length > 0) {
            // 更新
            const setClause = fields.map(f => `${f} = ?`).join(', ')
            await connection.execute(
              `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = ?`,
              [...values, id]
            )
          } else {
            // 插入
            const fieldList = ['id', ...fields].join(', ')
            const placeholders = ['?', ...fields.map(() => '?')].join(', ')
            await connection.execute(
              `INSERT INTO ${table} (${fieldList}) VALUES (${placeholders})`,
              [id, ...values]
            )
          }
          successCount++
        } catch (itemError) {
          errorCount++
          errors.push({ id: item.id, error: itemError.message })
        }
      }
      
      await connection.commit()
      
      // 记录同步日志
      await logSync(
        userId, 
        table, 
        'local_to_db', 
        successCount, 
        errorCount > 0 ? 'partial' : 'success',
        errorCount > 0 ? JSON.stringify(errors) : null
      )
      
      res.json({
        success: true,
        table,
        total: data.length,
        successCount,
        errorCount,
        errors: errorCount > 0 ? errors : null
      })
      
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
    
  } catch (error) {
    console.error(`同步 ${table} 失败:`, error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// 从数据库获取数据 (MySQL -> Local)
app.get('/api/sync', async (req, res) => {
  const { userId, table, lastSyncTime } = req.query
  
  if (!userId || !table) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数: userId, table' 
    })
  }
  
  if (!SYNC_TABLES.includes(table)) {
    return res.status(400).json({ 
      success: false, 
      error: `不支持的表: ${table}` 
    })
  }
  
  try {
    let query = `SELECT * FROM ${table} WHERE user_id = ?`
    const params = [userId]
    
    // 如果指定了上次同步时间，只获取更新的数据
    if (lastSyncTime) {
      query += ` AND updated_at > ?`
      params.push(lastSyncTime)
    }
    
    const [rows] = await pool.execute(query, params)
    
    res.json({
      success: true,
      table,
      count: rows.length,
      data: rows
    })
    
  } catch (error) {
    console.error(`获取 ${table} 失败:`, error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// 获取用户所有数据
app.get('/api/sync/all', async (req, res) => {
  const { userId, lastSyncTime } = req.query
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数: userId' 
    })
  }
  
  try {
    const result = {}
    
    for (const table of SYNC_TABLES) {
      try {
        let query = `SELECT * FROM ${table} WHERE user_id = ?`
        const params = [userId]
        
        if (lastSyncTime) {
          query += ` AND updated_at > ?`
          params.push(lastSyncTime)
        }
        
        const [rows] = await pool.execute(query, params)
        result[table] = {
          success: true,
          count: rows.length,
          data: rows
        }
      } catch (tableError) {
        result[table] = {
          success: false,
          error: tableError.message
        }
      }
    }
    
    res.json({
      success: true,
      userId,
      tables: result
    })
    
  } catch (error) {
    console.error('获取所有数据失败:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// ============================================
// 账户余额计算视图 (数据库层面计算)
// ============================================

// 获取账户余额（包括从交易记录计算）
app.get('/api/accounts/balance', async (req, res) => {
  const { userId } = req.query
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数: userId' 
    })
  }
  
  try {
    // 使用视图获取账户余额
    const [rows] = await pool.execute(
      `SELECT * FROM v_account_balance WHERE user_id = ?`,
      [userId]
    )
    
    res.json({
      success: true,
      accounts: rows
    })
    
  } catch (error) {
    // 如果视图不存在，使用简单查询
    try {
      const [accounts] = await pool.execute(
        `SELECT * FROM accounts WHERE user_id = ?`,
        [userId]
      )
      
      res.json({
        success: true,
        accounts,
        note: '视图不可用，使用账户表数据'
      })
    } catch (fallbackError) {
      console.error('获取账户余额失败:', fallbackError)
      res.status(500).json({ 
        success: false, 
        error: fallbackError.message 
      })
    }
  }
})

// ============================================
// 用户管理 API
// ============================================

// 获取用户信息
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params
  
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, email, created_at, last_login_at, is_active FROM users WHERE id = ?`,
      [id]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '用户不存在' 
      })
    }
    
    res.json({
      success: true,
      user: rows[0]
    })
    
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// 更新最后登录时间
app.post('/api/users/:id/login', async (req, res) => {
  const { id } = req.params
  
  try {
    await pool.execute(
      `UPDATE users SET last_login_at = NOW() WHERE id = ?`,
      [id]
    )
    
    res.json({ success: true })
    
  } catch (error) {
    console.error('更新登录时间失败:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// ============================================
// 静态文件服务
// ============================================

app.use(express.static(path.join(__dirname, 'dist')))

// 处理 SPA 路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ============================================
// 启动服务器
// ============================================

async function startServer() {
  console.log('🚀 MyMoney888 数据同步服务器启动中...')
  console.log(`📦 版本: 3.6.0`)
  
  // 测试数据库连接
  const dbConnected = await testConnection()
  if (!dbConnected) {
    console.warn('⚠️  数据库连接失败，服务器将以离线模式启动')
  }
  
  app.listen(PORT, () => {
    console.log(`✅ 服务器运行在 http://localhost:${PORT}`)
    console.log(`📡 API 端点: http://localhost:${PORT}/api`)
    console.log(`🔄 同步服务: http://localhost:${PORT}/api/sync`)
  })
}

startServer()

export default app
