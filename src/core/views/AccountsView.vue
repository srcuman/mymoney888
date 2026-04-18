<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">账户管理</h2>
        <button @click="showAddAccountModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
          添加账户
        </button>
      </div>
      
      <div class="space-y-6">
        <div v-for="(categoryAccounts, categoryValue) in accountsByCategory" :key="categoryValue" class="space-y-2">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">{{ accountCategories.find(c => c.value === categoryValue)?.label || '其他' }}</h3>
          <div class="space-y-3">
            <div v-for="account in categoryAccounts" :key="account.id" class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div class="flex items-center">
                <div class="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-4">
                  <span class="text-primary dark:text-blue-400 font-bold text-lg">{{ account.name.charAt(0) }}</span>
                </div>
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ account.name }}</h3>
                  <div class="text-sm text-gray-500 dark:text-gray-400">余额: ¥{{ (account.balance || 0).toFixed(2) }}</div>
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
        <div v-if="Object.keys(accountsByCategory).length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          暂无账户，请添加账户
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
          <div>
            <label for="account-category" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账户类别</label>
            <select id="account-category" v-model="formData.category" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option v-for="category in accountCategories" :key="category.value" :value="category.value">{{ category.label }}</option>
            </select>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import coreDataStore from '../../services/core-data-store.js'

// 账户类别列表
const accountCategories = [
  { value: 'cash', label: '现金' },
  { value: 'bank', label: '银行账户' },
  { value: 'credit_card', label: '信用卡' },
  { value: 'investment', label: '投资账户' },
  { value: 'loan', label: '贷款账户' },
  { value: 'other', label: '其他' }
]

// 数据版本号（用于触发响应式更新）
const dataVersion = ref(0)

// 计算属性：融合基础账户和衍生账户
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
      // 排除信用卡关联账户，因为它们会在信用卡处理部分被更新和显示
      if (!creditCardLinkedAccountIds.includes(account.id)) {
        result.push({ ...account })
      }
    })
    
    // 2. 添加信用卡账户（从 credit_cards 计算，但显示为独立账户）
    creditCards.forEach(card => {
      // 查找是否已存在关联账户（通过 linkedAccountId）
      const existingLinkedAccount = result.find(a => a.id === card.linkedAccountId)
      if (existingLinkedAccount) {
        // 关联账户已存在，更新余额和名称
        existingLinkedAccount.balance = card.usedCredit || (card.creditLimit - card.availableCredit)
        existingLinkedAccount.name = card.name
        existingLinkedAccount.sourceType = 'creditCard'
        existingLinkedAccount.linkedCreditCardId = card.id
        existingLinkedAccount.creditLimit = card.creditLimit
        existingLinkedAccount.availableCredit = card.availableCredit
      } else {
        // 创建关联的账户（用于在账户管理页面展示）
        result.push({
          id: card.id,
          name: card.name,
          balance: card.usedCredit || (card.creditLimit - card.availableCredit),
          category: 'credit_card',
          sourceType: 'creditCard',
          linkedCreditCardId: card.id,
          creditLimit: card.creditLimit,
          availableCredit: card.availableCredit
        })
      }
    })
    
    // 3. 添加投资账户（从 investment_accounts 计算）
    const investmentAccounts = coreDataStore.getRaw('investment_accounts') || []
    investmentAccounts.forEach(account => {
      // 查找是否已存在关联账户（通过 linkedAccountId）
      const existingLinkedAccount = result.find(a => a.id === account.linkedAccountId)
      if (existingLinkedAccount) {
        // 关联账户已存在，更新余额
        existingLinkedAccount.balance = account.totalValue || 0
        existingLinkedAccount.sourceType = 'investmentAccount'
        existingLinkedAccount.linkedInvestmentAccountId = account.id
      } else {
        // 创建关联的账户
        result.push({
          id: account.id,
          name: account.name,
          balance: account.totalValue || 0,
          category: 'investment',
          sourceType: 'investmentAccount',
          linkedInvestmentAccountId: account.id
        })
      }
    })
    
    // 4. 添加贷款账户（从 loans 计算）
    const loans = coreDataStore.getRaw('loans') || []
    loans.forEach(loan => {
      // 查找是否已存在（通过 linkedLoanId 关联）
      const existingByLink = result.find(a => a.linkedLoanId === loan.id)
      if (existingByLink) {
        // 关联账户已存在，更新余额
        existingByLink.balance = -(loan.remainingAmount || loan.amount)
      } else {
        // 创建关联的账户（贷款余额为负表示负债）
        result.push({
          id: loan.id,
          name: loan.name,
          balance: -(loan.remainingAmount || loan.amount),
          category: 'loan',
          sourceType: 'loan',
          linkedLoanId: loan.id,
          totalAmount: loan.amount
        })
      }
    })
    
    return result
  })

