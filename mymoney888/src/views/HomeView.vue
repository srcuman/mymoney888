<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">快速记账</h2>
      <form @submit.prevent="addTransaction" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">类型</label>
            <div class="flex space-x-4">
              <button type="button" @click="transactionType = 'expense'" :class="transactionType === 'expense' ? 'bg-danger text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'" class="flex-1 py-2 px-4 rounded-md font-medium">
                支出
              </button>
              <button type="button" @click="transactionType = 'income'" :class="transactionType === 'income' ? 'bg-secondary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'" class="flex-1 py-2 px-4 rounded-md font-medium">
                收入
              </button>
            </div>
          </div>
          <div>
            <label for="amount" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">金额</label>
            <input type="number" id="amount" v-model.number="transaction.amount" required min="0.01" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="category" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">分类</label>
            <select id="category" v-model.number="transaction.categoryId" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择分类</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
            </select>
          </div>
          <div>
            <label for="account" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账户</label>
            <select id="account" v-model.number="transaction.accountId" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择账户</option>
              <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }} (余额: {{ account.balance }})</option>
            </select>
          </div>
        </div>
        <div>
          <label for="date" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">日期</label>
          <input type="date" id="date" v-model="transaction.date" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
        </div>
        <div>
          <label for="description" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">备注</label>
          <input type="text" id="description" v-model="transaction.remark" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
        </div>
        <button type="submit" :disabled="loading" class="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {{ loading ? '保存中...' : '保存' }}
        </button>
      </form>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">最近交易</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                日期
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                类型
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                分类
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                金额
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                账户
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                备注
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="loading && transactions.length === 0">
              <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                加载中...
              </td>
            </tr>
            <tr v-else-if="transactions.length === 0">
              <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                暂无交易记录
              </td>
            </tr>
            <tr v-for="(item, index) in transactions" :key="item.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ item.date }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span :class="item.type === 'expense' ? 'text-danger' : 'text-secondary'" class="font-medium">
                  {{ item.type === 'expense' ? '支出' : '收入' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ item.category_name || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" :class="item.type === 'expense' ? 'text-danger' : 'text-secondary'">
                {{ item.type === 'expense' ? '-' : '+' }}{{ parseFloat(item.amount).toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ item.account_name || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ item.remark || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { transactions as transactionsApi, accounts as accountsApi, categories as categoriesApi, books as booksApi } from '../api'
import { auth } from '../api'

// 交易类型
const transactionType = ref('expense')

// 交易表单数据
const transaction = ref({
  amount: '',
  categoryId: '',
  accountId: '',
  date: new Date().toISOString().split('T')[0],
  remark: ''
})

// 分类列表
const categories = ref([])

// 账户列表
const accounts = ref([])

// 交易记录
const transactions = ref([])

// 当前账套ID
const currentBookId = ref(null)

// 加载状态
const loading = ref(false)

// 加载数据
const loadData = async () => {
  try {
    // 获取账套列表
    const books = await booksApi.getAll()
    if (books.length > 0) {
      currentBookId.value = books[0].id
    } else {
      // 创建默认账套
      const newBook = await booksApi.create({ name: '默认账套', description: '我的个人账套' })
      currentBookId.value = newBook.id
    }

    if (currentBookId.value) {
      // 并行加载数据
      const [accountsData, categoriesData, transactionsData] = await Promise.all([
        accountsApi.getAll(currentBookId.value),
        categoriesApi.getAll(currentBookId.value),
        transactionsApi.getAll(currentBookId.value, { limit: 10 })
      ])

      accounts.value = accountsData
      categories.value = categoriesData
      transactions.value = transactionsData
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

// 添加交易
const addTransaction = async () => {
  loading.value = true
  try {
    await transactionsApi.create(currentBookId.value, {
      type: transactionType.value,
      amount: transaction.value.amount,
      categoryId: transaction.value.categoryId,
      accountId: transaction.value.accountId,
      date: transaction.value.date,
      remark: transaction.value.remark
    })

    // 重新加载数据
    await loadData()

    // 重置表单
    transaction.value = {
      amount: '',
      categoryId: '',
      accountId: '',
      date: new Date().toISOString().split('T')[0],
      remark: ''
    }
    transactionType.value = 'expense'
  } catch (error) {
    console.error('添加交易失败:', error)
    alert('添加交易失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>