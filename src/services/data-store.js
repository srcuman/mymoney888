/**
 * 中央数据存储层 (DataStore)
 * 
 * 设计原则：
 * 1. 单一数据源：每种数据只存储一份
 * 2. 计算派生：衍生数据（如余额）通过计算得出
 * 3. 自动同步：数据变更自动同步到数据库
 * 4. 事件通知：数据变更通知所有监听者
 * 
 * 数据关系：
 * 
 * transactions (交易记录) ──────┬──► accounts.balance (计算得出)
 *                              │
 *                              ├──► creditCards.availableCredit (计算得出)
 *                              │
 *                              ├──► loans.paidAmount (计算得出)
 *                              │
 *                              └──► investmentAccounts.totalAsset (计算得出)
 */

import { ref, computed } from 'vue'

class DataStore {
  constructor() {
    // 内部数据存储
    this._data = {
      accounts: ref([]),
      transactions: ref([]),
      creditCards: ref([]),
      creditCardBills: ref([]),
      loans: ref([]),
      repaymentPlans: ref([]),
      investmentAccounts: ref([]),
      investmentDetails: ref([])
    }
    
    // 数据版本号，用于检测变更
    this._versions = {}
    
    // 初始化
    this._init()
  }
  
  // 初始化：从 localStorage 加载数据
  async _init() {
    // 加载所有数据
    for (const key of Object.keys(this._data)) {
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          this._data[key].value = JSON.parse(saved)
        } catch (e) {
          console.error(`加载 ${key} 失败:`, e)
          this._data[key].value = []
        }
      }
    }
    
    // 初始化版本号
    for (const key of Object.keys(this._data)) {
      this._versions[key] = 1
    }
    
    console.log('DataStore 初始化完成')
  }
  
  // 获取数据（响应式）
  get(key) {
    return this._data[key]
  }
  
  // 获取原始数据（非响应式，用于计算）
  getRaw(key) {
    return this._data[key].value
  }
  
  // 设置数据（自动保存和同步）
  async set(key, value, options = {}) {
    const { skipSync = false, skipNotify = false } = options
    
    this._data[key].value = value
    this._versions[key]++
    
    // 保存到 localStorage
    localStorage.setItem(key, JSON.stringify(value))
    
    // 同步到数据库
    if (!skipSync && navigator.onLine) {
      await this._syncToServer(key)
    }
    
    // 通知变更
    if (!skipNotify) {
      this._notifyChange(key)
    }
  }
  
  // 添加数据项
  async add(key, item, options = {}) {
    const data = this.getRaw(key)
    const newData = [...data, item]
    await this.set(key, newData, options)
  }
  
  // 更新数据项
  async update(key, id, updates, options = {}) {
    const data = this.getRaw(key)
    const index = data.findIndex(item => item.id === id)
    if (index !== -1) {
      const newData = [...data]
      newData[index] = { ...newData[index], ...updates }
      await this.set(key, newData, options)
    }
  }
  
  // 删除数据项
  async remove(key, id, options = {}) {
    const data = this.getRaw(key)
    const newData = data.filter(item => item.id !== id)
    await this.set(key, newData, options)
  }
  
  // ============================================
  // 计算属性：根据交易记录计算各模块的余额
  // ============================================
  
  /**
   * 计算账户余额
   * 普通账户余额 = 初始余额 + 收入 - 支出
   */
  computedAccountBalance(accountId) {
    const account = this.getRaw('accounts').find(a => a.id === accountId)
    if (!account) return 0
    
    // 如果是信用卡账户，使用信用卡的计算逻辑
    if (account.category === 'credit_card') {
      return this.computedCreditCardBalance(account.name)
    }
    
    // 如果是投资账户，使用投资账户的计算逻辑
    if (account.category === 'investment') {
      return this.computedInvestmentAccountBalance(accountId)
    }
    
    // 普通账户：从交易记录计算
    const initialBalance = account.initialBalance || account.balance || 0
    const transactions = this.getRaw('transactions')
    
    // 筛选该账户的交易
    const accountTransactions = transactions.filter(t => 
      t.account == accountId || t.account === accountId
    )
    
    let balance = initialBalance
    for (const t of accountTransactions) {
      if (t.type === 'income') {
        balance += parseFloat(t.amount)
      } else if (t.type === 'expense') {
        balance -= parseFloat(t.amount)
      } else if (t.type === 'transfer' && t.toAccount) {
        if (t.account == accountId || t.account === accountId) {
          balance -= parseFloat(t.amount) // 转出
        }
        if (t.toAccount == accountId || t.toAccount === accountId) {
          balance += parseFloat(t.amount) // 转入
        }
      }
    }
    
    return balance
  }
  
  /**
   * 计算所有账户余额
   */
  computedAllAccountBalances() {
    const balances = {}
    const accounts = this.getRaw('accounts')
    
    for (const account of accounts) {
      balances[account.id] = this.computedAccountBalance(account.id)
    }
    
    return balances
  }
  
  /**
   * 计算信用卡可用额度
   * 可用额度 = 总额度 - 已用额度
   * 已用额度 = 所有未还交易金额
   */
  computedCreditCardBalance(cardName) {
    const card = this.getRaw('creditCards').find(c => c.name === cardName)
    if (!card) return 0
    
    const totalCredit = card.totalCredit || card.creditLimit || 0
    
    // 计算已用额度：从交易记录中找出该卡的消费
    const transactions = this.getRaw('transactions')
    const cardTransactions = transactions.filter(t => {
      const account = this.getRaw('accounts').find(a => a.id == t.account || a.id === t.account)
      return account && account.name === cardName && account.category === 'credit_card'
    })
    
    // 计算未还金额
    let usedAmount = 0
    for (const t of cardTransactions) {
      if (t.type === 'expense') {
        usedAmount += parseFloat(t.amount)
      } else if (t.type === 'income') {
        // 信用卡还款（收入）减少已用额度
        usedAmount -= parseFloat(t.amount)
      }
    }
    
    // 从账单中获取未还金额
    const bills = this.getRaw('creditCardBills')
    const cardBills = bills.filter(b => b.cardName === cardName)
    for (const bill of cardBills) {
      if (bill.status !== 'paid') {
        usedAmount += parseFloat(bill.remainingAmount || 0)
      }
    }
    
    const availableCredit = totalCredit - Math.max(0, usedAmount)
    return availableCredit
  }
  
  /**
   * 计算所有信用卡额度
   */
  computedAllCreditCardBalances() {
    const balances = {}
    const cards = this.getRaw('creditCards')
    
    for (const card of cards) {
      balances[card.name] = this.computedCreditCardBalance(card.name)
    }
    
    return balances
  }
  
  /**
   * 计算贷款已还金额
   * 已还金额 = 所有还款记录金额
   */
  computedLoanPaidAmount(loanId) {
    const transactions = this.getRaw('transactions')
    const loans = this.getRaw('loans')
    const loan = loans.find(l => l.id === loanId)
    if (!loan) return 0
    
    // 从交易记录中计算还款金额
    let paidAmount = 0
    for (const t of transactions) {
      if (t.type === 'income' && t.description && t.description.includes(loan.name)) {
        paidAmount += parseFloat(t.amount)
      }
    }
    
    // 从还款计划中计算
    const repaymentPlans = this.getRaw('repaymentPlans')
    const loanPlans = repaymentPlans.filter(p => p.loanId === loanId)
    for (const plan of loanPlans) {
      if (plan.status === 'paid' || plan.isPaid) {
        paidAmount += parseFloat(plan.amount || 0)
      }
    }
    
    return paidAmount
  }
  
  /**
   * 计算所有贷款已还金额
   */
  computedAllLoanPaidAmounts() {
    const paidAmounts = {}
    const loans = this.getRaw('loans')
    
    for (const loan of loans) {
      paidAmounts[loan.id] = this.computedLoanPaidAmount(loan.id)
    }
    
    return paidAmounts
  }
  
  /**
   * 计算投资账户总资产
   * 总资产 = Σ(份额 × 当前价格)
   */
  computedInvestmentAccountBalance(accountId) {
    const details = this.getRaw('investmentDetails')
    const accountDetails = details.filter(d => d.accountId === accountId)
    
    let totalAsset = 0
    for (const detail of accountDetails) {
      totalAsset += parseFloat(detail.shares || 0) * parseFloat(detail.currentPrice || 0)
    }
    
    return totalAsset
  }
  
  /**
   * 计算所有投资账户余额
   */
  computedAllInvestmentAccountBalances() {
    const balances = {}
    const accounts = this.getRaw('investmentAccounts')
    
    for (const account of accounts) {
      balances[account.id] = this.computedInvestmentAccountBalance(account.id)
    }
    
    return balances
  }
  
  // ============================================
  // 数据同步
  // ============================================
  
  async _syncToServer(tableName) {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user || !user.id) return
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const data = this.getRaw(tableName)
      
      const response = await fetch(`${apiUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          table: tableName,
          data: data
        })
      })
      
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status}`)
      }
      
      console.log(`[DataStore] ${tableName} 已同步到服务器`)
    } catch (error) {
      console.error(`[DataStore] 同步 ${tableName} 失败:`, error)
    }
  }
  
  // ============================================
  // 事件通知
  // ============================================
  
  _notifyChange(key) {
    // 派发通用变更事件
    window.dispatchEvent(new CustomEvent('dataStoreChanged', {
      detail: { key, version: this._versions[key] }
    }))
    
    // 派发特定类型的变更事件
    const eventMap = {
      'transactions': 'transactionsUpdated',
      'accounts': 'accountsUpdated',
      'creditCards': 'creditCardsUpdated',
      'creditCardBills': 'creditCardBillsUpdated',
      'loans': 'loanAccountsUpdated',
      'repaymentPlans': 'loanAccountsUpdated',
      'investmentAccounts': 'investmentAccountsUpdated',
      'investmentDetails': 'investmentAccountsUpdated'
    }
    
    if (eventMap[key]) {
      window.dispatchEvent(new CustomEvent(eventMap[key]))
    }
  }
  
  // 手动刷新数据（从 localStorage 重新加载）
  async refresh(key) {
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        this._data[key].value = JSON.parse(saved)
        this._versions[key]++
        this._notifyChange(key)
      } catch (e) {
        console.error(`刷新 ${key} 失败:`, e)
      }
    }
  }
  
  // 刷新所有数据
  async refreshAll() {
    for (const key of Object.keys(this._data)) {
      await this.refresh(key)
    }
  }
  
  // 获取数据版本
  getVersion(key) {
    return this._versions[key] || 0
  }
}

// 创建单例
const dataStore = new DataStore()

export default dataStore
export { DataStore }
