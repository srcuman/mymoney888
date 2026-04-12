<template>
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
      <div v-if="transactionType !== 'transfer'">
        <label class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">分类</label>
        <div class="space-y-1 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700">
          <div v-for="category in (transactionType === 'income' ? incomeCategories : expenseCategories)" :key="category.id" class="text-sm">
            <!-- 一级分类 -->
            <div class="flex items-center py-1">
              <button type="button" @click="toggleCategory(category.id)" class="mr-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                {{ expandedCategories.includes(category.id) ? '▼' : '▶' }}
              </button>
              <label class="flex items-center cursor-pointer flex-1">
                <input type="radio" :name="'category-' + category.id" :value="category.name" v-model="selectedCategory" @change="selectCategory(category.name)" class="mr-2">
                <span class="text-gray-700 dark:text-gray-300">{{ category.name }}</span>
              </label>
            </div>
            <!-- 二级分类 -->
            <div v-if="expandedCategories.includes(category.id) && category.children && category.children.length > 0" class="ml-6 space-y-1">
              <label v-for="subcategory in category.children" :key="subcategory.id" class="flex items-center cursor-pointer py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-2">
                <input type="radio" :name="'subcategory-' + category.id" :value="`${category.name}-${subcategory.name}`" v-model="selectedCategory" @change="selectCategory(`${category.name}-${subcategory.name}`)" class="mr-2">
                <span class="text-gray-600 dark:text-gray-400">{{ subcategory.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <input type="hidden" v-model="transaction.category" required>
      </div>
      <div :class="transactionType === 'transfer' ? 'md:col-span-2' : ''">
        <label :for="transactionType === 'transfer' ? 'from-account' : 'account'" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ transactionType === 'transfer' ? '转出账户' : '账户' }}
        </label>
        <select :id="transactionType === 'transfer' ? 'from-account' : 'account'" v-model="transaction.account" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          <option value="">请选择账户</option>
          <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
        </select>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="payment-channel" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">支付渠道</label>
        <select id="payment-channel" v-model="transaction.paymentChannel" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          <option value="">请选择支付渠道</option>
          <option v-for="channel in paymentChannels" :key="channel.id" :value="channel.name">{{ channel.name }}</option>
        </select>
      </div>
    </div>
    <div v-if="transactionType === 'transfer'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="to-account" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">转入账户</label>
        <select id="to-account" v-model="transaction.toAccount" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          <option value="">请选择账户</option>
          <option v-for="account in accounts" :key="account.id" :value="account.id" :disabled="transaction.account && account.id === transaction.account">{{ account.name }}</option>
        </select>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="member" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">成员</label>
        <select id="member" v-model="transaction.member" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          <option value="">请选择成员</option>
          <option v-for="member in members" :key="member.id" :value="member.name">{{ member.name }}</option>
        </select>
      </div>
      <div>
        <label for="merchant" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">商家</label>
        <select id="merchant" v-model="transaction.merchant" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          <option value="">请选择商家</option>
          <option v-for="merchant in merchants" :key="merchant.id" :value="merchant.name">{{ merchant.name }}</option>
        </select>
      </div>
      <div>
        <label for="tag" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">标签</label>
        <select id="tag" v-model="transaction.tag" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          <option value="">请选择标签</option>
          <option v-for="tag in tags" :key="tag.id" :value="tag.name">{{ tag.name }}</option>
        </select>
      </div>
    </div>
    <div>
      <label for="description" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">备注</label>
      <input type="text" id="description" v-model="transaction.description" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
    </div>
    <div class="flex justify-end space-x-3">
      <button type="button" @click="$emit('close')" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
        取消
      </button>
      <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
        保存
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const emit = defineEmits(['close'])

// 获取账套特定的存储键
const getStorageKey = (key) => {
  const currentLedgerId = localStorage.getItem('currentLedgerId') || 'default'
  return `${key}_${currentLedgerId}`
}

// 保存账套特定数据
const saveLedgerData = () => {
  localStorage.setItem(getStorageKey('accounts'), JSON.stringify(accounts.value))
  localStorage.setItem(getStorageKey('transactions'), JSON.stringify(transactions.value))
}

