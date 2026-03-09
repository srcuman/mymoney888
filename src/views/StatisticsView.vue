<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">统计分析</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">收入统计</h3>
          <div class="space-y-2">
            <div v-for="item in statistics.incomeByCategory" :key="item.name" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">{{ item.name }}</span>
              <span class="text-green-600 font-semibold">{{ item.total }}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">支出统计</h3>
          <div class="space-y-2">
            <div v-for="item in statistics.expenseByCategory" :key="item.name" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">{{ item.name }}</span>
              <span class="text-red-600 font-semibold">{{ item.total }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statistics as statisticsApi, books as booksApi } from '../api'

const statistics = ref({
  incomeByCategory: [],
  expenseByCategory: [],
  totals: { total_income: 0, total_expense: 0, balance: 0 }
})
const currentBookId = ref(null)

const loadStatistics = async () => {
  try {
    const books = await booksApi.getAll()
    if (books.length > 0) {
      currentBookId.value = books[0].id
      statistics.value = await statisticsApi.getStatistics(currentBookId.value)
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

onMounted(() => {
  loadStatistics()
})
</script>