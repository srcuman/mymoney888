<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">资产概览</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">总资产</h3>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ totalAssets }}</p>
        </div>
        <div class="bg-green-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">本月收入</h3>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ monthlyIncome }}</p>
        </div>
        <div class="bg-red-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">本月支出</h3>
          <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ monthlyExpense }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { accounts as accountsApi, statistics as statisticsApi } from '../api'

const accounts = ref([])
const totalAssets = ref('0.00')
const monthlyIncome = ref('0.00')
const monthlyExpense = ref('0.00')
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const accs = await accountsApi.getAll(1)
    accounts.value = accs
    totalAssets.value = accs.reduce((sum, acc) => sum + parseFloat(acc.balance), 0).toFixed(2)
    const stats = await statisticsApi.getStatistics(1, {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(),1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    })
    monthlyIncome.value = stats.totals.total_income || 0
    monthlyExpense.value = stats.totals.total_expense || 0
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>