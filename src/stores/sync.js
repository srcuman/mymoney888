import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import syncService from '../services/sync-service.js'

export const useSyncStore = defineStore('sync', () => {
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)
  const lastSyncTime = ref(null)
  const syncStatus = ref('idle')
  const syncErrors = ref([])
  const syncHistory = ref([])

  const canSync = computed(() => isOnline.value && !isSyncing.value)
  const hasSyncErrors = computed(() => syncErrors.value.length > 0)
  const syncInProgress = computed(() => isSyncing.value)

  function setupNetworkListeners() {
    window.addEventListener('online', () => {
      isOnline.value = true
      autoSync()
    })
    
    window.addEventListener('offline', () => {
      isOnline.value = false
    })
  }

  async function sync(options = {}) {
    if (!canSync.value) {
      console.log('无法同步：离线或正在同步中')
      return null
    }

    try {
      const result = await syncService.sync(options)
      
      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'
      syncErrors.value = []
      
      addToSyncHistory({
        timestamp: lastSyncTime.value,
        status: 'success',
        result: result
      })
      
      return result
    } catch (error) {
      console.error('同步失败:', error)
      syncStatus.value = 'error'
      syncErrors.value = syncService.syncErrors.value
      
      addToSyncHistory({
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message
      })
      
      throw error
    }
  }

  async function autoSync() {
    if (canSync.value) {
      await sync()
    }
  }

  async function forceSync() {
    await sync({ force: true })
  }

  async function syncAccounts() {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user && user.id) {
      return await syncService.syncAccounts(user.id)
    }
  }

  async function syncTransactions() {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user && user.id) {
      return await syncService.syncTransactions(user.id)
    }
  }

  async function syncCategories() {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user && user.id) {
      return await syncService.syncCategories(user.id)
    }
  }

  function clearSyncErrors() {
    syncErrors.value = []
    syncService.clearSyncErrors()
  }

  function addToSyncHistory(record) {
    syncHistory.value.unshift(record)
    if (syncHistory.value.length > 50) {
      syncHistory.value = syncHistory.value.slice(0, 50)
    }
  }

  function clearSyncHistory() {
    syncHistory.value = []
  }

  function getSyncStatus() {
    return {
      isOnline: isOnline.value,
      isSyncing: isSyncing.value,
      lastSyncTime: lastSyncTime.value,
      syncStatus: syncStatus.value,
      hasErrors: hasSyncErrors.value,
      errors: syncErrors.value,
      history: syncHistory.value
    }
  }

  function loadSyncState() {
    const syncState = localStorage.getItem('syncState')
    if (syncState) {
      const state = JSON.parse(syncState)
      lastSyncTime.value = state.lastSyncTime
      syncErrors.value = state.syncErrors || []
    }
  }

  function saveSyncState() {
    localStorage.setItem('syncState', JSON.stringify({
      lastSyncTime: lastSyncTime.value,
      syncErrors: syncErrors.value
    }))
  }

  setupNetworkListeners()
  loadSyncState()

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    syncStatus,
    syncErrors,
    syncHistory,
    canSync,
    hasSyncErrors,
    syncInProgress,
    sync,
    autoSync,
    forceSync,
    syncAccounts,
    syncTransactions,
    syncCategories,
    clearSyncErrors,
    clearSyncHistory,
    getSyncStatus,
    loadSyncState,
    saveSyncState
  }
})