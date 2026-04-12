
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
    <!-- 左侧边栏导航 -->
    <aside v-if="isAuthenticated" class="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <router-link to="/" class="text-xl font-bold text-primary dark:text-blue-400 flex items-center">
          <span class="mr-2">💰</span>
          MyMoney888
        </router-link>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">v{{ APP_VERSION }}</p>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        <router-link to="/" :class="isActive('/')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">📝</span>
          记账
        </router-link>
        <router-link to="/assets" :class="isActive('/assets')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">💎</span>
          资产
        </router-link>
        <router-link to="/accounts" :class="isActive('/accounts')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">🏦</span>
          账户管理
        </router-link>
        <router-link to="/statistics" :class="isActive('/statistics')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">📊</span>
          统计分析
        </router-link>
        <router-link to="/credit-cards" :class="isActive('/credit-cards')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">💳</span>
          信用卡
        </router-link>
        <router-link to="/loans" :class="isActive('/loans')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">📈</span>
          贷款
        </router-link>
        <router-link to="/import-export" :class="isActive('/import-export')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">📤</span>
          数据管理
        </router-link>
        <router-link to="/ledger-management" :class="isActive('/ledger-management')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">📚</span>
          账套管理
        </router-link>
        <router-link to="/dimension-management" :class="isActive('/dimension-management')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">🏷️</span>
          维度管理
        </router-link>
        <router-link v-if="isAdmin" to="/user-management" :class="isActive('/user-management')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">👥</span>
          用户管理
        </router-link>
        <router-link to="/investments" :class="isActive('/investments')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">📊</span>
          投资管理
        </router-link>
        <router-link to="/annual-review" :class="isActive('/annual-review')" class="flex items-center px-3 py-2 rounded-md text-sm font-medium">
          <span class="mr-3">📅</span>
          年度回顾
        </router-link>
      </nav>
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <button @click="logout" class="w-full flex items-center justify-center px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium">
          <span class="mr-2">🚪</span>
          退出登录
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部栏 -->
      <header v-if="isAuthenticated" class="bg-white dark:bg-gray-800 shadow-sm">
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{{ currentPageTitle }}</h1>
          <div class="flex items-center space-x-4">
            <!-- 账套切换 -->
            <div class="relative">
              <button @click="showLedgerDropdown = !showLedgerDropdown" class="flex items-center px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium">
                {{ currentLedgerName }}
                <span class="ml-2">▼</span>
              </button>
              <div v-if="showLedgerDropdown" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50">
                <div v-for="ledger in ledgers" :key="ledger.id" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="switchToLedger(ledger.id); showLedgerDropdown = false">
                  <span :class="currentLedgerId === ledger.id ? 'font-bold text-primary' : ''">{{ ledger.name }}</span>
                  <span v-if="currentLedgerId === ledger.id" class="ml-2 text-xs text-primary">当前</span>
                </div>
                <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="$router.push('/ledger-management'); showLedgerDropdown = false">
                  <span class="text-primary">管理账套</span>
                </div>
              </div>
            </div>
            <!-- 快速记账按钮 -->
            <button @click="showQuickAddModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
              <span class="mr-2">➕</span>
              快速记账
            </button>
            <!-- 当前版本 -->
            <span class="text-sm text-gray-600 dark:text-gray-400">v3.8.0</span>
          </div>
        </div>
      </header>

      <!-- 主要内容 -->
      <main class="flex-1 container mx-auto px-4 py-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 快速记账弹窗 -->
    <div v-if="showQuickAddModal && isAuthenticated" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ quickAddTitle }}</h3>
          <button @click="closeQuickAddModal" class="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
            <span class="text-xl">×</span>
          </button>
        </div>
        <QuickAddComponent :initialData="quickAddInitialData" @close="closeQuickAddModal" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, provide, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import QuickAddComponent from './core/components/QuickAddComponent.vue'
import { APP_VERSION } from './config/version.js'

