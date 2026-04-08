<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">收支统计</h2>
      
      <!-- 时间范围选择 -->
      <div class="mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex space-x-2">
            <button @click="setTimeRange('today')" :class="activeTimeRange === 'today' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              今日
            </button>
            <button @click="setTimeRange('yesterday')" :class="activeTimeRange === 'yesterday' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              昨日
            </button>
            <button @click="setTimeRange('thisWeek')" :class="activeTimeRange === 'thisWeek' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              本周
            </button>
            <button @click="setTimeRange('thisMonth')" :class="activeTimeRange === 'thisMonth' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              本月
            </button>
            <button @click="setTimeRange('lastMonth')" :class="activeTimeRange === 'lastMonth' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              上月
            </button>
          </div>
          <div class="flex space-x-2">
            <input type="date" v-model="dateRange.start" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm">
            <span class="text-gray-500 dark:text-gray-400">至</span>
            <input type="date" v-model="dateRange.end" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm">
            <button @click="applyDateRange" class="px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              应用
            </button>
          </div>
        </div>
      </div>
      
      <!-- 维度筛选 -->
      <div class="mb-6">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">维度筛选</h3>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label for="member-filter" class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">成员</label>
            <select id="member-filter" v-model="filters.member" class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">全部成员</option>
              <option v-for="member in members" :key="member.id" :value="member.name">{{ member.name }}</option>
            </select>
          </div>
          <div>
            <label for="merchant-filter" class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">商家</label>
            <select id="merchant-filter" v-model="filters.merchant" class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">全部商家</option>
              <option v-for="merchant in merchants" :key="merchant.id" :value="merchant.name">{{ merchant.name }}</option>
            </select>
          </div>
          <div>
            <label for="tag-filter" class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">标签</label>
            <select id="tag-filter" v-model="filters.tag" class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">全部标签</option>
              <option v-for="tag in tags" :key="tag.id" :value="tag.name">{{ tag.name }}</option>
            </select>
          </div>
          <div>
            <label for="payment-channel-filter" class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">支付渠道</label>
            <select id="payment-channel-filter" v-model="filters.paymentChannel" class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">全部支付渠道</option>
              <option v-for="channel in paymentChannels" :key="channel.id" :value="channel.name">{{ channel.name }}</option>
            </select>
          </div>
          <div>
            <label for="category-filter" class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">分类</label>
            <select id="category-filter" v-model="filters.category" class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">全部分类</option>
              <option v-for="category in allCategories" :key="category" :value="category">{{ category }}</option>
            </select>
          </div>
        </div>
        <div class="mt-3 flex justify-end">
          <button @click="resetFilters" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium">
            重置筛选
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">支出分类</h3>
          <div class="space-y-3">
            <div v-for="(item, index) in expenseCategories" :key="index" class="flex justify-between items-center">
              <span class="text-gray-700 dark:text-gray-300">{{ item.category }}</span>
              <div class="flex items-center">
                <span class="text-danger font-medium mr-2">{{ item.amount.toFixed(2) }}</span>
                <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="bg-danger h-2 rounded-full" :style="{ width: item.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">收入分类</h3>
          <div class="space-y-3">
            <div v-for="(item, index) in incomeCategories" :key="index" class="flex justify-between items-center">
              <span class="text-gray-700 dark:text-gray-300">{{ item.category }}</span>
              <div class="flex items-center">
                <span class="text-secondary font-medium mr-2">{{ item.amount.toFixed(2) }}</span>
                <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="bg-secondary h-2 rounded-full" :style="{ width: item.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">月度趋势</h2>
      <div class="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p class="text-gray-500 dark:text-gray-400">月度收支趋势图表</p>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">年度概览</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-blue-600 dark:text-blue-400">年度总收入</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ yearlyIncome.toFixed(2) }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-red-600 dark:text-red-400">年度总支出</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ yearlyExpense.toFixed(2) }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-green-600 dark:text-green-400">年度结余</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ yearlyBalance.toFixed(2) }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-purple-600 dark:text-purple-400">交易次数</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalTransactions }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 交易记录
const transactions = ref([
  { id: 1, type: 'expense', amount: 50, category: '餐饮', account: 1, description: '午餐', date: '2026-03-01' },
  { id: 2, type: 'income', amount: 5000, category: '工资', account: 2, description: '月薪', date: '2026-03-01' },
  { id: 3, type: 'expense', amount: 200, category: '购物', account: 3, description: '超市购物', date: '2026-02-29' },
  { id: 4, type: 'expense', amount: 30, category: '交通', account: 4, description: '打车', date: '2026-02-29' },
  { id: 5, type: 'expense', amount: 100, category: '娱乐', account: 1, description: '电影', date: '2026-02-28' },
  { id: 6, type: 'income', amount: 500, category: '投资', account: 2, description: '股息', date: '2026-02-20' }
])

// 时间范围
const dateRange = ref({
  start: '',
  end: ''
})

// 活跃时间范围
const activeTimeRange = ref('thisMonth')

// 筛选条件
const filters = ref({
  member: '',
  merchant: '',
  tag: '',
  paymentChannel: '',
  category: ''
})

