/**
 * 数据存储服务 (DataStore)
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
 *    - 独立模块通过标签关联到交易
 *    - 不存储冗余的派生数据
 * 
 * 3. API 持久化
 *    - 数据通过 CoreDataStore 统一管理
 *    - 存储到 DATA_DIR/ledgers/{ledgerId}/*.json
 *    - 同时同步到 MySQL 备份
 * 
 * 4. 衍生数据计算
 *    - 账户余额 = SUM(交易)
 *    - 信用卡已用额度 = SUM(交易)
 *    - 所有衍生数据不长期存储，仅在使用时计算
 * 
 * =============================================================================
 * 版本: 3.9.0
 * =============================================================================
 */

import { ref, computed, shallowRef } from 'vue'

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
 * 数据存储类
 * 
 * 统一管理所有模块数据：
 * - 信用卡：credit_cards, credit_card_bills
 * - 贷款：loans, loan_payments
 * - 投资：investment_accounts, investment_details, net_value_history
 * 
 * 所有数据都通过 CoreDataStore 存储到 API
 */
class DataStore {
  constructor() {
    // 当前账套ID
    this.currentLedgerId = ref(sessionStorage.getItem('currentLedgerId') || 'default')
    
    // 当前用户ID
    this.currentUserId = ref(sessionStorage.getItem('userId') || null)
    
    // 内部数据存储
    this._data = shallowRef({})
    
    // 同步状态
    this._syncStatus = ref('idle')
    this._lastSyncTime = ref(null)
    
    // 在线状态
    this._isOnline = navigator.onLine
    
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
    })
    window.addEventListener('offline', () => {
      this._isOnline = false
    })

    // 监听数据变更事件
    window.addEventListener('dataChanged', (e) => {
      this._handleDataChange(e.detail)
    })

    console.log('[DataStore] v3.9.0 初始化完成')
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
    
    // 触发事件让其他组件响应
    window.dispatchEvent(new CustomEvent('ledgerChanged', {
      detail: { ledgerId }
    }))
  }

  // =========================================================================
  // 数据加载与保存（通过 API）
  // =========================================================================

  /**
   * 加载所有模块数据
   */
  async loadAllData() {
    const ledgerId = this.currentLedgerId.value
    
    try {
      const response = await apiRequest(`/api/datastore/load?ledgerId=${encodeURIComponent(ledgerId)}`)
      
      if (response.success && response.data) {
        this._data.value = response.data
        console.log(`[DataStore] 加载账套: ${ledgerId}`)
      } else {
        // 初始化空数据结构
        this._data.value = this._getEmptyDataStructure()
        console.log(`[DataStore] 账套 ${ledgerId} 初始化空数据`)
      }
      
    } catch (error) {
      console.error('[DataStore] 加载数据失败:', error)
      this._data.value = this._getEmptyDataStructure()
    }
  }

  /**
   * 获取空数据结构
   */
  _getEmptyDataStructure() {
    return {
      // 信用卡数据
      credit_cards: [],
      credit_card_bills: [],
      
      // 贷款数据
      loans: [],
      loan_payments: [],
      
      // 投资数据
      investment_accounts: [],
      investment_details: [],
      net_value_history: [],
      investment_profit_records: [],
      
      // 分期数据
      installment_templates: [],
      installments: []
    }
  }

  /**
   * 保存数据到 API
   */
  async _save(key) {
    try {
      await apiRequest('/api/datastore/save', {
        method: 'POST',
        body: JSON.stringify({
          ledgerId: this.currentLedgerId.value,
          data: {
            [key]: this._data.value[key] || []
          }
        })
      })
      
      // 同步到 MySQL
      this._scheduleSync(key)
      
    } catch (error) {
      console.error(`[DataStore] 保存 ${key} 失败:`, error)
      throw error
    }
  }

  /**
   * 安排同步到 MySQL
   */
  _scheduleSync(key) {
    if (this._syncTimer) {
      clearTimeout(this._syncTimer)
    }
    
    this._syncTimer = setTimeout(() => {
      this.syncToServer()
    }, 2000)
  }

  /**
   * 同步到 MySQL
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
      console.error('[DataStore] 同步失败:', error)
      this._syncStatus.value = 'error'
    }
  }

  /**
   * 处理数据变更事件
   */
  _handleDataChange(detail) {
    const { type, action, id } = detail
    console.log(`[DataStore] 数据变更: ${type} - ${action}`, id)
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
   * 生成唯一ID
   */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
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
    
    // 保存到 API
    await this._save(key)

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
    return data
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
    
    await this.add('credit_cards', card)
    
    console.log('[DataStore] 添加信用卡:', card.name)
    return card
  }

  /**
   * 获取信用卡列表
   */
  getCreditCards() {
    return this.getRaw('credit_cards')
  }

  /**
   * 添加信用卡账单
   */
  async addCreditCardBill(bill) {
    if (!bill.id) {
      bill.id = 'ccb_' + this._generateId()
    }
    bill.createdAt = new Date().toISOString()
    
    await this.add('credit_card_bills', bill)
    
    return bill
  }

  /**
   * 获取信用卡账单
   */
  getCreditCardBills(cardId = null) {
    const bills = this.getRaw('credit_card_bills')
    if (cardId) {
      return bills.filter(b => String(b.credit_card_id) === String(cardId))
    }
    return bills
  }

  // =========================================================================
  // 贷款管理
  // =========================================================================

  /**
   * 添加贷款
   */
  async addLoan(loan) {
    if (!loan.id) {
      loan.id = 'loan_' + this._generateId()
    }
    loan.createdAt = new Date().toISOString()
    
    await this.add('loans', loan)
    
    console.log('[DataStore] 添加贷款:', loan.name)
    return loan
  }

  /**
   * 获取贷款列表
   */
  getLoans() {
    return this.getRaw('loans')
  }

  /**
   * 添加贷款还款记录
   */
  async addLoanPayment(payment) {
    if (!payment.id) {
      payment.id = 'lp_' + this._generateId()
    }
    payment.createdAt = new Date().toISOString()
    
    await this.add('loan_payments', payment)
    
    return payment
  }

  /**
   * 获取贷款还款记录
   */
  getLoanPayments(loanId) {
    return this.getRaw('loan_payments').filter(p => String(p.loan_id) === String(loanId))
  }

  /**
   * 计算贷款剩余金额（由还款记录计算）
   */
  calculateLoanRemaining(loanId) {
    const loan = this.find('loans', loanId)
    if (!loan) return 0
    
    const payments = this.getLoanPayments(loanId)
    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.principal || p.amount || 0), 0)
    
    return Math.max(0, (loan.total_amount || 0) - totalPaid)
  }

  /**
   * 计算贷款已还期数
   */
  calculateLoanPaidPeriods(loanId) {
    const payments = this.getLoanPayments(loanId)
    return payments.filter(p => p.status === 'paid').length
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
    
    await this.add('investment_accounts', account)
    
    console.log('[DataStore] 添加投资账户:', account.name)
    return account
  }

  /**
   * 获取投资账户列表
   */
  getInvestmentAccounts() {
    return this.getRaw('investment_accounts')
  }

  /**
   * 添加投资明细
   */
  async addInvestmentDetail(detail) {
    if (!detail.id) {
      detail.id = 'invd_' + this._generateId()
    }
    detail.createdAt = new Date().toISOString()
    
    await this.add('investment_details', detail)
    
    return detail
  }

  /**
   * 获取投资明细
   */
  getInvestmentDetails(accountId = null) {
    const details = this.getRaw('investment_details')
    if (accountId) {
      return details.filter(d => String(d.account_id) === String(accountId))
    }
    return details
  }

  /**
   * 添加净值历史记录
   */
  async addNetValueRecord(record) {
    if (!record.id) {
      record.id = 'nvh_' + this._generateId()
    }
    record.createdAt = new Date().toISOString()
    
    await this.add('net_value_history', record)
    
    return record
  }

  /**
   * 获取净值历史记录
   */
  getNetValueHistory(accountId = null) {
    let history = this.getRaw('net_value_history')
    if (accountId) {
      history = history.filter(h => String(h.account_id) === String(accountId))
    }
    // 按日期降序排序
    return history.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }

  /**
   * 获取投资账户最新净值
   */
  getLatestNetValue(accountId) {
    const history = this.getNetValueHistory(accountId)
    return history[0] || null
  }

  /**
   * 添加投资损益记录
   */
  async addInvestmentProfitRecord(record) {
    if (!record.id) {
      record.id = 'ipr_' + this._generateId()
    }
    record.createdAt = new Date().toISOString()
    
    await this.add('investment_profit_records', record)
    
    return record
  }

  /**
   * 获取投资损益记录
   */
  getInvestmentProfitRecords(accountId = null, cycle = null) {
    let records = this.getRaw('investment_profit_records')
    
    if (accountId) {
      records = records.filter(r => String(r.account_id) === String(accountId))
    }
    if (cycle) {
      records = records.filter(r => r.cycle === cycle)
    }
    
    return records
  }

  // =========================================================================
  // 分期管理
  // =========================================================================

  /**
   * 添加分期模板
   */
  async addInstallmentTemplate(template) {
    if (!template.id) {
      template.id = 'it_' + this._generateId()
    }
    template.createdAt = new Date().toISOString()
    
    await this.add('installment_templates', template)
    
    return template
  }

  /**
   * 获取分期模板
   */
  getInstallmentTemplates() {
    return this.getRaw('installment_templates')
  }

  /**
   * 添加分期记录
   */
  async addInstallment(installment) {
    if (!installment.id) {
      installment.id = 'ins_' + this._generateId()
    }
    installment.createdAt = new Date().toISOString()
    
    await this.add('installments', installment)
    
    return installment
  }

  /**
   * 获取分期记录
   */
  getInstallments(templateId = null) {
    const installments = this.getRaw('installments')
    if (templateId) {
      return installments.filter(i => String(i.template_id) === String(templateId))
    }
    return installments
  }

  /**
   * 获取分期组记录
   */
  getInstallmentGroup(groupId) {
    return this.getRaw('installments').filter(i => i.installment_group_id === groupId)
  }

  // =========================================================================
  // 统计计算
  // =========================================================================

  /**
   * 计算信用卡已用额度
   */
  calculateCreditCardUsed(cardId) {
    // 注意：这个计算依赖 transactions 数据
    // 需要从 CoreDataStore 获取交易数据
    // 这里返回 0，实际计算在获取时进行
    return 0
  }

  /**
   * 计算投资账户总价值
   */
  calculateInvestmentValue(accountId) {
    const history = this.getNetValueHistory(accountId)
    if (history.length === 0) return 0
    return history[0].total_value || 0
  }
}

// 导出单例
const dataStore = new DataStore()
export default dataStore
export { DataStore }
