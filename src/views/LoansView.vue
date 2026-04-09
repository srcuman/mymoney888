<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">贷款管理</h2>
        <button @click="showAddLoanModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
          添加贷款
        </button>
      </div>
      
      <div class="space-y-4">
        <div v-for="loan in loans" :key="loan.id" class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ loan.name }}</h3>
              <div class="flex items-center text-sm">
                <span class="text-gray-500 dark:text-gray-400 mr-4">类型: {{ loan.type }}</span>
                <span class="text-gray-500 dark:text-gray-400">机构: {{ loan.institution }}</span>
              </div>
              <div class="flex items-center text-sm mt-1">
                <span class="text-gray-500 dark:text-gray-400 mr-4">贷款金额: ¥{{ loan.amount.toFixed(2) }}</span>
                <span class="text-gray-500 dark:text-gray-400">剩余金额: ¥{{ loan.remainingAmount.toFixed(2) }}</span>
              </div>
              <div class="flex items-center text-sm mt-1">
                <span class="text-gray-500 dark:text-gray-400 mr-4">利率: {{ (loan.interestRate * 100).toFixed(2) }}%</span>
                <span class="text-gray-500 dark:text-gray-400">还款日期: {{ loan.repaymentDay }}日</span>
              </div>
            </div>
          </div>
          <div class="flex space-x-2">
            <button @click="editLoan(loan)" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
              编辑
            </button>
            <button @click="deleteLoan(loan.id)" class="px-3 py-1 bg-danger hover:bg-red-600 text-white rounded-md text-sm font-medium">
              删除
            </button>
          </div>
        </div>
        <div v-if="loans.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          暂无贷款，请添加贷款
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">还款计划</h2>
      <div class="space-y-4">
        <div v-for="plan in repaymentPlans" :key="plan.id" class="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ plan.loanName }} - {{ plan.repaymentDate }}</h3>
            <span :class="{
              'text-danger': plan.status === 'unpaid',
              'text-warning': plan.status === 'partial_paid',
              'text-success': plan.status === 'paid',
              'text-error': plan.status === 'overdue'
            }" class="text-sm font-medium">
              {{ plan.status === 'unpaid' ? '未还款' : plan.status === 'partial_paid' ? '部分还款' : plan.status === 'paid' ? '已还款' : '逾期' }}
            </span>
          </div>
          <div class="flex items-center text-sm mt-2">
            <span class="text-gray-500 dark:text-gray-400 mr-4">应还金额: ¥{{ plan.amount.toFixed(2) }}</span>
            <span class="text-gray-500 dark:text-gray-400 mr-4">已还金额: ¥{{ plan.paidAmount.toFixed(2) }}</span>
            <span class="text-gray-500 dark:text-gray-400">剩余金额: ¥{{ plan.remainingAmount.toFixed(2) }}</span>
          </div>
          <div class="mt-3 flex justify-end">
            <button @click="payRepayment(plan)" :disabled="plan.status === 'paid'" class="px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed">
              {{ plan.status === 'paid' ? '已还款' : '立即还款' }}
            </button>
          </div>
        </div>
        <div v-if="repaymentPlans.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          暂无还款计划
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">还款提醒</h2>
      <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 flex items-center justify-center">
        <p class="text-gray-500 dark:text-gray-400">还款提醒设置</p>
      </div>
    </div>

    <!-- 添加/编辑贷款模态框 -->
    <div v-if="showAddLoanModal || showEditLoanModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ showEditLoanModal ? '编辑贷款' : '添加贷款' }}</h3>
        <form @submit.prevent="saveLoan" class="space-y-4">
          <div>
            <label for="loan-name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">贷款名称</label>
            <input type="text" id="loan-name" v-model="formData.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="loan-type" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">贷款类型</label>
            <select id="loan-type" v-model="formData.type" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择类型</option>
              <option value="房贷">房贷</option>
              <option value="车贷">车贷</option>
              <option value="个人贷款">个人贷款</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label for="loan-institution" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">贷款机构</label>
            <input type="text" id="loan-institution" v-model="formData.institution" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="loan-amount" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">贷款金额</label>
            <input type="number" id="loan-amount" v-model.number="formData.amount" required min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="loan-remaining" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">剩余金额</label>
            <input type="number" id="loan-remaining" v-model.number="formData.remainingAmount" required min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="loan-interest" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">年利率</label>
            <input type="number" id="loan-interest" v-model.number="formData.interestRate" required min="0" step="0.0001" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="loan-repayment-day" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">还款日期</label>
            <input type="number" id="loan-repayment-day" v-model.number="formData.repaymentDay" required min="1" max="31" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showAddLoanModal = false; showEditLoanModal = false; resetForm()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
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