// 按类别分组账户
const accountsByCategory = computed(() => {
  const grouped = {}
  accounts.value.forEach(account => {
    if (!grouped[account.category]) {
      grouped[account.category] = []
    }
    grouped[account.category].push(account)
  })
  return grouped
})

// 模态框状态
const showAddAccountModal = ref(false)
const showEditAccountModal = ref(false)

// 表单数据
const formData = ref({
  id: null,
  name: '',
  balance: 0,
  category: 'other'
})

// 重置表单
const resetForm = () => {
  formData.value = {
    id: null,
    name: '',
    balance: 0,
    category: 'other'
  }
}

// 编辑账户（只编辑基础账户，不编辑衍生账户）
const editAccount = (account) => {
  if (account.sourceType) {
    alert('这是从其他模块同步的账户，请在对应的管理页面修改')
    return
  }
  formData.value = { ...account }
  showEditAccountModal.value = true
  showAddAccountModal.value = false
}

// 生成唯一ID
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

// 保存账户（只保存基础账户）
const saveAccount = async () => {
  if (formData.value.sourceType) {
    alert('这是从其他模块同步的账户，不能直接编辑')
    return
  }
  
  if (showEditAccountModal.value) {
    await coreDataStore.update('accounts', formData.value.id, {
      name: formData.value.name,
      balance: formData.value.balance,
      category: formData.value.category
    })
  } else {
    const newAccount = {
      id: generateId(),
      name: formData.value.name,
      balance: formData.value.balance,
      category: formData.value.category,
      initialBalance: formData.value.balance,
      sourceType: 'manual'
    }
    await coreDataStore.add('accounts', newAccount)
  }
  
  // 关闭模态框并重置表单
  showAddAccountModal.value = false
  showEditAccountModal.value = false
  resetForm()
}

// 删除账户（只删除基础账户）
const deleteAccount = async (accountId) => {
  const account = accounts.value.find(a => String(a.id) === String(accountId))
  if (account && account.sourceType) {
    alert('这是从其他模块同步的账户，不能直接删除')
    return
  }
  
  if (confirm('确定要删除此账户吗？')) {
    await coreDataStore.remove('accounts', accountId)
  }
}

// 监听数据变更
const handleDataChanged = () => {
  dataVersion.value++
}

// 监听其他模块的更新事件
const handleOtherModuleUpdate = () => {
  dataVersion.value++
}

onMounted(() => {
  // 监听 DataStore 变更事件
  window.addEventListener('dataChanged', handleDataChanged)
  
  // 监听其他模块的更新事件
  window.addEventListener('investmentAccountsUpdated', handleOtherModuleUpdate)
  window.addEventListener('creditCardsUpdated', handleOtherModuleUpdate)
  window.addEventListener('loanAccountsUpdated', handleOtherModuleUpdate)
  window.addEventListener('transactionsUpdated', handleOtherModuleUpdate)
  window.addEventListener('accountsUpdated', handleOtherModuleUpdate)
})

onUnmounted(() => {
  window.removeEventListener('dataChanged', handleDataChanged)
  window.removeEventListener('investmentAccountsUpdated', handleOtherModuleUpdate)
  window.removeEventListener('creditCardsUpdated', handleOtherModuleUpdate)
  window.removeEventListener('loanAccountsUpdated', handleOtherModuleUpdate)
  window.removeEventListener('transactionsUpdated', handleOtherModuleUpdate)
  window.removeEventListener('accountsUpdated', handleOtherModuleUpdate)
})
</script>
