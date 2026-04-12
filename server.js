// MyMoney888 数据同步服务器
// 版本: 3.8.0
// 支持本地数据与MySQL数据库的双向同步
// 支持本地文件备份（双重持久化）

import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8888

// ============ 数据持久化配置 ============
// 数据存储目录（支持环境变量配置）
const DATA_DIR = process.env.DATA_DIR 
  ? path.resolve(process.env.DATA_DIR) 
  : path.join(__dirname, 'data')

// 自动备份配置
const AUTO_BACKUP_INTERVAL = parseInt(process.env.AUTO_BACKUP_INTERVAL || '30') // 分钟
const AUTO_BACKUP_ON_CHANGE = process.env.AUTO_BACKUP_ON_CHANGE !== 'false'

// 确保数据目录存在且可写
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o777 })
      console.log(`✅ 创建数据目录: ${DATA_DIR}`)
    } catch (error) {
      console.error(`❌ 创建数据目录失败: ${DATA_DIR}`, error.message)
    }
  }
  
  // 检查目录是否可写
  if (fs.existsSync(DATA_DIR)) {
    try {
      const testFile = path.join(DATA_DIR, '.write_test')
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      console.log(`✅ 数据目录可写: ${DATA_DIR}`)
    } catch (error) {
      console.error(`❌ 数据目录不可写: ${DATA_DIR}`, error.message)
    }
  }
}

// ============ 文件备份功能 ============
// 备份数据到本地文件
async function backupToFile(tableName, data) {
  try {
    ensureDataDir()
    const filePath = path.join(DATA_DIR, `${tableName}.json`)
    const backup = {
      table: tableName,
      updatedAt: new Date().toISOString(),
      count: data.length,
      data: data
    }
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf8')
    console.log(`💾 备份成功: ${tableName}.json (${data.length}条)`)
    return true
  } catch (error) {
    console.error(`❌ 备份 ${tableName} 到文件失败:`, error.message)
    return false
  }
}

// 从本地文件恢复数据
async function restoreFromFile(tableName) {
  try {
    const filePath = path.join(DATA_DIR, `${tableName}.json`)
    if (!fs.existsSync(filePath)) {
      return null
    }
    const content = fs.readFileSync(filePath, 'utf8')
    const backup = JSON.parse(content)
    console.log(`📥 从文件恢复 ${tableName} (${backup.count}条, ${backup.updatedAt})`)
    return backup.data
  } catch (error) {
    console.error(`❌ 从文件恢复 ${tableName} 失败:`, error.message)
    return null
  }
}

// 获取所有备份文件列表
function listBackups() {
  try {
    ensureDataDir()
    const files = fs.readdirSync(DATA_DIR)
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const filePath = path.join(DATA_DIR, f)
        const stats = fs.statSync(filePath)
        return {
          name: f,
          table: f.replace('.json', ''),
          size: stats.size,
          modified: stats.mtime.toISOString()
        }
      })
  } catch (error) {
    console.error('❌ 列出备份文件失败:', error.message)
    return []
  }
}

// 自动备份定时器
let backupTimer = null
function startAutoBackup() {
  if (AUTO_BACKUP_INTERVAL <= 0) {
    console.log('⏭️  自动备份已禁用')
    return
  }
  
  const intervalMs = AUTO_BACKUP_INTERVAL * 60 * 1000
  backupTimer = setInterval(async () => {
    console.log(`⏰ 执行定时备份...`)
    await backupAllData()
  }, intervalMs)
  
  console.log(`✅ 自动备份已启用，间隔: ${AUTO_BACKUP_INTERVAL}分钟`)
}

// 备份所有同步表的数据
async function backupAllData() {
  const results = {}
  for (const table of SYNC_TABLES) {
    try {
      const connection = await pool.getConnection()
      try {
        const [rows] = await pool.execute(`SELECT * FROM ${table}`)
        await backupToFile(table, rows)
        results[table] = { success: true, count: rows.length }
      } finally {
        connection.release()
      }
    } catch (error) {
      results[table] = { success: false, error: error.message }
    }
  }
  return results
}

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

// 初始化数据目录
ensureDataDir()

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
  res.json({ version: '3.8.1', name: 'MyMoney888' })
})

// 数据目录信息
app.get('/api/data-dir', (req, res) => {
  res.json({
    dataDir: DATA_DIR,
    autoBackup: AUTO_BACKUP_INTERVAL > 0,
    backupInterval: AUTO_BACKUP_INTERVAL,
    backupOnChange: AUTO_BACKUP_ON_CHANGE,
    backups: listBackups()
  })
})

