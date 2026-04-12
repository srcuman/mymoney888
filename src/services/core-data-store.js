/**
 * 核心数据存储服务 (CoreDataStore)
 * 
 * =============================================================================
 * 设计理念：★★★ 记账是核心，其他功能都是辅助记账而存在的 ★★★
 * =============================================================================
 * 
 * 【架构原则】
 * 
 * 1. 单一数据源
 *    - 所有数据存储在 DataStore 中
 *    - 按账套隔离，数据不冗余
 *    - 通过引用机制减少重复数据
 * 
 * 2. 双份持久化
 *    - DataStore（文件存储层，支持 DATA_DIR 环境变量配置）
 *    - MySQL（服务器备份）
 *    - 两份数据保持同步
 *    - 数据存储路径: DATA_DIR/ledgers/{ledgerId}/*.json
 * 
 * 3. 数据引用机制
 *    - 类似代码中的版本号概念：多处引用，一处写入
 *    - 例如：分类ID在多处使用，但分类名称只存储一份
 *    - 修改时只改一处，所有引用自动更新
 * 
 * 4. 模块联动
 *    - 账户 ← 交易（余额由交易驱动）
 *    - 账户 ← 投资（同步余额）
 *    - 账户 ← 信用卡（还款联动）
 *    - 交易 ← 信用卡（消费记账）
 *    - 交易 ← 投资（损益记录）
 * 
 * =============================================================================
 * 版本: 引用自 src/config/version.js
 * =============================================================================
 */

import { ref, computed, shallowRef } from 'vue'
import { APP_VERSION } from '../config/version.js'

/**
 * 获取 API 基础 URL
 */
function getApiBaseUrl() {
  // 从环境变量或当前页面获取 API 地址
  return window.__API_URL__ || `${window.location.protocol}//${window.location.host}`
}

/**
 * API 请求封装
 */
