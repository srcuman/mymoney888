<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">登录</h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          欢迎使用个人记账软件
        </p>
      </div>
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <div>
          <label for="email" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          >
        </div>
        <div>
          <label for="password" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          >
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input 
              id="remember-me" 
              type="checkbox" 
              v-model="rememberMe"
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500"
            >
            <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              自动登录
            </label>
          </div>
          <div class="text-sm">
            <a href="#" class="font-medium text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              忘记密码？
            </a>
          </div>
        </div>
        <div>
          <button 
            type="submit" 
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            登录
          </button>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            还没有账号？
            <router-link to="/register" class="font-medium text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              立即注册
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const rememberMe = ref(false)

const handleLogin = () => {
  // 简单的登录逻辑，实际项目中应该调用API
  const user = {
    email: email.value,
    name: '用户'
  }
  localStorage.setItem('user', JSON.stringify(user))
  router.push('/')
}
</script>