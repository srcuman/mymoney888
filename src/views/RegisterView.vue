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
          <label for="name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">姓名</label>
          <input 
            type="text" 
            id="name" 
            v-model="name" 
            required 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          >
        </div>
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
        <div class="flex items-center">
          <input 
            id="terms" 
            type="checkbox" 
            v-model="terms"
            required
            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500"
          >
          <label for="terms" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            我已阅读并同意
            <a href="#" class="text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">用户注册协议</a>和
            <a href="#" class="text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">个人信息保护政策</a>
          </label>
        </div>
        <div>
          <button 
            type="submit" 
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            注册
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

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const terms = ref(false)

const handleRegister = () => {
  if (password.value !== confirmPassword.value) {
    alert('密码确认不一致')
    return
  }
  // 简单的注册逻辑，实际项目中应该调用API
  const user = {
    name: name.value,
    email: email.value
  }
  localStorage.setItem('user', JSON.stringify(user))
  router.push('/')
}
</script>