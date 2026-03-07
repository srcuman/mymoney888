<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">注册</h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          创建您的个人记账账户
        </p>
      </div>
      <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
        <div>
          <label for="username" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            required 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          >
        </div>
        <div>
          <label for="email" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">邮箱（可选）</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
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
            minlength="6"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          >
        </div>
        <div>
          <label for="confirm-password" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">确认密码</label>
          <input 
            type="password" 
            id="confirm-password" 
            v-model="confirmPassword" 
            required 
            minlength="6"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          >
        </div>
        <div>
          <label for="admin-code" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">管理员注册码（选填）</label>
          <input 
            type="text" 
            id="admin-code" 
            v-model="adminCode" 
            placeholder="如需管理员权限请填写"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          >
        </div>
        <div v-if="error" class="text-red-600 text-sm text-center">
          {{ error }}
        </div>
        <div>
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            已有账号？
            <router-link to="/login" class="font-medium text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              立即登录
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
import { auth } from '../api'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const adminCode = ref('')
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = '密码确认不一致'
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    await auth.register({
      username: username.value,
      email: email.value || null,
      password: password.value,
      adminCode: adminCode.value || null
    })
    alert('注册成功，请登录')
    router.push('/login')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>