<template>
  <div class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h1 class="text-2xl font-bold mb-6 text-center text-primary dark:text-blue-400">数据管理</h1>
    
    <div class="space-y-6">
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">数据导出</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">将所有交易记录导出为CSV格式，方便备份和分析。</p>
        <button @click="exportToCSV" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
          导出CSV
        </button>
      </div>
      
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">数据导入</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">支持导入支付宝、微信账单和通用CSV格式数据。</p>
        <div class="space-y-4">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">选择文件</label>
            <input type="file" @change="handleFileUpload" accept=".csv" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <button @click="importFromCSV" :disabled="!selectedFile" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
            导入CSV
          </button>
        </div>
      </div>
      
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">数据备份与恢复</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">备份所有数据到本地文件，或从本地文件恢复数据。</p>
        <div class="flex space-x-4">
          <button @click="backupData" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
            备份数据
          </button>
          <button @click="restoreData" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
            恢复数据
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import coreDataStore from '../../services/core-data-store.js'
import mysqlSyncService from '../../services/mysql-sync-service.js'

// 选中的文件
const selectedFile = ref(null)

// 处理文件上传
const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0]
}

// 导出为CSV
const exportToCSV = () => {
  // 从本地存储获取交易记录
  const transactions = coreDataStore.getRaw('transactions')
  
  if (transactions.length === 0) {
    alert('没有交易记录可以导出')
    return
  }
  
  // CSV标题行
  const headers = ['ID', '类型', '金额', '分类', '账户', '描述', '日期']
  
  // CSV内容
  const csvContent = [
    headers.join(','),
    ...transactions.map(t => [
      t.id,
      t.type === 'expense' ? '支出' : t.type === 'income' ? '收入' : '转账',
      t.amount,
      t.category || '',
      t.account || '',
      t.description || '',
      t.date
    ].join(','))
  ].join('\n')
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  alert('导出成功')
}

// 导入CSV
const importFromCSV = () => {
  if (!selectedFile.value) {
    alert('请选择要导入的CSV文件')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const csvContent = e.target.result
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',')
    
    const transactions = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue
      
      const values = lines[i].split(',')
      const transaction = {
        id: parseInt(values[0]) || Date.now() + i,
        type: values[1] === '支出' ? 'expense' : values[1] === '收入' ? 'income' : 'transfer',
        amount: parseFloat(values[2]),
        category: values[3] || '',
        account: values[4] || '',
        description: values[5] || '',
        date: values[6]
      }
      transactions.push(transaction)
    }
    
    // 保存到本地存储
    const existingTransactions = coreDataStore.getRaw('transactions')
    const updatedTransactions = [...existingTransactions, ...transactions]
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions))
    
    alert('导入成功')
    selectedFile.value = null
  }
  reader.readAsText(selectedFile.value)
}

// 备份数据
const backupData = () => {
  const data = {
    transactions: coreDataStore.getRaw('transactions'),
    accounts: coreDataStore.getRaw('accounts'),
    dimensions: coreDataStore.getDimensions(),
    accountSets: JSON.parse(localStorage.getItem('accountSets') || '[]'),
    users: JSON.parse(localStorage.getItem('users') || '[]')
  }
  
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `backup_${new Date().toISOString().split('T')[0]}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  alert('备份成功')
}

// 恢复数据
const restoreData = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        // 恢复数据到本地存储
        if (data.transactions) localStorage.setItem('transactions', JSON.stringify(data.transactions))
        if (data.accounts) localStorage.setItem('accounts', JSON.stringify(data.accounts))
        if (data.dimensions) localStorage.setItem('dimensions', JSON.stringify(data.dimensions))
        if (data.accountSets) localStorage.setItem('accountSets', JSON.stringify(data.accountSets))
        if (data.users) localStorage.setItem('users', JSON.stringify(data.users))
        
        alert('恢复成功，请刷新页面')
      } catch (error) {
        alert('恢复失败：无效的备份文件')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}
</script>

<style scoped>
/* 样式 */
</style>