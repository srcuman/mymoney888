<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">资产概览</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-blue-600 dark:text-blue-400">总资产</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalAssets.toFixed(2) }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-green-600 dark:text-green-400">本月收入</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ monthlyIncome.toFixed(2) }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-red-600 dark:text-red-400">本月支出</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ monthlyExpense.toFixed(2) }}</p>
        </div>
      </div>
      
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">账户资产</h3>
      <div class="space-y-3">
        <div v-for="account in accounts" :key="account.id" class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-3">
              <span class="text-primary dark:text-blue-400 font-bold">{{ account.name.charAt(0) }}</span>
            </div>
            <span class="text-gray-900 dark:text-white font-medium">{{ account.name }}</span>
          </div>
          <span class="text-xl font-bold text-gray-900 dark:text-white">{{ account.balance.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">资产趋势</h2>
      <div class="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p class="text-gray-500 dark:text-gray-400">资产趋势图表</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 账户列表
const accounts = ref([
  { id: 1, name: '现金', balance: 1000 },
  { id: 2, name: '银行卡', balance: 5000 },
  { id: 3, name: '支付宝', balance: 2000 },
  { id: 4, name: '微信', balance: 1500 }
])

// 交易记录
const transactions = ref([
  { id: 1, type: 'expense', amount: 50, category: '餐饮', account: 1, description: '午餐', date: '2026-03-01' },
  { id: 2, type: 'income', amount: 5000, category: '工资', account: 2, description: '月薪', date: '2026-03-01' },
  { id: 3, type: 'expense', amount: 200, category: '购物', account: 3, description: '超市购物', date: '2026-02-29' },
  { id: 4, type: 'expense', amount: 30, category: '交通', account: 4, description: '打车', date: '2026-02-29' }
])

// 计算总资产
const totalAssets = computed(() => {
  return accounts.value.reduce((total, account) => total + account.balance, 0)
})

// 计算本月收入
const monthlyIncome = computed(() => {
  const currentMonth = new Date().toISOString().slice(0, 7)
  return transactions.value
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
    .reduce((total, t) => total + t.amount, 0)
})

// 计算本月支出
const monthlyExpense = computed(() => {
  const currentMonth = new Date().toISOString().slice(0, 7)
  return transactions.value
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((total, t) => total + t.amount, 0)
})

onMounted(() => {
  // 从本地存储加载数据
  const savedAccounts = localStorage.getItem('accounts')
  const savedTransactions = localStorage.getItem('transactions')
  if (savedAccounts) {
    accounts.value = JSON.parse(savedAccounts)
  }
  if (savedTransactions) {
    transactions.value = JSON.parse(savedTransactions)
  }
})
</script>