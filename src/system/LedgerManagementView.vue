<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">账套管理</h2>
        <button @click="showTemplateSelect = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
          添加账套
        </button>
      </div>
      
      <div class="space-y-4">
        <div v-for="ledger in ledgers" :key="ledger.id" class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-4">
              <span class="text-primary dark:text-blue-400 font-bold text-lg">{{ ledger.name.charAt(0) }}</span>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ ledger.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ ledger.description }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                创建时间: {{ ledger.createdAt }}
                <span v-if="ledger.templateId" class="ml-2 text-primary">({{ getTemplateName(ledger.templateId) }})</span>
              </p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button @click="switchToLedger(ledger.id)" :class="currentLedgerId === ledger.id ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'" class="px-3 py-1 rounded-md text-sm font-medium">
              {{ currentLedgerId === ledger.id ? '当前账套' : '切换' }}
            </button>
            <button @click="editLedger(ledger)" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
              编辑
            </button>
            <button @click="deleteLedger(ledger.id)" class="px-3 py-1 bg-danger hover:bg-red-600 text-white rounded-md text-sm font-medium">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 模板选择界面 -->
    <div v-if="showTemplateSelect" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">选择账套模板</h3>
          <button @click="showTemplateSelect = false" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <span class="text-2xl">&times;</span>
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="template in templates" 
            :key="template.id"
            @click="selectTemplate(template)"
            :class="selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''"
            class="p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary transition-colors"
          >
            <div class="flex items-center mb-2">
              <span class="text-3xl mr-3">{{ template.icon }}</span>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{{ template.name }}</h4>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ template.description }}</p>
            <div v-if="template.type !== 'blank'" class="mt-2 text-xs text-gray-400">
              <span class="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-1">
                {{ template.data?.expenseCategories?.length || 0 }} 个支出分类
              </span>
              <span class="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {{ template.data?.incomeCategories?.length || 0 }} 个收入分类
              </span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button @click="showTemplateSelect = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
            取消
          </button>
          <button @click="confirmTemplate" :disabled="!selectedTemplate" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
            下一步
          </button>
        </div>
      </div>
    </div>

    <!-- 添加账套模态框 -->
    <div v-if="showAddLedgerModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          创建账套 - {{ selectedTemplate?.name }}
        </h3>
        <form @submit.prevent="saveLedger" class="space-y-4">
          <div>
            <label for="ledger-name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账套名称</label>
            <input type="text" id="ledger-name" v-model="formData.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="ledger-description" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
            <textarea id="ledger-description" v-model="formData.description" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"></textarea>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="cancelAdd" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
              上一步
            </button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
              创建账套
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 编辑账套模态框 -->
    <div v-if="showEditLedgerModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">编辑账套</h3>
        <form @submit.prevent="saveLedger" class="space-y-4">
          <div>
            <label for="edit-ledger-name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账套名称</label>
            <input type="text" id="edit-ledger-name" v-model="formData.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="edit-ledger-description" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
            <textarea id="edit-ledger-description" v-model="formData.description" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"></textarea>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showEditLedgerModal = false; resetForm()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
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
import { ledgerTemplates, createLedgerFromTemplate, getLedgerCategories, getLedgerDimensions } from '../utils/ledger-templates.js'

// 账套列表
const ledgers = ref([])
const currentLedgerId = ref(null)

// 模板相关
const showTemplateSelect = ref(false)
const selectedTemplate = ref(null)
const templates = ledgerTemplates

// 模态框状态
const showAddLedgerModal = ref(false)
const showEditLedgerModal = ref(false)

// 表单数据
const formData = ref({
  id: null,
  name: '',
  description: '',
  templateId: null
})

// 获取模板名称
const getTemplateName = (templateId) => {
  const template = templates.find(t => t.id === templateId)
  return template ? template.name : '未知模板'
}

// 选择模板
const selectTemplate = (template) => {
  selectedTemplate.value = template
}

// 确认选择模板
const confirmTemplate = () => {
  if (!selectedTemplate.value) return
  
  formData.value = {
    id: null,
    name: selectedTemplate.value.name,
    description: selectedTemplate.value.description,
    templateId: selectedTemplate.value.id
  }
  
  showTemplateSelect.value = false
  showAddLedgerModal.value = true
}

