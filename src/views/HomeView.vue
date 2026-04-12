<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">交易流水查询</h2>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="start-date" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">开始日期</label>
            <input type="date" id="start-date" v-model="filters.startDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="end-date" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">结束日期</label>
            <input type="date" id="end-date" v-model="filters.endDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="transaction-type" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">交易类型</label>
            <select id="transaction-type" v-model="filters.type" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">全部</option>
              <option value="expense">支出</option>
              <option value="income">收入</option>
              <option value="transfer">转账</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="category" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">分类</label>
            <select id="category" v-model="filters.category" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">全部</option>
              <optgroup label="支出分类">
                <template v-for="category in expenseCategories" :key="category.name">
                  <option v-for="subcategory in (category.children || [])" :key="`${category.name}-${subcategory.name}`" :value="`${category.name}-${subcategory.name}`">{{ subcategory.name }}</option>
                </template>
              </optgroup>
              <optgroup label="收入分类">
                <template v-for="category in incomeCategories" :key="category.name">
                  <option v-for="subcategory in (category.children || [])" :key="`${category.name}-${subcategory.name}`" :value="`${category.name}-${subcategory.name}`">{{ subcategory.name }}</option>
                </template>
              </optgroup>
            </select>
          </div>
          <div>
            <label for="account" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账户</label>
            <select id="account" v-model="filters.account" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">全部</option>
              <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
            </select>
          </div>
          <div>
            <label for="keyword" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">关键词</label>
            <input type="text" id="keyword" v-model="filters.keyword" placeholder="搜索备注、商家等" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
        </div>
        <div class="flex space-x-4">
          <button @click="applyFilters" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
            应用筛选
          </button>
          <button @click="resetFilters" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            重置
          </button>
          <button @click="exportTransactions" class="px-4 py-2 bg-secondary text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:bg-green-600 dark:hover:bg-green-700">
            导出
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">交易流水</h2>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          共 {{ filteredTransactions.length }} 条记录
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                日期
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                类型
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                分类
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                金额
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                账户
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                支付渠道
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                备注
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                分期
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(transaction, index) in paginatedTransactions" :key="transaction.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ transaction.date }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span :class="transaction.type === 'expense' ? 'text-danger' : transaction.type === 'income' ? 'text-secondary' : 'text-primary'" class="font-medium">
                  {{ transaction.type === 'expense' ? '支出' : transaction.type === 'income' ? '收入' : '转账' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ transaction.category || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" :class="transaction.type === 'expense' ? 'text-danger' : transaction.type === 'income' ? 'text-secondary' : 'text-primary'">
                {{ transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : '' }}{{ transaction.amount.toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ transaction.type === 'transfer' ? `${getAccountName(transaction.account)} → ${getAccountName(transaction.toAccount)}` : getAccountName(transaction.account) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ transaction.paymentChannel || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ transaction.description || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <!-- 分期信息 -->
                <span v-if="transaction.isInstallment" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {{ transaction.installmentIndex }}/{{ transaction.installmentTotal }}
                </span>
                <span v-if="transaction.isInstallment && transaction.installmentId" class="ml-1">
                  <button @click="showInstallmentDetail(transaction)" class="text-primary hover:text-blue-700 dark:hover:text-blue-400 text-xs">
                    [查看全部分期]
                  </button>
                </span>
                <span v-if="transaction.isInstallment && transaction.creditCardBillId" class="ml-1">
                  <button @click="showBillDetail(transaction)" class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-xs">
                    [查看账单]
                  </button>
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="editTransaction(transaction)" class="text-primary hover:text-blue-700 dark:hover:text-blue-400 mr-2">
                  编辑
                </button>
                <button @click="copyTransaction(transaction)" class="text-secondary hover:text-green-700 dark:hover:text-green-400 mr-2">
                  复制
                </button>
                <button @click="deleteTransaction(transaction.id)" class="text-danger hover:text-red-700 dark:hover:text-red-400">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="paginatedTransactions.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        没有找到符合条件的交易记录
      </div>
      <div v-else class="mt-4 flex justify-center">
        <nav class="flex items-center space-x-1">
          <button @click="currentPage = 1" :disabled="currentPage === 1" class="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
            首页
          </button>
          <button @click="currentPage--" :disabled="currentPage === 1" class="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
            上一页
          </button>
          <span class="px-3 py-1 text-gray-700 dark:text-gray-300">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
            下一页
          </button>
          <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" class="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
            末页
          </button>
        </nav>
      </div>
    </div>

    <!-- 分期详情模态框 -->
    <div v-if="showInstallmentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">分期详情</h3>
          <button @click="showInstallmentModal = false" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div v-if="installmentDetail" class="space-y-4">
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-sm text-gray-500 dark:text-gray-400">分期ID</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ installmentDetail.installmentId }}</p>
              </div>
              <div>
                <span class="text-sm text-gray-500 dark:text-gray-400">总金额</span>
                <p class="font-medium text-gray-900 dark:text-white">¥{{ installmentDetail.totalAmount?.toFixed(2) }}</p>
              </div>
              <div>
                <span class="text-sm text-gray-500 dark:text-gray-400">分期期数</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ installmentDetail.totalPeriods }}期</p>
              </div>
              <div>
                <span class="text-sm text-gray-500 dark:text-gray-400">每期金额</span>
                <p class="font-medium text-gray-900 dark:text-white">¥{{ (installmentDetail.totalAmount / installmentDetail.totalPeriods)?.toFixed(2) }}</p>
              </div>
            </div>
          </div>
          
          <h4 class="font-medium text-gray-900 dark:text-white">分期记录</h4>
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">期数</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">日期</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">金额</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">状态</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="record in installmentDetail.records" :key="record.id">
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ record.installmentIndex }}/{{ record.installmentTotal }}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ record.date }}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">¥{{ record.amount.toFixed(2) }}</td>
                <td class="px-4 py-2">
                  <span v-if="record.installmentIndex <= getCurrentInstallmentIndex(installmentDetail.records)" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    已入账
                  </span>
                  <span v-else class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    待入账
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 账单详情模态框 -->
    <div v-if="showBillModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">账单详情 - {{ billDetail?.cardName }}</h3>
          <button @click="showBillModal = false" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div v-if="billDetail" class="space-y-4">
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span class="text-sm text-gray-500 dark:text-gray-400">账单周期</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ getBillMonth(billDetail.billDate) }}</p>
              </div>
              <div>
                <span class="text-sm text-gray-500 dark:text-gray-400">账单金额</span>
                <p class="font-medium text-gray-900 dark:text-white">¥{{ billDetail.amount?.toFixed(2) }}</p>
              </div>
              <div>
                <span class="text-sm text-gray-500 dark:text-gray-400">已还金额</span>
                <p class="font-medium text-gray-900 dark:text-white">¥{{ billDetail.paidAmount?.toFixed(2) }}</p>
              </div>
              <div>
                <span class="text-sm text-gray-500 dark:text-gray-400">剩余金额</span>
                <p class="font-medium text-danger">¥{{ billDetail.remainingAmount?.toFixed(2) }}</p>
              </div>
            </div>
            <div class="mt-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">还款日: </span>
              <span class="font-medium text-gray-900 dark:text-white">{{ billDetail.dueDate }}</span>
              <span :class="billDetail.status === 'paid' ? 'ml-2 text-success' : billDetail.status === 'overdue' ? 'ml-2 text-danger' : 'ml-2 text-warning'" class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs">
                {{ billDetail.status === 'unpaid' ? '未还款' : billDetail.status === 'partial_paid' ? '部分还款' : billDetail.status === 'paid' ? '已还款' : '逾期' }}
              </span>
            </div>
          </div>
          
          <h4 class="font-medium text-gray-900 dark:text-white">账单内交易</h4>
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">日期</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">分类</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">金额</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">备注</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="t in billDetail.transactions" :key="t.id">
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ t.date }}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ t.category || '-' }}</td>
                <td class="px-4 py-2 text-sm text-danger">-¥{{ t.amount.toFixed(2) }}</td>
                <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {{ t.description || '-' }}
                  <span v-if="t.isInstallment" class="ml-1 text-xs text-purple-600 dark:text-purple-400">
                    [{{ t.installmentIndex }}/{{ t.installmentTotal }}期]
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 获取账套特定的存储键
const getStorageKey = (key) => {
  const currentLedgerId = localStorage.getItem('currentLedgerId') || 'default'
  return `${key}_${currentLedgerId}`
}

