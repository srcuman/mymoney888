<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">账户管理</h2>
      <div class="space-y-4">
        <div v-for="account in accounts" :key="account.id" class="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ account.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ account.type }} - 余额: {{ account.balance }}</p>
            </div>
            <div class="space-x-2">
              <button @click="editAccount(account)" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">编辑</button>
              <button @click="deleteAccount(account.id)" class="px-4 py-2 bg-danger text-white rounded-md hover:bg-red-700">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { accounts as accountsApi } from '../api'

const accounts = ref([])

const loadData = async () => {
  try {
    accounts.value = await accountsApi.getAll(1)
  } catch (error) {
    console.error('加载账户失败:', error)
  }
}

const editAccount = (account) => {
  alert('编辑功能待实现')
}

const deleteAccount = async (id) => {
  if (confirm('确定要删除这个账户吗？')) {
    try {
      await accountsApi.delete(1, id)
      await loadData()
    } catch (error) {
      console.error('删除账户失败:', error)
      alert('删除失败: ' + error.message)
    }
  }
}

onMounted(() => {
  loadData()
})
</script>