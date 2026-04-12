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
        <div class="h-64">
          <canvas ref="trendChart"></canvas>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">支出分类占比</h3>
          <div class="h-64">
            <canvas ref="expensePieChart"></canvas>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">收入来源占比</h3>
          <div class="h-64">
            <canvas ref="incomePieChart"></canvas>
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import Chart from 'chart.js/auto'
import coreDataStore from '../../services/core-data-store.js'

// 选择的年份
const selectedYear = ref(new Date().getFullYear())

// 交易数据
const transactions = computed(() => coreDataStore.getRaw('transactions') || [])

// 图表引用
const trendChart = ref(null)
const expensePieChart = ref(null)
const incomePieChart = ref(null)

// 图表实例
let trendChartInstance = null
let expensePieChartInstance = null
let incomePieChartInstance = null

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

// 月度数据
const monthlyData = computed(() => {
  const year = selectedYear.value
  const yearTransactions = transactions.value.filter(t => {
    if (!t.date) return false
    return new Date(t.date).getFullYear() === year
  })
  
  const monthly = Array(12).fill(0).map(() => ({ income: 0, expense: 0 }))
  
  yearTransactions.forEach(t => {
    const month = new Date(t.date).getMonth()
    if (t.type === 'income') {
      monthly[month].income += t.amount || 0
    } else if (t.type === 'expense') {
      monthly[month].expense += t.amount || 0
    }
  })
  
  return monthly
})

// 支出分类数据
const expenseCategoryData = computed(() => {
  const year = selectedYear.value
  const yearTransactions = transactions.value.filter(t => {
    if (!t.date) return false
    return new Date(t.date).getFullYear() === year && t.type === 'expense'
  })
  
  const categories = {}
  yearTransactions.forEach(t => {
    const cat = t.category || '未分类'
    categories[cat] = (categories[cat] || 0) + (t.amount || 0)
  })
  
  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
})

// 收入分类数据
const incomeCategoryData = computed(() => {
  const year = selectedYear.value
  const yearTransactions = transactions.value.filter(t => {
    if (!t.date) return false
    return new Date(t.date).getFullYear() === year && t.type === 'income'
  })
  
  const categories = {}
  yearTransactions.forEach(t => {
    const cat = t.category || '未分类'
    categories[cat] = (categories[cat] || 0) + (t.amount || 0)
  })
  
  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
})

// 智能洞察
const insights = computed(() => {
  const year = selectedYear.value
  const insights = []
  
  // 分析支出最多的分类
  if (expenseCategoryData.value.length > 0) {
    const topExpense = expenseCategoryData.value[0]
    insights.push(`您在${year}年的最大支出类别是"${topExpense.name}"，共花费¥${topExpense.value.toFixed(2)}。`)
  }
  
  // 分析月度支出趋势
  const monthly = monthlyData.value
  const totalMonthlyExpense = monthly.reduce((sum, m) => sum + m.expense, 0)
  const monthsWithData = monthly.filter(m => m.expense > 0).length
  
  if (monthsWithData > 0) {
    const avgExpense = totalMonthlyExpense / monthsWithData
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

// 初始化图表
const initCharts = async () => {
  await nextTick()
  updateTrendChart()
  updateExpensePieChart()
  updateIncomePieChart()
}

// 更新收支趋势图表
const updateTrendChart = () => {
  if (!trendChart.value) return
  
  if (trendChartInstance) {
    trendChartInstance.destroy()
  }
  
  const labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const incomeData = monthlyData.value.map(m => m.income)
  const expenseData = monthlyData.value.map(m => m.expense)
  
  trendChartInstance = new Chart(trendChart.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '收入',
          data: incomeData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: '支出',
          data: expenseData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => '¥' + value.toFixed(0)
          }
        }
      }
    }
  })
}

// 更新支出饼图
const updateExpensePieChart = () => {
  if (!expensePieChart.value) return
  
  if (expensePieChartInstance) {
    expensePieChartInstance.destroy()
  }
  
  const data = expenseCategoryData.value.slice(0, 8)
  if (data.length === 0) return
  
  const colors = [
    'rgba(239, 68, 68, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(234, 179, 8, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(20, 184, 166, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)'
  ]
  
  expensePieChartInstance = new Chart(expensePieChart.value, {
    type: 'pie',
    data: {
      labels: data.map(d => d.name),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${context.label}: ¥${value.toFixed(2)} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// 更新收入饼图
const updateIncomePieChart = () => {
  if (!incomePieChart.value) return
  
  if (incomePieChartInstance) {
    incomePieChartInstance.destroy()
  }
  
  const data = incomeCategoryData.value.slice(0, 8)
  if (data.length === 0) return
  
  const colors = [
    'rgba(34, 197, 94, 0.8)',
    'rgba(20, 184, 166, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(234, 179, 8, 0.8)',
    'rgba(239, 68, 68, 0.8)'
  ]
  
  incomePieChartInstance = new Chart(incomePieChart.value, {
    type: 'pie',
    data: {
      labels: data.map(d => d.name),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${context.label}: ¥${value.toFixed(2)} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// 监听数据变化
const handleDataChanged = () => {
  initCharts()
}

// 监听年份变化
watch(selectedYear, () => {
  initCharts()
})

onMounted(() => {
  // 监听数据变更事件
  window.addEventListener('dataChanged', handleDataChanged)
  window.addEventListener('ledgerChanged', handleDataChanged)
  
  // 初始化图表
  initCharts()
})

onUnmounted(() => {
  window.removeEventListener('dataChanged', handleDataChanged)
  window.removeEventListener('ledgerChanged', handleDataChanged)
  
  // 销毁图表实例
  if (trendChartInstance) trendChartInstance.destroy()
  if (expensePieChartInstance) expensePieChartInstance.destroy()
  if (incomePieChartInstance) incomePieChartInstance.destroy()
})
</script>

<style scoped>
/* 样式 */
</style>