// 保存账套特定数据
const saveLedgerData = () => {
  localStorage.setItem(getStorageKey('accounts'), JSON.stringify(accounts.value))
  localStorage.setItem(getStorageKey('transactions'), JSON.stringify(transactions.value))
}

// 支出分类列表（从维度管理获取）
const expenseCategories = ref([])

// 收入分类列表（从维度管理获取）
const incomeCategories = ref([])

// 账户列表
const accounts = ref([
  { id: 1, name: '现金', balance: 1000 },
  { id: 2, name: '银行卡', balance: 5000 },
  { id: 3, name: '支付宝', balance: 2000 },
  { id: 4, name: '微信', balance: 1500 }
])

// 支付渠道列表
const paymentChannels = ref([])

// 成员列表
const members = ref([])

// 商家列表
const merchants = ref([])

// 标签列表
const tags = ref([])

// 交易记录
const transactions = ref([
  { id: 1, type: 'expense', amount: 50, category: '餐饮', account: 1, description: '午餐', date: '2026-03-01' },
  { id: 2, type: 'income', amount: 5000, category: '工资', account: 2, description: '月薪', date: '2026-03-01' },
  { id: 3, type: 'expense', amount: 200, category: '购物', account: 3, description: '超市购物', date: '2026-02-29' },
  { id: 4, type: 'expense', amount: 30, category: '交通', account: 4, description: '打车', date: '2026-02-29' },
  { id: 5, type: 'transfer', amount: 500, account: 2, toAccount: 3, description: '转账到支付宝', date: '2026-02-28' }
])

