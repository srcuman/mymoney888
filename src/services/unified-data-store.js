/**
 * 统一数据存储服务 (Unified DataStore)
 * 
 * 设计原则：
 * 1. 单一数据源：DataStore 是前端唯一的本地数据源
 * 2. 单向同步：本地变更 -> MySQL -> JSON文件备份
 * 3. 初始化策略：
 *    - 有MySQL数据：MySQL → localStorage
 *    - 无MySQL数据：localStorage → MySQL
 *    - 离线优先：localStorage 作为即时缓存
 * 4. 账套隔离：通过 ledgerId 在 localStorage 中隔离
 * 
 * 数据流向：
 * ┌──────────────────────────────────────────────────────────────┐
 * │  浏览器                                                      │
 * │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
 * │  │   Vue组件   │───►│  DataStore  │───►│ localStorage │     │
 * │  └─────────────┘    └─────────────┘    └─────────────┘     │
 * └─────────────────────────────┬────────────────────────────────┘
 *                              │ 推送变化
 * ┌─────────────────────────────▼────────────────────────────────┐
 * │  服务器                                                      │
 * │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
 * │  │   MySQL     │◄───│  定时备份   │───►│  JSON文件   │      │
 * │  │(主数据源)   │    │             │    │ (Docker卷)  │      │
 * │  └─────────────┘    └─────────────┘    └─────────────┘      │
 * └──────────────────────────────────────────────────────────────┘
 */

import { ref } from 'vue'

class UnifiedDataStore {
  constructor() {
    // 当前账套ID
    this.currentLedgerId = ref(localStorage.getItem('currentLedgerId') || 'default')
    
    // 内部数据存储（按账套隔离）
    this._data = {}
    
    // 数据版本号，用于检测变更
    this._versions = {}
    
    // 同步状态
    this._syncStatus = ref('idle') // idle | syncing | error
    this._lastSyncTime = ref(null)
    
    // 是否在线
    this._isOnline = navigator.onLine
    
    // 初始化
    this._init()
  }

  // 获取账套特定的存储键
  _getStorageKey(key) {
    return `${key}_${this.currentLedgerId.value}`
  }

  // 获取表名映射（前端camelCase -> 后端snake_case）
  _getTableNameMap() {
    return {
      'accounts': 'accounts',
      'transactions': 'transactions',
      'categories': 'categories',
      'creditCards': 'credit_cards',
      'creditCardBills': 'credit_card_bills',
      'loans': 'loans',
      'repaymentPlans': 'repayment_plans',
      'investmentAccounts': 'investment_accounts',
      'investmentDetails': 'investment_details',
      'netValueHistory': 'net_value_history',
      'dimensions': 'dimensions',
      'ledgers': 'ledgers',
      'members': 'members',
      'merchants': 'merchants',
      'tags': 'tags',
      'paymentChannels': 'payment_channels'
    }
  }

  // 初始化
  async _init() {
    // 监听账套切换
    window.addEventListener('ledgerChanged', (e) => {
      this.currentLedgerId.value = e.detail?.ledgerId || 'default'
      this.loadAllData()
    })

    // 监听在线状态
    window.addEventListener('online', () => {
      this._isOnline = true
      this.syncToServer()
    })
    window.addEventListener('offline', () => {
      this._isOnline = false
    })

    // 加载所有数据
    this.loadAllData()

    // 尝试从服务器同步
    if (this._isOnline) {
      await this.initializeFromServer()
    }

    console.log('[UnifiedDataStore] 初始化完成')
  }

