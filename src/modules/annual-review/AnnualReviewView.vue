<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">年度回顾</h2>
        <div class="flex items-center">
          <label for="year-select" class="mr-2 text-gray-700 dark:text-gray-300">选择年份：</label>
          <select id="year-select" v-model="selectedYear" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}年</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">年度总收入</h3>
          <p class="text-2xl font-bold text-secondary dark:text-green-400">¥{{ annualSummary.income.toFixed(2) }}</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">年度总支出</h3>
          <p class="text-2xl font-bold text-danger dark:text-red-400">¥{{ annualSummary.expense.toFixed(2) }}</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">年度结余</h3>
          <p class="text-2xl font-bold" :class="{ 'text-secondary dark:text-green-400': annualSummary.balance >= 0, 'text-danger dark:text-red-400': annualSummary.balance < 0 }">
            ¥{{ annualSummary.balance.toFixed(2) }}
          </p>
        </div>
      </div>

      <div class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">年度收支趋势</h3>
        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 flex items-center justify-center">
          <p class="text-gray-500 dark:text-gray-400">月度收支趋势图表</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">支出分类占比</h3>
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 flex items-center justify-center">
            <p class="text-gray-500 dark:text-gray-400">支出分类饼图</p>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">收入来源占比</h3>
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 flex items-center justify-center">
            <p class="text-gray-500 dark:text-gray-400">收入来源饼图</p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">智能洞察</h3>
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div v-for="(insight, index) in insights" :key="index" class="flex items-start mb-3">
            <div class="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-gray-700 dark:text-gray-300">{{ insight }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import coreDataStore from '../../services/core-data-store.js'

// 选择的年份
const selectedYear = ref(new Date().getFullYear())

// 交易数据
const transactions = ref([])

// 可用年份
const availableYears = computed(() => {
  const years = new Set()
  transactions.value.forEach(t => {
    if (t.date) {
      const year = new Date(t.date).getFullYear()
      years.add(year)
    }
  })
  // 确保当前年份在列表中
  years.add(new Date().getFullYear())
  return Array.from(years).sort((a, b) => b - a)
})

// 年度总结
const annualSummary = computed(() => {
  const year = selectedYear.value
  const yearTransactions = transactions.value.filter(t => {
    if (!t.date) return false
    return new Date(t.date).getFullYear() === year
  })
  
  const income = yearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const expense = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  return {
    income,
    expense,
    balance: income - expense
  }
})

// 智能洞察
const insights = computed(() => {
  const year = selectedYear.value
  const yearTransactions = transactions.value.filter(t => {
    if (!t.date) return false
    return new Date(t.date).getFullYear() === year
  })
  
  const insights = []
  
  // 分析支出最多的分类
  const expenseByCategory = {}
  yearTransactions
    .filter(t => t.type === 'expense' && t.category)
    .forEach(t => {
      if (!expenseByCategory[t.category]) {
        expenseByCategory[t.category] = 0
      }
      expenseByCategory[t.category] += t.amount || 0
    })
  
  const topExpenseCategory = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])[0]
  
  if (topExpenseCategory) {
    insights.push(`您在${year}年的最大支出类别是${topExpenseCategory[0]}，共花费¥${topExpenseCategory[1].toFixed(2)}。`)
  }
  
  // 分析月度支出趋势
  const monthlyExpenses = {}
  yearTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      if (!t.date) return
      const month = new Date(t.date).getMonth() + 1
      if (!monthlyExpenses[month]) {
        monthlyExpenses[month] = 0
      }
      monthlyExpenses[month] += t.amount || 0
    })
  
  const months = Object.keys(monthlyExpenses).map(Number).sort()
  if (months.length > 1) {
    const avgExpense = Object.values(monthlyExpenses).reduce((sum, val) => sum + val, 0) / months.length
    insights.push(`您在${year}年的月均支出为¥${avgExpense.toFixed(2)}。`)
  }
  
  // 分析年度结余
  if (annualSummary.value.balance > 0) {
    insights.push(`恭喜！您在${year}年实现了¥${annualSummary.value.balance.toFixed(2)}的结余。`)
  } else if (annualSummary.value.balance < 0) {
    insights.push(`请注意，您在${year}年出现了¥${Math.abs(annualSummary.value.balance).toFixed(2)}的赤字。`)
  }
  
  // 默认洞察
  if (insights.length === 0) {
    insights.push(`暂无${year}年的交易数据，无法提供分析。`)
  }
  
  return insights
})

onMounted(() => {
  // 从本地存储加载交易数据
  const savedTransactions = JSON.stringify(coreDataStore.getRaw('transactions'))
  if (savedTransactions) {
    transactions.value = JSON.parse(savedTransactions)
  }
})
</script>

<style scoped>
/* 样式 */
</style>