/**
 * 统一数据存储服务 (Unified DataStore)
 * 
 * =============================================================================
 * 设计理念：记账是核心，其他功能（信用卡、贷款、投资）都是辅助记账
 * =============================================================================
 * 
 * 架构原则：
 * 1. 单一数据源：localStorage 是浏览器端唯一的真实存储
 * 2. DataStore 只是 localStorage 的响应式包装（ViewModel）
 * 3. MySQL 是服务器端备份，用于多设备同步
 * 4. JSON文件 是 MySQL 的镜像备份，不算独立数据源
 * 
 * 数据流向（单向）：
 * 
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │  Vue组件  ◄────►  DataStore(响应式包装)  ◄────►  localStorage │
 *    └─────────────────────────────────────────────────────────────┘
 *                                                           │
 *                                                           ▼ 异步推送
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │                    MySQL (服务器主数据源)                      │
 *    └─────────────────────────────────────────────────────────────┘
 *                                                           │
 *                                                           ▼ 定时/变更备份
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │                 JSON文件 (Docker Volume)                      │
 *    └─────────────────────────────────────────────────────────────┘
 * 
 * 初始化策略：
 * 1. 已登录用户：MySQL → localStorage（覆盖本地）
 * 2. 未登录用户/首次：localStorage 自行运转
 * 3. 首次同步：localStorage → MySQL（建立备份）
 * 
 * 账套隔离策略：
 * - localStorage 键格式：{数据key}_{账套id}，如 accounts_default, transactions_user1
 * - MySQL 表包含 user_id + ledger_id 双字段隔离
 * 
 * 数据分类（按重要性）：
 * 
 * 【核心数据】- 记账必须依赖
 * - transactions: 交易记录（最核心）
 * - accounts: 账户（记录余额）
 * - categories: 收支分类
 * 
 * 【辅助数据】- 服务于记账
 * - creditCards: 信用卡（交易时自动关联）
 * - creditCardBills: 信用卡账单（关联信用卡交易）
 * - loans: 贷款账户（还款交易关联）
 * - repaymentPlans: 还款计划
 * 
 * 【扩展数据】- 记账的补充
 * - investmentAccounts: 投资账户
 * - investmentDetails: 投资明细
 * - netValueHistory: 净值历史
 * 
 * 【维度数据】- 记账的标签/属性
 * - dimensions: 维度总表（包含 members, merchants, tags, paymentChannels）
 * - expenseCategories: 支出分类
 * - incomeCategories: 收入分类
 * 
 * 【系统数据】- 应用配置
 * - ledgers: 账套管理
 * - users: 用户管理
 * 
 * =============================================================================
 * 核心原则：所有数据变更必须通过 DataStore，确保联动一致
 * =============================================================================
 */

import { ref } from 'vue'

