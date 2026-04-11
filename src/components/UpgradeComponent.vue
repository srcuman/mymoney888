<template>
  <div class="upgrade-component">
    <div v-if="showUpgradeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">应用升级</h2>
        
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        
        <div v-else-if="hasUpdate" class="space-y-4">
          <p class="text-gray-700 dark:text-gray-300">
            发现新版本：<span class="font-semibold">{{ latestVersion }}</span>
          </p>
          <p class="text-gray-700 dark:text-gray-300">
            当前版本：<span class="font-semibold">{{ currentVersion }}</span>
          </p>
          <div class="space-y-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">升级过程：</p>
            <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>备份当前代码</li>
              <li>拉取最新代码</li>
              <li>更新依赖</li>
              <li>构建项目</li>
              <li>重启容器</li>
            </ul>
          </div>
          <div class="pt-4 flex justify-end space-x-3">
            <button @click="showUpgradeModal = false" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              取消
            </button>
            <button @click="startUpgrade" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              开始升级
            </button>
          </div>
        </div>
        
        <div v-else-if="upgradeSuccess" class="space-y-4">
          <div class="flex justify-center">
            <div class="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
              <svg class="h-12 w-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white text-center">升级成功！</h3>
          <p class="text-gray-700 dark:text-gray-300 text-center">
            应用已成功升级到版本 {{ latestVersion }}
          </p>
          <div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">需要重启容器</h3>
                <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>请执行以下命令重启容器：</p>
                  <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">docker restart &lt;容器名&gt;</code>
                </div>
              </div>
            </div>
          </div>
          <div class="pt-4 flex justify-center">
            <button @click="showUpgradeModal = false" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              关闭
            </button>
          </div>
        </div>
        
        <div v-else-if="upgradeError" class="space-y-4">
          <div class="flex justify-center">
            <div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
              <svg class="h-12 w-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white text-center">升级失败</h3>
          <p class="text-gray-700 dark:text-gray-300 text-center">
            {{ upgradeError }}
          </p>
          <div class="pt-4 flex justify-center">
            <button @click="showUpgradeModal = false" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              关闭
            </button>
          </div>
        </div>
        
        <div v-else class="space-y-4">
          <p class="text-gray-700 dark:text-gray-300 text-center">
            当前已是最新版本
          </p>
          <div class="pt-4 flex justify-center">
            <button @click="showUpgradeModal = false" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import upgradeService from '../services/upgrade-service'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show'])

const showUpgradeModal = ref(props.show)
const loading = ref(false)
const hasUpdate = ref(false)
const currentVersion = ref('')
const latestVersion = ref('')
const upgradeSuccess = ref(false)
const upgradeError = ref('')

// 监听show属性变化
watch(() => props.show, (newValue) => {
  showUpgradeModal.value = newValue
  if (newValue) {
    checkForUpdates()
  }
})

// 检查更新
const checkForUpdates = async () => {
  loading.value = true
  try {
    const result = await upgradeService.checkForUpdates()
    currentVersion.value = result.currentVersion
    latestVersion.value = result.latestVersion
    hasUpdate.value = result.hasUpdate
  } catch (error) {
    console.error('检查更新失败:', error)
  } finally {
    loading.value = false
  }
}

// 开始升级
const startUpgrade = async () => {
  loading.value = true
  upgradeSuccess.value = false
  upgradeError.value = ''
  
  try {
    // 这里需要调用后端API执行升级
    // 由于我们在Docker容器中，需要通过执行脚本的方式
    const result = await fetch('/api/upgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await result.json()
    
    if (data.success) {
      upgradeSuccess.value = true
    } else {
      upgradeError.value = data.message || '升级失败'
    }
  } catch (error) {
    console.error('执行升级失败:', error)
    upgradeError.value = error.message || '升级失败'
  } finally {
    loading.value = false
  }
}

// 关闭模态框
const closeModal = () => {
  showUpgradeModal.value = false
  emit('update:show', false)
}

// 当模态框关闭时重置状态
watch(showUpgradeModal, (newValue) => {
  if (!newValue) {
    resetState()
  }
})

// 重置状态
const resetState = () => {
  loading.value = false
  hasUpdate.value = false
  currentVersion.value = ''
  latestVersion.value = ''
  upgradeSuccess.value = false
  upgradeError.value = ''
}
</script>

<style scoped>
.upgrade-component {
  position: relative;
}
</style>
