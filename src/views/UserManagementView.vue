<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">用户管理</h2>
        <button @click="showAddUserModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
          添加用户
        </button>
      </div>
      
      <div class="space-y-4">
        <div v-for="user in users" :key="user.username" class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-4">
              <span class="text-primary dark:text-blue-400 font-bold text-lg">{{ user.name.charAt(0) }}</span>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ user.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.username }} - {{ user.role || '普通用户' }}</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button @click="editUser(user)" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
              编辑
            </button>
            <button @click="deleteUser(user.username)" class="px-3 py-1 bg-danger hover:bg-red-600 text-white rounded-md text-sm font-medium">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑用户模态框 -->
    <div v-if="showAddUserModal || showEditUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ showEditUserModal ? '编辑用户' : '添加用户' }}</h3>
        <form @submit.prevent="saveUser" class="space-y-4">
          <div>
            <label for="user-username" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">用户名</label>
            <input type="text" id="user-username" v-model="formData.username" :disabled="showEditUserModal" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="user-name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">姓名</label>
            <input type="text" id="user-name" v-model="formData.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label for="user-role" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">角色</label>
            <select id="user-role" v-model="formData.role" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showAddUserModal = false; showEditUserModal = false; resetForm()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 当前用户
const currentUser = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

// 检查是否是管理员
const isAdmin = computed(() => {
  return currentUser.value && currentUser.value.role === 'admin'
})

// 用户列表
const users = ref([])

// 模态框状态
const showAddUserModal = ref(false)
const showEditUserModal = ref(false)

// 表单数据
const formData = ref({
  username: '',
  name: '',
  role: 'user'
})

// 重置表单
const resetForm = () => {
  formData.value = {
    username: '',
    name: '',
    role: 'user'
  }
}

// 编辑用户
const editUser = (user) => {
  formData.value = { ...user }
  showEditUserModal.value = true
  showAddUserModal.value = false
}

// 保存用户
const saveUser = () => {
  if (showEditUserModal.value) {
    // 更新现有用户
    const index = users.value.findIndex(u => u.username === formData.value.username)
    if (index !== -1) {
      users.value[index] = { ...formData.value }
    }
  } else {
    // 添加新用户
    const newUser = {
      username: formData.value.username,
      name: formData.value.name,
      role: formData.value.role
    }
    users.value.push(newUser)
  }
  
  // 保存到本地存储
  localStorage.setItem('users', JSON.stringify(users.value))
  
  // 关闭模态框并重置表单
  showAddUserModal.value = false
  showEditUserModal.value = false
  resetForm()
}

// 删除用户
const deleteUser = (username) => {
  if (confirm('确定要删除此用户吗？')) {
    users.value = users.value.filter(u => u.username !== username)
    // 保存到本地存储
    localStorage.setItem('users', JSON.stringify(users.value))
  }
}

onMounted(() => {
  // 从本地存储加载数据
  const savedUsers = localStorage.getItem('users')
  if (savedUsers) {
    users.value = JSON.parse(savedUsers)
  }
  
  // 检查当前用户是否是管理员
  if (!isAdmin.value) {
    // 检查是否有用户数据
    if (users.value.length === 0) {
      // 没有用户时，允许访问用户管理页面进行初始设置
      return
    }
    router.push('/')
    return
  }
})
</script>