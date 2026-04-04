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
              <button type="button" @click="transactionType = 'transfer'" :class="transactionType === 'transfer' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'" class="flex-1 py-2 px-4 rounded-md font-medium">
                转账
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
            <select id="category" v-model="transaction.category" :required="transactionType !== 'transfer'" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择分类</option>
              <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
            </select>
          </div>
          <div>
            <label :for="transactionType === 'transfer' ? 'from-account' : 'account'" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ transactionType === 'transfer' ? '转出账户' : '账户' }}
            </label>
            <select :id="transactionType === 'transfer' ? 'from-account' : 'account'" v-model="transaction.account" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择账户</option>
              <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
            </select>
          </div>
        </div>
        <div v-if="transactionType === 'transfer'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="to-account" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">转入账户</label>
            <select id="to-account" v-model="transaction.toAccount" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择账户</option>
              <option v-for="account in accounts" :key="account.id" :value="account.id" :disabled="account.id === parseInt(transaction.account)">{{ account.name }}</option>
            </select>
          </div>
        </div>
        <div>
          <label for="description" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">备注</label>
          <input type="text" id="description" v-model="transaction.description" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
        </div>
        <button type="submit" class="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
          保存
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
            <tr v-for="(transaction, index) in recentTransactions" :key="index">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ transaction.date }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span :class="transaction.type === 'expense' ? 'text-danger' : transaction.type === 'income' ? 'text-secondary' : 'text-primary'" class="font-medium">
                  {{ transaction.type === 'expense' ? '支出' : transaction.type === 'income' ? '收入' : '转账' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ transaction.category || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" :class="transaction.type === 'expense' ? 'text-danger' : transaction.type === 'income' ? 'text-secondary' : 'text-primary'">
                {{ transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : '' }}{{ transaction.amount.toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ transaction.type === 'transfer' ? `${getAccountName(transaction.account)} → ${getAccountName(transaction.toAccount)}` : getAccountName(transaction.account) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ transaction.description || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 交易类型
const transactionType = ref('expense')

// 交易表单数据
const transaction = ref({
  amount: '',
  category: '',
  account: '',
  toAccount: '',
  description: ''
})

// 分类列表
const categories = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '工资', '投资', '其他']

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
  { id: 4, type: 'expense', amount: 30, category: '交通', account: 4, description: '打车', date: '2026-02-29' },
  { id: 5, type: 'transfer', amount: 500, account: 2, toAccount: 3, description: '转账到支付宝', date: '2026-02-28' }
])

// 最近交易
const recentTransactions = computed(() => {
  return transactions.value.slice(0, 5)
})

// 根据账户ID获取账户名称
const getAccountName = (accountId) => {
  const account = accounts.value.find(a => a.id === accountId)
  return account ? account.name : ''
}

// 添加交易
const addTransaction = () => {
  const newTransaction = {
    id: transactions.value.length + 1,
    type: transactionType.value,
    amount: transaction.value.amount,
    category: transaction.value.category,
    account: parseInt(transaction.value.account),
    toAccount: transactionType.value === 'transfer' ? parseInt(transaction.value.toAccount) : null,
    description: transaction.value.description,
    date: new Date().toISOString().split('T')[0]
  }
  transactions.value.unshift(newTransaction)
  
  // 更新账户余额
  if (transactionType.value === 'transfer') {
    // 转账：减少转出账户余额，增加转入账户余额
    const fromAccountIndex = accounts.value.findIndex(a => a.id === newTransaction.account)
    const toAccountIndex = accounts.value.findIndex(a => a.id === newTransaction.toAccount)
    if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
      accounts.value[fromAccountIndex].balance -= newTransaction.amount
      accounts.value[toAccountIndex].balance += newTransaction.amount
    }
  } else {
    // 收入/支出：更新单个账户余额
    const accountIndex = accounts.value.findIndex(a => a.id === newTransaction.account)
    if (accountIndex !== -1) {
      if (newTransaction.type === 'income') {
        accounts.value[accountIndex].balance += newTransaction.amount
      } else {
        accounts.value[accountIndex].balance -= newTransaction.amount
      }
    }
  }
  
  // 保存到本地存储
  localStorage.setItem('accounts', JSON.stringify(accounts.value))
  localStorage.setItem('transactions', JSON.stringify(transactions.value))
  
  // 重置表单
  transaction.value = {
    amount: '',
    category: '',
    account: '',
    toAccount: '',
    description: ''
  }
  transactionType.value = 'expense'
}

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