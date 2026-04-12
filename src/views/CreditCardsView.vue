<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">信用卡管理</h2>
        <button @click="showAddCardModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
          添加信用卡
        </button>
      </div>
      
      <div class="space-y-4">
        <div v-for="card in creditCards" :key="card.id" class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ card.name }}</h3>
              <div class="flex items-center text-sm">
                <span class="text-gray-500 dark:text-gray-400 mr-4">银行: {{ card.bank }}</span>
                <span class="text-gray-500 dark:text-gray-400">卡号: {{ card.number }}</span>
              </div>
              <div class="flex items-center text-sm mt-1">
                <span class="text-gray-500 dark:text-gray-400 mr-4">信用额度: ¥{{ card.creditLimit.toFixed(2) }}</span>
                <span class="text-gray-500 dark:text-gray-400">可用额度: ¥{{ card.availableCredit.toFixed(2) }}</span>
              </div>
              <div class="flex items-center text-sm mt-1">
                <span class="text-gray-500 dark:text-gray-400 mr-4">账单日: {{ card.billDay }}日</span>
                <span class="text-gray-500 dark:text-gray-400">还款日: {{ card.dueDay }}日</span>
              </div>
            </div>
          </div>
          <div class="flex space-x-2">
            <button @click="editCard(card)" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
              编辑
            </button>
            <button @click="deleteCard(card.id)" class="px-3 py-1 bg-danger hover:bg-red-600 text-white rounded-md text-sm font-medium">
              删除
            </button>
          </div>
        </div>
        <div v-if="creditCards.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          暂无信用卡，请添加信用卡
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">账单管理</h2>
      <div class="space-y-4">
        <div v-for="bill in creditCardBills" :key="bill.id" class="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ bill.cardName }} - {{ bill.billDate }}</h3>
            <span :class="{
              'text-danger': bill.status === 'unpaid',
              'text-warning': bill.status === 'partial_paid',
              'text-success': bill.status === 'paid',
              'text-error': bill.status === 'overdue'
            }" class="text-sm font-medium">
              {{ bill.status === 'unpaid' ? '未还款' : bill.status === 'partial_paid' ? '部分还款' : bill.status === 'paid' ? '已还款' : '逾期' }}
            </span>
          </div>
          <div class="flex items-center text-sm mt-2">
            <span class="text-gray-500 dark:text-gray-400 mr-4">账单金额: ¥{{ bill.amount.toFixed(2) }}</span>
            <span class="text-gray-500 dark:text-gray-400 mr-4">已还金额: ¥{{ bill.paidAmount.toFixed(2) }}</span>
            <span class="text-gray-500 dark:text-gray-400">剩余金额: ¥{{ bill.remainingAmount.toFixed(2) }}</span>
          </div>
          <div class="flex items-center text-sm mt-1">
            <span class="text-gray-500 dark:text-gray-400">还款日: {{ bill.dueDate }}</span>
          </div>
          <div class="mt-3 flex justify-end">
            <button @click="payBill(bill)" :disabled="bill.status === 'paid'" class="px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed">
              {{ bill.status === 'paid' ? '已还款' : '立即还款' }}
            </button>
          </div>
        </div>
        <div v-if="creditCardBills.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          暂无账单数据
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">消费分析</h2>
      <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 flex items-center justify-center">
        <p class="text-gray-500 dark:text-gray-400">信用卡消费分析图表</p>
      </div>
    </div>

    <!-- 添加/编辑信用卡模态框 -->
    <div v-if="showAddCardModal || showEditCardModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ showEditCardModal ? '编辑信用卡' : '添加信用卡' }}</h3>
        <form @submit.prevent="saveCard" class="space-y-4">
          <div>
            <label for="card-name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">卡片名称</label>
            <input type="text" id="card-name" v-model="formData.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="card-bank" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">银行名称</label>
            <input type="text" id="card-bank" v-model="formData.bank" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="card-number" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">卡号</label>
            <input type="text" id="card-number" v-model="formData.number" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="card-limit" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">信用额度</label>
            <input type="number" id="card-limit" v-model.number="formData.creditLimit" required min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="card-available" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">可用额度</label>
            <input type="number" id="card-available" v-model.number="formData.availableCredit" required min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="card-bill-day" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账单日</label>
            <input type="number" id="card-bill-day" v-model.number="formData.billDay" required min="1" max="31" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="card-due-day" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">还款日</label>
            <input type="number" id="card-due-day" v-model.number="formData.dueDay" required min="1" max="31" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showAddCardModal = false; showEditCardModal = false; resetForm()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
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