// 筛选条件
const filters = ref({
  startDate: '',
  endDate: '',
  type: '',
  category: '',
  account: '',
  keyword: ''
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 过滤后的交易
const filteredTransactions = computed(() => {
  return transactions.value.filter(transaction => {
    // 日期过滤
    if (filters.value.startDate && transaction.date < filters.value.startDate) {
      return false
    }
    if (filters.value.endDate && transaction.date > filters.value.endDate) {
      return false
    }
    
    // 类型过滤
    if (filters.value.type && transaction.type !== filters.value.type) {
      return false
    }
    
    // 分类过滤
    if (filters.value.category && transaction.category !== filters.value.category) {
      return false
    }
    
    // 账户过滤
    if (filters.value.account && transaction.account !== filters.value.account) {
      return false
    }
    
    // 关键词过滤
    if (filters.value.keyword) {
      const keyword = filters.value.keyword.toLowerCase()
      return (
        (transaction.description && transaction.description.toLowerCase().includes(keyword)) ||
        (transaction.merchant && transaction.merchant.toLowerCase().includes(keyword)) ||
        (transaction.category && transaction.category.toLowerCase().includes(keyword))
      )
    }
    
    return true
  })
})

// 分页后的交易
const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTransactions.value.slice(start, end)
})

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / pageSize.value)
})

// 根据账户ID获取账户名称
const getAccountName = (accountId) => {
  const account = accounts.value.find(a => a.id === accountId)
  return account ? account.name : ''
}

// 应用筛选
const applyFilters = () => {
  currentPage.value = 1
}

// 重置筛选
const resetFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    type: '',
    category: '',
    account: '',
    keyword: ''
  }
  currentPage.value = 1
}

