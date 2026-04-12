/**
 * MySQL 同步服务
 * 
 * =============================================================================
 * 功能说明：
 * - 独立的数据同步模块
 * - 支持本地存储层（DataStore）与 MySQL 的双向同步
 * - 支持定时同步和变更触发同步
 * - 自动处理冲突（本地优先）
 * =============================================================================
 */

import apiService from './api-service.js'

class MySQLSyncService {
  constructor() {
    // 同步状态
    this.isSyncing = false
    this.lastSyncTime = null
    this.syncErrors = []
    
    // 同步配置
    this.config = {
      autoSync: true,
      syncInterval: 60000, // 1分钟
      syncOnChange: true,
      batchSize: 100
    }
    
    // 待同步队列
    this._pendingSync = new Set()
    this._syncTimer = null
    
    // 初始化
    this._init()
  }

  _init() {
    // 监听网络状态
    window.addEventListener('online', () => this.sync())
    window.addEventListener('offline', () => this.stopAutoSync())
    
    // 如果配置了自动同步，启动定时器
    if (this.config.autoSync) {
      this.startAutoSync()
    }
    
    console.log('[MySQLSync] 初始化完成')
  }

  // =========================================================================
  // 同步控制
  // =========================================================================

  /**
   * 启动自动同步
   */
  startAutoSync() {
    if (this._syncTimer) return
    
    this._syncTimer = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync()
      }
    }, this.config.syncInterval)
    
    console.log('[MySQLSync] 自动同步已启动')
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this._syncTimer) {
      clearInterval(this._syncTimer)
      this._syncTimer = null
    }
    console.log('[MySQLSync] 自动同步已停止')
  }

  /**
   * 触发同步（当数据变更时调用）
   */
  triggerSync(tableName) {
    if (!this.config.syncOnChange) return
    
    this._pendingSync.add(tableName)
    
    // 防抖：延迟 2 秒后同步
    clearTimeout(this._changeSyncTimer)
    this._changeSyncTimer = setTimeout(() => {
      this.sync([...this._pendingSync])
      this._pendingSync.clear()
    }, 2000)
  }

  /**
   * 执行同步
   */
  async sync(tables = null) {
    if (this.isSyncing) {
      console.log('[MySQLSync] 同步已在进行中')
      return
    }

    if (!navigator.onLine) {
      console.log('[MySQLSync] 离线状态，跳过同步')
      return
    }

    this.isSyncing = true
    this.syncErrors = []

    try {
      // 获取用户ID和账套ID
      const userId = localStorage.getItem('userId')
      const ledgerId = localStorage.getItem('currentLedgerId') || 'default'

      if (!userId) {
        console.log('[MySQLSync] 用户未登录，跳过同步')
        return
      }

      // 确定要同步的表
      const tablesToSync = tables || this._getAllTables()
      
      const results = {}
      
      for (const table of tablesToSync) {
        try {
          results[table] = await this._syncTable(table, userId, ledgerId)
        } catch (error) {
          console.error(`[MySQLSync] 同步表 ${table} 失败:`, error)
          results[table] = { success: false, error: error.message }
          this.syncErrors.push({ table, error: error.message })
        }
      }

      this.lastSyncTime = new Date().toISOString()
      
      // 保存同步状态
      this._saveSyncState()
      
      console.log('[MySQLSync] 同步完成:', results)
      return results

    } catch (error) {
      console.error('[MySQLSync] 同步失败:', error)
      throw error
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * 同步单个表
   */
  async _syncTable(table, userId, ledgerId) {
    // 获取本地数据
    const storageKey = this._isGlobalTable(table)
      ? table
      : `${table}_${ledgerId}`
    
    const localData = localStorage.getItem(storageKey)
    
    if (!localData) {
      return { success: true, message: '无数据' }
    }

    // 发送到服务器
    const response = await apiService.post('/sync', {
      table,
      userId,
      ledgerId,
      data: JSON.parse(localData),
      timestamp: new Date().toISOString()
    })

    return { success: true, count: response.count || 0 }
  }

  /**
   * 从服务器拉取数据
   */
  async pull(userId = null, ledgerId = null) {
    if (!navigator.onLine) {
      console.log('[MySQLSync] 离线状态，跳过拉取')
      return
    }

    userId = userId || localStorage.getItem('userId')
    ledgerId = ledgerId || localStorage.getItem('currentLedgerId') || 'default'

    if (!userId) {
      console.log('[MySQLSync] 用户未登录，跳过拉取')
      return
    }

    try {
      const response = await apiService.get('/sync/all', { userId, ledgerId })
      
      if (response.data) {
        // 合并到本地存储
        for (const [table, data] of Object.entries(response.data)) {
          const storageKey = this._isGlobalTable(table)
            ? table
            : `${table}_${ledgerId}`
          
          // 本地优先：如果本地有数据，不覆盖
          const localData = localStorage.getItem(storageKey)
          if (!localData) {
            localStorage.setItem(storageKey, JSON.stringify(data))
          }
        }
        
        console.log('[MySQLSync] 拉取完成')
        return response.data
      }

    } catch (error) {
      console.error('[MySQLSync] 拉取失败:', error)
      throw error
    }
  }

  /**
   * 全量同步（推送 + 拉取）
   */
  async fullSync() {
    // 先推送本地数据
    await this.sync()
    
    // 再拉取服务器数据
    await this.pull()
    
    // 触发数据更新事件
    window.dispatchEvent(new CustomEvent('dataSynced'))
    
    console.log('[MySQLSync] 全量同步完成')
  }

  // =========================================================================
  // 工具方法
  // =========================================================================

  /**
   * 获取所有表名
   */
  _getAllTables() {
    return [
      // 账套数据
      'accounts', 'transactions', 'categories',
      'creditCards', 'creditCardBills', 'loans', 'repaymentPlans',
      'investmentAccounts', 'investmentDetails', 'netValueHistory', 'investmentProfitRecords',
      // 全局数据
      'dimensions', 'ledgers', 'users', 'settings', 'defaults'
    ]
  }

  /**
   * 判断是否为全局表（不按账套隔离）
   */
  _isGlobalTable(table) {
    return ['dimensions', 'ledgers', 'users', 'settings', 'defaults'].includes(table)
  }

  /**
   * 保存同步状态
   */
  _saveSyncState() {
    localStorage.setItem('syncState', JSON.stringify({
      lastSyncTime: this.lastSyncTime,
      syncErrors: this.syncErrors
    }))
  }

  /**
   * 加载同步状态
   */
  _loadSyncState() {
    const saved = localStorage.getItem('syncState')
    if (saved) {
      const state = JSON.parse(saved)
      this.lastSyncTime = state.lastSyncTime
      this.syncErrors = state.syncErrors || []
    }
  }

  /**
   * 获取同步状态
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      syncErrors: this.syncErrors,
      isOnline: navigator.onLine
    }
  }
}

// 导出单例
const mysqlSyncService = new MySQLSyncService()
export default mysqlSyncService
export { MySQLSyncService }
