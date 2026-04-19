/**
 * 核心数据存储服务 (CoreDataStore)
 * 
 * =============================================================================
 * 设计理念：★★★ 数据为核心，标签化存储，无损迭代 ★★★
 * =============================================================================
 * 
 * 【核心原则】
 * 
 * 1. 数据唯一化
 *    - 核心数据只有一份，不冗余存储
 *    - transactions（交易）是唯一的事实来源
 *    - 所有其他数据都是对核心数据的"标签"
 * 
 * 2. 标签化存储
 *    - 非核心数据不做独立存储
 *    - 成员、商户、标签、支付渠道都是交易的属性标签
 *    - 分类是预定义标签，关联到交易
 * 
 * 3. 衍生数据计算
 *    - 账户余额 = SUM(交易)
 *    - 信用卡已用额度 = SUM(交易)
 *    - 投资账户净值 = 从净值历史计算
 *    - 所有衍生数据不长期存储，仅在使用时计算
 *    - 可选：存储计算结果用于校验
 * 
 * 4. 未来保障
 *    - 新功能只是给数据打新标签
 *    - 旧数据无需迁移，只需补充标签
 *    - 系统升级不影响已有数据完整性
 * 
 * 【数据层次】
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Layer 1: 核心数据 (不可分割的事实)                         │
 * │  - transactions: 每一笔交易是独立事实                        │
 * │    { id, date, type, amount, fromAccount, toAccount, ... }  │
 * └─────────────────────────────────────────────────────────────┘
 *                           ↓ 关联/引用
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Layer 2: 基础定义 (不包含业务计算值)                        │
 * │  - accounts: { id, name, category, currency, ... }         │
 * │  - categories: { id, name, type, parentId, icon, ... }     │
 * │  - credit_cards: { id, name, limit, linkedAccountId, ... } │
 * │  - investment_accounts: { id, name, currency, ... }         │
 * └─────────────────────────────────────────────────────────────┘
 *                           ↓ 标签/属性
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Layer 3: 交易标签 (依附于交易，不独立存在)                   │
 * │  - member: 交易参与者                                        │
 * │  - merchant: 商户                                            │
 * │  - tags: 多标签数组                                          │
 * │  - paymentChannel: 支付渠道                                  │
 * │  - notes: 备注                                               │
 * └─────────────────────────────────────────────────────────────┘
 *                           ↓ 实时计算
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Layer 4: 衍生数据 (使用时可计算，不存储)                      │
 * │  - account.balance = SUM(where account=id)                  │
 * │  - credit_card.usedCredit = SUM(where creditCard=id)         │
 * │  - statistics.xxx = 实时聚合                                 │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * =============================================================================
 * 版本: 引用自 src/config/version.js
 * =============================================================================
 */

import { ref, shallowRef, computed } from 'vue'
import { APP_VERSION } from '../config/version.js'

/**
 * 获取 API 基础 URL
 */