// 成员列表
const members = ref([])

// 商家列表
const merchants = ref([])

// 标签列表
const tags = ref([])

// 支付渠道列表
const paymentChannels = ref([])

// 收入分类列表
const incomeCategoryList = ref([])

// 支出分类列表
const expenseCategoryList = ref([])

// 所有分类列表
const allCategories = computed(() => {
  const categories = new Set()
  transactions.value.forEach(t => {
    if (t.category) {
      categories.add(t.category)
    }
  })
  return Array.from(categories)
})

// 过滤后的交易记录
const filteredTransactions = computed(() => {
  let result = transactions.value
  
  // 时间范围过滤
  if (dateRange.value.start && dateRange.value.end) {
    result = result.filter(t => {
      return t.date >= dateRange.value.start && t.date <= dateRange.value.end
    })
  }
  
  // 成员过滤
  if (filters.value.member) {
    result = result.filter(t => t.member === filters.value.member)
  }
  
  // 商家过滤
  if (filters.value.merchant) {
    result = result.filter(t => t.merchant === filters.value.merchant)
  }
  
  // 标签过滤
  if (filters.value.tag) {
    result = result.filter(t => t.tag === filters.value.tag)
  }
  
  // 分类过滤
  if (filters.value.category) {
    result = result.filter(t => t.category === filters.value.category)
  }
  
  return result
})

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    member: '',
    merchant: '',
    tag: '',
    paymentChannel: '',
    category: ''
  }
}

// 设置时间范围
const setTimeRange = (range) => {
  activeTimeRange.value = range
  const today = new Date()
  let startDate, endDate
  
  switch (range) {
    case 'today':
      startDate = today.toISOString().split('T')[0]
      endDate = startDate
      break
    case 'yesterday':
      startDate = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0]
      endDate = startDate
      break
    case 'thisWeek':
      // 计算本周一
      const monday = new Date(today)
      monday.setDate(today.getDate() - today.getDay() + 1)
      startDate = monday.toISOString().split('T')[0]
      endDate = today.toISOString().split('T')[0]
      break
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      endDate = today.toISOString().split('T')[0]
      break
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
      endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
      break
  }
  
  dateRange.value.start = startDate
  dateRange.value.end = endDate
}

// 应用日期范围
const applyDateRange = () => {
  activeTimeRange.value = 'custom'
}

// 计算支出分类统计
const expenseCategories = computed(() => {
  const expenses = filteredTransactions.value.filter(t => t.type === 'expense')
  const totalExpense = expenses.reduce((total, t) => total + t.amount, 0)
  
  const categoryMap = {}
  // 先初始化所有支出分类
  expenseCategoryList.value.forEach(category => {
    categoryMap[category.name] = 0
  })
  
  // 统计各分类金额
  expenses.forEach(t => {
    if (categoryMap[t.category] !== undefined) {
      categoryMap[t.category] += t.amount
    } else {
      categoryMap[t.category] = t.amount
    }
  })
  
  return Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
  })).sort((a, b) => b.amount - a.amount)
})

// 计算收入分类统计
const incomeCategories = computed(() => {
  const incomes = filteredTransactions.value.filter(t => t.type === 'income')
  const totalIncome = incomes.reduce((total, t) => total + t.amount, 0)
  
  const categoryMap = {}
  // 先初始化所有收入分类
  incomeCategoryList.value.forEach(category => {
    categoryMap[category.name] = 0
  })
  
  // 统计各分类金额
  incomes.forEach(t => {
    if (categoryMap[t.category] !== undefined) {
      categoryMap[t.category] += t.amount
    } else {
      categoryMap[t.category] = t.amount
    }
  })
  
  return Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
  })).sort((a, b) => b.amount - a.amount)
})

// 计算年度总收入
const yearlyIncome = computed(() => {
  return filteredTransactions.value
    .filter(t => t.type === 'income')
    .reduce((total, t) => total + t.amount, 0)
})

// 计算年度总支出
const yearlyExpense = computed(() => {
  return filteredTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((total, t) => total + t.amount, 0)
})

// 计算年度结余
const yearlyBalance = computed(() => {
  return yearlyIncome.value - yearlyExpense.value
})

// 计算总交易次数
const totalTransactions = computed(() => {
  return filteredTransactions.value.length
})

onMounted(() => {
  // 从本地存储加载数据
  const savedTransactions = localStorage.getItem('transactions')
  const savedDimensions = localStorage.getItem('dimensions')
  
  if (savedTransactions) {
    transactions.value = JSON.parse(savedTransactions)
  }
  
  if (savedDimensions) {
    const dimensions = JSON.parse(savedDimensions)
    members.value = dimensions.members || []
    merchants.value = dimensions.merchants || []
    tags.value = dimensions.tags || []
    paymentChannels.value = dimensions.paymentChannels || []
    incomeCategoryList.value = dimensions.incomeCategories || []
    expenseCategoryList.value = dimensions.expenseCategories || []
  }
  
  // 初始化时间范围为本月
  setTimeRange('thisMonth')
})
</script>