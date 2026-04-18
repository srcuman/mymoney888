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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import coreDataStore from '../../services/core-data-store.js'

// 数据版本号（用于触发响应式更新）
const dataVersion = ref(0)

// 监听数据变更
const handleDataChanged = () => {
  dataVersion.value++
}

// 账户列表（从 coreDataStore 获取实时数据）
const accounts = computed(() => {
  // 访问 version 触发响应式
  const version = dataVersion.value
  void version
  
  const result = []
  
  // 1. 基础账户（手动创建的账户，排除信用卡关联账户）
  const baseAccounts = coreDataStore.getRaw('accounts') || []
  const creditCards = coreDataStore.getRaw('credit_cards') || []
  const creditCardLinkedAccountIds = creditCards.map(card => card.linkedAccountId)
  
  baseAccounts.forEach(account => {
    if (!creditCardLinkedAccountIds.includes(account.id)) {
      // 计算账户余额
      const balance = coreDataStore.calculateAccountBalance(account.id)
      result.push({ ...account, balance })
    }
  })
  
  // 2. 添加信用卡账户
  creditCards.forEach(card => {
    const usedCredit = card.usedCredit || (card.creditLimit - card.availableCredit)
    result.push({
      id: card.id,
      name: card.name,
      balance: -usedCredit,
      category: 'credit_card'
    })
  })
  
  return result
})

// 交易记录
const transactions = computed(() => {
  const version = dataVersion.value
  void version
  return coreDataStore.getRaw('transactions') || []
})

// 计算总资产（排除负债）
const totalAssets = computed(() => {
  const version = dataVersion.value
  void version
  return accounts.value
    .filter(a => a.category !== 'credit_card' && a.category !== 'loan')
    .reduce((total, account) => total + (account.balance || 0), 0)
})

// 计算本月收入
const monthlyIncome = computed(() => {
  const version = dataVersion.value
  void version
  const currentMonth = new Date().toISOString().slice(0, 7)
  return transactions.value
    .filter(t => t.type === 'income' && t.date && t.date.startsWith(currentMonth))
    .reduce((total, t) => total + (t.amount || 0), 0)
})

// 计算本月支出
const monthlyExpense = computed(() => {
  const version = dataVersion.value
  void version
  const currentMonth = new Date().toISOString().slice(0, 7)
  return transactions.value
    .filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonth))
    .reduce((total, t) => total + (t.amount || 0), 0)
})

onMounted(() => {
  window.addEventListener('dataChanged', handleDataChanged)
  window.addEventListener('transactionsUpdated', handleDataChanged)
  window.addEventListener('accountsUpdated', handleDataChanged)
})

onUnmounted(() => {
  window.removeEventListener('dataChanged', handleDataChanged)
  window.removeEventListener('transactionsUpdated', handleDataChanged)
  window.removeEventListener('accountsUpdated', handleDataChanged)
})
</script>