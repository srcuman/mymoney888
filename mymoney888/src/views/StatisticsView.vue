<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">收支统计</h2>
      
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

// 计算支出分类统计
const expenseCategories = computed(() => {
  const expenses = transactions.value.filter(t => t.type === 'expense')
  const totalExpense = expenses.reduce((total, t) => total + t.amount, 0)
  
  const categoryMap = {}
  expenses.forEach(t => {
    if (categoryMap[t.category]) {
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
  const incomes = transactions.value.filter(t => t.type === 'income')
  const totalIncome = incomes.reduce((total, t) => total + t.amount, 0)
  
  const categoryMap = {}
  incomes.forEach(t => {
    if (categoryMap[t.category]) {
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
  const currentYear = new Date().getFullYear().toString()
  return transactions.value
    .filter(t => t.type === 'income' && t.date.startsWith(currentYear))
    .reduce((total, t) => total + t.amount, 0)
})

// 计算年度总支出
const yearlyExpense = computed(() => {
  const currentYear = new Date().getFullYear().toString()
  return transactions.value
    .filter(t => t.type === 'expense' && t.date.startsWith(currentYear))
    .reduce((total, t) => total + t.amount, 0)
})

// 计算年度结余
const yearlyBalance = computed(() => {
  return yearlyIncome.value - yearlyExpense.value
})

// 计算总交易次数
const totalTransactions = computed(() => {
  return transactions.value.length
})

onMounted(() => {
  // 从本地存储加载数据
  const savedTransactions = localStorage.getItem('transactions')
  if (savedTransactions) {
    transactions.value = JSON.parse(savedTransactions)
  }
})
</script>