async function apiRequest(url, options = {}) {
  const baseUrl = getApiBaseUrl()
  try {
    const response = await fetch(`${baseUrl}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    const data = await response.json()
    if (!response.ok && !data.success) {
      throw new Error(data.error || 'API 请求失败')
    }
    return data
  } catch (error) {
    console.error(`[API] ${url} 请求失败:`, error)
    throw error
  }
}

/**
 * 数据类型分类（snake_case 与 MySQL 对应）
 */
const DATA_TYPES = {
  // 核心数据（记账必须依赖）
  CORE: ['transactions', 'accounts', 'categories'],
  
  // 辅助数据（服务记账）
  AUXILIARY: ['credit_cards', 'credit_card_bills', 'loans', 'loan_payments'],

  // 扩展数据（记账的补充）
  EXTENSION: ['investment_accounts', 'investment_details', 'net_value_history', 'investment_profit_records'],
  
  // 维度数据（交易标签）
  DIMENSION: ['members', 'merchants', 'tags', 'payment_channels'],
  
  // 系统数据
  SYSTEM: ['ledgers', 'users', 'user_settings', 'user_defaults']
}

/**
 * 核心数据存储类
 */
class CoreDataStore {
  constructor() {
    // 当前账套ID (从 sessionStorage 获取，不跨标签页共享)
    this.currentLedgerId = ref(sessionStorage.getItem('currentLedgerId') || 'default')
    
    // 当前用户ID
    this.currentUserId = ref(sessionStorage.getItem('userId') || null)
    
    // 内部数据存储
    this._data = shallowRef({})
    
    // 数据引用表（用于去重）
    this._refs = shallowRef({})
    
    // 同步状态
    this._syncStatus = ref('idle')
    this._lastSyncTime = ref(null)
    
    // 在线状态
    this._isOnline = navigator.onLine
    
    // 维度使用情况
    this._dimensionUsage = {}
    
    // 本地缓存（用于离线或 API 不可用时）
    this._localCache = {}
    
    // 初始化
    this._init()
  }

  // =========================================================================
  // 初始化
  // =========================================================================

  async _init() {
    // 监听账套切换
    window.addEventListener('ledgerChanged', (e) => {
      this.switchLedger(e.detail?.ledgerId || 'default')
    })

    // 监听用户切换
    window.addEventListener('userChanged', (e) => {
      this.currentUserId.value = e.detail?.userId || null
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
    await this.loadAllData()

    console.log(`[CoreDataStore] v${APP_VERSION} 初始化完成, 数据目录: ${getApiBaseUrl()}/api/datastore`)
  }

  // =========================================================================
  // 账套管理
  // =========================================================================

  /**
   * 切换账套
   */
  switchLedger(ledgerId) {
    if (this.currentLedgerId.value === ledgerId) return
    
    this.currentLedgerId.value = ledgerId
    sessionStorage.setItem('currentLedgerId', ledgerId)
    this.loadAllData()
    
    window.dispatchEvent(new CustomEvent('ledgerChanged', {
      detail: { ledgerId }
    }))
  }

  /**
   * 获取账套特定的存储键（保留用于本地缓存兼容）
   */
  _getStorageKey(key) {
    return `${key}_${this.currentLedgerId.value}`
  }

  // =========================================================================
  // 数据加载与保存
  // =========================================================================

  /**
   * 加载所有数据到内存（从 API 加载，按账套隔离）
   * DataStore 数据必须通过 API 存储到 DATA_DIR 本地文件
   */
  async loadAllData() {
    const ledgerId = this.currentLedgerId.value
    const data = {}
    
    // 按账套隔离的数据（snake_case）
    const ledgerKeys = [
      'accounts', 'transactions', 'categories',
      'credit_cards', 'credit_card_bills', 'loans', 'loan_payments',
      'investment_accounts', 'investment_details', 'net_value_history', 'investment_profit_records'
    ]

    // 全局数据（不按账套隔离）
    const globalKeys = ['ledgers', 'users', 'user_settings', 'user_defaults']

    // 从 API 加载账套数据
    const response = await apiRequest(`/api/datastore/load?ledgerId=${encodeURIComponent(ledgerId)}`)
    
    if (response.success && response.data) {
      Object.assign(data, response.data)
      console.log(`[CoreDataStore] 加载账套数据: ${ledgerId}, savedAt: ${response.savedAt || 'N/A'}`)
    } else {
      console.log(`[CoreDataStore] 账套 ${ledgerId} 暂无数据，使用默认值`)
    }
    
    // 确保所有账套数据键存在
    for (const key of ledgerKeys) {
      if (!data[key]) {
        data[key] = []
      }
    }
    
    // 确保维度数据存在
    if (!data.dimensions) {
      data.dimensions = this._getDefaultDimensions()
    }

    // 全局数据（使用默认值或 API 数据）
    for (const key of globalKeys) {
      data[key] = data[key] || []
    }

    this._data.value = data
    
    // 重建引用表
    this._rebuildRefs()
    
    // 重建维度使用情况
    this._rebuildDimensionUsage()
    
    console.log('[CoreDataStore] 加载账套数据完成:', ledgerId)
  }

  /**
   * 安全解析 JSON
   */
  _parseJSON(str) {
    try {
      return JSON.parse(str)
    } catch (e) {
      console.error('[CoreDataStore] JSON解析失败:', e)
      return []
    }
  }

  /**
   * 重建引用表
   */
  _rebuildRefs() {
    const refs = {}
    
    // 分类引用
    const categories = this._data.value.categories || []
    refs.categories = {}
    for (const cat of categories) {
      refs.categories[cat.id] = cat
    }
    
    // 账户引用
    const accounts = this._data.value.accounts || []
    refs.accounts = {}
    for (const acc of accounts) {
      refs.accounts[acc.id] = acc
    }
    
    // 维度引用
    const dimensions = this._data.value.dimensions || {}
    refs.dimensions = dimensions
    
    this._refs.value = refs
  }

  /**
   * 重建维度使用情况
   */
  _rebuildDimensionUsage() {
    const transactions = this._data.value.transactions || []
    const usages = {
      members: new Set(),
      merchants: new Set(),
      tags: new Set(),
      paymentChannels: new Set()
    }

    for (const t of transactions) {
      if (t.member) usages.members.add(t.member)
      if (t.merchant) usages.merchants.add(t.merchant)
      // tags 处理（t.tags 是数组）
      if (t.tags) {
        for (const tag of t.tags) usages.tags.add(tag)
      }
      // t.tag 可能是单个标签字符串（旧格式兼容）
      if (t.tag) usages.tags.add(t.tag)
      if (t.paymentChannel) usages.paymentChannels.add(t.paymentChannel)
    }

    this._dimensionUsage = usages
  }

  /**
   * 获取默认维度
   */
  _getDefaultDimensions() {
    return {
      members: [],
      merchants: [],
      tags: [],
      paymentChannels: []
    }
  }

  // =========================================================================
  // 通用数据操作
  // =========================================================================

  /**
   * 获取响应式数据
   */
  get(key) {
    if (!this._data.value[key]) {
      this._data.value[key] = []
    }
    return computed(() => this._data.value[key])
  }

  /**
   * 获取原始数据（非响应式）
   */
  getRaw(key) {
    return this._data.value[key] || []
  }

  /**
   * 添加数据
   */
  async add(key, item) {
    const data = this._data.value[key] || []
    
    // 确保ID存在
    if (!item.id) {
      item.id = this._generateId()
    }
    
    item.createdAt = item.createdAt || new Date().toISOString()
    item.updatedAt = new Date().toISOString()
    
    data.push(item)
    this._data.value[key] = data
    
    // 保存到 API（异步）
    await this._save(key)
    
    // 同步到服务器 MySQL
    this._scheduleSync(key)
    
    // 更新引用表
    if (key === 'categories') {
      this._refs.value.categories[item.id] = item
    } else if (key === 'accounts') {
      this._refs.value.accounts[item.id] = item
    }

    return item
  }

  /**
   * 更新数据
   */
  async update(key, id, updates) {
    const data = this._data.value[key] || []
    const index = data.findIndex(item => String(item.id) === String(id))
    
    if (index === -1) return null
    
    updates.updatedAt = new Date().toISOString()
    data[index] = { ...data[index], ...updates }
    this._data.value[key] = [...data]
    
    // 保存到 API（异步）
    await this._save(key)
    
    // 同步到服务器 MySQL
    this._scheduleSync(key)
    
    // 更新引用表
    if (key === 'categories') {
      this._refs.value.categories[id] = data[index]
    } else if (key === 'accounts') {
      this._refs.value.accounts[id] = data[index]
    }

    return data[index]
  }

  /**
   * 删除数据
   */
  async remove(key, id) {
    const data = this._data.value[key] || []
    const index = data.findIndex(item => String(item.id) === String(id))
    
    if (index === -1) return false
    
    data.splice(index, 1)
    this._data.value[key] = [...data]
    
    // 保存到 API（异步）
    await this._save(key)
    
    // 同步到服务器 MySQL
    this._scheduleSync(key)
    
    // 清理引用表
    if (key === 'categories') {
      delete this._refs.value.categories[id]
    } else if (key === 'accounts') {
      delete this._refs.value.accounts[id]
    }

    return true
  }

  /**
   * 查找数据
   */
  find(key, predicate) {
    const data = this._data.value[key] || []
    if (typeof predicate === 'function') {
      return data.find(predicate)
    }
    return data.find(item => String(item.id) === String(predicate))
  }

  /**
   * 过滤数据
   */
  filter(key, predicate) {
    const data = this._data.value[key] || []
    if (typeof predicate === 'function') {
      return data.filter(predicate)
    }
    return data.filter(item => predicate(item))
  }

  /**
   * 生成唯一ID
   */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 保存到 API（数据存储到 DATA_DIR 本地文件）
   */
  async _save(key) {
    await apiRequest('/api/datastore/save', {
      method: 'POST',
      body: JSON.stringify({
        ledgerId: this.currentLedgerId.value,
        data: {
          [key]: this._data.value[key]
        }
      })
    })
  }
  
  /**
   * 批量保存所有数据（完整保存）
   */
  async _saveAll() {
    const response = await apiRequest('/api/datastore/save', {
      method: 'POST',
      body: JSON.stringify({
        ledgerId: this.currentLedgerId.value,
        data: this._data.value
      })
    })
    if (response.success) {
      console.log(`[CoreDataStore] 完整保存: ledger=${this.currentLedgerId.value}, tables=${Object.keys(response.tables || {}).length}`)
    }
  }

  // =========================================================================
  // 核心记账功能：交易操作
  // =========================================================================

  /**
   * 添加交易（核心功能）
   * 
   * 联动效果：
   * - 自动更新账户余额
   * - 自动更新信用卡额度（如适用）
   * - 自动记录维度使用情况
   * - 自动生成投资损益（如配置了周期）
   */
  async addTransaction(transaction) {
    // 确保ID和日期
    if (!transaction.id) {
      transaction.id = this._generateId()
    }
    transaction.date = transaction.date || new Date().toISOString().split('T')[0]
    transaction.createdAt = new Date().toISOString()

    // 添加交易记录
    await this.add('transactions', transaction)

    // 联动1：更新账户余额
    await this._updateAccountBalance(transaction, 'add')

    // 联动2：更新信用卡额度（如适用）
    // 检查是否是信用卡账户（account ID 可能是 cc_xxx 格式）
    const isCreditCardAccount = String(transaction.account).startsWith('cc_') ||
      this._isCreditCardAccount(transaction.account)
    
    if (isCreditCardAccount) {
      await this._updateCreditCardBalance(transaction, 'add')
    }

    // 联动3：记录维度使用
    this._updateDimensionUsage('add', transaction)

    // 联动4：生成投资损益（如需要）
    if (transaction.isInvestmentProfit) {
      await this._syncInvestmentProfit(transaction)
    }

    // 触发数据变更事件，通知所有监听器
    window.dispatchEvent(new CustomEvent('dataChanged', { 
      detail: { type: 'transactions', action: 'add', id: transaction.id } 
    }))

    console.log('[CoreDataStore] 添加交易:', transaction.id)
    return transaction
  }
  
  /**
   * 检查是否是信用卡账户
   */
  _isCreditCardAccount(accountId) {
    if (!accountId) return false
    const creditCards = this._data.value.credit_cards || []
    return creditCards.some(card => 
      String(card.id) === String(accountId) || 
      String(card.linkedAccountId) === String(accountId)
    )
  }

  /**
   * 更新交易
   * 
   * 联动效果：
   * - 先还原旧交易的影响
   * - 再应用新交易的影响
   * - 更新账户余额
   * - 更新信用卡额度
   */
  async updateTransaction(transactionId, updates) {
    const oldTransaction = this.find('transactions', t => String(t.id) === String(transactionId))
    if (!oldTransaction) return null

    // 联动：还原旧交易的影响
    await this._updateAccountBalance(oldTransaction, 'reverse')
    if (oldTransaction.creditCardAccount) {
      await this._updateCreditCardBalance(oldTransaction, 'reverse')
    }
    this._updateDimensionUsage('remove', oldTransaction)

    // 更新交易
    const updated = { ...oldTransaction, ...updates }
    await this.update('transactions', transactionId, updates)

    // 联动：应用新交易的影响
    await this._updateAccountBalance(updated, 'add')
    if (updated.creditCardAccount) {
      await this._updateCreditCardBalance(updated, 'add')
    }
    this._updateDimensionUsage('add', updated)

    console.log('[CoreDataStore] 更新交易:', transactionId)
    return updated
  }

  /**
   * 删除交易
   * 
   * 联动效果：
   * - 还原账户余额
   * - 还原信用卡额度
   */
  async deleteTransaction(transactionId) {
    const transaction = this.find('transactions', t => String(t.id) === String(transactionId))
    if (!transaction) return

    // 联动：还原余额
    await this._updateAccountBalance(transaction, 'reverse')
    if (transaction.creditCardAccount) {
      await this._updateCreditCardBalance(transaction, 'reverse')
    }
    this._updateDimensionUsage('remove', transaction)

    // 删除交易
    await this.remove('transactions', transactionId)

    console.log('[CoreDataStore] 删除交易:', transactionId)
  }

  // =========================================================================
  // 账户操作（联动核心）
  // =========================================================================

  /**
   * 添加账户（联动投资、信用卡等）
   * 
   * 联动效果：
   * - 同步创建关联的投资账户（如类型为投资）
   * - 同步创建关联的信用卡（如类型为信用卡）
   */
  async addAccount(account) {
    if (!account.id) {
      account.id = this._generateId()
    }
    account.createdAt = new Date().toISOString()
    account.updatedAt = new Date().toISOString()

    await this.add('accounts', account)

    // 联动1：如果是投资账户，同步创建投资账户
    if (account.category === 'investment' && account.linkedInvestmentAccountId) {
      await this.addInvestmentAccount({
        id: account.linkedInvestmentAccountId,
        name: account.name,
        totalValue: account.balance || 0,
        linkedAccountId: account.id
      })
    }

    // 联动2：如果是信用卡，同步创建信用卡记录
    if (account.category === 'credit' && account.linkedCreditCardId) {
      await this.addCreditCard({
        id: account.linkedCreditCardId,
        name: account.name,
        creditLimit: account.creditLimit || 0,
        linkedAccountId: account.id
      })
    }

    console.log('[CoreDataStore] 添加账户:', account.id)
    return account
  }

  /**
   * 更新账户
   * 
   * 联动效果：
   * - 同步更新关联的投资账户余额
   * - 同步更新关联的信用卡额度
   */
  async updateAccount(accountId, updates) {
    const oldAccount = this.find('accounts', accountId)
    if (!oldAccount) return null

    // 更新账户
    const updated = { ...oldAccount, ...updates }
    await this.update('accounts', accountId, updates)

    // 联动1：同步投资账户余额
    if (oldAccount.category === 'investment' && updates.balance !== undefined) {
      const linkedAccount = this.find('investment_accounts', 
        inv => String(inv.linkedAccountId) === String(accountId))
      if (linkedAccount) {
        await this.updateInvestmentAccount(linkedAccount.id, { totalValue: updates.balance })
      }
    }

    // 联动2：同步信用卡额度
    if (oldAccount.category === 'credit' && updates.creditLimit !== undefined) {
      const linkedCard = this.find('credit_cards',
        card => String(card.linkedAccountId) === String(accountId))
      if (linkedCard) {
        await this.updateCreditCard(linkedCard.id, { creditLimit: updates.creditLimit })
      }
    }

    console.log('[CoreDataStore] 更新账户:', accountId)
    return updated
  }

  /**
   * 删除账户
   * 
   * 联动效果：
   * - 清理关联的投资账户
   * - 清理关联的信用卡
   */
  async deleteAccount(accountId) {
    const account = this.find('accounts', accountId)
    if (!account) return

    // 联动：清理关联数据
    if (account.category === 'investment') {
      const linkedInv = this.find('investment_accounts',
        inv => String(inv.linkedAccountId) === String(accountId))
      if (linkedInv) {
        await this.deleteInvestmentAccount(linkedInv.id)
      }
    }
    if (account.category === 'credit') {
      const linkedCard = this.find('credit_cards',
        card => String(card.linkedAccountId) === String(accountId))
      if (linkedCard) {
        await this.deleteCreditCard(linkedCard.id)
      }
    }

    await this.remove('accounts', accountId)
    console.log('[CoreDataStore] 删除账户:', accountId)
  }

  /**
   * 根据交易更新账户余额
   */
  async _updateAccountBalance(trans, mode) {
    const multiplier = mode === 'add' ? 1 : -1

    if (trans.type === 'transfer') {
      // 转账：减少转出账户，增加转入账户
      const fromAccount = this.find('accounts', a => String(a.id) === String(trans.account))
      const toAccount = this.find('accounts', a => String(a.id) === String(trans.toAccount))
      
      if (fromAccount) {
        await this.update('accounts', fromAccount.id, {
          balance: fromAccount.balance - trans.amount * multiplier
        })
      }
      if (toAccount) {
        await this.update('accounts', toAccount.id, {
          balance: toAccount.balance + trans.amount * multiplier
        })
      }
    } else {
      // 收入/支出：更新单个账户
      const account = this.find('accounts', a => String(a.id) === String(trans.account))
      if (account) {
        let newBalance
        if (trans.type === 'income') {
          newBalance = account.balance + trans.amount * multiplier
        } else {
          newBalance = account.balance - trans.amount * multiplier
        }
        await this.update('accounts', account.id, { balance: newBalance })
      }
    }
  }

  // =========================================================================
  // 信用卡操作（联动记账）
  // =========================================================================

  /**
   * 添加信用卡（联动账户）
   */
  async addCreditCard(card) {
    if (!card.id) {
      card.id = this._generateId()
    }
    
    // 同步创建关联账户
    if (!card.linkedAccountId) {
      const linkedAccount = await this.addAccount({
        name: card.name,
        category: 'credit',
        balance: 0,
        creditLimit: card.creditLimit || 0,
        linkedCreditCardId: card.id
      })
      card.linkedAccountId = linkedAccount.id
    }

    // 初始化可用额度
    card.availableCredit = card.creditLimit
    card.usedCredit = 0
    
    await this.add('credit_cards', card)
    
    console.log('[CoreDataStore] 添加信用卡:', card.id)
    return card
  }

  /**
   * 更新信用卡
   */
  async updateCreditCard(cardId, updates) {
    const card = await this.update('credit_cards', cardId, updates)
    
    // 联动：同步关联账户的额度
    if (card && (updates.creditLimit !== undefined || updates.usedCredit !== undefined)) {
      const linkedAccount = this.find('accounts', acc => String(acc.id) === String(card.linkedAccountId))
      if (linkedAccount) {
        await this.update('accounts', linkedAccount.id, {
          creditLimit: card.creditLimit,
          usedCredit: card.usedCredit
        })
      }
    }
    
    return card
  }

  /**
   * 删除信用卡
   */
  async deleteCreditCard(cardId) {
    const card = this.find('credit_cards', cardId)
    if (card?.linkedAccountId) {
      await this.remove('accounts', card.linkedAccountId)
    }
    await this.remove('credit_cards', cardId)
  }

  /**
   * 更新信用卡额度
   */
  async _updateCreditCardBalance(transaction, mode) {
    // 尝试通过多种方式查找信用卡
    const creditCards = this._data.value.credit_cards || []
    let card = null
    
    // 方式1：通过 linkedAccountId 查找
    card = creditCards.find(c => String(c.linkedAccountId) === String(transaction.account))
    
    // 方式2：通过 cc_ 前缀的 account ID 查找
    if (!card && transaction.account) {
      const ccId = String(transaction.account).replace('cc_', '')
      card = creditCards.find(c => String(c.id) === String(ccId))
    }
    
    // 方式3：通过信用卡账户本身的 ID 查找
    if (!card) {
      card = creditCards.find(c => String(c.id) === String(transaction.account))
    }
    
    if (!card) {
      console.log('[CoreDataStore] 未找到关联的信用卡，尝试查找所有信用卡:', {
        account: transaction.account,
        availableCards: creditCards.map(c => ({ id: c.id, linkedAccountId: c.linkedAccountId }))
      })
      return
    }

    const multiplier = mode === 'add' ? 1 : -1
    const usedAmount = transaction.amount * multiplier
    const currentUsedCredit = card.usedCredit || 0
    const newUsedCredit = currentUsedCredit + usedAmount

    await this.update('credit_cards', card.id, {
      usedCredit: Math.max(0, newUsedCredit),
      availableCredit: Math.max(0, (card.creditLimit || 0) - Math.max(0, newUsedCredit))
    })
    
    console.log('[CoreDataStore] 更新信用卡额度:', card.name, {
      mode,
      amount: transaction.amount,
      usedCredit: Math.max(0, newUsedCredit),
      availableCredit: Math.max(0, (card.creditLimit || 0) - Math.max(0, newUsedCredit))
    })
  }

  /**
   * 信用卡还款（生成转账交易）
   */
  async repayCreditCard(fromAccountId, cardId, amount, date) {
    const card = this.find('credit_cards', cardId)
    if (!card) throw new Error('信用卡不存在')

    // 生成还款转账交易
    await this.addTransaction({
      type: 'transfer',
      account: fromAccountId,           // 转出账户（借记卡）
      toAccount: card.linkedAccountId,  // 转入账户（信用卡）
      amount: amount,
      date: date || new Date().toISOString().split('T')[0],
      description: `信用卡还款 - ${card.name}`,
      category: 'transfer',
      isRepayment: true,
      relatedCreditCard: cardId
    })

    // 更新信用卡余额
    await this.updateCreditCard(cardId, {
      usedCredit: Math.max(0, card.usedCredit - amount)
    })
  }

  // =========================================================================
  // 投资操作（联动记账）
  // =========================================================================

  /**
   * 添加投资账户（联动账户）
   */
  async addInvestmentAccount(account) {
    if (!account.id) {
      account.id = this._generateId()
    }
    account.totalValue = account.totalValue || 0
    account.createdAt = new Date().toISOString()

    // 同步创建关联账户
    if (!account.linkedAccountId) {
      const linkedAccount = await this.addAccount({
        name: account.name,
        category: 'investment',
        balance: account.totalValue,
        linkedInvestmentAccountId: account.id
      })
      account.linkedAccountId = linkedAccount.id
    }

    await this.add('investment_accounts', account)
    
    // 如果初始资金大于0，创建视同转入的投资明细记录（显示为"现金"）
    if (account.totalValue > 0) {
      await this.add('investment_details', {
        accountId: account.id,
        accountName: account.name,
        type: '现金',
        code: '-',
        name: '初始资金（视同转入）',
        shares: 1,
        costPrice: account.totalValue,
        currentPrice: account.totalValue,
        netValueDate: new Date().toISOString().split('T')[0],
        updateDate: new Date().toISOString().split('T')[0],
        isInitialTransfer: true,
        description: `${account.name} 的初始投入`
      })
      
      // 同时记录到交易历史
      await this.addTransaction({
        type: 'income',
        amount: account.totalValue,
        account: account.linkedAccountId,
        category: 'investment_transfer_in',
        description: `视同转入 - ${account.name}`,
        isInvestmentTransfer: true,
        investmentAccountId: account.id,
        date: new Date().toISOString().split('T')[0]
      })
    }
    
    console.log('[CoreDataStore] 添加投资账户:', account.id)
    return account
  }

  /**
   * 更新投资账户
   */
  async updateInvestmentAccount(accountId, updates) {
    const oldAccount = this.find('investment_accounts', accountId)
    if (!oldAccount) return null

    const updated = { ...oldAccount, ...updates }
    await this.update('investment_accounts', accountId, updates)

    // 联动：同步账户余额
    if (updates.totalValue !== undefined) {
      const linkedAccount = this.find('accounts', acc => String(acc.id) === String(updated.linkedAccountId))
      if (linkedAccount) {
        await this.update('accounts', linkedAccount.id, { balance: updates.totalValue })
      }
    }

    // 联动：检查是否需要生成投资损益交易
    if (updates.totalValue !== undefined && oldAccount.profitCycle) {
      await this._checkAndGenerateProfitTransaction(updated)
    }

    return updated
  }

  /**
   * 删除投资账户
   */
  async deleteInvestmentAccount(accountId) {
    const account = this.find('investment_accounts', accountId)
    if (account?.linkedAccountId) {
      await this.remove('accounts', account.linkedAccountId)
    }
    
    // 清理关联的投资明细和净值历史
    const details = this.filter('investment_details', d => String(d.accountId) === String(accountId))
    for (const detail of details) {
      await this.remove('investment_details', detail.id)
    }
    
    const history = this.filter('net_value_history', h => String(h.accountId) === String(accountId))
    for (const record of history) {
      await this.remove('net_value_history', record.id)
    }

    await this.remove('investment_accounts', accountId)
  }

  /**
   * 更新净值并生成损益交易
   */
  async updateNetValue(accountId, newValue, date) {
    const account = this.find('investment_accounts', accountId)
    if (!account) return

    const oldValue = account.totalValue || 0
    const profit = newValue - oldValue

    // 添加净值历史
    await this.add('net_value_history', {
      accountId: accountId,
      value: newValue,
      date: date || new Date().toISOString().split('T')[0],
      profit: profit
    })

    // 更新投资账户余额
    await this.updateInvestmentAccount(accountId, { totalValue: newValue })

    // 联动：检查是否需要生成损益交易
    await this._checkAndGenerateProfitTransaction(account, profit, date)

    return profit
  }

  /**
   * 检查并生成投资损益交易
   */
  async _checkAndGenerateProfitTransaction(account, profit, date) {
    if (!account.profitCycle) return

    const today = new Date()
    const accountDate = new Date(account.updatedAt || account.createdAt || today)
    
    // 计算周期
    const shouldGenerate = this._shouldGenerateProfit(account.profitCycle, accountDate, today)
    
    if (!shouldGenerate) return

    // 检查是否已生成本周期损益
    const existingProfit = this.filter('investment_profit_records', r => 
      String(r.accountId) === String(account.id) &&
      r.cycle === account.profitCycle &&
      r.period === this._getCurrentPeriod(account.profitCycle)
    )

    if (existingProfit.length > 0) {
      // 更新现有损益交易
      const profitValue = account.totalValue - (existingProfit[0].startValue || account.totalValue)
      await this.updateTransaction(existingProfit[0].transactionId, {
        amount: Math.abs(profitValue),
        description: `${account.name} ${account.profitCycle}投资收益`
      })
    } else {
      // 生成新的损益交易
      const cycleDate = this._getCycleEndDate(account.profitCycle, today)
      const profitValue = account.totalValue - (account.initialValue || account.totalValue)

      const transaction = await this.addTransaction({
        type: profitValue >= 0 ? 'income' : 'expense',
        amount: Math.abs(profitValue),
        account: account.linkedAccountId,
        date: cycleDate,
        description: `${account.name} ${account.profitCycle}投资收益`,
        category: profitValue >= 0 ? '投资收入' : '投资损失',
        isInvestmentProfit: true,
        investmentAccountId: account.id
      })

      // 记录损益记录
      await this.add('investment_profit_records', {
        accountId: account.id,
        transactionId: transaction.id,
        cycle: account.profitCycle,
        period: this._getCurrentPeriod(account.profitCycle),
        startValue: account.initialValue || account.totalValue,
        endValue: account.totalValue,
        profit: profitValue,
        date: cycleDate
      })
    }
  }

  /**
   * 判断是否应该生成损益
   */
  _shouldGenerateProfit(cycle, lastDate, currentDate) {
    const last = new Date(lastDate)
    const current = new Date(currentDate)
    
    switch (cycle) {
      case 'monthly':
        return last.getMonth() !== current.getMonth()
      case 'quarterly':
        return Math.floor(last.getMonth() / 3) !== Math.floor(current.getMonth() / 3)
      case 'yearly':
        return last.getFullYear() !== current.getFullYear()
      default:
        return false
    }
  }

  /**
   * 获取当前周期标识
   */
  _getCurrentPeriod(cycle) {
    const now = new Date()
    switch (cycle) {
      case 'monthly':
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      case 'quarterly':
        return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`
      case 'yearly':
        return `${now.getFullYear()}`
      default:
        return now.toISOString().split('T')[0]
    }
  }

  /**
   * 获取周期结束日期
   */
  _getCycleEndDate(cycle, date) {
    const d = new Date(date)
    switch (cycle) {
      case 'monthly':
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
      case 'quarterly':
        const quarterEndMonth = Math.floor(d.getMonth() / 3) * 3 + 2
        return new Date(d.getFullYear(), quarterEndMonth + 1, 0).toISOString().split('T')[0]
      case 'yearly':
        return new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0]
      default:
        return d.toISOString().split('T')[0]
    }
  }

  /**
   * 同步投资损益
   */
  async _syncInvestmentProfit(transaction) {
    // 投资损益交易已关联到投资账户，不需要额外处理
  }

  // =========================================================================
  // 贷款操作（联动记账）
  // =========================================================================

  /**
   * 添加贷款（联动还款计划）
   */
  async addLoan(loan) {
    if (!loan.id) {
      loan.id = this._generateId()
    }
    loan.totalAmount = loan.totalAmount || loan.principal
    loan.paidAmount = 0
    loan.status = 'active'
    
    await this.add('loans', loan)
    
    // 生成还款计划
    if (loan.repaymentPlan) {
      await this._generateRepaymentPlan(loan)
    }
    
    console.log('[CoreDataStore] 添加贷款:', loan.id)
    return loan
  }

  /**
   * 生成还款计划
   */
  async _generateRepaymentPlan(loan) {
    const plan = loan.repaymentPlan
    const startDate = new Date(loan.startDate || new Date())
    const payments = []

    for (let i = 0; i < plan.totalPeriods; i++) {
      const paymentDate = new Date(startDate)
      paymentDate.setMonth(paymentDate.getMonth() + i)
      
      payments.push({
        id: this._generateId(),
        loanId: loan.id,
        period: i + 1,
        dueDate: paymentDate.toISOString().split('T')[0],
        principal: plan.principalPerPeriod,
        interest: plan.interestPerPeriod,
        totalPayment: plan.totalPaymentPerPeriod,
        status: 'pending'
      })
    }

    // 保存还款计划
    for (const payment of payments) {
      await this.add('loan_payments', payment)
    }
  }

  /**
   * 记录还款（生成转账交易）
   */
  async recordLoanRepayment(loanId, paymentId, fromAccountId, amount, date) {
    const loan = this.find('loans', loanId)
    if (!loan) throw new Error('贷款不存在')

    // 生成还款转账交易
    await this.addTransaction({
      type: 'expense',
      account: fromAccountId,
      amount: amount,
      date: date || new Date().toISOString().split('T')[0],
      description: `贷款还款 - ${loan.name}`,
      category: 'loan_repayment',
      isLoanRepayment: true,
      loanId: loanId,
      paymentId: paymentId
    })

    // 更新还款计划状态
    if (paymentId) {
      await this.update('loan_payments', paymentId, {
        status: 'paid',
        paidDate: date || new Date().toISOString().split('T')[0],
        actualAmount: amount
      })
    }

    // 更新贷款已还金额
    await this.update('loans', loanId, {
      paidAmount: (loan.paidAmount || 0) + amount,
      remainingAmount: (loan.totalAmount || loan.principal) - ((loan.paidAmount || 0) + amount)
    })
  }

  // =========================================================================
  // 维度管理
  // =========================================================================

  /**
   * 检查维度是否被使用
   */
  isDimensionUsed(type, name) {
    return this._dimensionUsage[type]?.has(name) || false
  }

  /**
   * 获取维度被使用情况
   */
  getDimensionUsage(type) {
    return this._dimensionUsage[type] || new Set()
  }

  /**
   * 获取指定类型的维度列表（兼容 DimensionManagementView 格式）
   * 返回对象数组 [{id, name}] 用于支持删除功能
   */
  getDimensionItems(type) {
    const dimensions = this._data.value.dimensions || this._getDefaultDimensions()
    const items = dimensions[type] || []
    
    // 如果是字符串数组，转换为对象数组
    if (items.length > 0 && typeof items[0] === 'string') {
      return items.map((name, index) => ({
        id: `dim_${type}_${index}`,
        name: name
      }))
    }
    
    // 如果已经是对象数组，直接返回
    return items.map((item, index) => ({
      id: item.id || `dim_${type}_${index}`,
      name: item.name || item
    }))
  }

  /**
   * 添加维度成员（兼容 DimensionManagementView）
   */
  async addDimension(type, item) {
    const name = typeof item === 'string' ? item : item.name
    return await this.addDimensionMember(type, name)
  }

  /**
   * 更新维度成员（兼容 DimensionManagementView）
   */
  async updateDimension(type, id, updates) {
    // 找到对应的维度成员
    const dimensions = this._data.value.dimensions || this._getDefaultDimensions()
    if (!dimensions[type]) return null

    const items = dimensions[type]
    let oldName = null
    let index = -1

    // 如果是字符串数组
    if (typeof items[0] === 'string') {
      // 通过索引查找
      const idx = items.findIndex((item, i) => `dim_${type}_${i}` === id)
      if (idx !== -1) {
        oldName = items[idx]
        index = idx
      }
    } else {
      // 通过 id 查找
      index = items.findIndex(item => item.id === id)
      if (index !== -1) {
        oldName = items[index].name
      }
    }

    if (index === -1 || !oldName) return null

    const newName = updates.name
    if (newName && newName !== oldName) {
      return await this.renameDimensionMember(type, oldName, newName)
    }

    return { success: true }
  }

  /**
   * 删除维度成员（兼容 DimensionManagementView）
   */
  async deleteDimension(type, id) {
    // 找到对应的维度成员
    const dimensions = this._data.value.dimensions || this._getDefaultDimensions()
    if (!dimensions[type]) return { success: false, message: '维度类型不存在' }

    const items = dimensions[type]
    let name = null
    let index = -1

    // 如果是字符串数组
    if (typeof items[0] === 'string') {
      const idx = items.findIndex((item, i) => `dim_${type}_${i}` === id)
      if (idx !== -1) {
        name = items[idx]
        index = idx
      }
    } else {
      index = items.findIndex(item => item.id === id)
      if (index !== -1) {
        name = items[index].name
      }
    }

    if (index === -1 || !name) return { success: false, message: '成员不存在' }

    return await this.deleteDimensionMember(type, name)
  }

  /**
   * 更新维度使用情况
   */
  _updateDimensionUsage(mode, transaction) {
    if (!transaction) return

    const dimensions = this._data.value.dimensions || { members: [], merchants: [], tags: [], paymentChannels: [] }
    
    if (mode === 'add') {
      if (transaction.member && !dimensions.members.includes(transaction.member)) {
        dimensions.members.push(transaction.member)
      }
      if (transaction.merchant && !dimensions.merchants.includes(transaction.merchant)) {
        dimensions.merchants.push(transaction.merchant)
      }
      if (transaction.tags) {
        for (const tag of transaction.tags) {
          if (!dimensions.tags.includes(tag)) {
            dimensions.tags.push(tag)
          }
        }
      }
      if (transaction.paymentChannel && !dimensions.paymentChannels.includes(transaction.paymentChannel)) {
        dimensions.paymentChannels.push(transaction.paymentChannel)
      }
    } else if (mode === 'remove') {
      // 不删除，因为可能有其他地方使用
    }

    this._data.value.dimensions = dimensions
    this._save('dimensions')
    this._rebuildDimensionUsage()
  }

  /**
   * 添加维度成员
   */
  async addDimensionMember(type, name) {
    const dimensions = this._data.value.dimensions || this._getDefaultDimensions()
    if (!dimensions[type]) return null

    // 检查是否已存在
    if (dimensions[type].includes(name)) {
      return { success: false, message: '已存在' }
    }

    dimensions[type].push(name)
    this._data.value.dimensions = dimensions
    this._save('dimensions')

    return { success: true, name }
  }

  /**
   * 删除维度成员（仅当未被使用时可删除）
   */
  async deleteDimensionMember(type, name) {
    // 检查是否被使用
    if (this.isDimensionUsed(type, name)) {
      return { success: false, message: '该维度正在被交易使用，无法删除' }
    }

    const dimensions = this._data.value.dimensions || this._getDefaultDimensions()
    if (!dimensions[type]) return { success: false, message: '维度类型不存在' }

    const index = dimensions[type].indexOf(name)
    if (index === -1) return { success: false, message: '成员不存在' }

    dimensions[type].splice(index, 1)
    this._data.value.dimensions = dimensions
    this._save('dimensions')

    return { success: true }
  }

  /**
   * 重命名维度成员
   */
  async renameDimensionMember(type, oldName, newName) {
    const dimensions = this._data.value.dimensions || this._getDefaultDimensions()
    if (!dimensions[type]) return { success: false, message: '维度类型不存在' }

    const index = dimensions[type].indexOf(oldName)
    if (index === -1) return { success: false, message: '成员不存在' }

    // 检查新名称是否已存在
    if (dimensions[type].includes(newName)) {
      return { success: false, message: '新名称已存在' }
    }

    // 更新维度列表
    dimensions[type][index] = newName
    this._data.value.dimensions = dimensions
    this._save('dimensions')

    // 更新所有使用该维度的交易
    const transactions = this._data.value.transactions || []
    for (const t of transactions) {
      let needUpdate = false
      
      if (type === 'members' && t.member === oldName) {
        t.member = newName
        needUpdate = true
      } else if (type === 'merchants' && t.merchant === oldName) {
        t.merchant = newName
        needUpdate = true
      } else if (type === 'tags') {
        const tagIndex = t.tags?.indexOf(oldName) ?? -1
        if (tagIndex !== -1) {
          t.tags[tagIndex] = newName
          needUpdate = true
        }
      } else if (type === 'paymentChannels' && t.paymentChannel === oldName) {
        t.paymentChannel = newName
        needUpdate = true
      }

      if (needUpdate) {
        await this.update('transactions', t.id, t)
      }
    }

    // 更新使用情况缓存
    this._rebuildDimensionUsage()

    return { success: true, oldName, newName }
  }

  // =========================================================================
  // 数据同步
  // =========================================================================

  /**
   * 调度同步到服务器
   */
  _scheduleSync(key) {
    // 防抖：延迟 1 秒后同步
    clearTimeout(this._syncTimer)
    this._syncTimer = setTimeout(() => {
      this.syncToServer(key)
    }, 1000)
  }

  /**
   * 同步到服务器
   */
  async syncToServer(key) {
    if (!this._isOnline) return

    this._syncStatus.value = 'syncing'
    
    try {
      const data = key 
        ? { [key]: this._data.value[key] }
        : this._data.value

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUserId.value,
          ledgerId: this.currentLedgerId.value,
          data: data,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        this._syncStatus.value = 'success'
        this._lastSyncTime.value = new Date().toISOString()
      } else {
        this._syncStatus.value = 'error'
      }
    } catch (error) {
      console.error('[CoreDataStore] 同步失败:', error)
      this._syncStatus.value = 'error'
    }
  }

  /**
   * 从服务器拉取数据
   */
  async pullFromServer() {
    if (!this._isOnline) return

    try {
      const response = await fetch(`/api/sync?userId=${this.currentUserId.value}&ledgerId=${this.currentLedgerId.value}`)
      if (response.ok) {
        const serverData = await response.json()
        // 合并数据（服务器优先）
        // ...
      }
    } catch (error) {
      console.error('[CoreDataStore] 拉取失败:', error)
    }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return {
      status: this._syncStatus.value,
      lastSyncTime: this._lastSyncTime.value,
      isOnline: this._isOnline
    }
  }

  // =========================================================================
  // 工具方法
  // =========================================================================

  /**
   * 获取分类引用
   */
  getCategory(id) {
    return this._refs.value.categories?.[id]
  }

  /**
   * 获取账户引用
   */
  getAccount(id) {
    return this._refs.value.accounts?.[id]
  }

  /**
   * 获取维度列表
   */
  getDimensions() {
    return this._data.value.dimensions || this._getDefaultDimensions()
  }

  /**
   * 计算账户余额（基于交易）
   */
  calculateAccountBalance(accountId) {
    const transactions = this._data.value.transactions || []
    let balance = 0

    for (const t of transactions) {
      if (String(t.account) === String(accountId)) {
        if (t.type === 'income') {
          balance += t.amount
        } else if (t.type === 'expense') {
          balance -= t.amount
        }
      }
      if (String(t.toAccount) === String(accountId) && t.type === 'transfer') {
        balance += t.amount
      }
    }

    return balance
  }

  /**
   * 导出账套数据
   */
  exportLedgerData() {
    return {
      version: APP_VERSION,
      ledgerId: this.currentLedgerId.value,
      exportedAt: new Date().toISOString(),
      data: this._data.value
    }
  }

  /**
   * 导入账套数据
   */
  async importLedgerData(importData) {
    if (!importData || !importData.data) {
      throw new Error('无效的导入数据')
    }

    // 合并数据
    for (const [key, value] of Object.entries(importData.data)) {
      this._data.value[key] = value
      this._save(key)
    }

    // 重建引用
    this._rebuildRefs()
    this._rebuildDimensionUsage()

    return { success: true }
  }
}

// 导出单例
const coreDataStore = new CoreDataStore()
export default coreDataStore
export { DATA_TYPES, CoreDataStore }