  // 加载所有数据到内存
  loadAllData() {
    const keys = [
      'accounts', 'transactions', 'categories', 'creditCards', 
      'creditCardBills', 'loans', 'repaymentPlans', 'investmentAccounts',
      'investmentDetails', 'netValueHistory', 'dimensions', 'ledgers',
      'members', 'merchants', 'tags', 'paymentChannels'
    ]

    for (const key of keys) {
      const storageKey = this._getStorageKey(key)
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          this._data[key] = ref(JSON.parse(saved))
        } catch (e) {
          console.error(`[UnifiedDataStore] 加载 ${key} 失败:`, e)
          this._data[key] = ref([])
        }
      } else {
        this._data[key] = ref([])
      }
      this._versions[key] = 1
    }

    console.log('[UnifiedDataStore] 加载账套数据:', this.currentLedgerId.value)
  }

  // 初始化：从服务器拉取数据
  async initializeFromServer() {
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user || !user.id) {
      console.log('[UnifiedDataStore] 未登录，跳过服务器初始化')
      return
    }

    try {
      console.log('[UnifiedDataStore] 从服务器初始化数据...')
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const tableMap = this._getTableNameMap()

      for (const [localKey, dbTable] of Object.entries(tableMap)) {
        // 跳过账套和维度（按用户隔离，不需要账套）
        if (['dimensions', 'ledgers'].includes(localKey)) {
          const globalKey = localKey
          const saved = localStorage.getItem(globalKey)
          if (saved) {
            this._data[localKey] = ref(JSON.parse(saved))
          }
          continue
        }

        const response = await fetch(`${apiUrl}/sync?userId=${user.id}&table=${dbTable}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data && result.data.length > 0) {
            // 使用服务器数据更新本地
            this._data[localKey].value = result.data
            const storageKey = this._getStorageKey(localKey)
            localStorage.setItem(storageKey, JSON.stringify(result.data))
            console.log(`[UnifiedDataStore] ${localKey} 从服务器同步 (${result.data.length}条)`)
          }
        }
      }

      // 如果服务器没有数据，尝试推送本地数据到服务器
      await this.pushLocalToServer()

      this._lastSyncTime.value = new Date().toISOString()
    } catch (error) {
      console.error('[UnifiedDataStore] 从服务器初始化失败:', error)
    }
  }

  // 推送本地数据到服务器（首次同步或本地有数据但服务器为空）
  async pushLocalToServer() {
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user || !user.id) return

    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    const tableMap = this._getTableNameMap()

    for (const [localKey, dbTable] of Object.entries(tableMap)) {
      const data = this._data[localKey]?.value || []
      if (data.length === 0) continue

      try {
        const response = await fetch(`${apiUrl}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            table: dbTable,
            data: data
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            console.log(`[UnifiedDataStore] ${localKey} 推送到服务器 (${result.successCount}条)`)
          }
        }
      } catch (error) {
        console.error(`[UnifiedDataStore] 推送 ${localKey} 失败:`, error)
      }
    }
  }

  // 获取数据（响应式）
  get(key) {
    if (!this._data[key]) {
      this._data[key] = ref([])
    }
    return this._data[key]
  }

  // 获取原始数据（非响应式）
  getRaw(key) {
    return this._data[key]?.value || []
  }

  // 设置数据
  async set(key, value, options = {}) {
    const { skipSync = false } = options

    this._data[key].value = value
    this._versions[key]++

    // 保存到 localStorage
    const storageKey = this._getStorageKey(key)
    localStorage.setItem(storageKey, JSON.stringify(value))

    // 通知变更
    this._notifyChange(key)

    // 同步到服务器（可选）
    if (!skipSync && this._isOnline) {
      this._syncToServer(key)
    }
  }

  // 添加数据项
  async add(key, item) {
    const data = this.getRaw(key)
    // 确保ID存在
    if (!item.id) {
      item.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    const newData = [item, ...data]
    await this.set(key, newData)
    return item
  }

  // 更新数据项
  async update(key, id, updates) {
    const data = this.getRaw(key)
    const index = data.findIndex(item => String(item.id) === String(id))
    if (index !== -1) {
      const newData = [...data]
      newData[index] = { ...newData[index], ...updates }
      await this.set(key, newData)
      return newData[index]
    }
    return null
  }

  // 删除数据项
  async remove(key, id) {
    const data = this.getRaw(key)
    const newData = data.filter(item => String(item.id) !== String(id))
    await this.set(key, newData)
  }

  // 查找数据项
  find(key, predicate) {
    return this.getRaw(key).find(predicate)
  }

  // 过滤数据
  filter(key, predicate) {
    return this.getRaw(key).filter(predicate)
  }

  // 同步单个表到服务器
  async _syncToServer(key) {
    if (this._syncStatus.value === 'syncing') {
      console.log('[UnifiedDataStore] 同步正在进行中，跳过...')
      return
    }

    this._syncStatus.value = 'syncing'

    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user || !user.id) return

      const tableMap = this._getTableNameMap()
      const dbTable = tableMap[key] || key
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const data = this.getRaw(key)

      const response = await fetch(`${apiUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          table: dbTable,
          data: data
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log(`[UnifiedDataStore] ${key} 已同步到服务器 (${result.successCount}条)`)
        }
      }

      this._syncStatus.value = 'idle'
      this._lastSyncTime.value = new Date().toISOString()
    } catch (error) {
      console.error(`[UnifiedDataStore] 同步 ${key} 失败:`, error)
      this._syncStatus.value = 'error'
    }
  }

  // 同步所有数据到服务器
  async syncToServer() {
    const keys = Object.keys(this._data)
    for (const key of keys) {
      await this._syncToServer(key)
    }
  }

  // 通知变更
  _notifyChange(key) {
    // 派发通用变更事件
    window.dispatchEvent(new CustomEvent('dataChanged', {
      detail: { key, version: this._versions[key] }
    }))

    // 派发特定类型的变更事件
    const eventMap = {
      'transactions': 'transactionsUpdated',
      'accounts': 'accountsUpdated',
      'creditCards': 'creditCardsUpdated',
      'creditCardBills': 'creditCardBillsUpdated',
      'loans': 'loanAccountsUpdated',
      'investmentAccounts': 'investmentAccountsUpdated'
    }

    if (eventMap[key]) {
      window.dispatchEvent(new CustomEvent(eventMap[key]))
    }
  }

  // 手动刷新（从localStorage重新加载）
  async refresh(key) {
    const storageKey = this._getStorageKey(key)
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      this._data[key].value = JSON.parse(saved)
      this._versions[key]++
      this._notifyChange(key)
    }
  }

  // 获取同步状态
  getSyncStatus() {
    return {
      status: this._syncStatus.value,
      lastSyncTime: this._lastSyncTime.value,
      isOnline: this._isOnline,
      currentLedger: this.currentLedgerId.value
    }
  }
}

// 创建单例
const unifiedDataStore = new UnifiedDataStore()

export default unifiedDataStore
export { UnifiedDataStore }
