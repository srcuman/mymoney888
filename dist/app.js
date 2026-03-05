const { createApp, ref, computed, onMounted, nextTick } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// 版本控制
const APP_VERSION = '1.3.0';
const GITHUB_REPO = 'https://api.github.com/repos/srcuman/mymoney888/releases/latest';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/srcuman/mymoney888/main';

// 检查版本更新
const checkForUpdates = async () => {
  try {
    const response = await fetch(GITHUB_REPO);
    if (response.ok) {
      const data = await response.json();
      const latestVersion = data.tag_name.replace('v', '');
      if (compareVersions(latestVersion, APP_VERSION) > 0) {
        return {
          hasUpdate: true,
          version: latestVersion,
          url: data.html_url,
          releaseNotes: data.body || '暂无更新说明',
          publishDate: data.published_at
        };
      }
    }
  } catch (error) {
    console.log('版本检查失败:', error);
  }
  return { hasUpdate: false };
};

// 下载并更新应用文件
const downloadUpdate = async (version) => {
  try {
    const appJsUrl = `${GITHUB_RAW_URL}/dist/app.js`;
    const response = await fetch(appJsUrl);
    if (response.ok) {
      const newCode = await response.text();
      localStorage.setItem('pendingUpdate', JSON.stringify({
        version: version,
        code: newCode,
        timestamp: Date.now()
      }));
      return { success: true };
    }
  } catch (error) {
    console.log('下载更新失败:', error);
    return { success: false, error: error.message };
  }
};

// 应用更新
const applyUpdate = () => {
  const pendingUpdate = localStorage.getItem('pendingUpdate');
  if (pendingUpdate) {
    localStorage.setItem('applyUpdateFlag', 'true');
    window.location.reload();
  }
};

// 检查是否需要应用更新
const checkAndApplyUpdate = () => {
  const applyFlag = localStorage.getItem('applyUpdateFlag');
  if (applyFlag === 'true') {
    localStorage.removeItem('applyUpdateFlag');
    console.log('正在应用更新...');
  }
};

// 版本比较函数
const compareVersions = (v1, v2) => {
  const arr1 = v1.split('.');
  const arr2 = v2.split('.');
  for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
    const num1 = parseInt(arr1[i] || 0);
    const num2 = parseInt(arr2[i] || 0);
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

// 全局账套管理
const getCurrentBookId = () => localStorage.getItem('currentBookId') || 'default';
const getBookKey = (key) => `${key}_${getCurrentBookId()}`;

// 登录页面
const LoginView = {
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-xl">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">登录</h2>
          <p class="mt-2 text-sm text-gray-600">欢迎使用个人记账软件</p>
        </div>
        <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">用户名</label>
            <input type="text" v-model="username" required 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">密码</label>
            <input type="password" v-model="password" required 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
          </div>
          <button type="submit" 
            class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md">
            登录
          </button>
          <div class="text-center">
            <p class="text-sm text-gray-600">
              还没有账号？
              <router-link to="/register" class="font-medium text-primary hover:text-blue-700">立即注册</router-link>
            </p>
          </div>
        </form>
      </div>
    </div>
  `,
  setup() {
    const username = ref('');
    const password = ref('');
    
    const handleLogin = () => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.username === username.value && u.password === password.value);
      
      if (!user) {
        alert('用户名或密码错误');
        return;
      }
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      window.location.hash = '/';
    };
    
    return { username, password, handleLogin };
  }
};

// 注册页面
const RegisterView = {
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-xl">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">注册</h2>
          <p class="mt-2 text-sm text-gray-600">创建您的个人记账账户</p>
        </div>
        <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">用户名</label>
            <input type="text" v-model="username" required 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">密码</label>
            <input type="password" v-model="password" required 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">确认密码</label>
            <input type="password" v-model="confirmPassword" required 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
          </div>
          <div v-if="!hasAdmin">
            <label class="block mb-2 text-sm font-medium text-gray-700">管理员注册码</label>
            <input type="text" v-model="adminCode" placeholder="输入管理员注册码注册为管理员" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
            <div class="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-800 font-medium"><i class="fas fa-info-circle mr-1"></i>管理员注册说明</p>
              <p class="text-xs text-blue-600 mt-1">首次注册需要输入管理员注册码。管理员注册码：<span class="font-bold">admin123</span></p>
            </div>
          </div>
          <button type="submit" 
            class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md">
            {{ hasAdmin ? '注册' : '注册为管理员' }}
          </button>
          <div class="text-center">
            <p class="text-sm text-gray-600">
              已有账号？
              <router-link to="/login" class="font-medium text-primary hover:text-blue-700">立即登录</router-link>
            </p>
          </div>
        </form>
      </div>
    </div>
  `,
  setup() {
    const username = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const adminCode = ref('');
    const hasAdmin = ref(false);
    
    const checkAdminExists = () => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      hasAdmin.value = users.some(u => u.isAdmin);
    };
    
    checkAdminExists();
    
    const handleRegister = () => {
      if (password.value !== confirmPassword.value) {
        alert('密码确认不一致');
        return;
      }
      
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (users.find(u => u.username === username.value)) {
        alert('用户名已存在');
        return;
      }
      
      if (hasAdmin.value) {
        const user = { 
          id: Date.now(),
          username: username.value, 
          password: password.value,
          name: username.value,
          isAdmin: false,
          createdAt: new Date().toISOString()
        };
        
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        window.location.hash = '/';
      } else {
        if (adminCode.value !== 'admin123') {
          alert('管理员注册码错误');
          return;
        }
        
        const user = { 
          id: Date.now(),
          username: username.value, 
          password: password.value,
          name: username.value,
          isAdmin: true,
          createdAt: new Date().toISOString()
        };
        
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        window.location.hash = '/';
      }
    };
    
    return { username, password, confirmPassword, adminCode, hasAdmin, handleRegister };
  }
};