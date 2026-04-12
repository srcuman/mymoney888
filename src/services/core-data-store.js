/**
 * 核心数据存储服务 (Core DataStore)
 * 
 * =============================================================================
 * 设计理念：记账是核心，其他功能都是辅助记账而存在的
 * =============================================================================
 * 
 * 【架构原则】
 * 1. 单一数据源：所有数据只存储一份在 localStorage，按账套隔离
 * 2. 双份持久化：localStorage（浏览器）+ MySQL（服务器）
 * 3. 零冗余存储：不使用事件触发机制，直接通过 DataStore 统一操作
 * 4. 模块独立：各模块有独立的数据存储服务，但都依赖核心 DataStore
 * 
 * 【数据分类】
 * 
 * ★★★ 核心数据（记账必须依赖）★★★
 * - transactions: 交易记录（最核心，只有一份）
 * - accounts: 账户余额（交易驱动的结果）
 * - categories: 收支分类（维度数据）
 * 
 * 辅助数据（服务记账但不主导）
 * - creditCards: 信用卡配置
 * - creditCardBills: 信用卡账单
 * - loans: 贷款配置
 * - repaymentPlans: 还款计划
 * 
 * 扩展数据（记账的补充）
 * - investmentAccounts: 投资账户
 * - investmentDetails: 投资明细
 * - netValueHistory: 净值历史
 * - investmentProfitRecords: 投资损益记录（关联的交易）
 * 
 * 维度数据（记账的标签）
 * - members: 成员
 * - merchants: 商户
 * - tags: 标签
 * - paymentChannels: 支付渠道
 * 
 * 系统数据（应用配置）
 * - ledgers: 账套管理
 * - users: 用户管理
 * 
 * 【数据联动规则】
 * 
 * 交易为核心驱动力：
 * - 添加交易 → 自动更新账户余额
 * - 编辑交易 → 自动调整账户余额
 * - 删除交易 → 自动还原账户余额
 * 
 * 信用卡辅助记账：
 * - 消费交易 → 关联信用卡账单
 * - 还款交易 → 转为转账（从借记卡到信用卡）
 * 
 * 投资辅助记账：
 * - 净值更新 → 可自动生成损益交易（按设定周期）
 * - 损益记录 → 作为收入/支出交易存储
 * 
 * 维度管理保护：
 * - 维度被交易引用时，只允许修改名称，不允许删除
 * 
 * =============================================================================
 * 版本: 3.8.0
 * =============================================================================
 */

import { ref, watch } from 'vue'

class CoreDataStore {
  constructor() {
    // 当前账套ID
    this.currentLedgerId = ref(localStorage.getItem('currentLedgerId') || 'default')
    
    // 内部数据存储（按账套隔离）
    this._data = {}
    
    // 数据版本号（用于触发响应式更新）
    this._versions = {}
    
    // 同步状态
    this._syncStatus = ref('idle')
    this._lastSyncTime = ref(null)
    
    // 在线状态
    this._isOnline = navigator.onLine
    
    // 维度使用情况缓存
    this._dimensionUsage = {}
    
    // 初始化
    this._init()
  }

  // 获取账套特定的存储键
  _getStorageKey(key) {
    return `${key}_${this.currentLedgerId.value}`
  }

  // 获取维度表名映射
  _getDimensionTableMap() {
    return {
      'members': 'members',
      'merchants': 'merchants',
      'tags': 'tags',
      'paymentChannels': 'payment_channels'
    }
  }

  // 获取业务表名映射
  _getBusinessTableMap() {
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
      'investmentProfitRecords': 'investment_profit_records'
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

    console.log('[CoreDataStore] 初始化完成')
  }

