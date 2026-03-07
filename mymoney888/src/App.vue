<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <nav v-if="isAuthenticated" class="bg-white dark:bg-gray-800 shadow-md">
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-xl font-bold text-primary dark:text-blue-400">
              个人记账
            </router-link>
            <div class="hidden md:flex space-x-6">
              <router-link to="/" class="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-blue-400">
                记账
              </router-link>
              <router-link to="/assets" class="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-blue-400">
                资产
              </router-link>
              <router-link to="/accounts" class="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-blue-400">
                账户管理
              </router-link>
              <router-link to="/statistics" class="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-blue-400">
                统计分析
              </router-link>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600 dark:text-gray-300">{{ currentUser?.username }}</span>
            <button @click="logout" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium">
              退出登录
            </button>
          </div>
        </div>
      </div>
    </nav>
    <main class="container mx-auto px-4 py-8">
      <router-view v-if="isAuthenticated" />
      <router-view v-else v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from './api'

const router = useRouter()
const isAuthenticated = ref(false)
const currentUser = ref(null)

onMounted(() => {
  const user = auth.getCurrentUser()
  currentUser.value = user
  isAuthenticated.value = !!user
})

const logout = () => {
  auth.logout()
  isAuthenticated.value = false
  currentUser.value = null
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