// 导出交易
const exportTransactions = () => {
  const data = filteredTransactions.value
  const csvContent = "日期,类型,分类,金额,账户,支付渠道,备注\n"
  
  const csvRows = data.map(transaction => {
    const typeText = transaction.type === 'expense' ? '支出' : transaction.type === 'income' ? '收入' : '转账'
    const accountText = transaction.type === 'transfer' ? 
      `${getAccountName(transaction.account)} → ${getAccountName(transaction.toAccount)}` : 
      getAccountName(transaction.account)
    
    return [
      transaction.date,
      typeText,
      transaction.category || '',
      transaction.amount.toFixed(2),
      accountText,
      transaction.paymentChannel || '',
      transaction.description || ''
    ].map(field => `"${field}"`).join(',')
  })
  
  const csv = csvContent + csvRows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `交易流水_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 交易类型
const transactionType = ref('expense')

// 交易表单数据
const transaction = ref({
  amount: '',
  category: '',
  account: '',
  toAccount: '',
  description: '',
  paymentChannel: '',
  member: '',
  merchant: '',
  tag: ''
})

// 添加交易
const addTransaction = () => {
  const newTransaction = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type: transactionType.value,
    amount: parseFloat(transaction.value.amount),
    category: transaction.value.category,
    account: transaction.value.account,
    toAccount: transactionType.value === 'transfer' ? transaction.value.toAccount : null,
    description: transaction.value.description,
    paymentChannel: transaction.value.paymentChannel,
    member: transaction.value.member,
    merchant: transaction.value.merchant,
    tag: transaction.value.tag,
    date: new Date().toISOString().split('T')[0]
  }
  transactions.value.unshift(newTransaction)
  
  // 更新账户余额
  if (transactionType.value === 'transfer') {
    // 转账：减少转出账户余额，增加转入账户余额
    const fromAccountIndex = accounts.value.findIndex(a => a.id === newTransaction.account)
    const toAccountIndex = accounts.value.findIndex(a => a.id === newTransaction.toAccount)
    if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
      accounts.value[fromAccountIndex].balance -= newTransaction.amount
      accounts.value[toAccountIndex].balance += newTransaction.amount
    }
  } else {
    // 收入/支出：更新单个账户余额
    const accountIndex = accounts.value.findIndex(a => a.id === newTransaction.account)
    if (accountIndex !== -1) {
      if (newTransaction.type === 'income') {
        accounts.value[accountIndex].balance += newTransaction.amount
      } else {
        accounts.value[accountIndex].balance -= newTransaction.amount
      }
    }
  }
  
  // 保存到本地存储
  saveLedgerData()
  
  // 重置表单
  transaction.value = {
    amount: '',
    category: '',
    account: '',
    toAccount: '',
    description: '',
    paymentChannel: '',
    member: '',
    merchant: '',
    tag: ''
  }
  transactionType.value = 'expense'
}

// 编辑交易
const editTransaction = (editTransaction) => {
  transactionType.value = editTransaction.type
  transaction.value = {
    amount: editTransaction.amount,
    category: editTransaction.category,
    account: editTransaction.account.toString(),
    toAccount: editTransaction.toAccount ? editTransaction.toAccount.toString() : '',
    description: editTransaction.description,
    paymentChannel: editTransaction.paymentChannel || '',
    member: editTransaction.member || '',
    merchant: editTransaction.merchant || '',
    tag: editTransaction.tag || ''
  }
  // 从列表中删除该交易
  transactions.value = transactions.value.filter(t => t.id !== editTransaction.id)
  // 更新账户余额
  if (editTransaction.type === 'transfer') {
    const fromAccountIndex = accounts.value.findIndex(a => a.id === editTransaction.account)
    const toAccountIndex = accounts.value.findIndex(a => a.id === editTransaction.toAccount)
    if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
      accounts.value[fromAccountIndex].balance += editTransaction.amount
      accounts.value[toAccountIndex].balance -= editTransaction.amount
    }
  } else {
    const accountIndex = accounts.value.findIndex(a => a.id === editTransaction.account)
    if (accountIndex !== -1) {
      if (editTransaction.type === 'income') {
        accounts.value[accountIndex].balance -= editTransaction.amount
      } else {
        accounts.value[accountIndex].balance += editTransaction.amount
      }
    }
  }
  // 保存到本地存储
  saveLedgerData()
}

// 复制交易
const copyTransaction = (copyTransaction) => {
  transactionType.value = copyTransaction.type
  transaction.value = {
    amount: copyTransaction.amount,
    category: copyTransaction.category,
    account: copyTransaction.account.toString(),
    toAccount: copyTransaction.toAccount ? copyTransaction.toAccount.toString() : '',
    description: copyTransaction.description,
    paymentChannel: copyTransaction.paymentChannel || '',
    member: copyTransaction.member || '',
    merchant: copyTransaction.merchant || '',
    tag: copyTransaction.tag || ''
  }
}

// 金额计算功能
const calculateAmount = () => {
  const input = transaction.value.amount
  if (!input) return
  
  // 只允许数字、四则运算符号和括号
  const safeRegex = /^[0-9+\-*/().\s]+$/
  if (!safeRegex.test(input)) {
    alert('请输入有效的算术表达式')
    return
  }
  
  try {
    // 使用Function构造函数代替eval，更安全
    const result = new Function('return ' + input)()
    if (typeof result === 'number' && !isNaN(result)) {
      transaction.value.amount = result.toFixed(2)
    } else {
      alert('计算结果无效')
    }
  } catch (error) {
    alert('计算错误，请检查表达式')
  }
}

// 删除交易
const deleteTransaction = (transactionId) => {
  if (confirm('确定要删除这条交易记录吗？')) {
    const transactionToDelete = transactions.value.find(t => t.id === transactionId)
    if (transactionToDelete) {
      // 更新账户余额
      if (transactionToDelete.type === 'transfer') {
        const fromAccountIndex = accounts.value.findIndex(a => a.id === transactionToDelete.account)
        const toAccountIndex = accounts.value.findIndex(a => a.id === transactionToDelete.toAccount)
        if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
          accounts.value[fromAccountIndex].balance += transactionToDelete.amount
          accounts.value[toAccountIndex].balance -= transactionToDelete.amount
        }
      } else {
        const accountIndex = accounts.value.findIndex(a => a.id === transactionToDelete.account)
        if (accountIndex !== -1) {
          if (transactionToDelete.type === 'income') {
            accounts.value[accountIndex].balance -= transactionToDelete.amount
          } else {
            accounts.value[accountIndex].balance += transactionToDelete.amount
          }
        }
      }
      // 从列表中删除
      transactions.value = transactions.value.filter(t => t.id !== transactionId)
      // 保存到本地存储
      saveLedgerData()
    }
  }
}

// 加载账套特定数据
const loadLedgerData = () => {
  const currentLedgerId = localStorage.getItem('currentLedgerId') || 'default'
  
  // 加载账套特定的维度数据
  const savedDimensions = localStorage.getItem(`dimensions_${currentLedgerId}`)
  if (savedDimensions) {
    const dimensions = JSON.parse(savedDimensions)
    paymentChannels.value = dimensions.paymentChannels || []
    members.value = dimensions.members || []
    merchants.value = dimensions.merchants || []
    tags.value = dimensions.tags || []
    expenseCategories.value = dimensions.expenseCategories || []
    incomeCategories.value = dimensions.incomeCategories || []
  }
  
  // 加载账套特定的账户和交易数据
  const savedAccounts = localStorage.getItem(`accounts_${currentLedgerId}`)
  if (savedAccounts) {
    accounts.value = JSON.parse(savedAccounts)
  } else {
    // 兼容旧数据
    const oldAccounts = localStorage.getItem('accounts')
    if (oldAccounts) {
      accounts.value = JSON.parse(oldAccounts)
    }
  }
  
  const savedTransactions = localStorage.getItem(`transactions_${currentLedgerId}`)
  if (savedTransactions) {
    transactions.value = JSON.parse(savedTransactions)
  } else {
    // 兼容旧数据
    const oldTransactions = localStorage.getItem('transactions')
    if (oldTransactions) {
      transactions.value = JSON.parse(oldTransactions)
    }
  }
}

// 监听账套切换
const handleLedgerChange = () => {
  loadLedgerData()
}

onMounted(() => {
  loadLedgerData()
  // 监听账套切换事件
  window.addEventListener('ledgerChanged', handleLedgerChange)
  // 监听从信用卡管理跳转过来的事件
  window.addEventListener('showBillDetail', (e) => {
    if (e.detail && e.detail.billId) {
      const bills = loadCreditCardBills()
      const bill = bills.find(b => b.id === e.detail.billId)
      if (bill) {
        const billTransactions = transactions.value.filter(t => t.creditCardBillId === e.detail.billId)
        billDetail.value = { ...bill, transactions: billTransactions }
        showBillModal.value = true
      }
    }
  })
})

// ========== 信用卡分期联查功能 ==========

// 分期详情模态框状态
const showInstallmentModal = ref(false)
const installmentDetail = ref(null)

// 账单详情模态框状态
const showBillModal = ref(false)
const billDetail = ref(null)

// 加载信用卡账单数据
const loadCreditCardBills = () => {
  try {
    const saved = localStorage.getItem('creditCardBills')
    return saved ? JSON.parse(saved) : []
  } catch (e) {
    console.error('加载账单失败:', e)
    return []
  }
}

// 显示分期详情
const showInstallmentDetail = (transaction) => {
  if (!transaction.installmentId) return
  
  // 查找所有分期记录
  const allInstallments = transactions.value.filter(t => t.installmentId === transaction.installmentId)
    .sort((a, b) => a.installmentIndex - b.installmentIndex)
  
  installmentDetail.value = {
    installmentId: transaction.installmentId,
    totalAmount: transaction.totalAmount || (transaction.amount * transaction.installmentTotal),
    totalPeriods: transaction.installmentTotal,
    records: allInstallments
  }
  
  showInstallmentModal.value = true
}

// 显示账单详情
const showBillDetail = (transaction) => {
  if (!transaction.creditCardBillId) return
  
  const bills = loadCreditCardBills()
  const bill = bills.find(b => b.id === transaction.creditCardBillId)
  
  if (bill) {
    // 查找该账单下的所有交易
    const billTransactions = transactions.value.filter(t => t.creditCardBillId === transaction.creditCardBillId)
    
    billDetail.value = {
      ...bill,
      transactions: billTransactions
    }
    showBillModal.value = true
  }
}

// 获取账单月份显示
const getBillMonth = (billDate) => {
  const date = new Date(billDate)
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

// 获取当前已入账的分期期数
const getCurrentInstallmentIndex = (records) => {
  if (!records || records.length === 0) return 0
  const today = new Date().toISOString().split('T')[0]
  let count = 0
  for (const r of records) {
    if (r.date <= today) count++
  }
  return count
}
</script>