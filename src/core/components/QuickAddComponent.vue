<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
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
        <input type="text" id="amount" v-model="transaction.amount" @keydown.enter.prevent="calculateAmount" required min="0.01" step="0.01" placeholder="输入金额或算式（如100+50*2），按回车计算" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
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
          <option v-for="account in allAccounts" :key="account.id" :value="account.id">
            {{ account.name }} ({{ formatCurrency(account.balance) }})
          </option>
        </select>
      </div>
      <div v-if="transactionType === 'transfer'">
        <label for="to-account" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">转入账户</label>
        <select id="to-account" v-model="transaction.toAccount" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          <option value="">请选择账户</option>
          <option v-for="account in allAccounts" :key="account.id" :value="account.id">
            {{ account.name }}
          </option>
        </select>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="member" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">成员</label>
        <input list="members-list" id="member" v-model="transaction.member" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white" placeholder="选择或输入成员">
        <datalist id="members-list">
          <option v-for="m in members" :key="m" :value="m"></option>
        </datalist>
      </div>
      <div>
        <label for="merchant" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">商户</label>
        <input list="merchants-list" id="merchant" v-model="transaction.merchant" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white" placeholder="选择或输入商户">
        <datalist id="merchants-list">
          <option v-for="m in merchants" :key="m" :value="m"></option>
        </datalist>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="tags" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">标签</label>
        <input list="tags-list" id="tags" v-model="transaction.tags" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white" placeholder="选择或输入标签">
        <datalist id="tags-list">
          <option v-for="t in tags" :key="t" :value="t"></option>
        </datalist>
      </div>
      <div>
        <label for="paymentChannel" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">支付渠道</label>
        <input list="channels-list" id="paymentChannel" v-model="transaction.paymentChannel" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white" placeholder="选择或输入支付渠道">
        <datalist id="channels-list">
          <option v-for="c in paymentChannels" :key="c" :value="c"></option>
        </datalist>
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
import { ref, onMounted, computed, watch, defineProps } from 'vue'
import coreDataStore from '../../services/core-data-store.js'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

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
  tags: '',
  paymentChannel: '',
  description: ''
})

// 分类折叠状态
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

// 计算金额
const calculateAmount = () => {
  const input = transaction.value.amount
  if (!input) return
  
  if (!isNaN(input) && input.trim() !== '') {
    return
  }
  
  try {
    const cleanedInput = input.replace(/[^\d+\-*/().]/g, '')
    if (cleanedInput === '') return
    
    const result = new Function('return ' + cleanedInput)()
    
    if (typeof result === 'number' && isFinite(result)) {
      transaction.value.amount = Math.round(result * 100) / 100
    }
  } catch (e) {
    console.log('金额计算失败:', e)
  }
}

// 分类数据
const expenseCategories = computed(() => coreDataStore.getRaw('categories')?.filter(c => c.type === 'expense') || [])
const incomeCategories = computed(() => coreDataStore.getRaw('categories')?.filter(c => c.type === 'income') || [])

// 账户列表（包括关联账户）
const accounts = computed(() => coreDataStore.getRaw('accounts') || [])
const investmentAccounts = computed(() => coreDataStore.getRaw('investment_accounts') || [])
const creditCards = computed(() => coreDataStore.getRaw('credit_cards') || [])

// 所有账户（统一格式）
const allAccounts = computed(() => {
  const result = [...accounts.value]
  
  // 添加投资账户
  investmentAccounts.value.forEach(acc => {
    if (!result.find(a => a.id === `inv_${acc.id}`)) {
      result.push({
        id: `inv_${acc.id}`,
        name: `[投资]${acc.name}`,
        balance: acc.totalValue || 0,
        type: 'investment'
      })
    }
  })
  
  // 添加信用卡
  creditCards.value.forEach(card => {
    if (!result.find(a => a.id === `cc_${card.id}`)) {
      result.push({
        id: `cc_${card.id}`,
        name: `[信用卡]${card.name}`,
        balance: -(card.creditLimit - card.availableCredit) || 0,
        type: 'credit'
      })
    }
  })
  
  return result
})

// 维度数据
const members = computed(() => coreDataStore.getDimensions().members || [])
const merchants = computed(() => coreDataStore.getDimensions().merchants || [])
const tags = computed(() => coreDataStore.getDimensions().tags || [])
const paymentChannels = computed(() => coreDataStore.getDimensions().paymentChannels || [])

// 是否为编辑模式
const isEditMode = computed(() => props.initialData && props.initialData.id)

// 格式化货币
const formatCurrency = (value) => {
  if (typeof value !== 'number') return '¥0.00'
  return '¥' + value.toFixed(2)
}

// 提交处理
const handleSubmit = async () => {
  // 验证
  if (!transaction.value.amount || parseFloat(transaction.value.amount) <= 0) {
    alert('请输入有效金额')
    return
  }
  
  if (transactionType.value !== 'transfer' && !transaction.value.category) {
    alert('请选择分类')
    return
  }
  
  if (!transaction.value.account) {
    alert('请选择账户')
    return
  }
  
  if (transactionType.value === 'transfer' && !transaction.value.toAccount) {
    alert('请选择转入账户')
    return
  }
  
  // 处理金额
  let amount = transaction.value.amount
  if (typeof amount === 'string') {
    calculateAmount()
    amount = parseFloat(transaction.value.amount) || 0
  }
  
  const transactionData = {
    id: props.initialData?.id || undefined,
    type: transactionType.value,
    amount: amount,
    category: transaction.value.category || '',
    account: transaction.value.account,
    toAccount: transactionType.value === 'transfer' ? transaction.value.toAccount : null,
    member: transaction.value.member,
    merchant: transaction.value.merchant,
    tags: transaction.value.tags ? [transaction.value.tags] : [],
    paymentChannel: transaction.value.paymentChannel,
    description: transaction.value.description,
    date: new Date().toISOString().split('T')[0]
  }
  
  try {
    if (isEditMode.value) {
      await coreDataStore.updateTransaction(transactionData.id, transactionData)
    } else {
      await coreDataStore.addTransaction(transactionData)
    }
    
    emit('close')
  } catch (error) {
    console.error('保存交易失败:', error)
    alert('保存失败: ' + error.message)
  }
}

// 初始化
onMounted(() => {
  // 如果有初始数据，填充表单
  if (props.initialData) {
    const data = props.initialData
    transactionType.value = data.type || 'expense'
    transaction.value = {
      amount: data.amount?.toString() || '',
      category: data.category || '',
      account: data.account?.toString() || '',
      toAccount: data.toAccount ? data.toAccount.toString() : '',
      member: data.member || '',
      merchant: data.merchant || '',
      tags: data.tags?.[0] || '',
      paymentChannel: data.paymentChannel || '',
      description: data.description || ''
    }
    selectedCategory.value = data.category || ''
  }
})
</script>
