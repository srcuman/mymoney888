/**
 * PostgreSQL 同步服务
 * 
 * =============================================================================
 * 设计理念：★★★ 数据为核心，标签化存储，无损迭代 ★★★
 * =============================================================================
 * 
 * 功能说明：
 * - 独立的数据同步模块
 * - 支持前端 DataStore 与 PostgreSQL 的双向同步
 * - 遵循"衍生数据不存储"原则
 * - 自动处理同步冲突
 * 
 * 同步表列表（与 database/init-db.sql 保持一致）：
 * - transactions: 交易记录（核心事实数据）
 * - accounts: 账户定义（不含余额）
 * - categories: 分类定义
 * - credit_cards: 信用卡定义（不含可用额度）
 * - credit_card_bills: 信用卡账单
 * - loans: 贷款定义（不含剩余金额）
 * - loan_payments: 贷款还款记录
 * - investment_accounts: 投资账户定义（不含总资产）
 * - investment_holdings: 投资明细（持仓）
 * - nav_history: 净值历史
 * - investment_transfers: 投资内部转账
 * - investment_profit_records: 投资损益记录
 * - dimensions: 维度配置
 * - ledgers: 账套
 * - users: 用户
 * - user_settings: 用户设置
 * 
 * =============================================================================
 * 版本: 3.9.0 (PostgreSQL)
 * =============================================================================
 */

import apiService from './api-service.js'

class PostgresSyncService {
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
    
    console.log('[PostgresSync] v3.9.0 初始化完成')
    console.log('[PostgresSync] 数据库: PostgreSQL')
    console.log('[PostgresSync] 架构: 数据为核心，标签化存储')
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
    
