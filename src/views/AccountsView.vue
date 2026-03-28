<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">账户管理</h2>
        <button @click="showAddAccountModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
          添加账户
        </button>
      </div>
      
      <div class="space-y-4">
        <div v-for="account in accounts" :key="account.id" class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-4">
              <span class="text-primary dark:text-blue-400 font-bold text-lg">{{ account.name.charAt(0) }}</span>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ account.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">余额: ¥{{ account.balance.toFixed(2) }}</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button @click="editAccount(account)" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
              编辑
            </button>
            <button @click="deleteAccount(account.id)" class="px-3 py-1 bg-danger hover:bg-red-600 text-white rounded-md text-sm font-medium">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑账户模态框 -->
    <div v-if="showAddAccountModal || showEditAccountModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ showEditAccountModal ? '编辑账户' : '添加账户' }}</h3>
        <form @submit.prevent="saveAccount" class="space-y-4">
          <div>
            <label for="account-name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账户名称</label>
            <input type="text" id="account-name" v-model="formData.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="account-balance" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">初始余额</label>
            <input type="number" id="account-balance" v-model.number="formData.balance" required min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showAddAccountModal = false; showEditAccountModal = false; resetForm()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
              取消
            </button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 账户列表
const accounts = ref([
  { id: 1, name: '现金', balance: 1000 },
  { id: 2, name: '银行卡', balance: 5000 },
  { id: 3, name: '支付宝', balance: 2000 },
  { id: 4, name: '微信', balance: 1500 }
])

// 模态框状态
const showAddAccountModal = ref(false)
const showEditAccountModal = ref(false)

// 表单数据
const formData = ref({
  id: null,
  name: '',
  balance: 0
})

// 重置表单
const resetForm = () => {
  formData.value = {
    id: null,
    name: '',
    balance: 0
  }
}

// 编辑账户
const editAccount = (account) => {
  formData.value = { ...account }
  showEditAccountModal.value = true
  showAddAccountModal.value = false
}

// 保存账户
const saveAccount = () => {
  if (showEditAccountModal.value) {
    // 更新现有账户
    const index = accounts.value.findIndex(a => a.id === formData.value.id)
    if (index !== -1) {
      accounts.value[index] = { ...formData.value }
    }
  } else {
    // 添加新账户
    const newAccount = {
      id: accounts.value.length + 1,
      name: formData.value.name,
      balance: formData.value.balance
    }
    accounts.value.push(newAccount)
  }
  
  // 保存到本地存储
  localStorage.setItem('accounts', JSON.stringify(accounts.value))
  
  // 关闭模态框并重置表单
  showAddAccountModal.value = false
  showEditAccountModal.value = false
  resetForm()
}

// 删除账户
const deleteAccount = (accountId) => {
  if (confirm('确定要删除此账户吗？')) {
    accounts.value = accounts.value.filter(a => a.id !== accountId)
    // 保存到本地存储
    localStorage.setItem('accounts', JSON.stringify(accounts.value))
  }
}

onMounted(() => {
  // 从本地存储加载数据
  const savedAccounts = localStorage.getItem('accounts')
  if (savedAccounts) {
    accounts.value = JSON.parse(savedAccounts)
  }
})
</script>