// 信用卡列表
const creditCards = ref([])

// 信用卡账单列表
const creditCardBills = ref([
  {
    id: 1,
    cardName: '招商银行信用卡',
    billDate: '2026-03-05',
    dueDate: '2026-03-25',
    amount: 15000,
    paidAmount: 0,
    remainingAmount: 15000,
    status: 'unpaid'
  },
  {
    id: 2,
    cardName: '工商银行信用卡',
    billDate: '2026-03-10',
    dueDate: '2026-03-30',
    amount: 10000,
    paidAmount: 5000,
    remainingAmount: 5000,
    status: 'partial_paid'
  }
])

// 模态框状态
const showAddCardModal = ref(false)
const showEditCardModal = ref(false)

// 表单数据
const formData = ref({
  id: null,
  name: '',
  bank: '',
  number: '',
  creditLimit: 0,
  availableCredit: 0,
  billDay: 1,
  dueDay: 20
})

// 重置表单
const resetForm = () => {
  formData.value = {
    id: null,
    name: '',
    bank: '',
    number: '',
    creditLimit: 0,
    availableCredit: 0,
    billDay: 1,
    dueDay: 20
  }
}

// 编辑信用卡
const editCard = (card) => {
  formData.value = { ...card }
  showEditCardModal.value = true
  showAddCardModal.value = false
}

// 保存信用卡
const saveCard = () => {
  if (showEditCardModal.value) {
    // 更新现有信用卡
    const index = creditCards.value.findIndex(c => c.id === formData.value.id)
    if (index !== -1) {
      creditCards.value[index] = { ...formData.value }
    }
  } else {
    // 添加新信用卡
    const newCard = {
      id: Date.now(),
      name: formData.value.name,
      bank: formData.value.bank,
      number: formData.value.number,
      creditLimit: formData.value.creditLimit,
      availableCredit: formData.value.availableCredit,
      billDay: formData.value.billDay,
      dueDay: formData.value.dueDay
    }
    creditCards.value.push(newCard)
    
    // 自动创建对应的账户到账户管理
    const linkedAccount = {
      id: `credit_${Date.now()}`,
      name: `${formData.value.name} (信用卡)`,
      type: 'credit_card',
      balance: -formData.value.availableCredit, // 信用卡欠款为负
      creditLimit: formData.value.creditLimit,
      linkedCardId: newCard.id,
      createdAt: new Date().toLocaleString()
    }
    
    // 获取现有账户
    const existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]')
    existingAccounts.push(linkedAccount)
    localStorage.setItem('accounts', JSON.stringify(existingAccounts))
    
    // 触发账户更新事件
    window.dispatchEvent(new CustomEvent('accountsUpdated'))
  }
  
  // 保存到本地存储
  localStorage.setItem('creditCards', JSON.stringify(creditCards.value))
  
  // 关闭模态框并重置表单
  showAddCardModal.value = false
  showEditCardModal.value = false
  resetForm()
}

// 删除信用卡
const deleteCard = (cardId) => {
  if (confirm('确定要删除此信用卡吗？')) {
    creditCards.value = creditCards.value.filter(c => c.id !== cardId)
    // 保存到本地存储
    localStorage.setItem('creditCards', JSON.stringify(creditCards.value))
  }
}

// 还款
const payBill = (bill) => {
  if (confirm(`确定要偿还 ${bill.cardName} 的账单吗？金额：¥${bill.remainingAmount.toFixed(2)}`)) {
    const index = creditCardBills.value.findIndex(b => b.id === bill.id)
    if (index !== -1) {
      creditCardBills.value[index].paidAmount = bill.amount
      creditCardBills.value[index].remainingAmount = 0
      creditCardBills.value[index].status = 'paid'
    }
    // 保存到本地存储
    localStorage.setItem('creditCardBills', JSON.stringify(creditCardBills.value))
  }
}

onMounted(() => {
  // 从本地存储加载数据
  const savedCards = localStorage.getItem('creditCards')
  const savedBills = localStorage.getItem('creditCardBills')
  
  if (savedCards) {
    creditCards.value = JSON.parse(savedCards)
  }
  
  if (savedBills) {
    creditCardBills.value = JSON.parse(savedBills)
  }
})
</script>

<style scoped>
/* 样式 */
</style>