    console.log('[PostgresSync] 自动同步已启动')
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this._syncTimer) {
      clearInterval(this._syncTimer)
      this._syncTimer = null
    }
    console.log('[PostgresSync] 自动同步已停止')
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
      console.log('[PostgresSync] 同步已在进行中')
      return
    }

    if (!navigator.onLine) {
      console.log('[PostgresSync] 离线状态，跳过同步')
      return
    }

    this.isSyncing = true
    this.syncErrors = []

    try {
      // 获取用户ID和账套ID
      const userId = localStorage.getItem('userId')
      const ledgerId = localStorage.getItem('currentLedgerId') || 'default'

      if (!userId) {
        console.log('[PostgresSync] 用户未登录，跳过同步')
        return
      }

      // 确定要同步的表
      const tablesToSync = tables || this._getAllTables()
      
      const results = {}
      
      for (const table of tablesToSync) {
        try {
          results[table] = await this._syncTable(table, userId, ledgerId)
        } catch (error) {
          console.error(`[PostgresSync] 同步表 ${table} 失败:`, error)
          results[table] = { success: false, error: error.message }
          this.syncErrors.push({ table, error: error.message })
        }
      }

      this.lastSyncTime = new Date().toISOString()
      
      // 保存同步状态
      this._saveSyncState()
      
      console.log('[PostgresSync] 同步完成:', results)
      return results

    } catch (error) {
      console.error('[PostgresSync] 同步失败:', error)
      throw error
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * 同步单个表
   */
  async _syncTable(table, userId, ledgerId) {
    // 获取本地数据（从 DataStore）
    const data = this._getLocalData(table)
    
    if (!data || data.length === 0) {
      return { success: true, message: '无数据' }
    }

    // 发送到服务器
    const response = await apiService.post('/sync', {
      table,
      userId,
      ledgerId,
      data: data,
      timestamp: new Date().toISOString()
    })

    return { success: true, count: response.count || 0 }
  }

  /**
   * 获取本地数据（从 DataStore）
   */
  _getLocalData(table) {
    // 尝试从 CoreDataStore 获取
    if (window.coreDataStore) {
      const data = window.coreDataStore.getRaw(table)
      if (data && data.length > 0) {
        return data
      }
    }
    
    // 尝试从旧版 DataStore 获取
    if (window.dataStore) {
      // 表名映射（camelCase -> snake_case）
      const tableMap = {
        'creditCards': 'credit_cards',
        'creditCardBills': 'credit_card_bills',
        'investmentAccounts': 'investment_accounts',
        'investmentHoldings': 'investment_holdings',
        'navHistory': 'nav_history',
        'investmentTransfers': 'investment_transfers',
        'loanPayments': 'loan_payments',
        'installmentTemplates': 'installment_templates'
      }
      const mappedTable = tableMap[table] || table
      const data = window.dataStore.getRaw(mappedTable)
      if (data && data.length > 0) {
        return data
      }
    }
    
    return null
  }

  /**
   * 从服务器拉取数据
   */
  async pull(userId = null, ledgerId = null) {
    if (!navigator.onLine) {
      console.log('[PostgresSync] 离线状态，跳过拉取')
      return
    }

    userId = userId || localStorage.getItem('userId')
    ledgerId = ledgerId || localStorage.getItem('currentLedgerId') || 'default'

    if (!userId) {
      console.log('[PostgresSync] 用户未登录，跳过拉取')
      return
    }

    try {
      const response = await apiService.get('/sync/all', { userId, ledgerId })
      
      if (response.data) {
        // 更新到 DataStore
        for (const [table, data] of Object.entries(response.data)) {
          this._updateLocalData(table, data)
        }
        
        console.log('[PostgresSync] 拉取完成')
        return response.data
      }

    } catch (error) {
      console.error('[PostgresSync] 拉取失败:', error)
      throw error
    }
  }

  /**
   * 更新本地数据
   */
  _updateLocalData(table, data) {
    // 更新到 CoreDataStore
    if (window.coreDataStore) {
      window.coreDataStore._data.value[table] = data
    }
    
    // 更新到旧版 DataStore
    if (window.dataStore) {
      const tableMap = {
        'credit_cards': 'creditCards',
        'credit_card_bills': 'creditCardBills',
        'investment_accounts': 'investmentAccounts',
        'investment_holdings': 'investmentHoldings',
        'nav_history': 'navHistory',
        'investment_transfers': 'investmentTransfers',
        'loan_payments': 'loanPayments',
        'installment_templates': 'installmentTemplates'
      }
      const mappedTable = tableMap[table] || table
      window.dataStore._data.value[mappedTable] = ref(data)
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
    
    console.log('[PostgresSync] 全量同步完成')
  }

  // =========================================================================
  // 工具方法
  // =========================================================================

  /**
   * 获取所有表名（snake_case）
   */
  _getAllTables() {
    return [
      // 核心数据
      'transactions',
      'accounts',
      'categories',
      
      // 信用卡
      'credit_cards',
      'credit_card_bills',
      
      // 贷款
      'loans',
      'loan_payments',
      
      // 投资
      'investment_accounts',
      'investment_holdings',
      'nav_history',
      'investment_transfers',
      'investment_profit_records',
      
      // 分期
      'installment_templates',
      'installments',
      
      // 系统数据
      'dimensions',
      'ledgers',
      'users',
      'user_settings',
      'user_defaults',
      'sync_logs'
    ]
  }

  /**
   * 判断是否为全局表（不按账套隔离）
   */
  _isGlobalTable(table) {
    return ['users', 'user_settings', 'ledgers', 'sync_logs'].includes(table)
  }

  /**
   * 保存同步状态
   */
  _saveSyncState() {
    localStorage.setItem('syncState', JSON.stringify({
      lastSyncTime: this.lastSyncTime,
      syncErrors: this.syncErrors,
      dbType: 'postgresql'
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
      isOnline: navigator.onLine,
      dbType: 'postgresql'
    }
  }
}

// 导出单例
const postgresSyncService = new PostgresSyncService()
export default postgresSyncService
export { PostgresSyncService }
