import syncService from './sync-service.js'

class ApiService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    this.timeout = 10000
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: this.timeout
    }

    const mergedOptions = { ...defaultOptions, ...options }

    try {
      const response = await this.fetchWithTimeout(url, mergedOptions)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API请求失败:', error)
      throw error
    }
  }

  async fetchWithTimeout(url, options) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('请求超时')
      }
      throw error
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return await this.request(url, { method: 'GET' })
  }

  async post(endpoint, data = {}) {
    return await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put(endpoint, data = {}) {
    return await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete(endpoint) {
    return await this.request(endpoint, { method: 'DELETE' })
  }

  async login(email, password) {
    try {
      const response = await this.post('/auth/login', { email, password })
      
      if (response.success && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('token', response.data.token)
        
        await syncService.autoSync()
      }
      
      return response
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  async register(userData) {
    try {
      const response = await this.post('/auth/register', userData)
      
      if (response.success && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('token', response.data.token)
        
        await syncService.autoSync()
      }
      
      return response
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  async logout() {
    try {
      await this.post('/auth/logout')
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  async getCurrentUser() {
    try {
      return await this.get('/auth/me')
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  async getAccounts() {
    try {
      const response = await this.get('/accounts')
      return response.data || []
    } catch (error) {
      console.error('获取账户列表失败:', error)
      return []
    }
  }

  async getAccount(id) {
    try {
      const response = await this.get(`/accounts/${id}`)
      return response.data
    } catch (error) {
      console.error('获取账户详情失败:', error)
      throw error
    }
  }

  async createAccount(accountData) {
    try {
      const response = await this.post('/accounts', accountData)
      
      if (response.success && response.data) {
        await syncService.syncOnDataChange('accounts')
      }
      
      return response
    } catch (error) {
      console.error('创建账户失败:', error)
      throw error
    }
  }

  async updateAccount(id, accountData) {
    try {
      const response = await this.put(`/accounts/${id}`, accountData)
      
      if (response.success && response.data) {
        await syncService.syncOnDataChange('accounts')
      }
      
      return response
    } catch (error) {
      console.error('更新账户失败:', error)
      throw error
    }
  }

  async deleteAccount(id) {
    try {
      const response = await this.delete(`/accounts/${id}`)
      
      if (response.success) {
        await syncService.syncOnDataChange('accounts')
      }
      
      return response
    } catch (error) {
      console.error('删除账户失败:', error)
      throw error
    }
  }

  async getTransactions(params = {}) {
    try {
      const response = await this.get('/transactions', params)
      return response.data || []
    } catch (error) {
      console.error('获取交易列表失败:', error)
      return []
    }
  }

  async getTransaction(id) {
    try {
      const response = await this.get(`/transactions/${id}`)
      return response.data
    } catch (error) {
      console.error('获取交易详情失败:', error)
      throw error
    }
  }

  async createTransaction(transactionData) {
    try {
      const response = await this.post('/transactions', transactionData)
      
      if (response.success && response.data) {
        await syncService.syncOnDataChange('transactions')
      }
      
      return response
    } catch (error) {
      console.error('创建交易失败:', error)
      throw error
    }
  }

  async updateTransaction(id, transactionData) {
    try {
      const response = await this.put(`/transactions/${id}`, transactionData)
      
      if (response.success && response.data) {
        await syncService.syncOnDataChange('transactions')
      }
      
      return response
    } catch (error) {
      console.error('更新交易失败:', error)
      throw error
    }
  }

  async deleteTransaction(id) {
    try {
      const response = await this.delete(`/transactions/${id}`)
      
      if (response.success) {
        await syncService.syncOnDataChange('transactions')
      }
      
      return response
    } catch (error) {
      console.error('删除交易失败:', error)
      throw error
    }
  }

  async getCategories() {
    try {
      const response = await this.get('/categories')
      return response.data || []
    } catch (error) {
      console.error('获取分类列表失败:', error)
      return []
    }
  }

  async getCategory(id) {
    try {
      const response = await this.get(`/categories/${id}`)
      return response.data
    } catch (error) {
      console.error('获取分类详情失败:', error)
      throw error
    }
  }

  async createCategory(categoryData) {
    try {
      const response = await this.post('/categories', categoryData)
      
      if (response.success && response.data) {
        await syncService.syncOnDataChange('categories')
      }
      
      return response
    } catch (error) {
      console.error('创建分类失败:', error)
      throw error
    }
  }

  async updateCategory(id, categoryData) {
    try {
      const response = await this.put(`/categories/${id}`, categoryData)
      
      if (response.success && response.data) {
        await syncService.syncOnDataChange('categories')
      }
      
      return response
    } catch (error) {
      console.error('更新分类失败:', error)
      throw error
    }
  }

  async deleteCategory(id) {
    try {
      const response = await this.delete(`/categories/${id}`)
      
      if (response.success) {
        await syncService.syncOnDataChange('categories')
      }
      
      return response
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }

  async getStatistics(params = {}) {
    try {
      const response = await this.get('/statistics', params)
      return response.data || {}
    } catch (error) {
      console.error('获取统计数据失败:', error)
      return {}
    }
  }

  async syncData(table, options = {}) {
    try {
      const response = await this.post('/sync', options)
      return response
    } catch (error) {
      console.error('同步数据失败:', error)
      throw error
    }
  }

  async getSyncLogs(params = {}) {
    try {
      const response = await this.get('/sync/logs', params)
      return response.data || []
    } catch (error) {
      console.error('获取同步日志失败:', error)
      return []
    }
  }

  async getUserSettings() {
    try {
      const response = await this.get('/settings')
      return response.data || {}
    } catch (error) {
      console.error('获取用户设置失败:', error)
      return {}
    }
  }

  async updateUserSetting(key, value) {
    try {
      const response = await this.put('/settings', { key, value })
      return response
    } catch (error) {
      console.error('更新用户设置失败:', error)
      throw error
    }
  }

  async checkConnection() {
    try {
      const response = await this.get('/health')
      return response.success || false
    } catch (error) {
      return false
    }
  }
}

const apiService = new ApiService()

export default apiService
export { ApiService }