// 交易类型
const transactionType = ref('expense')

// 交易表单数据
const transaction = ref({
  amount: '',
  category: '',
  account: '',
  toAccount: '',
  member: '',
  merchant: '',
  tag: '',
  paymentChannel: '',
  description: ''
})

// 分类折叠状态 - 默认全部折叠
const expandedCategories = ref([])

// 选中的分类
const selectedCategory = ref('')

// 切换分类展开/折叠
const toggleCategory = (categoryId) => {
  const index = expandedCategories.value.indexOf(categoryId)
  if (index === -1) {
    expandedCategories.value.push(categoryId)
  } else {
    expandedCategories.value.splice(index, 1)
  }
}

// 选择分类
const selectCategory = (category) => {
  transaction.value.category = category
}

// 支出分类列表（从维度管理获取）
const expenseCategories = ref([])

// 收入分类列表（从维度管理获取）
const incomeCategories = ref([])

// 根据交易类型获取分类列表（支持二级分类）
const categories = computed(() => {
  const list = transactionType.value === 'income' ? incomeCategories.value : expenseCategories.value
  // 展开分类列表，包含父分类和子分类
  const result = []
  list.forEach(cat => {
    result.push(cat.name)
    if (cat.children && cat.children.length > 0) {
      cat.children.forEach(child => {
        result.push(`${cat.name}-${child.name}`)
      })
    }
  })
  return result
})

// 账户列表
const accounts = ref([
  { id: 1, name: '现金', balance: 1000 },
  { id: 2, name: '银行卡', balance: 5000 },
  { id: 3, name: '支付宝', balance: 2000 },
  { id: 4, name: '微信', balance: 1500 }
])

// 成员列表
const members = ref([])

// 商家列表
const merchants = ref([])

// 标签列表
const tags = ref([])

// 支付渠道列表
const paymentChannels = ref([])

// 交易记录
const transactions = ref([])

// 添加交易
const addTransaction = () => {
  const newTransaction = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type: transactionType.value,
    amount: transaction.value.amount,
    category: transaction.value.category,
    account: transaction.value.account,
    toAccount: transactionType.value === 'transfer' ? transaction.value.toAccount : null,
    member: transaction.value.member,
    merchant: transaction.value.merchant,
    tag: transaction.value.tag,
    paymentChannel: transaction.value.paymentChannel,
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
  saveLedgerData()
  
  // 重置表单
  transaction.value = {
    amount: '',
    category: '',
    account: '',
    toAccount: '',
    member: '',
    merchant: '',
    tag: '',
    paymentChannel: '',
    description: ''
  }
  transactionType.value = 'expense'
  
  // 关闭弹窗
  emit('close')
}

// 加载账套特定数据
const loadLedgerData = () => {
  const currentLedgerId = localStorage.getItem('currentLedgerId') || 'default'
  
  // 加载账套特定的维度数据
  const savedDimensions = localStorage.getItem(`dimensions_${currentLedgerId}`)
  if (savedDimensions) {
    const dimensions = JSON.parse(savedDimensions)
    members.value = dimensions.members || []
    merchants.value = dimensions.merchants || []
    tags.value = dimensions.tags || []
    paymentChannels.value = dimensions.paymentChannels || []
    expenseCategories.value = dimensions.expenseCategories || []
    incomeCategories.value = dimensions.incomeCategories || []
  }
  
  // 加载账套特定的账户和交易数据
  const savedAccounts = localStorage.getItem(`accounts_${currentLedgerId}`)
  if (savedAccounts) {
    accounts.value = JSON.parse(savedAccounts)
  }
  
  const savedTransactions = localStorage.getItem(`transactions_${currentLedgerId}`)
  if (savedTransactions) {
    transactions.value = JSON.parse(savedTransactions)
  }
}

// 监听账套切换
const handleLedgerChange = () => {
  loadLedgerData()
}

onMounted(() => {
  loadLedgerData()
  // 监听账套切换事件
  window.addEventListener('ledgerChanged', handleLedgerChange)
})
</script>