const router = useRouter()
const route = useRoute()
const isAuthenticated = ref(false)
const showQuickAddModal = ref(false)
const quickAddInitialData = ref(null)
const quickAddTitle = ref('快速记账')

// 账套相关状态
const ledgers = ref([])
const currentLedgerId = ref(null)
const showLedgerDropdown = ref(false)

// 关闭快速记账弹窗并重置数据
const closeQuickAddModal = () => {
  showQuickAddModal.value = false
  quickAddInitialData.value = null
  quickAddTitle.value = '快速记账'
}

// 打开快速记账弹窗
const openQuickAddModal = (data = null, title = '快速记账') => {
  quickAddInitialData.value = data
  quickAddTitle.value = title
  showQuickAddModal.value = true
}

const checkAuth = () => {
  const user = localStorage.getItem('user')
  isAuthenticated.value = !!user
  return isAuthenticated.value
}

provide('checkAuth', checkAuth)

// 页面标题
const currentPageTitle = computed(() => {
  const pageTitles = {
    '/': '记账',
    '/assets': '资产概览',
    '/accounts': '账户管理',
    '/statistics': '统计分析',
    '/credit-cards': '信用卡管理',
    '/loans': '贷款管理',
    '/import-export': '数据管理',
    '/ledger-management': '账套管理',
    '/dimension-management': '维度管理',
    '/user-management': '用户管理',
    '/investments': '投资管理',
    '/annual-review': '年度回顾'
  }
  return pageTitles[route.path] || 'MyMoney888'
})

// 检查路由是否激活
const isActive = (path) => {
  return route.path === path 
    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400' 
    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
}

// 当前用户
const currentUser = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

// 检查是否是管理员
const isAdmin = computed(() => {
  return currentUser.value && currentUser.value.role === 'admin'
})

// 计算当前账套名称
const currentLedgerName = computed(() => {
  const currentLedger = ledgers.value.find(ledger => ledger.id === currentLedgerId.value)
  return currentLedger ? currentLedger.name : '默认账套'
})

// 切换账套
const switchToLedger = (ledgerId) => {
  currentLedgerId.value = ledgerId
  localStorage.setItem('currentLedgerId', ledgerId)
  // 触发事件通知其他组件
  window.dispatchEvent(new CustomEvent('ledgerChanged', { detail: { ledgerId } }))
}

// 加载账套数据
const loadLedgers = () => {
  const savedLedgers = localStorage.getItem('ledgers')
  const savedCurrentLedgerId = localStorage.getItem('currentLedgerId')
  
  if (savedLedgers) {
    ledgers.value = JSON.parse(savedLedgers)
  } else {
    // 默认创建一个账套
    const defaultLedger = {
      id: '1',
      name: '默认账套',
      description: '系统默认账套',
      createdAt: new Date().toLocaleString()
    }
    ledgers.value = [defaultLedger]
    localStorage.setItem('ledgers', JSON.stringify(ledgers.value))
  }
  
  if (savedCurrentLedgerId) {
    currentLedgerId.value = savedCurrentLedgerId
  } else if (ledgers.value.length > 0) {
    currentLedgerId.value = ledgers.value[0].id
    localStorage.setItem('currentLedgerId', currentLedgerId.value)
  }
}

onMounted(() => {
  checkAuth()
  loadLedgers()
  
  // 监听路由变化，检查登录状态
  router.afterEach(() => {
    checkAuth()
  })
  
  // 监听账套变化，更新当前账套信息
  window.addEventListener('ledgerChanged', (event) => {
    const { ledgerId } = event.detail
    currentLedgerId.value = ledgerId
  })
  
  // 监听打开快速记账弹窗事件（来自HomeView的编辑/复制功能）
  window.addEventListener('openQuickAdd', (event) => {
    const { data, title } = event.detail || {}
    openQuickAddModal(data, title || '快速记账')
  })
})

const logout = () => {
  localStorage.removeItem('user')
  isAuthenticated.value = false
  router.push('/login')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