// 手动触发备份
app.post('/api/backup', async (req, res) => {
  try {
    const results = await backupAllData()
    const successCount = Object.values(results).filter(r => r.success).length
    res.json({
      success: true,
      message: `备份完成，成功: ${successCount}/${Object.keys(results).length}`,
      details: results
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 备份指定表
app.post('/api/backup/:table', async (req, res) => {
  const { table } = req.params
  
  if (!SYNC_TABLES.includes(table)) {
    return res.status(400).json({ success: false, error: `不支持的表: ${table}` })
  }
  
  try {
    const connection = await pool.getConnection()
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${table}`)
      await backupToFile(table, rows)
      res.json({ success: true, table, count: rows.length })
    } finally {
      connection.release()
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 从文件恢复指定表
app.post('/api/restore/:table', async (req, res) => {
  const { table } = req.params
  const { data, toDb = true } = req.body
  
  if (!SYNC_TABLES.includes(table)) {
    return res.status(400).json({ success: false, error: `不支持的表: ${table}` })
  }
  
  try {
    // 如果提供了数据，先保存到文件
    if (data && Array.isArray(data)) {
      await backupToFile(table, data)
    }
    
    // 从文件恢复
    const restoreData = data || await restoreFromFile(table)
    if (!restoreData) {
      return res.status(404).json({ success: false, error: '没有找到可恢复的数据' })
    }
    
    // 如果需要同步到数据库
    if (toDb) {
      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()
        
        for (const item of restoreData) {
          const id = item.id
          const fields = Object.keys(item).filter(k => k !== 'id')
          const values = fields.map(k => item[k])
          
          const [existing] = await connection.execute(
            `SELECT id FROM ${table} WHERE id = ?`,
            [id]
          )
          
          if (existing.length > 0) {
            const setClause = fields.map(f => `${f} = ?`).join(', ')
            await connection.execute(
              `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = ?`,
              [...values, id]
            )
          } else {
            const fieldList = ['id', ...fields].join(', ')
            const placeholders = ['?', ...fields.map(() => '?')].join(', ')
            await connection.execute(
              `INSERT INTO ${table} (${fieldList}) VALUES (${placeholders})`,
              [id, ...values]
            )
          }
        }
        
        await connection.commit()
        res.json({ success: true, table, count: restoreData.length, toDb: true })
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    } else {
      res.json({ success: true, table, count: restoreData.length, toDb: false })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
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
  const { userId, table, data, ledgerId } = req.body
  
  // 兼容两种格式：单个表同步 或 多表数据同步
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数: userId' 
    })
  }
  
  // 如果提供了 ledgerId，设置默认账套
  const effectiveLedgerId = ledgerId || 'default'
  
  // 如果是单个表同步（旧格式兼容）
  if (table && data) {
    if (!SYNC_TABLES.includes(table)) {
      return res.status(400).json({ 
        success: false, 
        error: `不支持的表: ${table}` 
      })
    }
    
    // 单表同步逻辑
    try {
      const connection = await pool.getConnection()
      
      try {
        await connection.beginTransaction()
        
        let successCount = 0
        let errorCount = 0
        const errors = []
        
        const dataArray = Array.isArray(data) ? data : []
        
        for (const item of dataArray) {
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
        
        // 自动备份到本地文件（双重保险）
        let backupSuccess = false
        if (AUTO_BACKUP_ON_CHANGE && successCount > 0) {
          try {
            const [rows] = await pool.execute(
              `SELECT * FROM ${table} WHERE user_id = ?`,
              [userId]
            )
            backupSuccess = await backupToFile(table, rows)
          } catch (backupError) {
            console.warn(`同步后备份失败: ${backupError.message}`)
          }
        }
        
        res.json({
          success: true,
          table,
          total: dataArray.length,
          successCount,
          errorCount,
          errors: errorCount > 0 ? errors : null,
          backedUp: backupSuccess
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
    return
  }
  
  // 如果 data 是对象（多表数据格式），处理多表同步
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const results = {}
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      for (const [tableName, tableData] of Object.entries(data)) {
        if (!SYNC_TABLES.includes(tableName)) continue
        if (!Array.isArray(tableData)) continue
        
        let successCount = 0
        let errorCount = 0
        
        for (const item of tableData) {
          try {
            const id = item.id
            const fields = Object.keys(item).filter(k => k !== 'id')
            const values = fields.map(k => item[k])
            
            const [existing] = await connection.execute(
              `SELECT id FROM ${tableName} WHERE id = ?`,
              [id]
            )
            
            if (existing.length > 0) {
              const setClause = fields.map(f => `${f} = ?`).join(', ')
              await connection.execute(
                `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = ?`,
                [...values, id]
              )
            } else {
              const fieldList = ['id', ...fields].join(', ')
              const placeholders = ['?', ...fields.map(() => '?')].join(', ')
              await connection.execute(
                `INSERT INTO ${tableName} (${fieldList}) VALUES (${placeholders})`,
                [id, ...values]
              )
            }
            successCount++
          } catch (itemError) {
            errorCount++
          }
        }
        
        results[tableName] = { successCount, errorCount }
        
        // 自动备份
        if (AUTO_BACKUP_ON_CHANGE && successCount > 0) {
          await backupToFile(tableName, tableData)
        }
      }
      
      await connection.commit()
      
      res.json({
        success: true,
        ledgerId: effectiveLedgerId,
        results,
        message: '多表同步完成'
      })
      
    } catch (error) {
      await connection.rollback()
      console.error('多表同步失败:', error)
      res.status(500).json({ 
        success: false, 
        error: error.message 
      })
    } finally {
      connection.release()
    }
    return
  }
  
  // 如果 data 是数组（旧格式兼容）
  if (data && Array.isArray(data)) {
    res.status(400).json({ 
      success: false, 
      error: '缺少 table 参数' 
    })
    return
  }
  
  res.status(400).json({ 
    success: false, 
    error: '无效的请求数据' 
  })
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
  console.log(`📦 版本: 3.8.0`)
  console.log(`📁 数据目录: ${DATA_DIR}`)
  
  // 测试数据库连接
  const dbConnected = await testConnection()
  if (!dbConnected) {
    console.warn('⚠️  数据库连接失败，服务器将以离线模式启动')
    console.log('💡 提示: 可使用 /api/backup 从文件恢复数据')
  }
  
  // 启动自动备份定时器
  startAutoBackup()
  
  app.listen(PORT, () => {
    console.log(`✅ 服务器运行在 http://localhost:${PORT}`)
    console.log(`📡 API 端点: http://localhost:${PORT}/api`)
    console.log(`🔄 同步服务: http://localhost:${PORT}/api/sync`)
    console.log(`💾 备份服务: http://localhost:${PORT}/api/backup`)
    console.log(`📥 恢复服务: http://localhost:${PORT}/api/restore/{table}`)
  })
}

startServer()

export default app