// 贷款列表
const loans = ref([
  {
    id: 1,
    name: '住房贷款',
    type: '房贷',
    institution: '工商银行',
    amount: 1000000,
    remainingAmount: 800000,
    interestRate: 0.049,
    repaymentDay: 15
  },
  {
    id: 2,
    name: '汽车贷款',
    type: '车贷',
    institution: '招商银行',
    amount: 200000,
    remainingAmount: 100000,
    interestRate: 0.058,
    repaymentDay: 10
  }
])

// 还款计划列表
const repaymentPlans = ref([
  {
    id: 1,
    loanName: '住房贷款',
    repaymentDate: '2026-04-15',
    amount: 5000,
    paidAmount: 0,
    remainingAmount: 5000,
    status: 'unpaid'
  },
  {
    id: 2,
    loanName: '汽车贷款',
    repaymentDate: '2026-04-10',
    amount: 3000,
    paidAmount: 3000,
    remainingAmount: 0,
    status: 'paid'
  }
])

// 模态框状态
const showAddLoanModal = ref(false)
const showEditLoanModal = ref(false)

// 表单数据
const formData = ref({
  id: null,
  name: '',
  type: '',
  institution: '',
  amount: 0,
  remainingAmount: 0,
  interestRate: 0,
  repaymentDay: 1
})

// 重置表单
const resetForm = () => {
  formData.value = {
    id: null,
    name: '',
    type: '',
    institution: '',
    amount: 0,
    remainingAmount: 0,
    interestRate: 0,
    repaymentDay: 1
  }
}

// 编辑贷款
const editLoan = (loan) => {
  formData.value = { ...loan }
  showEditLoanModal.value = true
  showAddLoanModal.value = false
}

// 保存贷款
const saveLoan = () => {
  if (showEditLoanModal.value) {
    // 更新现有贷款
    const index = loans.value.findIndex(l => l.id === formData.value.id)
    if (index !== -1) {
      loans.value[index] = { ...formData.value }
    }
  } else {
    // 添加新贷款
    const newLoan = {
      id: loans.value.length + 1,
      name: formData.value.name,
      type: formData.value.type,
      institution: formData.value.institution,
      amount: formData.value.amount,
      remainingAmount: formData.value.remainingAmount,
      interestRate: formData.value.interestRate,
      repaymentDay: formData.value.repaymentDay
    }
    loans.value.push(newLoan)
  }
  
  // 保存到本地存储
  localStorage.setItem('loans', JSON.stringify(loans.value))
  
  // 关闭模态框并重置表单
  showAddLoanModal.value = false
  showEditLoanModal.value = false
  resetForm()
}

// 删除贷款
const deleteLoan = (loanId) => {
  if (confirm('确定要删除此贷款吗？')) {
    loans.value = loans.value.filter(l => l.id !== loanId)
    // 保存到本地存储
    localStorage.setItem('loans', JSON.stringify(loans.value))
  }
}

// 还款
const payRepayment = (plan) => {
  if (confirm(`确定要偿还 ${plan.loanName} 的还款吗？金额：¥${plan.remainingAmount.toFixed(2)}`)) {
    const index = repaymentPlans.value.findIndex(p => p.id === plan.id)
    if (index !== -1) {
      repaymentPlans.value[index].paidAmount = plan.amount
      repaymentPlans.value[index].remainingAmount = 0
      repaymentPlans.value[index].status = 'paid'
    }
    // 保存到本地存储
    localStorage.setItem('repaymentPlans', JSON.stringify(repaymentPlans.value))
  }
}

onMounted(() => {
  // 从本地存储加载数据
  const savedLoans = localStorage.getItem('loans')
  const savedPlans = localStorage.getItem('repaymentPlans')
  
  if (savedLoans) {
    loans.value = JSON.parse(savedLoans)
  }
  
  if (savedPlans) {
    repaymentPlans.value = JSON.parse(savedPlans)
  }
})
</script>

<style scoped>
/* 样式 */
</style>