// 取消添加
const cancelAdd = () => {
  showAddLedgerModal.value = false
  formData.value = {
    id: null,
    name: '',
    description: '',
    templateId: null
  }
  selectedTemplate.value = null
}

// 重置表单
const resetForm = () => {
  formData.value = {
    id: null,
    name: '',
    description: '',
    templateId: null
  }
  selectedTemplate.value = null
}

// 编辑账套
const editLedger = (ledger) => {
  formData.value = { ...ledger }
  showEditLedgerModal.value = true
  showAddLedgerModal.value = false
}

// 保存账套
const saveLedger = () => {
  if (showEditLedgerModal.value) {
    // 更新现有账套
    const index = ledgers.value.findIndex(l => l.id === formData.value.id)
    if (index !== -1) {
      ledgers.value[index] = { 
        ...ledgers.value[index],
        name: formData.value.name,
        description: formData.value.description
      }
    }
  } else {
    // 添加新账套 - 使用模板创建
    const newLedger = createLedgerFromTemplate(
      formData.value.templateId,
      formData.value.name,
      formData.value.description
    )
    ledgers.value.push(newLedger)
    
    // 如果启用了 coreDataStore，同步分类数据
    if (window.coreDataStore) {
      const categories = getLedgerCategories(newLedger.id)
      const dimensions = getLedgerDimensions(newLedger.id)
      window.coreDataStore._data.value.categories = categories
      window.coreDataStore._data.value.dimensions = dimensions
      window.coreDataStore._save('categories')
      window.coreDataStore._save('dimensions')
    }
  }
  
  // 保存到本地存储
  localStorage.setItem('ledgers', JSON.stringify(ledgers.value))
  
  // 关闭模态框并重置表单
  showAddLedgerModal.value = false
  showEditLedgerModal.value = false
  resetForm()
}

// 切换账套
const switchToLedger = (ledgerId) => {
  currentLedgerId.value = ledgerId
  localStorage.setItem('currentLedgerId', ledgerId)
  // 触发事件通知其他组件
  window.dispatchEvent(new CustomEvent('ledgerChanged', { detail: { ledgerId } }))
}

// 删除账套
const deleteLedger = (ledgerId) => {
  if (confirm('确定要删除此账套吗？相关数据也会被删除。')) {
    ledgers.value = ledgers.value.filter(l => l.id !== ledgerId)
    
    // 清理账套相关的本地存储数据
    localStorage.removeItem(`dimensions_${ledgerId}`)
    localStorage.removeItem(`categories_${ledgerId}`)
    // 清理其他账套特定数据
    const ledgerKeys = ['accounts', 'transactions', 'categories', 'credit_cards', 'credit_card_bills', 
                        'loans', 'loan_payments', 'investment_accounts', 'investment_details', 
                        'net_value_history', 'investment_profit_records']
    for (const key of ledgerKeys) {
      localStorage.removeItem(`${key}_${ledgerId}`)
    }
    
    // 如果删除的是当前账套，切换到第一个账套
    if (currentLedgerId.value === ledgerId && ledgers.value.length > 0) {
      switchToLedger(ledgers.value[0].id)
    } else if (ledgers.value.length === 0) {
      currentLedgerId.value = null
      localStorage.removeItem('currentLedgerId')
    }
    // 保存到本地存储
    localStorage.setItem('ledgers', JSON.stringify(ledgers.value))
  }
}

onMounted(() => {
  // 从本地存储加载数据
  const savedLedgers = localStorage.getItem('ledgers')
  const savedCurrentLedgerId = localStorage.getItem('currentLedgerId')
  
  if (savedLedgers) {
    ledgers.value = JSON.parse(savedLedgers)
  } else {
    // 使用默认模板创建第一个账套
    const defaultLedger = createLedgerFromTemplate(
      'personal',
      '我的账本',
      '默认账套，包含常用的收支分类和基础数据'
    )
    ledgers.value = [defaultLedger]
    localStorage.setItem('ledgers', JSON.stringify(ledgers.value))
  }
  
  if (savedCurrentLedgerId) {
    currentLedgerId.value = savedCurrentLedgerId
  } else if (ledgers.value.length > 0) {
    currentLedgerId.value = ledgers.value[0].id
    localStorage.setItem('currentLedgerId', currentLedgerId.value)
  }
})
</script>
