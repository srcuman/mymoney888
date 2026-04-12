import { ref, computed } from 'vue'

class SyncService {
  constructor() {
    this.isOnline = ref(navigator.onLine)
    this.isSyncing = ref(false)
    this.lastSyncTime = ref(null)
    this.syncStatus = ref('idle')
    this.syncErrors = ref([])
    
    this.setupNetworkListeners()
    this.loadSyncState()
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline.value = true
      this.autoSync()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline.value = false
    })
  }

  loadSyncState() {
    const syncState = localStorage.getItem('syncState')
    if (syncState) {
      const state = JSON.parse(syncState)
      this.lastSyncTime.value = state.lastSyncTime
      this.syncErrors.value = state.syncErrors || []
    }
  }

  saveSyncState() {
    localStorage.setItem('syncState', JSON.stringify({
      lastSyncTime: this.lastSyncTime.value,
      syncErrors: this.syncErrors.value
    }))
  }

  async autoSync() {
    if (this.isOnline.value && !this.isSyncing.value) {
      await this.sync()
    }
  }

  async sync(options = {}) {
    // 扩展同步表列表，包含所有前端存储的数据
    const { force = false, tables = [
      'accounts',
      'transactions',
      'categories',
      'creditCards',
      'creditCardBills',
      'loans',
      'repaymentPlans',
      'investmentAccounts',
      'investmentDetails',
      'dimensions',
      'defaults',
      'ledgers',
      'members',
      'merchants',
      'tags',
      'paymentChannels',
      'user'
    ] } = options
    
    if (this.isSyncing.value) {
      console.log('同步已在进行中...')
      return
    }

    this.isSyncing.value = true
    this.syncStatus.value = 'syncing'
    this.syncErrors.value = []

    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user || !user.id) {
        throw new Error('用户未登录')
      }

      const syncResults = {
        timestamp: new Date().toISOString(),
        tables: {}
      }

      for (const table of tables) {
        try {
          const result = await this.syncTable(table, user.id, force)
          syncResults.tables[table] = result
        } catch (error) {
          console.error(`同步表 ${table} 失败:`, error)
          syncResults.tables[table] = { success: false, error: error.message }
          this.syncErrors.value.push({ table, error: error.message })
        }
      }

      this.lastSyncTime.value = new Date().toISOString()
      this.syncStatus.value = 'success'
      this.saveSyncState()
      
      return syncResults
    } catch (error) {
      console.error('同步失败:', error)
      this.syncStatus.value = 'error'
      this.syncErrors.value.push({ general: error.message })
      this.saveSyncState()
      throw error
    } finally {
      this.isSyncing.value = false
    }
  }

  async syncTable(tableName, userId, force = false) {
    const lastSyncTime = force ? null : this.lastSyncTime.value
    
    const localData = this.getLocalData(tableName)
    const serverData = await this.getServerData(tableName, userId, lastSyncTime)
    
    const result = {
      localCount: localData.length,
      serverCount: serverData.length,
      conflicts: [],
      merged: false
    }

    if (this.hasConflicts(localData, serverData)) {
      const conflicts = this.detectConflicts(localData, serverData)
      result.conflicts = conflicts
      
      if (!force) {
        const resolved = await this.resolveConflicts(conflicts, tableName)
        result.merged = true
        await this.updateLocalData(tableName, resolved.local)
        await this.updateServerData(tableName, userId, resolved.server)
      }
    } else {
      await this.mergeData(tableName, userId, localData, serverData)
    }

    return result
  }

  getLocalData(tableName) {
    const data = localStorage.getItem(tableName)
    return data ? JSON.parse(data) : []
  }

  async getServerData(tableName, userId, lastSyncTime) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    
    const params = new URLSearchParams({
      userId: userId,
      table: tableName
    })
    
    if (lastSyncTime) {
      params.append('lastSyncTime', lastSyncTime)
    }

    try {
      const response = await fetch(`${apiUrl}/sync?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('获取服务器数据失败:', error)
      return []
    }
  }

  hasConflicts(localData, serverData) {
    if (!localData.length || !serverData.length) return false
    
    const localIds = new Set(localData.map(item => item.id))
    const serverIds = new Set(serverData.map(item => item.id))
    
    const commonIds = [...localIds].filter(id => serverIds.has(id))
    
    for (const id of commonIds) {
      const localItem = localData.find(item => item.id === id)
      const serverItem = serverData.find(item => item.id === id)
      
      if (this.isModifiedAfter(localItem, serverItem)) {
        return true
      }
    }
    
    return false
  }

  detectConflicts(localData, serverData) {
    const conflicts = []
    const localIds = new Set(localData.map(item => item.id))
    const serverIds = new Set(serverData.map(item => item.id))
    
    const commonIds = [...localIds].filter(id => serverIds.has(id))
    
    for (const id of commonIds) {
      const localItem = localData.find(item => item.id === id)
      const serverItem = serverData.find(item => item.id === id)
      
      if (this.isModifiedAfter(localItem, serverItem)) {
        conflicts.push({
          id,
          local: localItem,
          server: serverItem,
          type: this.getConflictType(localItem, serverItem)
        })
      }
    }
    
    return conflicts
  }

  isModifiedAfter(localItem, serverItem) {
    const localTime = new Date(localItem.updated_at || localItem.created_at)
    const serverTime = new Date(serverItem.updated_at || serverItem.created_at)
    
    const localModified = localItem._modified ? new Date(localItem._modified) : localTime
    const serverModified = serverItem._modified ? new Date(serverItem._modified) : serverTime
    
    return Math.abs(localModified - serverModified) > 1000
  }

  getConflictType(localItem, serverItem) {
    const localTime = new Date(localItem.updated_at || localItem.created_at)
    const serverTime = new Date(serverItem.updated_at || serverItem.created_at)
    
    if (localTime > serverTime) {
      return 'local_newer'
    } else if (serverTime > localTime) {
      return 'server_newer'
    } else {
      return 'simultaneous'
    }
  }

  async resolveConflicts(conflicts, tableName) {
    const resolved = {
      local: [],
      server: []
    }

    for (const conflict of conflicts) {
      const resolution = await this.promptConflictResolution(conflict, tableName)
      
      if (resolution === 'local') {
        resolved.server.push(conflict.local)
        resolved.local.push(conflict.local)
      } else if (resolution === 'server') {
        resolved.local.push(conflict.server)
        resolved.server.push(conflict.server)
      } else {
        const merged = this.mergeConflictData(conflict.local, conflict.server)
        resolved.local.push(merged)
        resolved.server.push(merged)
      }
    }

    return resolved
  }

  async promptConflictResolution(conflict, tableName) {
    return new Promise((resolve) => {
      const message = `检测到数据冲突 (${tableName} ID: ${conflict.id}):\n\n` +
        `本地数据: ${JSON.stringify(conflict.local, null, 2)}\n\n` +
        `服务器数据: ${JSON.stringify(conflict.server, null, 2)}\n\n` +
        `请选择解决方案:\n` +
        `1. 使用本地数据\n` +
        `2. 使用服务器数据\n` +
        `3. 合并数据`

      const choice = prompt(message, '3')
      
      if (choice === '1') {
        resolve('local')
      } else if (choice === '2') {
        resolve('server')
      } else {
        resolve('merge')
      }
    })
  }

  mergeConflictData(localItem, serverItem) {
    const merged = { ...localItem }
    
    for (const key in serverItem) {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        const localTime = new Date(localItem.updated_at || localItem.created_at)
        const serverTime = new Date(serverItem.updated_at || serverItem.created_at)
        
        if (serverTime > localTime) {
          merged[key] = serverItem[key]
        }
      }
    }
    
    merged._merged = true
    merged._merged_at = new Date().toISOString()
    
    return merged
  }

  async mergeData(tableName, userId, localData, serverData) {
    const localIds = new Set(localData.map(item => item.id))
    const serverIds = new Set(serverData.map(item => item.id))
    
    const localOnly = localData.filter(item => !serverIds.has(item.id))
    const serverOnly = serverData.filter(item => !localIds.has(item.id))
    
    if (localOnly.length > 0) {
      await this.updateServerData(tableName, userId, localOnly)
    }
    
    if (serverOnly.length > 0) {
      await this.updateLocalData(tableName, [...localData, ...serverOnly])
    }
  }

  async updateLocalData(tableName, data) {
    localStorage.setItem(tableName, JSON.stringify(data))
  }

  async updateServerData(tableName, userId, data) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    
    try {
      const response = await fetch(`${apiUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          table: tableName,
          data: data
        })
      })

      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('更新服务器数据失败:', error)
      throw error
    }
  }

  async syncAccounts(userId) {
    return await this.syncTable('accounts', userId)
  }

  async syncTransactions(userId) {
    return await this.syncTable('transactions', userId)
  }

  async syncCategories(userId) {
    return await this.syncTable('categories', userId)
  }

  async forceSync() {
    return await this.sync({ force: true })
  }

  getSyncStatus() {
    return {
      isOnline: this.isOnline.value,
      isSyncing: this.isSyncing.value,
      lastSyncTime: this.lastSyncTime.value,
      syncStatus: this.syncStatus.value,
      hasErrors: this.syncErrors.value.length > 0,
      errors: this.syncErrors.value
    }
  }

  clearSyncErrors() {
    this.syncErrors.value = []
    this.saveSyncState()
  }

  async syncOnDataChange(tableName) {
    if (this.isOnline.value && !this.isSyncing.value) {
      try {
        const user = JSON.parse(localStorage.getItem('user'))
        if (user && user.id) {
          await this.syncTable(tableName, user.id)
        }
      } catch (error) {
        console.error('数据变更同步失败:', error)
      }
    }
  }
}

const syncService = new SyncService()

export default syncService
export { SyncService }