class UnifiedDataStore {
  constructor() {
    // 当前账套ID
    this.currentLedgerId = ref(localStorage.getItem('currentLedgerId') || 'default')
    
    // 内部数据存储（按账套隔离的视图）
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

  // =========================================================================
  // 核心记账功能：交易与账户联动
  // =========================================================================

  /**
   * 添加交易并自动更新关联账户余额
   * @param {Object} transaction - 交易对象
   * @returns {Object} 添加的交易对象
   */
  async addTransaction(transaction) {
    // 确保ID存在
    if (!transaction.id) {
      transaction.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }

    // 添加交易记录
    await this.add('transactions', transaction)

    // 自动更新关联账户余额
    await this._updateAccountBalanceForTransaction(transaction, 'add')

    // 如果是信用卡交易，自动更新信用卡额度
    if (transaction.creditCardAccount) {
      await this._updateCreditCardBalance(transaction)
    }

    return transaction
  }

  /**
   * 更新交易并自动调整账户余额
   * @param {string} transactionId - 交易ID
   * @param {Object} updates - 更新内容
   */
  async updateTransaction(transactionId, updates) {
    const oldTransaction = this.find('transactions', t => String(t.id) === String(transactionId))
    
    // 先还原旧交易的影响
    if (oldTransaction) {
      await this._updateAccountBalanceForTransaction(oldTransaction, 'reverse')
    }

    // 更新交易
    await this.update('transactions', transactionId, updates)

    // 应用新交易的影响
    const newTransaction = { ...oldTransaction, ...updates }
    await this._updateAccountBalanceForTransaction(newTransaction, 'add')

    // 如果涉及信用卡，更新信用卡额度
    if (oldTransaction?.creditCardAccount || updates.creditCardAccount) {
      // 还原旧的影响
      if (oldTransaction?.creditCardAccount) {
        await this._updateCreditCardBalance({ ...oldTransaction, amount: -oldTransaction.amount })
      }
      // 应用新的影响
      if (newTransaction.creditCardAccount) {
        await this._updateCreditCardBalance(newTransaction)
      }
    }
  }

  /**
   * 删除交易并还原账户余额
   * @param {string} transactionId - 交易ID
   */
  async deleteTransaction(transactionId) {
    const transaction = this.find('transactions', t => String(t.id) === String(transactionId))
    
    if (transaction) {
      // 还原账户余额
      await this._updateAccountBalanceForTransaction(transaction, 'reverse')

      // 如果是信用卡交易，还原信用卡额度
      if (transaction.creditCardAccount) {
        await this._updateCreditCardBalance({ ...transaction, amount: -transaction.amount })
      }

      // 删除交易记录
      await this.remove('transactions', transactionId)
    }
  }

  /**
   * 根据交易更新账户余额
   * @param {Object} trans - 交易对象
   * @param {string} mode - 'add' 添加影响, 'reverse' 还原影响
   */
  async _updateAccountBalanceForTransaction(trans, mode) {
    const multiplier = mode === 'add' ? 1 : -1

    if (trans.type === 'transfer') {
      // 转账：减少转出账户，增加转入账户
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
      // 收入/支出：更新单个账户
      const account = this.find('accounts', a => String(a.id) === String(trans.account))
      if (account) {
        let newBalance
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
   * 更新信用卡额度（消费增加欠款，还款减少欠款）
   * @param {Object} trans - 信用卡交易
   */
  async _updateCreditCardBalance(trans) {
    const card = this.find('creditCards', c => c.name === trans.creditCardAccount || c.id === trans.creditCardAccount)
    if (card) {
      // 消费增加欠款（可用额度减少），还款减少欠款（可用额度增加）
      await this.update('creditCards', card.id, {
        availableCredit: card.availableCredit - trans.amount
      })
    }
  }

  // =========================================================================
  // 辅助功能：信用卡、贷款、投资与核心记账联动
  // =========================================================================

  /**
   * 创建信用卡并自动同步到账户管理
   * @param {Object} card - 信用卡数据
   */
  async addCreditCard(card) {
    if (!card.id) {
      card.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    await this.add('creditCards', card)

    // 自动创建关联的账户记录
    await this.add('accounts', {
      id: card.id,
      name: card.name,
      category: 'credit_card',
      balance: 0,
      creditLimit: card.creditLimit,
      availableCredit: card.availableCredit,
      // 关联信用卡ID
      linkedCreditCardId: card.id
    })

    return card
  }

  /**
   * 删除信用卡并清理关联数据
   * @param {string} cardId - 信用卡ID
   */
  async deleteCreditCard(cardId) {
    // 查找关联的账户
    const linkedAccount = this.find('accounts', a => a.linkedCreditCardId === cardId)
    if (linkedAccount) {
      await this.remove('accounts', linkedAccount.id)
    }

    // 删除信用卡
    await this.remove('creditCards', cardId)

    // 清理关联的账单
    const bills = this.filter('creditCardBills', b => String(b.creditCardId) === String(cardId))
    for (const bill of bills) {
      await this.remove('creditCardBills', bill.id)
    }
  }

  /**
   * 创建贷款并自动同步到账户管理
   * @param {Object} loan - 贷款数据
   */
  async addLoan(loan) {
    if (!loan.id) {
      loan.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    await this.add('loans', loan)

    // 自动创建关联的账户记录
    await this.add('accounts', {
      id: loan.id,
      name: loan.name,
      category: 'loan',
      balance: loan.remainingAmount || loan.amount,
      // 关联贷款ID
      linkedLoanId: loan.id
    })

    return loan
  }

  /**
   * 删除贷款并清理关联数据
   * @param {string} loanId - 贷款ID
   */
  async deleteLoan(loanId) {
    // 查找关联的账户
    const linkedAccount = this.find('accounts', a => a.linkedLoanId === loanId)
    if (linkedAccount) {
      await this.remove('accounts', linkedAccount.id)
    }

    // 删除贷款
    await this.remove('loans', loanId)

    // 清理关联的还款计划
    const plans = this.filter('repaymentPlans', p => String(p.loanId) === String(loanId))
    for (const plan of plans) {
      await this.remove('repaymentPlans', plan.id)
    }
  }

  /**
   * 创建投资账户并自动同步到账户管理
   * @param {Object} account - 投资账户数据
   */
  async addInvestmentAccount(account) {
    if (!account.id) {
      account.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    await this.add('investmentAccounts', account)

    // 自动创建关联的账户记录
    await this.add('accounts', {
      id: account.id,
      name: account.name,
      category: 'investment',
      balance: account.totalValue || 0,
      // 关联投资账户ID
      linkedInvestmentAccountId: account.id
    })

    return account
  }

  /**
   * 更新投资账户并同步余额到账户管理
   * @param {string} accountId - 投资账户ID
   * @param {Object} updates - 更新内容
   */
  async updateInvestmentAccount(accountId, updates) {
    await this.update('investmentAccounts', accountId, updates)

    // 同步余额到账户管理
    const investmentAccount = this.find('investmentAccounts', a => String(a.id) === String(accountId))
    if (investmentAccount && updates.totalValue !== undefined) {
      const linkedAccount = this.find('accounts', a => a.linkedInvestmentAccountId === accountId)
      if (linkedAccount) {
        await this.update('accounts', linkedAccount.id, {
          balance: updates.totalValue
        })
      }
    }
  }

  /**
   * 删除投资账户并清理关联数据
   * @param {string} accountId - 投资账户ID
   */
  async deleteInvestmentAccount(accountId) {
    // 查找关联的账户
    const linkedAccount = this.find('accounts', a => a.linkedInvestmentAccountId === accountId)
    if (linkedAccount) {
      await this.remove('accounts', linkedAccount.id)
    }

    // 删除投资账户
    await this.remove('investmentAccounts', accountId)

    // 清理关联的投资明细
    const details = this.filter('investmentDetails', d => String(d.accountId) === String(accountId))
    for (const detail of details) {
      await this.remove('investmentDetails', detail.id)
    }

    // 清理关联的净值历史
    const history = this.filter('netValueHistory', h => String(h.accountId) === String(accountId))
    for (const record of history) {
      await this.remove('netValueHistory', record.id)
    }
  }
}

// 创建单例
const unifiedDataStore = new UnifiedDataStore()

export default unifiedDataStore
export { UnifiedDataStore }