function getApiBaseUrl() {
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
 * 核心数据存储类
 * 
 * 遵循"数据为核心，标签化存储"原则：
 * - transactions 是唯一事实来源
 * - 其他数据都是对交易的标签或定义
 * - 衍生数据通过计算得出，不存储
 */
class CoreDataStore {
  constructor() {
    // 当前账套ID
    this.currentLedgerId = ref(sessionStorage.getItem('currentLedgerId') || 'default')
    
    // 当前用户ID
    this.currentUserId = ref(sessionStorage.getItem('userId') || null)
    
    // 内部数据存储（仅核心数据 + 基础定义）
    this._data = shallowRef({})
    
    // 数据引用表（ID → 对象映射）
    this._refs = shallowRef({})
    
    // 同步状态
    this._syncStatus = ref('idle')
    this._lastSyncTime = ref(null)
    
    // 在线状态
    this._isOnline = navigator.onLine
    
    // 维度使用情况（从交易中提取）
    this._dimensionUsage = ref({
      members: [],
      merchants: [],
      tags: [],
      paymentChannels: []
    })
    
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

    console.log(`[CoreDataStore] v${APP_VERSION} 初始化完成`)
    console.log(`[CoreDataStore] 架构: 数据为核心，标签化存储`)
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
    
    // 先加载数据
    this.loadAllData()
    
    // 然后再派发事件，让组件知道账套已切换
    window.dispatchEvent(new CustomEvent('ledgerChanged', {
      detail: { ledgerId }
    }))
  }

  // =========================================================================
  // 数据加载与保存
  // =========================================================================

  /**
   * 加载所有数据到内存
   * 
   * 数据结构：
   * - 核心数据：transactions（交易事实）
   * - 基础定义：accounts, categories, credit_cards, investment_accounts 等
   * - 注意：不含 balance, usedCredit 等衍生数据
   */
  async loadAllData() {
    const ledgerId = this.currentLedgerId.value
    
    try {
      // 从 API 加载
      const response = await apiRequest(`/api/datastore/load?ledgerId=${encodeURIComponent(ledgerId)}`)
      
      if (response.success && response.data) {
        this._data.value = response.data
        console.log(`[CoreDataStore] 加载账套: ${ledgerId}`)
      } else {
        // API响应成功但数据为空，初始化空数据结构
        this._data.value = this._getEmptyDataStructure()
        console.log(`[CoreDataStore] 账套 ${ledgerId} 初始化空数据`)
        
        // 初始化预置数据
        await this._initDefaultData()
      }
    } catch (error) {
      // API请求失败，初始化空数据结构并加载预置数据
      console.error(`[CoreDataStore] 加载数据失败:`, error)
      console.log(`[CoreDataStore] 初始化预置数据`)
      this._data.value = this._getEmptyDataStructure()
      await this._initDefaultData()
    }
    
    // 确保核心数据存在
    this._ensureCoreData()
    
    // 重建引用表
    this._rebuildRefs()
    
    // 提取维度使用情况
    this._extractDimensionUsage()
    
    console.log(`[CoreDataStore] 交易: ${(this._data.value.transactions || []).length} 条`)
  }
  
  /**
   * 获取空数据结构（仅核心数据 + 基础定义）
   */
  _getEmptyDataStructure() {
    return {
      // 核心数据 - 交易是唯一事实
      transactions: [],
      
      // 基础定义 - 不含衍生数据
      accounts: [],
      categories: [],
      
      // 信用卡定义
      credit_cards: [],
      credit_card_bills: [],
      
      // 贷款定义
      loans: [],
      loan_payments: [],
      
      // 投资定义
      investment_accounts: [],
      investment_details: [],
      net_value_history: [],
      investment_profit_records: [],
      
      // 系统数据
      ledgers: [],
      users: [],
      user_settings: [],
      user_defaults: [],
      
      // 维度数据（成员、商家、标签、支付渠道）- 独立存储
      dimensions: {
        members: [],
        merchants: [],
        tags: [],
        paymentChannels: []
      }
    }
  }
  
  /**
   * 确保核心数据结构完整
   */
  _ensureCoreData() {
    const requiredKeys = [
      'transactions', 'accounts', 'categories',
      'credit_cards', 'credit_card_bills',
      'loans', 'loan_payments',
      'investment_accounts', 'investment_details', 'net_value_history'
    ]
    
    for (const key of requiredKeys) {
      if (!this._data.value[key]) {
        this._data.value[key] = []
      }
    }
    
    // 确保维度数据结构完整
    if (!this._data.value.dimensions) {
      this._data.value.dimensions = {
        members: [],
        merchants: [],
        tags: [],
        paymentChannels: []
      }
    }
  }

  /**
   * 初始化预置数据
   * 当账套为空时，加载基础数据，确保开箱即用
   */
  async _initDefaultData() {
    console.log('[CoreDataStore] 初始化预置数据...')
    
    // 1. 初始化账户数据
    const defaultAccounts = [
      // 现金类
      { id: '1001', name: '我的钱包', category: 'cash', currency: 'CNY', initialBalance: 0, description: '现金账户' },
      // 银行卡类
      { id: '1002', name: '中国工商银行储蓄卡', category: 'bank', currency: 'CNY', initialBalance: 0, description: '工资卡' },
      { id: '1003', name: '中国建设银行储蓄卡', category: 'bank', currency: 'CNY', initialBalance: 0, description: '日常消费卡' },
      // 支付宝类
      { id: '1005', name: '支付宝', category: 'alipay', currency: 'CNY', initialBalance: 0, description: '支付宝余额' },
      { id: '1006', name: '余额宝', category: 'alipay', currency: 'CNY', initialBalance: 0, description: '支付宝理财产品' },
      // 微信类
      { id: '1007', name: '微信支付', category: 'wechat', currency: 'CNY', initialBalance: 0, description: '微信零钱' },
      { id: '1008', name: '微信理财通', category: 'wechat', currency: 'CNY', initialBalance: 0, description: '微信理财' },
      // 信用卡类
      { id: '1009', name: '招商银行信用卡', category: 'credit_card', currency: 'CNY', initialBalance: 0, description: '主用信用卡' },
      // 投资账户类
      { id: '1011', name: '天天基金账户', category: 'investment', currency: 'CNY', initialBalance: 0, description: '基金投资账户' },
      { id: '1012', name: '证券账户', category: 'investment', currency: 'CNY', initialBalance: 0, description: '股票投资账户' }
    ]
    
    for (const account of defaultAccounts) {
      await this.add('accounts', account)
    }
    
    // 2. 初始化分类数据
    const defaultCategories = [
      // 支出分类（一级）
      { id: '2001', name: '餐饮', type: 'expense', parentId: null },
      { id: '2002', name: '购物', type: 'expense', parentId: null },
      { id: '2003', name: '居住', type: 'expense', parentId: null },
      { id: '2004', name: '交通', type: 'expense', parentId: null },
      { id: '2005', name: '医疗', type: 'expense', parentId: null },
      { id: '2006', name: '教育', type: 'expense', parentId: null },
      { id: '2007', name: '娱乐', type: 'expense', parentId: null },
      { id: '2008', name: '人情', type: 'expense', parentId: null },
      { id: '2009', name: '金融', type: 'expense', parentId: null },
      { id: '2010', name: '其他', type: 'expense', parentId: null },
      // 支出分类（二级）
      { id: '200101', name: '早午晚餐', type: 'expense', parentId: '2001' },
      { id: '200102', name: '外卖', type: 'expense', parentId: '2001' },
      { id: '200201', name: '服装鞋包', type: 'expense', parentId: '2002' },
      { id: '200202', name: '日用百货', type: 'expense', parentId: '2002' },
      { id: '200301', name: '房租', type: 'expense', parentId: '2003' },
      { id: '200302', name: '房贷', type: 'expense', parentId: '2003' },
      { id: '200401', name: '公共交通', type: 'expense', parentId: '2004' },
      { id: '200402', name: '打车', type: 'expense', parentId: '2004' },
      // 收入分类（一级）
      { id: '3001', name: '工资', type: 'income', parentId: null },
      { id: '3002', name: '经营', type: 'income', parentId: null },
      { id: '3003', name: '投资', type: 'income', parentId: null },
      { id: '3004', name: '其他收入', type: 'income', parentId: null },
      // 收入分类（二级）
      { id: '300101', name: '基本工资', type: 'income', parentId: '3001' },
      { id: '300102', name: '奖金', type: 'income', parentId: '3001' },
      { id: '300301', name: '基金收益', type: 'income', parentId: '3003' },
      { id: '300302', name: '股票收益', type: 'income', parentId: '3003' }
    ]
    
    for (const category of defaultCategories) {
      await this.add('categories', category)
    }
    
    // 3. 初始化账套数据
    await this.add('ledgers', {
      id: this.currentLedgerId.value,
      name: '我的账本',
      description: '默认记账账本',
      isDefault: true,
      isActive: true
    })
    
    // 4. 初始化维度数据（成员、商家、标签、支付渠道）
    this._data.value.dimensions = {
      members: ['我自己', '家人'],
      merchants: [],
      tags: ['重要', '日常'],
      paymentChannels: ['现金', '支付宝', '微信', '银行卡']
    }
    // 保存维度数据
    await this._save('dimensions')
    
    console.log('[CoreDataStore] 预置数据初始化完成')
  }

  /**
   * 重建引用表（ID → 对象映射）
   */
  _rebuildRefs() {
    const refs = {}
    
    // 分类引用
    refs.categories = {}
    for (const cat of (this._data.value.categories || [])) {
      refs.categories[cat.id] = cat
    }
    
    // 账户引用
    refs.accounts = {}
    for (const acc of (this._data.value.accounts || [])) {
      refs.accounts[acc.id] = acc
    }
    
    // 信用卡引用
    refs.credit_cards = {}
    for (const card of (this._data.value.credit_cards || [])) {
      refs.credit_cards[card.id] = card
    }
    
    // 投资账户引用
    refs.investment_accounts = {}
    for (const inv of (this._data.value.investment_accounts || [])) {
      refs.investment_accounts[inv.id] = inv
    }
    
    this._refs.value = refs
  }

  /**
   * 从交易中提取维度使用情况
   * 
   * 注意：维度数据不独立存储，只在需要时从交易中提取
   */
  _extractDimensionUsage() {
    const transactions = this._data.value.transactions || []
    const storedDimensions = this._data.value.dimensions || { members: [], merchants: [], tags: [], paymentChannels: [] }
    
    // 从已存储的维度数据初始化
    const usage = {
      members: new Set(storedDimensions.members || []),
      merchants: new Set(storedDimensions.merchants || []),
      tags: new Set(storedDimensions.tags || []),
      paymentChannels: new Set(storedDimensions.paymentChannels || [])
    }
    
    // 从交易中提取使用的维度，合并到已存储的维度中
    for (const t of transactions) {
      if (t.member) usage.members.add(t.member)
      if (t.merchant) usage.merchants.add(t.merchant)
      if (t.tags) {
        if (Array.isArray(t.tags)) {
          t.tags.forEach(tag => usage.tags.add(tag))
        } else if (t.tag) {
          usage.tags.add(t.tag)
        }
      }
      if (t.paymentChannel) usage.paymentChannels.add(t.paymentChannel)
    }
    
    // 转换为数组
    const dimensionData = {
      members: Array.from(usage.members),
      merchants: Array.from(usage.merchants),
      tags: Array.from(usage.tags),
      paymentChannels: Array.from(usage.paymentChannels)
    }
    
    // 更新响应式数据
    this._dimensionUsage.value = dimensionData
    
    // 保存到持久化存储
    this._data.value.dimensions = dimensionData
  }

  // =========================================================================
  // 通用数据操作
  // =========================================================================

  /**
   * 获取原始数据
   */
  getRaw(key) {
    return this._data.value[key] || []
  }

  /**
   * 获取响应式数据
   */
  getData(key) {
    return computed(() => this._data.value[key] || [])
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
    // 创建新数组以确保Vue检测到变化
    this._data.value[key] = [...data]
    
    // 保存到 API
    await this._save(key)
    
    // 同步到 PostgreSQL
    this._scheduleSync(key)
    
    // 更新引用表
    this._updateRef(key, item.id, item)
    
    // 如果是交易，更新维度使用情况
    if (key === 'transactions') {
      this._updateDimensionUsage('add', item)
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
    
    // 保存到 API
    await this._save(key)
    
    // 同步到 MySQL
    this._scheduleSync(key)
    
    // 更新引用表
    this._updateRef(key, id, data[index])

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
    
    // 保存到 API
    await this._save(key)
    
    // 同步到 PostgreSQL
    this._scheduleSync(key)
    
    // 清理引用表
    this._clearRef(key, id)

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
   * 更新引用表
   */
  _updateRef(key, id, item) {
    const refMap = {
      categories: 'categories',
      accounts: 'accounts',
      credit_cards: 'credit_cards',
      investment_accounts: 'investment_accounts'
    }
    
    const refKey = refMap[key]
    if (refKey && this._refs.value[refKey]) {
      this._refs.value[refKey][id] = item
    }
  }
  
  /**
   * 清理引用表
   */
  _clearRef(key, id) {
    const refMap = {
      categories: 'categories',
      accounts: 'accounts',
      credit_cards: 'credit_cards',
      investment_accounts: 'investment_accounts'
    }
    
    const refKey = refMap[key]
    if (refKey && this._refs.value[refKey]) {
      delete this._refs.value[refKey][id]
    }
  }

  /**
   * 生成唯一ID
   */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 保存到 API
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

  // =========================================================================
  // 衍生数据计算（核心功能）
  // =========================================================================
  
  /**
   * 计算账户余额
   * 
   * balance = SUM(交易金额)
   * - 收入类交易：+amount（到账账户）
   * - 支出类交易：-amount（出账账户）
   * - 转账类交易：-amount（出账账户），+amount（到账账户）
   */
  calculateAccountBalance(accountId) {
    const transactions = this._data.value.transactions || []
    let balance = 0
    
    for (const t of transactions) {
      if (t.type === 'income' && String(t.account_id) === String(accountId)) {
        balance += t.amount || 0
      } else if (t.type === 'expense' && String(t.account_id) === String(accountId)) {
        balance -= t.amount || 0
      } else if (t.type === 'transfer') {
        if (String(t.fromAccount) === String(accountId)) {
          balance -= t.amount || 0
        }
        if (String(t.to_account_id) === String(accountId)) {
          balance += t.amount || 0
        }
      }
    }
    
    const account = this.find('accounts', accountId)
    if (account) {
      balance += account.initialBalance || 0
    }
    
    return balance
  }
  
  /**
   * 获取账户余额（计算值 + 可选校验存储值）
   * 
   * @param {string} accountId - 账户ID
   * @param {boolean} validate - 是否与存储值校验
   */
  getAccountBalance(accountId, validate = false) {
    const calculated = this.calculateAccountBalance(accountId)
    
    if (validate) {
      const account = this.find('accounts', accountId)
      if (account && account.balance !== undefined) {
        const stored = account.balance
        if (Math.abs(calculated - stored) > 0.01) {
          console.warn(`[CoreDataStore] 账户 ${accountId} 余额校验失败: 计算值=${calculated}, 存储值=${stored}`)
          // 可选：自动修正
          // this.update('accounts', accountId, { balance: calculated })
        }
      }
    }
    
    return calculated
  }
  
  /**
   * 计算信用卡已用额度
   */
  calculateCreditCardUsed(accountId) {
    const transactions = this._data.value.transactions || []
    let used = 0
    
    for (const t of transactions) {
      // 信用卡消费（支出）增加已用额度
      if (t.type === 'expense' && String(t.creditCardAccount) === String(accountId)) {
        used += t.amount || 0
      }
      // 信用卡还款（收入）减少已用额度
      if (t.type === 'income' && t.isRepayment && String(t.creditCardAccount) === String(accountId)) {
        used -= t.amount || 0
      }
    }
    
    return Math.max(0, used)
  }
  
  /**
   * 获取信用卡信息（含计算值）
   */
  getCreditCardInfo(cardId) {
    const card = this.find('credit_cards', cardId)
    if (!card) return null
    
    const usedCredit = this.calculateCreditCardUsed(cardId)
    const limit = card.creditLimit || 0
    
    return {
      ...card,
      usedCredit,
      availableCredit: Math.max(0, limit - usedCredit)
    }
  }
  
  /**
   * 计算投资账户总价值
   */
  calculateInvestmentValue(accountId) {
    // 从净值历史中获取最新净值
    const history = this.filter('net_value_history', h => String(h.accountId) === String(accountId))
    
    if (history.length === 0) return 0
    
    // 按日期排序，获取最新记录
    history.sort((a, b) => new Date(b.date) - new Date(a.date))
    const latest = history[0]
    
    return latest.totalValue || 0
  }
  
  /**
   * 获取维度数据（从交易中提取）
   */
  getDimensions() {
    return {
      members: this._dimensionUsage.value.members || [],
      merchants: this._dimensionUsage.value.merchants || [],
      tags: this._dimensionUsage.value.tags || [],
      paymentChannels: this._dimensionUsage.value.paymentChannels || []
    }
  }

  /**
   * 获取维度项目列表（用于下拉选择）
   */
  getDimensionItems(type) {
    const items = this._dimensionUsage.value[type] || []
    return items.map((name, index) => ({
      id: `dim_${type}_${index}`,
      name
    }))
  }

  /**
   * 检查维度是否被使用
   */
  isDimensionUsed(type, name) {
    const items = this._dimensionUsage.value[type] || []
    return items.includes(name)
  }

  /**
   * 添加维度（直接保存到dimensions，不创建临时交易）
   */
  async addDimension(type, data) {
    // 直接添加到dimensions数组
    if (!this._data.value.dimensions) {
      this._data.value.dimensions = {
        members: [],
        merchants: [],
        tags: [],
        paymentChannels: []
      }
    }
    
    const fieldName = type === 'paymentChannels' ? 'paymentChannels' : type
    if (!this._data.value.dimensions[fieldName].includes(data.name)) {
      this._data.value.dimensions[fieldName].push(data.name)
    }
    
    // 更新响应式数据
    this._dimensionUsage.value = { ...this._data.value.dimensions }
    
    // 保存维度数据
    await this._save('dimensions')
    
    // 同步到 PostgreSQL
    this._scheduleSync('dimensions')
    
    return { success: true, id: `dim_${type}_${Date.now()}` }
  }

  /**
   * 更新维度（更新维度数据）
   */
  async updateDimension(type, id, updates) {
    const fieldName = type === 'paymentChannels' ? 'paymentChannels' : type
    const oldName = id.split('_').slice(2).join('_')
    const newName = updates.name
    
    if (oldName === newName) return { success: true }
    
    // 更新维度数据
    const currentItems = this._data.value.dimensions[fieldName] || []
    const index = currentItems.indexOf(oldName)
    if (index > -1) {
      currentItems[index] = newName
      this._data.value.dimensions[fieldName] = [...currentItems]
    }
    
    // 更新响应式数据
    this._dimensionUsage.value = { ...this._data.value.dimensions }
    
    // 保存维度数据
    await this._save('dimensions')
    
    // 同步到 PostgreSQL
    this._scheduleSync('dimensions')
    
    return { success: true }
  }

  /**
   * 删除维度（只能删除未使用的维度）
   */
  async deleteDimension(type, id) {
    const fieldName = type === 'paymentChannels' ? 'paymentChannels' : type
    const name = id.split('_').slice(2).join('_')
    
    if (this.isDimensionUsed(type, name)) {
      return { success: false, message: '该维度已被交易使用，无法删除' }
    }
    
    // 从维度数据中移除
    const currentItems = this._data.value.dimensions[fieldName] || []
    const index = currentItems.indexOf(name)
    if (index > -1) {
      currentItems.splice(index, 1)
      this._data.value.dimensions[fieldName] = [...currentItems]
    }
    
    // 更新响应式数据
    this._dimensionUsage.value = { ...this._data.value.dimensions }
    
    // 保存维度数据
    await this._save('dimensions')
    
    // 同步到 PostgreSQL
    this._scheduleSync('dimensions')
    
    return { success: true }
  }

  // =========================================================================
  // 核心记账功能：交易操作
  // =========================================================================

  /**
   * 添加交易（核心功能）
   * 
   * 交易是唯一事实，添加交易后：
   * - 账户余额由 calculateAccountBalance() 实时计算
   * - 信用卡额度由 calculateCreditCardUsed() 实时计算
   * - 不存储衍生值，只在读取时计算
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

    // 更新维度使用情况
    this._updateDimensionUsage('add', transaction)

    // 触发数据变更事件
    window.dispatchEvent(new CustomEvent('dataChanged', { 
      detail: { type: 'transactions', action: 'add', id: transaction.id } 
    }))

    console.log('[CoreDataStore] 添加交易:', transaction.id)
    return transaction
  }
  
  /**
   * 更新交易
   */
  async updateTransaction(id, updates) {
    const oldTransaction = this.find('transactions', id)
    
    // 更新交易
    await this.update('transactions', id, updates)
    
    // 更新维度使用情况
    if (oldTransaction) {
      this._extractDimensionUsage()
    }
    
    // 触发数据变更事件
    window.dispatchEvent(new CustomEvent('dataChanged', { 
      detail: { type: 'transactions', action: 'update', id } 
    }))
    
    return this.find('transactions', id)
  }
  
  /**
   * 删除交易
   */
  async deleteTransaction(id) {
    const transaction = this.find('transactions', id)
    
    await this.remove('transactions', id)
    
    // 重新提取维度
    this._extractDimensionUsage()
    
    // 触发数据变更事件
    window.dispatchEvent(new CustomEvent('dataChanged', { 
      detail: { type: 'transactions', action: 'delete', id } 
    }))
    
    return transaction
  }

  /**
   * 获取交易列表（支持过滤）
   */
  getTransactions(filters = {}) {
    let transactions = this._data.value.transactions || []
    
    // 按日期过滤
    if (filters.startDate) {
      transactions = transactions.filter(t => t.date >= filters.startDate)
    }
    if (filters.endDate) {
      transactions = transactions.filter(t => t.date <= filters.endDate)
    }
    
    // 按类型过滤
    if (filters.type) {
      transactions = transactions.filter(t => t.type === filters.type)
    }
    
    // 按账户过滤
    if (filters.accountId) {
      transactions = transactions.filter(t => 
        String(t.account) === String(filters.accountId) ||
        String(t.fromAccount) === String(filters.accountId) ||
        String(t.toAccount) === String(filters.accountId)
      )
    }
    
    // 按分类过滤
    if (filters.category) {
      transactions = transactions.filter(t => t.category === filters.category)
    }
    
    // 按商户过滤
    if (filters.merchant) {
      transactions = transactions.filter(t => t.merchant === filters.merchant)
    }
    
    // 按成员过滤
    if (filters.member) {
      transactions = transactions.filter(t => t.member === filters.member)
    }
    
    // 按标签过滤
    if (filters.tag) {
      transactions = transactions.filter(t => {
        if (Array.isArray(t.tags)) return t.tags.includes(filters.tag)
        return t.tag === filters.tag
      })
    }
    
    // 排序（默认按日期降序）
    if (filters.sortBy === 'date' || !filters.sortBy) {
      transactions.sort((a, b) => {
        const dateCompare = (b.date || '').localeCompare(a.date || '')
        if (dateCompare !== 0) return dateCompare
        return (b.createdAt || '').localeCompare(a.createdAt || '')
      })
    }
    
    return transactions
  }
  
  /**
   * 更新维度使用情况
   */
  _updateDimensionUsage(mode, transaction) {
    if (mode === 'add') {
      if (transaction.member) {
        if (!this._dimensionUsage.value.members.includes(transaction.member)) {
          this._dimensionUsage.value.members.push(transaction.member)
        }
      }
      if (transaction.merchant) {
        if (!this._dimensionUsage.value.merchants.includes(transaction.merchant)) {
          this._dimensionUsage.value.merchants.push(transaction.merchant)
        }
      }
      if (transaction.paymentChannel) {
        if (!this._dimensionUsage.value.paymentChannels.includes(transaction.paymentChannel)) {
          this._dimensionUsage.value.paymentChannels.push(transaction.paymentChannel)
        }
      }
      if (transaction.tags) {
        const tags = Array.isArray(transaction.tags) ? transaction.tags : [transaction.tag]
        for (const tag of tags) {
          if (tag && !this._dimensionUsage.value.tags.includes(tag)) {
            this._dimensionUsage.value.tags.push(tag)
          }
        }
      }
    }
  }

  // =========================================================================
  // 账户管理
  // =========================================================================

  /**
   * 添加账户（仅基础定义，不含余额）
   */
  async addAccount(account) {
    if (!account.id) {
      account.id = this._generateId()
    }
    account.createdAt = new Date().toISOString()
    // 不存储 balance，由交易计算得出
    
    await this.add('accounts', account)
    
    console.log('[CoreDataStore] 添加账户:', account.name)
    return account
  }

  /**
   * 更新账户（仅基础信息，不更新余额）
   */
  async updateAccount(id, updates) {
    // 禁止直接更新余额
    delete updates.balance
    
    return await this.update('accounts', id, updates)
  }

  /**
   * 获取账户列表（包含计算得出的余额）
   */
  getAccounts(withBalance = true) {
    const accounts = this._data.value.accounts || []
    
    if (!withBalance) return accounts
    
    return accounts.map(acc => ({
      ...acc,
      balance: this.calculateAccountBalance(acc.id)
    }))
  }

  // =========================================================================
  // 信用卡管理
  // =========================================================================

  /**
   * 添加信用卡
   */
  async addCreditCard(card) {
    if (!card.id) {
      card.id = 'cc_' + this._generateId()
    }
    card.createdAt = new Date().toISOString()
    // 不存储 usedCredit，由交易计算得出
    
    // 创建关联账户
    const linkedAccount = await this.addAccount({
      name: card.name + ' (信用卡)',
      category: 'credit_card',
      currency: card.currency || 'CNY'
    })
    card.linkedAccountId = linkedAccount.id
    
    await this.add('credit_cards', card)
    
    console.log('[CoreDataStore] 添加信用卡:', card.name)
    return card
  }

  /**
   * 获取信用卡列表（包含计算得出的额度）
   */
  getCreditCards() {
    const cards = this._data.value.credit_cards || []
    
    return cards.map(card => ({
      ...card,
      usedCredit: this.calculateCreditCardUsed(card.id),
      availableCredit: Math.max(0, (card.creditLimit || 0) - this.calculateCreditCardUsed(card.id))
    }))
  }

  // =========================================================================
  // 贷款管理
  // =========================================================================

  /**
   * 添加贷款
   */
  async addLoan(loan) {
    if (!loan.id) {
      loan.id = this._generateId()
    }
    loan.createdAt = new Date().toISOString()
    
    await this.add('loans', loan)
    
    console.log('[CoreDataStore] 添加贷款:', loan.name)
    return loan
  }
  
  /**
   * 添加贷款还款
   */
  async addLoanPayment(payment) {
    if (!payment.id) {
      payment.id = this._generateId()
    }
    payment.date = payment.date || new Date().toISOString().split('T')[0]
    payment.createdAt = new Date().toISOString()
    
    await this.add('loan_payments', payment)
    
    return payment
  }
  
  /**
   * 计算贷款剩余金额
   */
  calculateLoanRemaining(loanId) {
    const loan = this.find('loans', loanId)
    if (!loan) return 0
    
    const payments = this.filter('loan_payments', p => String(p.loanId) === String(loanId))
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    
    return Math.max(0, (loan.principal || 0) - totalPaid)
  }

  // =========================================================================
  // 投资管理
  // =========================================================================

  /**
   * 添加投资账户
   */
  async addInvestmentAccount(account) {
    if (!account.id) {
      account.id = 'inv_' + this._generateId()
    }
    account.createdAt = new Date().toISOString()
    // 不存储 totalValue，由净值历史计算
    
    // 创建关联账户
    const linkedAccount = await this.addAccount({
      name: account.name,
      category: 'investment',
      currency: account.currency || 'CNY'
    })
    account.linkedAccountId = linkedAccount.id
    
    await this.add('investment_accounts', account)
    
    console.log('[CoreDataStore] 添加投资账户:', account.name)
    return account
  }
  
  /**
   * 添加净值记录
   */
  async addNetValueRecord(record) {
    if (!record.id) {
      record.id = this._generateId()
    }
    record.date = record.date || new Date().toISOString().split('T')[0]
    record.createdAt = new Date().toISOString()
    
    await this.add('net_value_history', record)
    
    return record
  }
  
  /**
   * 获取投资账户总价值
   */
  getInvestmentValue(accountId) {
    return this.calculateInvestmentValue(accountId)
  }

  /**
   * 更新投资账户资产
   */
  async updateInvestmentAccount(id, updates) {
    // 禁止直接更新余额，由投资明细计算得出
    delete updates.balance
    
    // 更新投资账户
    const result = await this.update('investment_accounts', id, updates)
    
    // 同步更新关联账户的余额
    const investmentAccount = this.find('investment_accounts', id)
    if (investmentAccount && investmentAccount.linkedAccountId) {
      // 计算投资账户总价值
      const accountDetails = this.filter('investment_details', d => String(d.accountId) === String(id))
      const totalValue = accountDetails.reduce((total, d) => total + (d.shares || 0) * (d.currentPrice || 0), 0)
      
      // 更新关联账户的余额
      await this.update('accounts', investmentAccount.linkedAccountId, {
        balance: totalValue
      })
    }
    
    console.log('[CoreDataStore] 更新投资账户资产:', id)
    return result
  }

  /**
   * 删除投资账户
   */
  async deleteInvestmentAccount(id) {
    // 删除关联的投资明细
    const details = this.filter('investment_details', d => String(d.accountId) === String(id))
    for (const detail of details) {
      await this.remove('investment_details', detail.id)
    }
    
    // 删除关联的净值历史
    const history = this.filter('net_value_history', h => String(h.accountId) === String(id))
    for (const record of history) {
      await this.remove('net_value_history', record.id)
    }
    
    // 删除关联账户
    const account = this.find('investment_accounts', id)
    if (account && account.linkedAccountId) {
      await this.remove('accounts', account.linkedAccountId)
    }
    
    // 删除投资账户
    await this.remove('investment_accounts', id)
    
    console.log('[CoreDataStore] 删除投资账户:', id)
    return true
  }

  // =========================================================================
  // 信用卡管理（扩展方法）
  // =========================================================================

  /**
   * 删除信用卡
   */
  async deleteCreditCard(id) {
    // 删除关联的信用卡账单
    const bills = this.filter('credit_card_bills', b => String(b.creditCardId) === String(id))
    for (const bill of bills) {
      await this.remove('credit_card_bills', bill.id)
    }
    
    // 删除关联账户
    const card = this.find('credit_cards', id)
    if (card && card.linkedAccountId) {
      await this.remove('accounts', card.linkedAccountId)
    }
    
    // 删除信用卡
    await this.remove('credit_cards', id)
    
    console.log('[CoreDataStore] 删除信用卡:', id)
    return true
  }

  /**
   * 计算信用卡已用额度（从交易中计算）
   */
  calculateCreditCardUsed(cardId) {
    const transactions = this._data.value.transactions || []
    let used = 0
    
    for (const t of transactions) {
      // 信用卡消费（支出）增加已用额度
      if (t.type === 'expense' && String(t.creditCard) === String(cardId)) {
        used += t.amount || 0
      }
      // 信用卡还款（收入）减少已用额度
      if (t.type === 'income' && t.isRepayment && String(t.creditCard) === String(cardId)) {
        used -= t.amount || 0
      }
    }
    
    return Math.max(0, used)
  }

  /**
   * 计算信用卡可用额度
   */
  getCreditCardAvailable(cardId) {
    const card = this.find('credit_cards', cardId)
    if (!card) return 0
    
    const used = this.calculateCreditCardUsed(cardId)
    const limit = card.creditLimit || 0
    
    return Math.max(0, limit - used)
  }

  // =========================================================================
  // 贷款管理（扩展方法）
  // =========================================================================

  /**
   * 删除贷款
   */
  async deleteLoan(id) {
    // 删除关联的还款记录
    const payments = this.filter('loan_payments', p => String(p.loanId) === String(id))
    for (const payment of payments) {
      await this.remove('loan_payments', payment.id)
    }
    
    // 删除贷款
    await this.remove('loans', id)
    
    console.log('[CoreDataStore] 删除贷款:', id)
    return true
  }

  /**
   * 计算贷款剩余金额（改进版）
   */
  calculateLoanRemainingAmount(loanId) {
    const loan = this.find('loans', loanId)
    if (!loan) return 0
    
    const payments = this.filter('loan_payments', p => String(p.loanId) === String(loanId) && p.status === 'paid')
    const totalPaid = payments.reduce((sum, p) => sum + (p.principal || p.amount || 0), 0)
    
    return Math.max(0, (loan.totalAmount || loan.total_amount || 0) - totalPaid)
  }

  /**
   * 计算贷款已还期数
   */
  calculateLoanPaidPeriods(loanId) {
    const payments = this.filter('loan_payments', p => String(p.loanId) === String(loanId) && p.status === 'paid')
    return payments.length
  }

  // =========================================================================
  // 分类管理
  // =========================================================================

  /**
   * 获取分类树
   */
  getCategoryTree() {
    const categories = this._data.value.categories || []
    
    // 按类型分组
    const income = categories.filter(c => c.type === 'income')
    const expense = categories.filter(c => c.type === 'expense')
    
    // 构建树
    const buildTree = (items) => {
      const roots = items.filter(c => !c.parentId)
      const children = items.filter(c => c.parentId)
      
      const attachChildren = (parent) => {
        parent.children = children
          .filter(c => c.parentId === parent.id)
          .map(c => ({ ...c, children: attachChildren(c) || [] }))
        return parent
      }
      
      return roots.map(r => attachChildren(r))
    }
    
    return {
      income: buildTree(income),
      expense: buildTree(expense)
    }
  }

  // =========================================================================
  // 同步功能
  // =========================================================================

  /**
   * 安排同步到 PostgreSQL
   */
  _scheduleSync(key) {
    // 延迟同步，避免频繁请求
    if (this._syncTimer) {
      clearTimeout(this._syncTimer)
    }
    
    this._syncTimer = setTimeout(() => {
      this.syncToServer()
    }, 2000)
  }

  /**
   * 同步到 PostgreSQL
   */
  async syncToServer() {
    if (!this._isOnline) return
    
    const userId = this.currentUserId.value || 'default'
    
    try {
      this._syncStatus.value = 'syncing'
      
      await apiRequest('/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          ledgerId: this.currentLedgerId.value,
          data: this._data.value
        })
      })
      
      this._syncStatus.value = 'synced'
      this._lastSyncTime.value = new Date().toISOString()
      
    } catch (error) {
      console.error('[CoreDataStore] 同步失败:', error)
      this._syncStatus.value = 'error'
    }
  }
}

// 导出单例
const coreDataStore = new CoreDataStore()
export default coreDataStore

// 导出辅助函数
export { CoreDataStore }