  // 加载所有数据到内存
  loadAllData() {
    const ledgerKeys = [
      'accounts', 'transactions', 'categories', 'creditCards',
      'creditCardBills', 'loans', 'repaymentPlans', 'investmentAccounts',
      'investmentDetails', 'netValueHistory', 'investmentProfitRecords'
    ]

    const globalKeys = [
      'dimensions', 'ledgers', 'members', 'merchants', 'tags', 'paymentChannels'
    ]

    // 加载账套隔离的数据
    for (const key of ledgerKeys) {
      const storageKey = this._getStorageKey(key)
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          this._data[key] = ref(JSON.parse(saved))
        } catch (e) {
          console.error(`[CoreDataStore] 加载 ${key} 失败:`, e)
          this._data[key] = ref([])
        }
      } else {
        this._data[key] = ref([])
      }
      this._versions[key] = 1
    }

    // 加载全局数据（不按账套隔离）
    for (const key of globalKeys) {
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          this._data[key] = ref(JSON.parse(saved))
        } catch (e) {
          console.error(`[CoreDataStore] 加载 ${key} 失败:`, e)
          this._data[key] = ref([])
        }
      } else {
        this._data[key] = ref([])
      }
      this._versions[key] = 1
    }

    // 重建维度使用情况
    this._rebuildDimensionUsage()

    console.log('[CoreDataStore] 加载账套数据:', this.currentLedgerId.value)
  }

  // 重建维度使用情况缓存
  _rebuildDimensionUsage() {
    const transactions = this.getRaw('transactions')
    const usages = {
      members: new Set(),
      merchants: new Set(),
      tags: new Set(),
      paymentChannels: new Set()
    }

    for (const t of transactions) {
      if (t.member) usages.members.add(t.member)
      if (t.merchant) usages.merchants.add(t.merchant)
      if (t.tag) usages.tags.add(t.tag)
      if (t.paymentChannel) usages.paymentChannels.add(t.paymentChannel)
    }

    this._dimensionUsage = usages
  }

  // 检查维度是否被使用
  isDimensionUsed(type, name) {
    return this._dimensionUsage[type]?.has(name) || false
  }

  // 更新维度使用情况
  _updateDimensionUsage(type, oldValue, newValue) {
    if (!this._dimensionUsage[type]) {
      this._dimensionUsage[type] = new Set()
    }
    if (oldValue) {
      this._dimensionUsage[type].delete(oldValue)
    }
    if (newValue) {
      this._dimensionUsage[type].add(newValue)
    }
  }

  // =========================================================================
  // 核心记账功能：交易操作
  // =========================================================================

  /**
   * 添加交易（核心功能）
   * @param {Object} transaction - 交易对象
   * @returns {Object} 添加的交易对象
   */
  async addTransaction(transaction) {
    // 确保ID存在
    if (!transaction.id) {
      transaction.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    transaction.date = transaction.date || new Date().toISOString().split('T')[0]

    // 添加交易记录
    await this.add('transactions', transaction)

    // 自动更新关联账户余额
    await this._updateAccountBalance(transaction, 'add')

    // 如果是信用卡交易，更新信用卡额度
    if (transaction.creditCardAccount) {
      await this._updateCreditCardBalance(transaction, 'add')
    }

    // 更新维度使用情况
    this._updateDimensionUsage('members', null, transaction.member)
    this._updateDimensionUsage('merchants', null, transaction.merchant)
    this._updateDimensionUsage('tags', null, transaction.tag)
    this._updateDimensionUsage('paymentChannels', null, transaction.paymentChannel)

    return transaction
  }

  /**
   * 更新交易
   * @param {string} transactionId - 交易ID
   * @param {Object} updates - 更新内容
   */
  async updateTransaction(transactionId, updates) {
    const oldTransaction = this.find('transactions', t => String(t.id) === String(transactionId))
    
    if (!oldTransaction) return null

    // 还原旧交易的影响
    await this._updateAccountBalance(oldTransaction, 'reverse')
    if (oldTransaction.creditCardAccount) {
      await this._updateCreditCardBalance(oldTransaction, 'reverse')
    }
    
    // 更新维度使用情况
    this._updateDimensionUsage('members', oldTransaction.member, updates.member)
    this._updateDimensionUsage('merchants', oldTransaction.merchant, updates.merchant)
    this._updateDimensionUsage('tags', oldTransaction.tag, updates.tag)
    this._updateDimensionUsage('paymentChannels', oldTransaction.paymentChannel, updates.paymentChannel)

    // 更新交易
    const updated = { ...oldTransaction, ...updates }
    await this.update('transactions', transactionId, updates)

    // 应用新交易的影响
    await this._updateAccountBalance(updated, 'add')
    if (updated.creditCardAccount) {
      await this._updateCreditCardBalance(updated, 'add')
    }

    return updated
  }

  /**
   * 删除交易
   * @param {string} transactionId - 交易ID
   */
  async deleteTransaction(transactionId) {
    const transaction = this.find('transactions', t => String(t.id) === String(transactionId))
    
    if (!transaction) return

    // 还原账户余额
    await this._updateAccountBalance(transaction, 'reverse')
    
    // 还原信用卡额度
    if (transaction.creditCardAccount) {
      await this._updateCreditCardBalance(transaction, 'reverse')
    }

    // 更新维度使用情况（不清理，因为可能有其他地方使用）
    // 实际上这里不应该删除，因为可能其他交易也使用同样的维度

    // 删除交易
    await this.remove('transactions', transactionId)
  }

  /**
   * 根据交易更新账户余额
   */
  async _updateAccountBalance(trans, mode) {
    const multiplier = mode === 'add' ? 1 : -1

    if (trans.type === 'transfer') {
      // 转账
      const fromAccount = this.find('accounts', a => String(a.id) === String(trans.account))
      const toAccount = this.find('accounts', a => String(a.id) === String(trans.toAccount))
      
      if (fromAccount) {
        await this.update('accounts', fromAccount.id, {
          balance: fromAccount.balance - (trans.amount * multiplier)
        })
      }
      if (toAccount) {
        await this.update('accounts', toAccount.id, {
          balance: toAccount.balance + (trans.amount * multiplier)
        })
      }
    } else {
      // 收入/支出
      const account = this.find('accounts', a => String(a.id) === String(trans.account))
      if (account) {
        let newBalance = account.balance
        if (trans.type === 'income') {
          newBalance = account.balance + (trans.amount * multiplier)
        } else {
          newBalance = account.balance - (trans.amount * multiplier)
        }
        await this.update('accounts', account.id, { balance: newBalance })
      }
    }
  }

  /**
   * 更新信用卡额度
   */
  async _updateCreditCardBalance(trans, mode) {
    const multiplier = mode === 'add' ? 1 : -1
    const card = this.find('creditCards', c => c.name === trans.creditCardAccount || c.id === trans.creditCardAccount)
    if (card) {
      await this.update('creditCards', card.id, {
        availableCredit: card.availableCredit - (trans.amount * multiplier)
      })
    }
  }

  // =========================================================================
  // 通用 CRUD 操作
  // =========================================================================

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
    const { skipSync = false, skipNotification = false } = options

    this._data[key].value = value
    this._versions[key]++

    // 保存到 localStorage
    const storageKey = key.includes('ledgers') || key.includes('dimensions') || 
                        ['members', 'merchants', 'tags', 'paymentChannels'].includes(key)
      ? key  // 全局数据
      : this._getStorageKey(key)
    
    localStorage.setItem(storageKey, JSON.stringify(value))

    // 同步到服务器
    if (!skipSync && this._isOnline) {
      this._syncToServer(key)
    }
  }

  // 添加数据项
  async add(key, item) {
    const data = this.getRaw(key)
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

  // =========================================================================
  // 维度管理功能
  // =========================================================================

  /**
   * 添加维度项目
   * @param {string} type - 维度类型 (members|merchants|tags|paymentChannels)
   * @param {Object} item - 维度项目
   */
  async addDimension(type, item) {
    if (!item.id) {
      item.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    item.createdAt = new Date().toISOString()
    return await this.add(type, item)
  }

  /**
   * 更新维度项目
   * @param {string} type - 维度类型
   * @param {string} id - 项目ID
   * @param {Object} updates - 更新内容
   */
  async updateDimension(type, id, updates) {
    const oldItem = this.find(type, i => String(i.id) === String(id))
    const oldName = oldItem?.name
    
    await this.update(type, id, updates)
    
    // 如果名称变更，需要更新所有使用该维度的交易
    if (updates.name && updates.name !== oldName) {
      await this._updateTransactionsWithDimension(type, oldName, updates.name)
    }
  }

  /**
   * 删除维度项目（仅在未使用时允许）
   * @param {string} type - 维度类型
   * @param {string} id - 项目ID
   * @returns {boolean} 是否删除成功
   */
  async deleteDimension(type, id) {
    const item = this.find(type, i => String(i.id) === String(id))
    if (!item) return false

    // 检查是否被使用
    if (this.isDimensionUsed(type, item.name)) {
      console.warn(`[CoreDataStore] 维度 ${type}.${item.name} 正在被使用，无法删除`)
      return false
    }

    await this.remove(type, id)
    return true
  }

  /**
   * 更新所有使用某维度的交易
   */
  async _updateTransactionsWithDimension(type, oldName, newName) {
    const transactions = this.getRaw('transactions')
    const dimensionMap = {
      members: 'member',
      merchants: 'merchant',
      tags: 'tag',
      paymentChannels: 'paymentChannel'
    }
    const field = dimensionMap[type]
    if (!field) return

    for (const t of transactions) {
      if (t[field] === oldName) {
        await this.update('transactions', t.id, { [field]: newName })
      }
    }
  }

  /**
   * 获取维度列表（带使用状态）
   */
  getDimensionsWithUsage(type) {
    const items = this.getRaw(type)
    return items.map(item => ({
      ...item,
      isUsed: this.isDimensionUsed(type, item.name)
    }))
  }

  // =========================================================================
  // 信用卡管理功能
  // =========================================================================

  /**
   * 创建信用卡并同步到账户管理
   */
  async addCreditCard(card) {
    if (!card.id) {
      card.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    card.availableCredit = card.creditLimit
    await this.add('creditCards', card)

    // 创建关联账户（信用卡账户）
    await this.add('accounts', {
      id: 'cc_' + card.id,
      name: card.name,
      category: 'credit_card',
      balance: 0,
      creditLimit: card.creditLimit,
      availableCredit: card.availableCredit,
      linkedCreditCardId: card.id
    })

    return card
  }

  /**
   * 删除信用卡及关联数据
   */
  async deleteCreditCard(cardId) {
    // 删除关联账户
    const linkedAccount = this.find('accounts', a => String(a.linkedCreditCardId) === String(cardId))
    if (linkedAccount) {
      await this.remove('accounts', linkedAccount.id)
    }

    // 删除信用卡
    await this.remove('creditCards', cardId)

    // 删除关联账单
    const bills = this.filter('creditCardBills', b => String(b.creditCardId) === String(cardId))
    for (const bill of bills) {
      await this.remove('creditCardBills', bill.id)
    }
  }

  // =========================================================================
  // 贷款管理功能
  // =========================================================================

  /**
   * 创建贷款并同步到账户管理
   */
  async addLoan(loan) {
    if (!loan.id) {
      loan.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    loan.remainingAmount = loan.amount
    await this.add('loans', loan)

    // 创建关联账户
    await this.add('accounts', {
      id: 'loan_' + loan.id,
      name: loan.name,
      category: 'loan',
      balance: loan.remainingAmount,
      linkedLoanId: loan.id
    })

    return loan
  }

  /**
   * 删除贷款及关联数据
   */
  async deleteLoan(loanId) {
    // 删除关联账户
    const linkedAccount = this.find('accounts', a => String(a.linkedLoanId) === String(loanId))
    if (linkedAccount) {
      await this.remove('accounts', linkedAccount.id)
    }

    // 删除贷款
    await this.remove('loans', loanId)

    // 删除还款计划
    const plans = this.filter('repaymentPlans', p => String(p.loanId) === String(loanId))
    for (const plan of plans) {
      await this.remove('repaymentPlans', plan.id)
    }
  }

  // =========================================================================
  // 投资管理功能
  // =========================================================================

  /**
   * 创建投资账户并同步到账户管理
   */
  async addInvestmentAccount(account) {
    if (!account.id) {
      account.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    
    // 统一字段名
    account.totalValue = account.totalValue ?? account.totalAsset ?? 0
    account.profitLoss = account.profitLoss ?? 0
    
    await this.add('investmentAccounts', account)

    // 创建关联账户
    await this.add('accounts', {
      id: 'inv_' + account.id,
      name: account.name,
      category: 'investment',
      balance: account.totalValue,
      linkedInvestmentAccountId: account.id
    })

    return account
  }

  /**
   * 更新投资账户并同步余额
   */
  async updateInvestmentAccount(accountId, updates) {
    // 统一字段名
    if (updates.totalAsset !== undefined && updates.totalValue === undefined) {
      updates.totalValue = updates.totalAsset
    }

    await this.update('investmentAccounts', accountId, updates)

    // 同步余额到关联账户
    if (updates.totalValue !== undefined) {
      const linkedAccount = this.find('accounts', a => String(a.linkedInvestmentAccountId) === String(accountId))
      if (linkedAccount) {
        await this.update('accounts', linkedAccount.id, { balance: updates.totalValue })
      }
    }
  }

  /**
   * 删除投资账户及关联数据
   */
  async deleteInvestmentAccount(accountId) {
    // 删除关联账户
    const linkedAccount = this.find('accounts', a => String(a.linkedInvestmentAccountId) === String(accountId))
    if (linkedAccount) {
      await this.remove('accounts', linkedAccount.id)
    }

    // 删除投资账户
    await this.remove('investmentAccounts', accountId)

    // 删除关联明细
    const details = this.filter('investmentDetails', d => String(d.accountId) === String(accountId))
    for (const detail of details) {
      await this.remove('investmentDetails', detail.id)
    }

    // 删除净值历史
    const history = this.filter('netValueHistory', h => String(h.accountId) === String(accountId))
    for (const record of history) {
      await this.remove('netValueHistory', record.id)
    }

    // 删除损益记录（关联的交易）
    const profitRecords = this.filter('investmentProfitRecords', r => String(r.accountId) === String(accountId))
    for (const record of profitRecords) {
      // 删除对应的交易
      if (record.transactionId) {
        await this.deleteTransaction(record.transactionId)
      }
      await this.remove('investmentProfitRecords', record.id)
    }
  }

  /**
   * 添加投资明细
   */
  async addInvestmentDetail(detail) {
    if (!detail.id) {
      detail.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    detail.updateDate = new Date().toISOString().split('T')[0]
    await this.add('investmentDetails', detail)

    // 更新账户资产
    await this._updateInvestmentAccountTotalValue(detail.accountId)

    return detail
  }

  /**
   * 更新投资明细
   */
  async updateInvestmentDetail(detailId, updates) {
    const oldDetail = this.find('investmentDetails', d => String(d.id) === String(detailId))
    if (!oldDetail) return null

    await this.update('investmentDetails', detailId, updates)

    // 如果账户变更或资产变更，更新账户
    if (oldDetail.accountId !== updates.accountId || 
        updates.currentPrice !== undefined || updates.shares !== undefined) {
      // 更新旧账户
      await this._updateInvestmentAccountTotalValue(oldDetail.accountId)
      // 更新新账户
      if (updates.accountId && updates.accountId !== oldDetail.accountId) {
        await this._updateInvestmentAccountTotalValue(updates.accountId)
      }
    }

    return this.find('investmentDetails', d => String(d.id) === String(detailId))
  }

  /**
   * 删除投资明细
   */
  async deleteInvestmentDetail(detailId) {
    const detail = this.find('investmentDetails', d => String(d.id) === String(detailId))
    if (!detail) return

    await this.remove('investmentDetails', detailId)
    await this._updateInvestmentAccountTotalValue(detail.accountId)
  }

  /**
   * 更新投资账户总价值
   */
  async _updateInvestmentAccountTotalValue(accountId) {
    const details = this.filter('investmentDetails', d => String(d.accountId) === String(accountId))
    const totalValue = details.reduce((sum, d) => sum + (d.shares || 0) * (d.currentPrice || 0), 0)
    const totalCost = details.reduce((sum, d) => sum + (d.shares || 0) * (d.costPrice || 0), 0)
    const profitLoss = totalValue - totalCost

    await this.updateInvestmentAccount(accountId, { totalValue, profitLoss })
  }

  /**
   * 记录净值历史
   */
  async recordNetValue(detail) {
    const today = new Date().toISOString().split('T')[0]
    const existing = this.find('netValueHistory', 
      h => h.code === detail.code && h.date === today
    )

    if (existing) {
      await this.update('netValueHistory', existing.id, {
        price: detail.currentPrice,
        updateTime: new Date().toISOString()
      })
    } else {
      await this.add('netValueHistory', {
        code: detail.code,
        name: detail.name,
        date: today,
        price: detail.currentPrice,
        updateTime: new Date().toISOString()
      })
    }
  }

  /**
   * 刷新投资净值（按周期自动生成损益交易）
   */
  async refreshInvestmentNetValues() {
    const details = this.getRaw('investmentDetails')
    const accounts = this.getRaw('investmentAccounts')

    for (const detail of details) {
      try {
        const info = await this._fetchInvestmentInfo(detail.code, detail.type)
        if (info.currentPrice) {
          await this.update('investmentDetails', detail.id, {
            currentPrice: info.currentPrice,
            netValueDate: info.updateDate || new Date().toISOString().split('T')[0]
          })
          await this.recordNetValue({ ...detail, currentPrice: info.currentPrice })

          // 更新账户总价值
          const account = accounts.find(a => String(a.id) === String(detail.accountId))
          if (account) {
            await this._updateInvestmentAccountTotalValue(account.id)
          }
        }
      } catch (error) {
        console.error(`刷新 ${detail.code} 净值失败:`, error)
      }
    }

    // 按周期检查是否需要生成损益交易
    await this._checkAndGenerateProfitRecords()
  }

  /**
   * 检查并生成损益记录
   */
  async _checkAndGenerateProfitRecords() {
    const accounts = this.getRaw('investmentAccounts')

    for (const account of accounts) {
      if (!account.profitRecordCycle) continue // 没有设置周期，不生成

      const cycle = account.profitRecordCycle // 'monthly' | 'quarterly' | 'yearly'
      const lastRecord = this.find('investmentProfitRecords', 
        r => String(r.accountId) === String(account.id)
      )
      
      // 检查是否到达记录周期
      if (!this._shouldGenerateRecord(cycle, lastRecord?.date)) continue

      // 计算当前损益
      const details = this.filter('investmentDetails', d => String(d.accountId) === String(account.id))
      const currentValue = details.reduce((sum, d) => sum + (d.shares || 0) * (d.currentPrice || 0), 0)
      const totalCost = details.reduce((sum, d) => sum + (d.shares || 0) * (d.costPrice || 0), 0)
      const profitLoss = currentValue - totalCost

      // 获取周期最后一天
      const recordDate = this._getCycleEndDate(cycle)

      // 检查是否已有该周期的记录
      const existingRecord = this.find('investmentProfitRecords',
        r => String(r.accountId) === String(account.id) && r.period === this._getPeriodKey(cycle, recordDate)
      )

      if (existingRecord) {
        // 更新现有记录对应的交易
        if (existingRecord.transactionId) {
          await this.updateTransaction(existingRecord.transactionId, {
            amount: Math.abs(profitLoss),
            type: profitLoss >= 0 ? 'income' : 'expense',
            category: profitLoss >= 0 
              ? (account.profitCategory || '投资收益') 
              : (account.lossCategory || '投资损失')
          })
        }
        await this.update('investmentProfitRecords', existingRecord.id, {
          profitLoss,
          currentValue,
          recordDate
        })
      } else {
        // 创建新记录和对应交易
        const category = profitLoss >= 0 
          ? (account.profitCategory || '投资收益')
          : (account.lossCategory || '投资损失')

        const transaction = await this.addTransaction({
          type: profitLoss >= 0 ? 'income' : 'expense',
          amount: Math.abs(profitLoss),
          category: category,
          account: account.linkedAccountId || 'default',
          description: `${account.name} ${this._getPeriodLabel(cycle)} 损益`,
          date: recordDate,
          member: '',
          merchant: '',
          tag: '投资损益',
          paymentChannel: '',
          isInvestmentProfit: true,
          investmentAccountId: account.id
        })

        await this.add('investmentProfitRecords', {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          accountId: account.id,
          period: this._getPeriodKey(cycle, recordDate),
          profitLoss,
          currentValue,
          costValue: totalCost,
          recordDate,
          transactionId: transaction.id
        })
      }
    }
  }

  /**
   * 判断是否应该生成记录
   */
  _shouldGenerateRecord(cycle, lastDate) {
    if (!lastDate) return true

    const now = new Date()
    const last = new Date(lastDate)
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24))

    switch (cycle) {
      case 'monthly': return diffDays >= 30
      case 'quarterly': return diffDays >= 90
      case 'yearly': return diffDays >= 365
      default: return false
    }
  }

  /**
   * 获取周期结束日期
   */
  _getCycleEndDate(cycle) {
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth()
    let day = 1

    switch (cycle) {
      case 'monthly':
        // 上月末
        return new Date(year, month, 0).toISOString().split('T')[0]
      case 'quarterly':
        // 上季度末
        const quarter = Math.floor(month / 3)
        if (quarter === 0) {
          year--
          month = 9
        } else {
          month = (quarter - 1) * 3 + 2
        }
        return new Date(year, month + 1, 0).toISOString().split('T')[0]
      case 'yearly':
        // 去年末
        return new Date(year - 1, 11, 31).toISOString().split('T')[0]
      default:
        return now.toISOString().split('T')[0]
    }
  }

  /**
   * 获取周期标识
   */
  _getPeriodKey(cycle, date) {
    const d = new Date(date)
    switch (cycle) {
      case 'monthly': return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      case 'quarterly': return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`
      case 'yearly': return `${d.getFullYear()}`
      default: return date
    }
  }

  /**
   * 获取周期标签
   */
  _getPeriodLabel(cycle) {
    switch (cycle) {
      case 'monthly': return '月度'
      case 'quarterly': return '季度'
      case 'yearly': return '年度'
      default: return ''
    }
  }

  /**
   * 获取投资信息（模拟，实际应调用外部API）
   */
  async _fetchInvestmentInfo(code, type) {
    // 这里应该调用真实的基金/股票查询API
    // 暂时返回模拟数据
    return {
      currentPrice: 1.0,
      updateDate: new Date().toISOString().split('T')[0]
    }
  }

  // =========================================================================
  // 服务器同步功能
  // =========================================================================

  // 初始化：从服务器拉取数据
  async initializeFromServer() {
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user || !user.id) {
      console.log('[CoreDataStore] 未登录，跳过服务器初始化')
      return
    }

    try {
      console.log('[CoreDataStore] 从服务器初始化数据...')
      const apiUrl = import.meta.env.VITE_API_URL || '/api'

      // 同步业务数据
      const businessTableMap = this._getBusinessTableMap()
      for (const [localKey, dbTable] of Object.entries(businessTableMap)) {
        if (this._isLedgerSpecificKey(localKey)) {
          const response = await fetch(`${apiUrl}/sync?userId=${user.id}&table=${dbTable}&ledgerId=${this.currentLedgerId.value}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data && result.data.length > 0) {
              this._data[localKey].value = result.data
              localStorage.setItem(this._getStorageKey(localKey), JSON.stringify(result.data))
              console.log(`[CoreDataStore] ${localKey} 从服务器同步 (${result.data.length}条)`)
            }
          }
        }
      }

      // 同步全局数据
      const dimensionTableMap = this._getDimensionTableMap()
      for (const [localKey, dbTable] of Object.entries(dimensionTableMap)) {
        const response = await fetch(`${apiUrl}/sync?userId=${user.id}&table=${dbTable}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data && result.data.length > 0) {
            this._data[localKey].value = result.data
            localStorage.setItem(localKey, JSON.stringify(result.data))
          }
        }
      }

      // 推送本地数据到服务器（如服务器无数据）
      await this.pushLocalToServer()

      this._lastSyncTime.value = new Date().toISOString()
    } catch (error) {
      console.error('[CoreDataStore] 从服务器初始化失败:', error)
    }
  }

  // 判断是否是账套隔离的数据
  _isLedgerSpecificKey(key) {
    const ledgerKeys = [
      'accounts', 'transactions', 'categories', 'creditCards',
      'creditCardBills', 'loans', 'repaymentPlans', 'investmentAccounts',
      'investmentDetails', 'netValueHistory', 'investmentProfitRecords'
    ]
    return ledgerKeys.includes(key)
  }

  // 推送本地数据到服务器
  async pushLocalToServer() {
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user || !user.id) return

    const apiUrl = import.meta.env.VITE_API_URL || '/api'

    // 推送业务数据
    const businessTableMap = this._getBusinessTableMap()
    for (const [localKey, dbTable] of Object.entries(businessTableMap)) {
      const data = this._data[localKey]?.value || []
      if (data.length === 0) continue

      try {
        await fetch(`${apiUrl}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            table: dbTable,
            ledgerId: this._isLedgerSpecificKey(localKey) ? this.currentLedgerId.value : null,
            data: data
          })
        })
      } catch (error) {
        console.error(`[CoreDataStore] 推送 ${localKey} 失败:`, error)
      }
    }
  }

  // 同步单个表到服务器
  async _syncToServer(key) {
    if (this._syncStatus.value === 'syncing') return

    this._syncStatus.value = 'syncing'

    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user || !user.id) return

      const businessTableMap = this._getBusinessTableMap()
      const dimensionTableMap = this._getDimensionTableMap()
      const tableMap = { ...businessTableMap, ...dimensionTableMap }
      
      const dbTable = tableMap[key] || key
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const data = this.getRaw(key)

      await fetch(`${apiUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          table: dbTable,
          ledgerId: this._isLedgerSpecificKey(key) ? this.currentLedgerId.value : null,
          data: data
        })
      })

      this._syncStatus.value = 'idle'
      this._lastSyncTime.value = new Date().toISOString()
    } catch (error) {
      console.error(`[CoreDataStore] 同步 ${key} 失败:`, error)
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
const coreDataStore = new CoreDataStore()

export default coreDataStore
export { CoreDataStore }
