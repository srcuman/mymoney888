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
    // 下载最新的app.js
    const appJsUrl = `${GITHUB_RAW_URL}/dist/app.js`;
    const response = await fetch(appJsUrl);
    if (response.ok) {
      const newCode = await response.text();
      // 存储新版本代码到localStorage
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
    // 设置标记表示需要应用更新
    localStorage.setItem('applyUpdateFlag', 'true');
    // 刷新页面以应用更新
    window.location.reload();
  }
};

// 检查是否需要应用更新（页面加载时调用）
const checkAndApplyUpdate = () => {
  const applyFlag = localStorage.getItem('applyUpdateFlag');
  if (applyFlag === 'true') {
    localStorage.removeItem('applyUpdateFlag');
    // 页面已经刷新，更新会在index.html中自动应用
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
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">登录</h2>
          <p class="mt-2 text-sm text-gray-600">欢迎使用个人记账软件</p>
        </div>
        <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">用户名</label>
            <input type="text" v-model="username" required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">密码</label>
            <input type="password" v-model="password" required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
          </div>
          <button type="submit" 
            class="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
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
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">注册</h2>
          <p class="mt-2 text-sm text-gray-600">创建您的个人记账账户</p>
        </div>
        <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">用户名</label>
            <input type="text" v-model="username" required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">密码</label>
            <input type="password" v-model="password" required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">确认密码</label>
            <input type="password" v-model="confirmPassword" required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
          </div>
          <div v-if="!hasAdmin">
            <label class="block mb-2 text-sm font-medium text-gray-700">管理员注册码</label>
            <input type="text" v-model="adminCode" placeholder="输入管理员注册码注册为管理员" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p class="text-sm text-blue-800 font-medium">管理员注册说明</p>
              <p class="text-xs text-blue-600 mt-1">首次注册需要输入管理员注册码。管理员注册码：<span class="font-bold">admin123</span></p>
            </div>
          </div>
          <button type="submit" 
            class="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
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
    
    // 检查是否已有管理员
    const checkAdminExists = () => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      hasAdmin.value = users.some(u => u.isAdmin);
    };
    
    // 初始化时检查
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
      
      // 如果已有管理员，不允许再注册管理员
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
        // 没有管理员，验证管理员注册码
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

// 多级分类数据 - 支出分类
const defaultExpenseCategories = [
  {
    id: 1, name: '餐饮', type: 'expense', children: [
      { id: 11, name: '早餐', type: 'expense' },
      { id: 12, name: '午餐', type: 'expense' },
      { id: 13, name: '晚餐', type: 'expense' },
      { id: 14, name: '零食饮料', type: 'expense' }
    ]
  },
  {
    id: 2, name: '交通', type: 'expense', children: [
      { id: 21, name: '公交地铁', type: 'expense' },
      { id: 22, name: '打车', type: 'expense' },
      { id: 23, name: '加油', type: 'expense' },
      { id: 24, name: '停车', type: 'expense' }
    ]
  },
  {
    id: 3, name: '购物', type: 'expense', children: [
      { id: 31, name: '服装', type: 'expense' },
      { id: 32, name: '日用', type: 'expense' },
      { id: 33, name: '电子产品', type: 'expense' }
    ]
  },
  {
    id: 4, name: '娱乐', type: 'expense', children: [
      { id: 41, name: '电影', type: 'expense' },
      { id: 42, name: '游戏', type: 'expense' },
      { id: 43, name: '旅游', type: 'expense' }
    ]
  },
  {
    id: 5, name: '居住', type: 'expense', children: [
      { id: 51, name: '房租', type: 'expense' },
      { id: 52, name: '水电煤', type: 'expense' },
      { id: 53, name: '物业', type: 'expense' }
    ]
  },
  {
    id: 6, name: '医疗', type: 'expense', children: [
      { id: 61, name: '药品', type: 'expense' },
      { id: 62, name: '诊疗', type: 'expense' }
    ]
  },
  {
    id: 7, name: '教育', type: 'expense', children: [
      { id: 71, name: '书籍', type: 'expense' },
      { id: 72, name: '培训', type: 'expense' }
    ]
  }
];

// 多级分类数据 - 收入分类（支持更详细的层级）
const defaultIncomeCategories = [
  {
    id: 101, name: '工资收入', type: 'income', children: [
      { id: 111, name: '基本工资', type: 'income' },
      { id: 112, name: '绩效工资', type: 'income' },
      { id: 113, name: '加班费', type: 'income' },
      { id: 114, name: '补贴', type: 'income' }
    ]
  },
  {
    id: 102, name: '奖金收入', type: 'income', children: [
      { id: 121, name: '年终奖', type: 'income' },
      { id: 122, name: '季度奖', type: 'income' },
      { id: 123, name: '项目奖', type: 'income' },
      { id: 124, name: '其他奖励', type: 'income' }
    ]
  },
  {
    id: 103, name: '投资收入', type: 'income', children: [
      { id: 131, name: '股票收益', type: 'income' },
      { id: 132, name: '基金收益', type: 'income' },
      { id: 133, name: '理财收益', type: 'income' },
      { id: 134, name: '存款利息', type: 'income' },
      { id: 135, name: '房租收入', type: 'income' }
    ]
  },
  {
    id: 104, name: '兼职收入', type: 'income', children: [
      { id: 141, name: '兼职工资', type: 'income' },
      { id: 142, name: '稿费', type: 'income' },
      { id: 143, name: '设计费', type: 'income' },
      { id: 144, name: '咨询费', type: 'income' }
    ]
  },
  {
    id: 105, name: '其他收入', type: 'income', children: [
      { id: 151, name: '红包', type: 'income' },
      { id: 152, name: '退款', type: 'income' },
      { id: 153, name: '二手出售', type: 'income' },
      { id: 154, name: '其他', type: 'income' }
    ]
  }
];

// 合并分类用于兼容旧数据
const defaultCategories = [...defaultExpenseCategories, ...defaultIncomeCategories];

// 账户类型定义
const accountTypes = [
  { id: 'cash', name: '现金', icon: 'fa-money-bill' },
  { id: 'bank', name: '银行卡', icon: 'fa-credit-card' },
  { id: 'alipay', name: '支付宝', icon: 'fa-alipay' },
  { id: 'wechat', name: '微信', icon: 'fa-weixin' },
  { id: 'investment', name: '投资账户', icon: 'fa-chart-line' },
  { id: 'debt', name: '负债账户', icon: 'fa-hand-holding-usd' }
];

// 主页
const HomeView = {
  template: `
    <div class="space-y-8">
      <!-- 资产概览卡片 -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <h2 class="text-xl font-bold mb-4">资产概览</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <h3 class="text-sm font-medium text-white/80">总资产</h3>
            <p class="text-2xl font-bold mt-1">{{ totalAssets.toFixed(2) }}</p>
          </div>
          <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <h3 class="text-sm font-medium text-white/80">本月收入</h3>
            <p class="text-2xl font-bold mt-1 text-green-300">+{{ monthlyIncome.toFixed(2) }}</p>
          </div>
          <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <h3 class="text-sm font-medium text-white/80">本月支出</h3>
            <p class="text-2xl font-bold mt-1 text-red-300">-{{ monthlyExpense.toFixed(2) }}</p>
          </div>
          <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <h3 class="text-sm font-medium text-white/80">本月结余</h3>
            <p class="text-2xl font-bold mt-1" :class="monthlyBalance >= 0 ? 'text-green-300' : 'text-red-300'">
              {{ monthlyBalance >= 0 ? '+' : '' }}{{ monthlyBalance.toFixed(2) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 快速记账卡片 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-plus-circle text-primary mr-2"></i>
          快速记账
        </h2>
        <form @submit.prevent="addTransaction" class="space-y-4">
          <!-- 第一行：类型和金额 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">类型</label>
              <div class="flex space-x-2">
                <button type="button" @click="transactionType = 'expense'" 
                  :class="transactionType === 'expense' ? 'bg-danger text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'" 
                  class="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200">
                  <i class="fas fa-minus-circle mr-1"></i> 支出
                </button>
                <button type="button" @click="transactionType = 'income'" 
                  :class="transactionType === 'income' ? 'bg-secondary text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'" 
                  class="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200">
                  <i class="fas fa-plus-circle mr-1"></i> 收入
                </button>
                <button type="button" @click="transactionType = 'transfer'" 
                  :class="transactionType === 'transfer' ? 'bg-purple-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'" 
                  class="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200">
                  <i class="fas fa-exchange-alt mr-1"></i> 转账
                </button>
              </div>
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">金额</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 font-medium">¥</span>
                </div>
                <input type="text" v-model="amountInput" @blur="calculateAmount" @keyup.enter="calculateAmount" required 
                  placeholder="支持计算，如：100+50"
                  class="w-full pl-8 pr-20 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                <button v-if="calculatedAmount !== null" @click="applyCalculatedAmount" type="button"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-secondary text-white text-sm rounded-lg hover:bg-green-600 transition-all shadow-sm">
                  使用 {{ calculatedAmount.toFixed(2) }}
                </button>
              </div>
              <p v-if="calcError" class="text-xs text-danger mt-1 flex items-center">
                <i class="fas fa-exclamation-triangle mr-1"></i> {{ calcError }}
              </p>
            </div>
          </div>

          <!-- 第二行：分类选择 -->
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">分类</label>
            <select v-model="transaction.categoryId" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
              <option value="">请选择分类</option>
              <optgroup v-for="parent in parentCategories" :key="parent.id" :label="parent.name">
                <option v-for="child in parent.children" :key="child.id" :value="child.id">
                  {{ parent.name }} > {{ child.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- 第三行：账户和商家 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-if="transactionType !== 'transfer'">
              <label class="block mb-2 text-sm font-medium text-gray-700">账户</label>
              <select v-model="transaction.accountId" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                <option value="">请选择账户</option>
                <optgroup v-for="type in accountTypes" :key="type.id" :label="type.name">
                  <option v-for="account in getAccountsByType(type.id)" :key="account.id" :value="account.id">
                    {{ account.name }} ({{ account.balance.toFixed(2) }})
                  </option>
                </optgroup>
              </select>
            </div>
            <div v-if="transactionType === 'transfer'">
              <label class="block mb-2 text-sm font-medium text-gray-700">转出账户</label>
              <select v-model="transaction.fromAccountId" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                <option value="">请选择转出账户</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">
                  {{ account.name }} ({{ account.balance.toFixed(2) }})
                </option>
              </select>
            </div>
            <div v-if="transactionType === 'transfer'">
              <label class="block mb-2 text-sm font-medium text-gray-700">转入账户</label>
              <select v-model="transaction.toAccountId" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                <option value="">请选择转入账户</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">
                  {{ account.name }} ({{ account.balance.toFixed(2) }})
                </option>
              </select>
            </div>
            <div v-if="transactionType !== 'transfer'">
              <label class="block mb-2 text-sm font-medium text-gray-700">商家</label>
              <select v-model="transaction.merchantId" 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                <option value="">请选择商家（可选）</option>
                <option v-for="merchant in merchants" :key="merchant.id" :value="merchant.id">{{ merchant.name }}</option>
              </select>
            </div>
          </div>

          <!-- 第四行：项目和成员 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">项目</label>
              <select v-model="transaction.projectId" 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                <option value="">请选择项目（可选）</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">成员</label>
              <select v-model="transaction.memberId" 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                <option value="">请选择成员（可选）</option>
                <option v-for="member in members" :key="member.id" :value="member.id">{{ member.name }}</option>
              </select>
            </div>
          </div>

          <!-- 备注 -->
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">备注</label>
            <input type="text" v-model="transaction.description" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
          </div>
          
          <!-- 提交按钮 -->
          <button type="submit" class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md transform hover:scale-[1.02]">
            <i class="fas fa-save mr-2"></i> {{ editingTransactionId ? '更新交易' : '保存交易' }}
          </button>
        </form>
      </div>

      <!-- 最近交易卡片 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-history text-primary mr-2"></i>
          最近交易
        </h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商家</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成员</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(t, index) in recentTransactions" :key="index" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ t.date }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span v-if="t.type === 'expense'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <i class="fas fa-minus-circle mr-1"></i> 支出
                  </span>
                  <span v-else-if="t.type === 'income'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i class="fas fa-plus-circle mr-1"></i> 收入
                  </span>
                  <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <i class="fas fa-exchange-alt mr-1"></i> 转账
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <span v-if="t.type === 'transfer'">{{ getAccountName(t.fromAccountId) }} → {{ getAccountName(t.toAccountId) }}</span>
                  <span v-else>{{ getCategoryName(t.categoryId) }}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-bold" :class="t.type === 'expense' ? 'text-danger' : t.type === 'income' ? 'text-secondary' : 'text-purple-600'">
                  {{ t.type === 'expense' ? '-' : t.type === 'income' ? '+' : '' }}{{ t.amount.toFixed(2) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <span v-if="t.type === 'transfer'">{{ getAccountName(t.toAccountId) }}</span>
                  <span v-else>{{ getAccountName(t.accountId) }}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ getMerchantName(t.merchantId) || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ getProjectName(t.projectId) || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ getMemberName(t.memberId) || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <button @click="copyTransaction(t)" class="text-blue-600 hover:text-blue-800 mr-2 transition-colors" title="复制">
                    <i class="fas fa-copy"></i>
                  </button>
                  <button @click="editTransaction(t)" class="text-primary hover:text-blue-800 mr-2 transition-colors" title="修改">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="deleteTransaction(t)" class="text-danger hover:text-red-800 transition-colors" title="删除">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  setup() {
    const transactionType = ref('expense');
    const transaction = ref({ 
      amount: '', 
      categoryId: '', 
      accountId: '', 
      fromAccountId: '',
      toAccountId: '',
      merchantId: '',
      projectId: '',
      memberId: '',
      description: '' 
    });

    // 金额计算器
    const amountInput = ref('');
    const calculatedAmount = ref(null);
    const calcError = ref('');

    const calculateAmount = () => {
      if (!amountInput.value) {
        calculatedAmount.value = null;
        calcError.value = '';
        return;
      }
      
      // 检查是否包含运算符
      const hasOperator = /[\+\-\*\/]/.test(amountInput.value);
      if (!hasOperator) {
        const num = parseFloat(amountInput.value);
        if (!isNaN(num)) {
          transaction.value.amount = num;
        }
        calculatedAmount.value = null;
        calcError.value = '';
        return;
      }
      
      try {
        // 只允许数字和基本运算符
        const sanitized = amountInput.value.replace(/[^0-9+\-*/.()]/g, '');
        if (sanitized !== amountInput.value) {
          calcError.value = '输入包含非法字符';
          calculatedAmount.value = null;
          return;
        }
        
        // 使用Function安全计算
        const result = new Function('return ' + sanitized)();
        if (isNaN(result) || !isFinite(result)) {
          calcError.value = '计算结果无效';
          calculatedAmount.value = null;
        } else if (result < 0) {
          calcError.value = '金额不能为负数';
          calculatedAmount.value = null;
        } else {
          calculatedAmount.value = result;
          calcError.value = '';
        }
      } catch (e) {
        calcError.value = '计算错误，请检查表达式';
        calculatedAmount.value = null;
      }
    };

    const applyCalculatedAmount = () => {
      if (calculatedAmount.value !== null) {
        transaction.value.amount = calculatedAmount.value;
        amountInput.value = calculatedAmount.value.toString();
        calculatedAmount.value = null;
        calcError.value = '';
      }
    };

    // 获取当前账套ID
    const currentBookId = localStorage.getItem('currentBookId') || 'default';
    
    // 获取账套特定的localStorage key
    const getBookKey = (key) => `${key}_${currentBookId}`;
    
    // 从localStorage加载数据（带账套前缀）
    const categories = ref(JSON.parse(localStorage.getItem(getBookKey('categories')) || JSON.stringify(defaultCategories)));
    const accounts = ref(JSON.parse(localStorage.getItem(getBookKey('accounts')) || JSON.stringify([
      { id: 1, name: '现金', type: 'cash', balance: 1000 },
      { id: 2, name: '工商银行', type: 'bank', balance: 5000 },
      { id: 3, name: '支付宝', type: 'alipay', balance: 2000 },
      { id: 4, name: '微信钱包', type: 'wechat', balance: 1500 },
      { id: 5, name: '股票账户', type: 'investment', balance: 10000 },
      { id: 6, name: '信用卡', type: 'debt', balance: -2000 }
    ])));
    const merchants = ref(JSON.parse(localStorage.getItem(getBookKey('merchants')) || JSON.stringify([
      { id: 1, name: '沃尔玛' },
      { id: 2, name: '星巴克' },
      { id: 3, name: '滴滴出行' },
      { id: 4, name: '美团' }
    ])));
    const projects = ref(JSON.parse(localStorage.getItem(getBookKey('projects')) || JSON.stringify([
      { id: 1, name: '家庭开支' },
      { id: 2, name: '工作报销' },
      { id: 3, name: '旅游基金' }
    ])));
    const members = ref(JSON.parse(localStorage.getItem(getBookKey('members')) || JSON.stringify([
      { id: 1, name: '本人' },
      { id: 2, name: '配偶' },
      { id: 3, name: '孩子' },
      { id: 4, name: '父母' }
    ])));

    const transactions = ref(JSON.parse(localStorage.getItem(getBookKey('transactions')) || JSON.stringify([
      { id: 1, type: 'expense', amount: 50, categoryId: 12, accountId: 1, merchantId: 2, projectId: 1, memberId: 1, date: '2026-03-01' },
      { id: 2, type: 'income', amount: 5000, categoryId: 81, accountId: 2, merchantId: '', projectId: 2, memberId: 1, date: '2026-03-01' },
      { id: 3, type: 'expense', amount: 200, categoryId: 32, accountId: 3, merchantId: 1, projectId: 1, memberId: 1, date: '2026-02-29' },
      { id: 4, type: 'expense', amount: 30, categoryId: 22, accountId: 4, merchantId: 3, projectId: '', memberId: 1, date: '2026-02-29' }
    ])));

    // 计算属性：根据类型筛选一级分类
    const parentCategories = computed(() => {
      return categories.value.filter(cat => cat.type === transactionType.value);
    });

    const recentTransactions = computed(() => transactions.value.slice(0, 5));

    const totalAssets = computed(() => accounts.value.reduce((total, account) => total + account.balance, 0));
    const monthlyIncome = computed(() => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return transactions.value.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((total, t) => total + t.amount, 0);
    });
    const monthlyExpense = computed(() => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return transactions.value.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((total, t) => total + t.amount, 0);
    });
    const monthlyBalance = computed(() => monthlyIncome.value - monthlyExpense.value);

    const getAccountsByType = (typeId) => {
      return accounts.value.filter(a => a.type === typeId);
    };

    const getCategoryName = (categoryId) => {
      for (const parent of categories.value) {
        if (parent.id === categoryId) return parent.name;
        const child = parent.children?.find(c => c.id === categoryId);
        if (child) return `${parent.name} > ${child.name}`;
      }
      return '';
    };

    const getAccountName = (accountId) => {
      const account = accounts.value.find(a => a.id === accountId);
      return account ? account.name : '';
    };

    const getMerchantName = (merchantId) => {
      if (!merchantId) return '';
      const merchant = merchants.value.find(m => m.id === merchantId);
      return merchant ? merchant.name : '';
    };

    const getProjectName = (projectId) => {
      if (!projectId) return '';
      const project = projects.value.find(p => p.id === projectId);
      return project ? project.name : '';
    };

    const getMemberName = (memberId) => {
      if (!memberId) return '';
      const member = members.value.find(m => m.id === memberId);
      return member ? member.name : '';
    };

    const addTransaction = () => {
      // 确保金额已计算
      calculateAmount();
      
      // 检测疑似重复录入
      if (!editingTransactionId.value) {
        const today = new Date().toISOString().split('T')[0];
        const duplicateThreshold = 5 * 60 * 1000; // 5分钟内
        const now = Date.now();
        
        const recentDuplicates = transactions.value.filter(t => {
          // 检查是否是今天的交易
          if (t.date !== today) return false;
          
          // 检查类型是否相同
          if (t.type !== transactionType.value) return false;
          
          // 检查金额是否相同（允许0.01的误差）
          if (Math.abs(t.amount - transaction.value.amount) > 0.01) return false;
          
          // 检查是否在5分钟内创建
          const transactionTime = t.id;
          const timeDiff = now - transactionTime;
          return timeDiff < duplicateThreshold;
        });
        
        if (recentDuplicates.length > 0) {
          const duplicate = recentDuplicates[0];
          const confirmMsg = `检测到疑似重复录入：\n\n` +
            `已有交易：${duplicate.description || '无备注'}\n` +
            `金额：¥${duplicate.amount.toFixed(2)}\n` +
            `时间：${new Date(duplicate.id).toLocaleTimeString()}\n\n` +
            `是否继续保存？`;
          
          if (!confirm(confirmMsg)) {
            return;
          }
        }
      }
      
      if (editingTransactionId.value) {
        // 修改现有交易
        const index = transactions.value.findIndex(t => t.id === editingTransactionId.value);
        if (index !== -1) {
          const oldTransaction = transactions.value[index];
          
          // 先恢复旧交易的余额影响
          if (oldTransaction.type === 'transfer') {
            const fromAccountIndex = accounts.value.findIndex(a => a.id === oldTransaction.fromAccountId);
            const toAccountIndex = accounts.value.findIndex(a => a.id === oldTransaction.toAccountId);
            if (fromAccountIndex !== -1) {
              accounts.value[fromAccountIndex].balance += oldTransaction.amount;
            }
            if (toAccountIndex !== -1) {
              accounts.value[toAccountIndex].balance -= oldTransaction.amount;
            }
          } else {
            const accountIndex = accounts.value.findIndex(a => a.id === oldTransaction.accountId);
            if (accountIndex !== -1) {
              if (oldTransaction.type === 'income') {
                accounts.value[accountIndex].balance -= oldTransaction.amount;
              } else if (oldTransaction.type === 'expense') {
                accounts.value[accountIndex].balance += oldTransaction.amount;
              }
            }
          }
          
          // 更新交易信息
          if (transactionType.value === 'transfer') {
            if (!transaction.value.fromAccountId || !transaction.value.toAccountId) {
              alert('请选择转出和转入账户');
              return;
            }
            
            if (transaction.value.fromAccountId === transaction.value.toAccountId) {
              alert('转出和转入账户不能相同');
              return;
            }
            
            const fromAccountIndex = accounts.value.findIndex(a => a.id === transaction.value.fromAccountId);
            const toAccountIndex = accounts.value.findIndex(a => a.id === transaction.value.toAccountId);
            
            if (fromAccountIndex === -1 || toAccountIndex === -1) {
              alert('账户不存在');
              return;
            }
            
            if (accounts.value[fromAccountIndex].balance < transaction.value.amount) {
              alert('转出账户余额不足');
              return;
            }
            
            transactions.value[index] = {
              id: editingTransactionId.value,
              type: 'transfer',
              amount: transaction.value.amount,
              categoryId: null,
              fromAccountId: parseInt(transaction.value.fromAccountId),
              toAccountId: parseInt(transaction.value.toAccountId),
              merchantId: null,
              projectId: null,
              memberId: null,
              description: transaction.value.description || '账户转账',
              date: new Date().toISOString().split('T')[0]
            };
            
            accounts.value[fromAccountIndex].balance -= transaction.value.amount;
            accounts.value[toAccountIndex].balance += transaction.value.amount;
          } else {
            transactions.value[index] = {
              id: editingTransactionId.value,
              type: transactionType.value,
              amount: transaction.value.amount,
              categoryId: parseInt(transaction.value.categoryId),
              accountId: parseInt(transaction.value.accountId),
              merchantId: transaction.value.merchantId ? parseInt(transaction.value.merchantId) : null,
              projectId: transaction.value.projectId ? parseInt(transaction.value.projectId) : null,
              memberId: transaction.value.memberId ? parseInt(transaction.value.memberId) : null,
              description: transaction.value.description,
              date: new Date().toISOString().split('T')[0]
            };
            
            const accountIndex = accounts.value.findIndex(a => a.id === transaction.value.accountId);
            if (accountIndex !== -1) {
              if (transactionType.value === 'income') {
                accounts.value[accountIndex].balance += transaction.value.amount;
              } else if (transactionType.value === 'expense') {
                accounts.value[accountIndex].balance -= transaction.value.amount;
              }
            }
          }
          
          // 更新localStorage（使用账套前缀）
          localStorage.setItem(getBookKey('transactions'), JSON.stringify(transactions.value));
          localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
          
          // 重置表单
          resetForm();
        }
      } else {
        // 添加新交易
        if (transactionType.value === 'transfer') {
          if (!transaction.value.fromAccountId || !transaction.value.toAccountId) {
            alert('请选择转出和转入账户');
            return;
          }
          
          if (transaction.value.fromAccountId === transaction.value.toAccountId) {
            alert('转出和转入账户不能相同');
            return;
          }
          
          const fromAccountIndex = accounts.value.findIndex(a => a.id === transaction.value.fromAccountId);
          const toAccountIndex = accounts.value.findIndex(a => a.id === transaction.value.toAccountId);
          
          if (fromAccountIndex === -1 || toAccountIndex === -1) {
            alert('账户不存在');
            return;
          }
          
          if (accounts.value[fromAccountIndex].balance < transaction.value.amount) {
            alert('转出账户余额不足');
            return;
          }
          
          const newTransaction = {
            id: Date.now(),
            type: 'transfer',
            amount: transaction.value.amount,
            categoryId: null,
            fromAccountId: parseInt(transaction.value.fromAccountId),
            toAccountId: parseInt(transaction.value.toAccountId),
            merchantId: null,
            projectId: null,
            memberId: null,
            description: transaction.value.description || '账户转账',
            date: new Date().toISOString().split('T')[0]
          };
          
          transactions.value.push(newTransaction);
          
          accounts.value[fromAccountIndex].balance -= transaction.value.amount;
          accounts.value[toAccountIndex].balance += transaction.value.amount;
        } else {
          const newTransaction = {
            id: Date.now(),
            type: transactionType.value,
            amount: transaction.value.amount,
            categoryId: parseInt(transaction.value.categoryId),
            accountId: parseInt(transaction.value.accountId),
            merchantId: transaction.value.merchantId ? parseInt(transaction.value.merchantId) : null,
            projectId: transaction.value.projectId ? parseInt(transaction.value.projectId) : null,
            memberId: transaction.value.memberId ? parseInt(transaction.value.memberId) : null,
            description: transaction.value.description,
            date: new Date().toISOString().split('T')[0]
          };
          
          transactions.value.push(newTransaction);
          
          const accountIndex = accounts.value.findIndex(a => a.id === transaction.value.accountId);
          if (accountIndex !== -1) {
            if (transactionType.value === 'income') {
              accounts.value[accountIndex].balance += transaction.value.amount;
            } else if (transactionType.value === 'expense') {
              accounts.value[accountIndex].balance -= transaction.value.amount;
            }
          }
        }
        
        // 更新localStorage（使用账套前缀）
        localStorage.setItem(getBookKey('transactions'), JSON.stringify(transactions.value));
        localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
        
        // 重置表单
        resetForm();
      }
    };

    const copyTransaction = (t) => {
      transactionType.value = t.type;
      transaction.value = {
        amount: t.amount,
        categoryId: t.categoryId || '',
        accountId: t.accountId || '',
        fromAccountId: t.fromAccountId || '',
        toAccountId: t.toAccountId || '',
        merchantId: t.merchantId || '',
        projectId: t.projectId || '',
        memberId: t.memberId || '',
        description: t.description || ''
      };
      amountInput.value = t.amount.toString();
      calculatedAmount.value = null;
      calcError.value = '';
    };

    const deleteTransaction = (t) => {
      if (confirm('确定要删除此交易吗？')) {
        // 恢复余额
        if (t.type === 'transfer') {
          const fromAccountIndex = accounts.value.findIndex(a => a.id === t.fromAccountId);
          const toAccountIndex = accounts.value.findIndex(a => a.id === t.toAccountId);
          if (fromAccountIndex !== -1) {
            accounts.value[fromAccountIndex].balance += t.amount;
          }
          if (toAccountIndex !== -1) {
            accounts.value[toAccountIndex].balance -= t.amount;
          }
        } else {
          // 收入或支出：更新对应账户余额
          const accountIndex = accounts.value.findIndex(a => a.id === t.accountId);
          if (accountIndex !== -1) {
            if (t.type === 'income') {
              // 收入：从账户余额中减去
              accounts.value[accountIndex].balance -= t.amount;
            } else if (t.type === 'expense') {
              // 支出：给账户余额加上
              accounts.value[accountIndex].balance += t.amount;
            }
          }
        }
        
        // 从数组中删除交易
        transactions.value.splice(transactions.value.findIndex(transaction => transaction.id === t.id), 1);
        
        // 更新localStorage（使用账套前缀）
        localStorage.setItem(getBookKey('transactions'), JSON.stringify(transactions.value));
        localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
      }
    };

    const editingTransactionId = ref(null);

    const editTransaction = (t) => {
      editingTransactionId.value = t.id;
      transactionType.value = t.type;
      transaction.value = {
        amount: t.amount,
        categoryId: t.categoryId || '',
        accountId: t.accountId || '',
        fromAccountId: t.fromAccountId || '',
        toAccountId: t.toAccountId || '',
        merchantId: t.merchantId || '',
        projectId: t.projectId || '',
        memberId: t.memberId || '',
        description: t.description || ''
      };
      amountInput.value = t.amount.toString();
      calculatedAmount.value = null;
      calcError.value = '';
    };

    const resetForm = () => {
      transactionType.value = 'expense';
      transaction.value = {
        amount: '',
        categoryId: '',
        accountId: '',
        fromAccountId: '',
        toAccountId: '',
        merchantId: '',
        projectId: '',
        memberId: '',
        description: ''
      };
      amountInput.value = '';
      calculatedAmount.value = null;
      calcError.value = '';
      editingTransactionId.value = null;
    };

    return { 
      transactionType, 
      transaction, 
      amountInput,
      calculatedAmount,
      calcError,
      categories,
      parentCategories,
      accounts, 
      accountTypes,
      merchants,
      projects,
      members,
      transactions, 
      recentTransactions,
      totalAssets,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance,
      getAccountsByType,
      getCategoryName,
      getAccountName, 
      getMerchantName,
      getProjectName,
      getMemberName,
      addTransaction,
      copyTransaction,
      editTransaction,
      deleteTransaction,
      editingTransactionId,
      calculateAmount,
      applyCalculatedAmount
    };
  }
};

// 资产页面
const AssetsView = {
  template: `
    <div class="space-y-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-wallet text-primary mr-2"></i>
          资产概览
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-white/80">总资产</h3>
                <p class="text-3xl font-bold mt-2">{{ totalAssets.toFixed(2) }}</p>
              </div>
              <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i class="fas fa-coins text-2xl"></i>
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-white/80">本月收入</h3>
                <p class="text-3xl font-bold mt-2">+{{ monthlyIncome.toFixed(2) }}</p>
              </div>
              <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i class="fas fa-arrow-up text-2xl"></i>
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-white/80">本月支出</h3>
                <p class="text-3xl font-bold mt-2">-{{ monthlyExpense.toFixed(2) }}</p>
              </div>
              <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i class="fas fa-arrow-down text-2xl"></i>
              </div>
            </div>
          </div>
        </div>
        
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-university text-primary mr-2"></i>
          账户资产
        </h3>
        <div class="space-y-3">
          <div v-for="account in accounts" :key="account.id" class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all">
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4 shadow-md">
                <span class="text-white font-bold text-lg">{{ account.name.charAt(0) }}</span>
              </div>
              <div>
                <span class="text-gray-900 font-medium text-lg">{{ account.name }}</span>
                <p class="text-sm text-gray-500 mt-1">{{ getAccountTypeName(account.type) }}</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-2xl font-bold" :class="account.balance < 0 ? 'text-danger' : 'text-gray-900'">
                {{ account.balance < 0 ? '-' : '' }}¥{{ Math.abs(account.balance).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const accounts = ref(JSON.parse(localStorage.getItem(getBookKey('accounts')) || JSON.stringify([
      { id: 1, name: '现金', type: 'cash', balance: 1000 },
      { id: 2, name: '银行卡', type: 'bank', balance: 5000 },
      { id: 3, name: '支付宝', type: 'alipay', balance: 2000 },
      { id: 4, name: '微信', type: 'wechat', balance: 1500 }
    ])));
    const transactions = ref(JSON.parse(localStorage.getItem(getBookKey('transactions')) || '[]'));

    const totalAssets = computed(() => accounts.value.reduce((total, account) => total + account.balance, 0));
    const monthlyIncome = computed(() => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return transactions.value.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((total, t) => total + t.amount, 0);
    });
    const monthlyExpense = computed(() => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return transactions.value.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((total, t) => total + t.amount, 0);
    });

    const getAccountTypeName = (typeId) => {
      const type = accountTypes.find(t => t.id === typeId);
      return type ? type.name : '';
    };

    return { accounts, totalAssets, monthlyIncome, monthlyExpense, getAccountTypeName };
  }
};

// 账户管理页面
const AccountsView = {
  template: `
    <div class="space-y-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-credit-card text-primary mr-2"></i>
            账户管理
          </h2>
          <button @click="showAddModal = true" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center">
            <i class="fas fa-plus mr-2"></i>
            添加账户
          </button>
        </div>
        
        <div class="space-y-4">
          <div v-for="type in accountTypes" :key="type.id" class="mb-6">
            <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <i :class="type.icon" class="text-primary mr-2"></i>
              {{ type.name }}
            </h3>
            <div class="space-y-2">
              <div v-for="account in getAccountsByType(type.id)" :key="account.id" class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all">
                <div class="flex items-center">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4 shadow-md">
                    <i :class="type.icon" class="text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">{{ account.name }}</h3>
                    <p class="text-sm text-gray-500">余额: <span :class="account.balance < 0 ? 'text-danger' : 'text-secondary'">{{ account.balance < 0 ? '-' : '' }}¥{{ Math.abs(account.balance).toFixed(2) }}</span></p>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <button @click="editAccount(account)" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-all flex items-center">
                    <i class="fas fa-edit mr-1"></i> 编辑
                  </button>
                  <button @click="deleteAccount(account)" class="px-3 py-2 bg-danger hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all flex items-center">
                    <i class="fas fa-trash mr-1"></i> 删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 添加/编辑账户模态框 -->
      <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-credit-card text-primary mr-2"></i>
            {{ editingAccount ? '编辑账户' : '添加账户' }}
          </h3>
          <form @submit.prevent="saveAccount" class="space-y-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">账户名称</label>
              <input type="text" v-model="accountForm.name" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">账户类型</label>
              <select v-model="accountForm.type" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                <option v-for="type in accountTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">初始余额</label>
              <input type="number" v-model.number="accountForm.balance" step="0.01" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="showAddModal = false" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  setup() {
    const accounts = ref(JSON.parse(localStorage.getItem(getBookKey('accounts')) || JSON.stringify([
      { id: 1, name: '现金', type: 'cash', balance: 1000 },
      { id: 2, name: '工商银行', type: 'bank', balance: 5000 },
      { id: 3, name: '支付宝', type: 'alipay', balance: 2000 },
      { id: 4, name: '微信钱包', type: 'wechat', balance: 1500 }
    ])));
    const showAddModal = ref(false);
    const editingAccount = ref(null);
    const accountForm = ref({ name: '', type: 'cash', balance: 0 });

    const getAccountTypeName = (typeId) => {
      const type = accountTypes.find(t => t.id === typeId);
      return type ? type.name : '';
    };

    const getAccountsByType = (typeId) => {
      return accounts.value.filter(a => a.type === typeId);
    };

    const editAccount = (account) => {
      editingAccount.value = account;
      accountForm.value = { ...account };
      showAddModal.value = true;
    };

    const deleteAccount = (account) => {
      if (confirm('确定要删除此账户吗？')) {
        accounts.value = accounts.value.filter(a => a.id !== account.id);
        localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
      }
    };

    const saveAccount = () => {
      if (editingAccount.value) {
        // 编辑现有账户
        const index = accounts.value.findIndex(a => a.id === editingAccount.value.id);
        if (index !== -1) {
          accounts.value[index] = { ...accountForm.value };
        }
      } else {
        // 添加新账户
        const newAccount = {
          id: Date.now(),
          ...accountForm.value
        };
        accounts.value.push(newAccount);
      }
      localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
      showAddModal.value = false;
      accountForm.value = { name: '', type: 'cash', balance: 0 };
      editingAccount.value = null;
    };

    return { 
      accounts, 
      showAddModal, 
      editingAccount, 
      accountForm, 
      accountTypes,
      getAccountTypeName, 
      getAccountsByType,
      editAccount, 
      deleteAccount, 
      saveAccount 
    };
  }
};

// 统计分析页面
const StatsView = {
  template: `
    <div class="space-y-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-chart-bar text-primary mr-2"></i>
          统计分析
        </h2>
        
        <!-- 快捷查询条件 -->
        <div class="flex flex-wrap gap-2 mb-6">
          <button @click="applyQuickFilter('today')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all">
            今天
          </button>
          <button @click="applyQuickFilter('week')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all">
            本周
          </button>
          <button @click="applyQuickFilter('month')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all">
            本月
          </button>
          <button @click="applyQuickFilter('quarter')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all">
            本季度
          </button>
          <button @click="applyQuickFilter('halfYear')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all">
            近半年
          </button>
          <button @click="applyQuickFilter('year')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all">
            近一年
          </button>
          <button @click="applyQuickFilter('thisYear')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all">
            今年
          </button>
          <button @click="applyQuickFilter('lastYear')" class="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-all">
            去年
          </button>
          <button @click="applyQuickFilter('beforeLastYear')" class="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-all">
            前年
          </button>
        </div>
        
        <!-- 自定义查询 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">开始日期</label>
            <input type="date" v-model="filter.startDate" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">结束日期</label>
            <input type="date" v-model="filter.endDate" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">交易类型</label>
            <select v-model="filter.type" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
              <option value="all">全部</option>
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </div>
          <div class="flex items-end">
            <button @click="applyFilter" class="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
              <i class="fas fa-search mr-2"></i> 查询
            </button>
          </div>
        </div>
        
        <!-- 统计概览 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-white/80">总收入</h3>
                <p class="text-2xl font-bold mt-2">{{ totalIncome.toFixed(2) }}</p>
              </div>
              <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i class="fas fa-arrow-up text-2xl"></i>
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-white/80">总支出</h3>
                <p class="text-2xl font-bold mt-2">{{ totalExpense.toFixed(2) }}</p>
              </div>
              <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i class="fas fa-arrow-down text-2xl"></i>
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-white/80">结余</h3>
                <p class="text-2xl font-bold mt-2">{{ balance.toFixed(2) }}</p>
              </div>
              <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i class="fas fa-balance-scale text-2xl"></i>
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-white/80">交易次数</h3>
                <p class="text-2xl font-bold mt-2">{{ filteredTransactions.length }}</p>
              </div>
              <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i class="fas fa-exchange-alt text-2xl"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 统计结果 -->
        <div class="space-y-6">
          <!-- 饼图 -->
          <div v-if="chartData.labels.length > 0">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i class="fas fa-chart-pie text-primary mr-2"></i>
              {{ filter.type === 'all' ? '收支分布' : filter.type === 'expense' ? '支出分布' : '收入分布' }}
            </h3>
            <div class="h-80 bg-gray-50 rounded-lg p-4">
              <canvas ref="pieChart"></canvas>
            </div>
          </div>
          
          <!-- 时间序列对比分析 -->
          <div v-if="timeSeriesData.labels.length > 0">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i class="fas fa-chart-line text-primary mr-2"></i>
              时间序列分析
            </h3>
            <div class="h-80 bg-gray-50 rounded-lg p-4">
              <canvas ref="timeSeriesChart"></canvas>
            </div>
          </div>
          
          <!-- 同比环比分析 -->
          <div v-if="comparisonData.hasData">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i class="fas fa-chart-area text-primary mr-2"></i>
              同比环比分析
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <h4 class="text-sm font-medium text-blue-800 mb-2">同比增长</h4>
                <p class="text-3xl font-bold" :class="comparisonData.yoy >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ comparisonData.yoy >= 0 ? '+' : '' }}{{ comparisonData.yoy.toFixed(2) }}%
                </p>
                <p class="text-xs text-blue-600 mt-1">与去年同期相比</p>
              </div>
              <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <h4 class="text-sm font-medium text-green-800 mb-2">环比增长</h4>
                <p class="text-3xl font-bold" :class="comparisonData.mom >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ comparisonData.mom >= 0 ? '+' : '' }}{{ comparisonData.mom.toFixed(2) }}%
                </p>
                <p class="text-xs text-green-600 mt-1">与上一期相比</p>
              </div>
            </div>
          </div>
          
          <!-- 年度回顾 -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i class="fas fa-calendar-alt text-primary mr-2"></i>
              年度回顾
            </h3>
            <button @click="generateAnnualReview" class="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md">
              <i class="fas fa-magic mr-2"></i> 生成年度回顾
            </button>
            <div v-if="annualReview" class="mt-4 p-6 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
              <h4 class="font-bold text-xl mb-3 text-gray-900">{{ annualReview.year }}年度回顾</h4>
              <p class="mb-4 text-gray-700">{{ annualReview.summary }}</p>
              <div v-for="(item, index) in annualReview.highlights" :key="index" class="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                <p class="font-medium text-gray-900">{{ item.title }}</p>
                <p class="text-sm text-gray-600 mt-1">{{ item.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const filter = ref({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      type: 'all'
    });
    const pieChart = ref(null);
    const timeSeriesChart = ref(null);
    const chartData = ref({ labels: [], data: [] });
    const timeSeriesData = ref({ labels: [], expenseData: [], incomeData: [] });
    const comparisonData = ref({ hasData: false, yoy: 0, mom: 0 });
    const annualReview = ref(null);
    
    const transactions = ref(JSON.parse(localStorage.getItem(getBookKey('transactions')) || '[]'));
    const categories = ref(JSON.parse(localStorage.getItem(getBookKey('categories')) || JSON.stringify(defaultCategories)));
    
    const filteredTransactions = computed(() => {
      return transactions.value.filter(t => {
        const date = new Date(t.date);
        const start = new Date(filter.value.startDate);
        const end = new Date(filter.value.endDate);
        const typeMatch = filter.value.type === 'all' || t.type === filter.value.type;
        return date >= start && date <= end && typeMatch;
      });
    });

    const totalIncome = computed(() => {
      return filteredTransactions.value.filter(t => t.type === 'income').reduce((total, t) => total + t.amount, 0);
    });

    const totalExpense = computed(() => {
      return filteredTransactions.value.filter(t => t.type === 'expense').reduce((total, t) => total + t.amount, 0);
    });

    const balance = computed(() => totalIncome.value - totalExpense.value);

    const applyQuickFilter = (period) => {
      const now = new Date();
      switch (period) {
        case 'today':
          filter.value.startDate = now.toISOString().split('T')[0];
          filter.value.endDate = now.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          filter.value.startDate = weekStart.toISOString().split('T')[0];
          filter.value.endDate = now.toISOString().split('T')[0];
          break;
        case 'month':
          filter.value.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          filter.value.endDate = now.toISOString().split('T')[0];
          break;
        case 'quarter':
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
          filter.value.startDate = quarterStart.toISOString().split('T')[0];
          filter.value.endDate = now.toISOString().split('T')[0];
          break;
        case 'halfYear':
          const halfYearMonth = Math.floor(now.getMonth() / 6) * 6;
          const halfYearStart = new Date(now.getFullYear(), halfYearMonth, 1);
          filter.value.startDate = halfYearStart.toISOString().split('T')[0];
          filter.value.endDate = now.toISOString().split('T')[0];
          break;
        case 'year':
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          filter.value.startDate = yearAgo.toISOString().split('T')[0];
          filter.value.endDate = now.toISOString().split('T')[0];
          break;
        case 'thisYear':
          filter.value.startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          filter.value.endDate = now.toISOString().split('T')[0];
          break;
        case 'lastYear':
          filter.value.startDate = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
          filter.value.endDate = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
          break;
        case 'beforeLastYear':
          filter.value.startDate = new Date(now.getFullYear() - 2, 0, 1).toISOString().split('T')[0];
          filter.value.endDate = new Date(now.getFullYear() - 2, 11, 31).toISOString().split('T')[0];
          break;
      }
      applyFilter();
    };

    const applyFilter = () => {
      const filteredTransactions = transactions.value.filter(t => {
        const date = new Date(t.date);
        const start = new Date(filter.value.startDate);
        const end = new Date(filter.value.endDate);
        const typeMatch = filter.value.type === 'all' || t.type === filter.value.type;
        return date >= start && date <= end && typeMatch;
      });
      
      // 生成饼图数据
      generatePieChartData(filteredTransactions);
      
      // 生成时间序列数据
      generateTimeSeriesData(filteredTransactions);
      
      // 生成同比环比数据
      generateComparisonData(filteredTransactions);
    };

    const generatePieChartData = (filteredTransactions) => {
      const categoryMap = {};
      filteredTransactions.forEach(t => {
        if (t.type !== 'transfer') {
          const categoryName = getCategoryName(t.categoryId);
          categoryMap[categoryName] = (categoryMap[categoryName] || 0) + t.amount;
        }
      });
      
      chartData.value.labels = Object.keys(categoryMap);
      chartData.value.data = Object.values(categoryMap);
      
      // 渲染饼图
      if (pieChart.value) {
        const ctx = pieChart.value.getContext('2d');
        if (window.pieChartInstance) {
          window.pieChartInstance.destroy();
        }
        window.pieChartInstance = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: chartData.value.labels,
            datasets: [{
              data: chartData.value.data,
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
              ]
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    };

    const generateTimeSeriesData = (filteredTransactions) => {
      const timeMap = {};
      filteredTransactions.forEach(t => {
        const date = t.date;
        if (!timeMap[date]) {
          timeMap[date] = { expense: 0, income: 0 };
        }
        if (t.type === 'expense') {
          timeMap[date].expense += t.amount;
        } else if (t.type === 'income') {
          timeMap[date].income += t.amount;
        }
      });
      
      const sortedDates = Object.keys(timeMap).sort();
      timeSeriesData.value.labels = sortedDates;
      timeSeriesData.value.expenseData = sortedDates.map(date => timeMap[date].expense);
      timeSeriesData.value.incomeData = sortedDates.map(date => timeMap[date].income);
      
      // 渲染时间序列图表
      if (timeSeriesChart.value) {
        const ctx = timeSeriesChart.value.getContext('2d');
        if (window.timeSeriesChartInstance) {
          window.timeSeriesChartInstance.destroy();
        }
        window.timeSeriesChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: timeSeriesData.value.labels,
            datasets: [
              {
                label: '支出',
                data: timeSeriesData.value.expenseData,
                borderColor: '#FF6384',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.1
              },
              {
                label: '收入',
                data: timeSeriesData.value.incomeData,
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.1
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    };

    const generateComparisonData = (filteredTransactions) => {
      const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);
      
      // 计算去年同期
      const startDate = new Date(filter.value.startDate);
      const endDate = new Date(filter.value.endDate);
      const lastYearStart = new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate());
      const lastYearEnd = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
      
      const lastYearTransactions = transactions.value.filter(t => {
        const date = new Date(t.date);
        return date >= lastYearStart && date <= lastYearEnd && 
               (filter.value.type === 'all' || t.type === filter.value.type);
      });
      const lastYearAmount = lastYearTransactions.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);
      
      // 计算上一期
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const lastPeriodStart = new Date(startDate);
      lastPeriodStart.setDate(startDate.getDate() - daysDiff);
      const lastPeriodEnd = new Date(startDate);
      lastPeriodEnd.setDate(startDate.getDate() - 1);
      
      const lastPeriodTransactions = transactions.value.filter(t => {
        const date = new Date(t.date);
        return date >= lastPeriodStart && date <= lastPeriodEnd && 
               (filter.value.type === 'all' || t.type === filter.value.type);
      });
      const lastPeriodAmount = lastPeriodTransactions.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);
      
      // 计算同比和环比
      const yoy = lastYearAmount !== 0 ? ((totalAmount - lastYearAmount) / Math.abs(lastYearAmount)) * 100 : 0;
      const mom = lastPeriodAmount !== 0 ? ((totalAmount - lastPeriodAmount) / Math.abs(lastPeriodAmount)) * 100 : 0;
      
      comparisonData.value = {
        hasData: true,
        yoy: yoy,
        mom: mom
      };
    };

    const generateAnnualReview = () => {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1).toISOString().split('T')[0];
      const yearEnd = new Date(currentYear, 11, 31).toISOString().split('T')[0];
      
      const yearTransactions = transactions.value.filter(t => {
        return t.date >= yearStart && t.date <= yearEnd;
      });
      
      const totalIncome = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netIncome = totalIncome - totalExpense;
      
      // 计算月度支出
      const monthlyExpenses = {};
      for (let i = 0; i < 12; i++) {
        const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        monthlyExpenses[monthKey] = 0;
      }
      
      yearTransactions.filter(t => t.type === 'expense').forEach(t => {
        const monthKey = t.date.slice(0, 7);
        if (monthlyExpenses[monthKey] !== undefined) {
          monthlyExpenses[monthKey] += t.amount;
        }
      });
      
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const maxExpenseMonth = Object.entries(monthlyExpenses).reduce((max, [month, amount]) => 
        amount > max.amount ? { month, amount } : max, { month: '0000-00', amount: 0 });
      
      // 计算分类支出
      const categoryExpenses = {};
      yearTransactions.filter(t => t.type === 'expense').forEach(t => {
        const categoryName = getCategoryName(t.categoryId);
        categoryExpenses[categoryName] = (categoryExpenses[categoryName] || 0) + t.amount;
      });
      
      const topCategory = Object.entries(categoryExpenses).reduce((max, [category, amount]) => 
        amount > max.amount ? { category, amount } : max, { category: '', amount: 0 });
      
      annualReview.value = {
        year: currentYear,
        summary: `在${currentYear}年，您的总收入为¥${totalIncome.toFixed(2)}，总支出为¥${totalExpense.toFixed(2)}，净收入为¥${netIncome.toFixed(2)}。`,
        highlights: [
          {
            title: '支出最高的月份',
            content: `${months[parseInt(maxExpenseMonth.month.split('-')[1]) - 1]}，支出¥${maxExpenseMonth.amount.toFixed(2)}`
          },
          {
            title: '支出最多的分类',
            content: `${topCategory.category}，支出¥${topCategory.amount.toFixed(2)}`
          },
          {
            title: '财务建议',
            content: netIncome > 0 ? '您的财务状况良好，建议适当增加储蓄和投资。' : '您的支出大于收入，建议控制开支，增加收入来源。'
          }
        ]
      };
    };

    const getCategoryName = (categoryId) => {
      for (const parent of categories.value) {
        if (parent.id === categoryId) return parent.name;
        const child = parent.children?.find(c => c.id === categoryId);
        if (child) return `${parent.name} > ${child.name}`;
      }
      return '';
    };

    // 初始应用筛选
    applyFilter();

    return { 
      filter, 
      pieChart, 
      timeSeriesChart, 
      chartData, 
      timeSeriesData, 
      comparisonData, 
      annualReview,
      filteredTransactions,
      totalIncome,
      totalExpense,
      balance,
      applyQuickFilter, 
      applyFilter, 
      generateAnnualReview 
    };
  }
};

// 维度管理页面
const DimensionsView = {
  template: `
    <div class="space-y-8">
      <!-- 分类管理 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-tags text-primary mr-2"></i>
            分类管理
          </h2>
          <button @click="showCategoryModal = true" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
            <i class="fas fa-plus mr-2"></i> 添加分类
          </button>
        </div>
        
        <div class="space-y-4">
          <div v-for="category in categories" :key="category.id" class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center">
                <span class="text-lg font-medium text-gray-900">{{ category.name }}</span>
                <span :class="category.type === 'income' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'" class="ml-2 px-3 py-1 text-xs rounded-full font-medium">
                  {{ category.type === 'income' ? '收入' : '支出' }}
                </span>
              </div>
              <div class="flex space-x-2">
                <button @click="addChildCategory(category)" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-all">
                  <i class="fas fa-plus mr-1"></i> 添加子分类
                </button>
                <button @click="editCategory(category)" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-all">
                  <i class="fas fa-edit mr-1"></i> 编辑
                </button>
                <button @click="deleteCategory(category.id)" class="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all">
                  <i class="fas fa-trash mr-1"></i> 删除
                </button>
              </div>
            </div>
            <div v-if="category.children && category.children.length > 0" class="ml-4 mt-2 space-y-2">
              <div v-for="child in category.children" :key="child.id" class="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100">
                <span class="text-gray-700 font-medium">{{ child.name }}</span>
                <button @click="deleteChildCategory(category.id, child.id)" class="text-gray-400 hover:text-danger transition-all">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 商家管理 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-store text-primary mr-2"></i>
            商家管理
          </h2>
          <button @click="showMerchantModal = true" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
            <i class="fas fa-plus mr-2"></i> 添加商家
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="merchant in merchants" :key="merchant.id" class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all">
            <span class="text-gray-900 font-medium">{{ merchant.name }}</span>
            <button @click="deleteMerchant(merchant.id)" class="text-gray-400 hover:text-danger transition-all">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 项目管理 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-project-diagram text-primary mr-2"></i>
            项目管理
          </h2>
          <button @click="showProjectModal = true" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
            <i class="fas fa-plus mr-2"></i> 添加项目
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="project in projects" :key="project.id" class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all">
            <span class="text-gray-900 font-medium">{{ project.name }}</span>
            <button @click="deleteProject(project.id)" class="text-gray-400 hover:text-danger transition-all">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 成员管理 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-users text-primary mr-2"></i>
            成员管理
          </h2>
          <button @click="showMemberModal = true" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
            <i class="fas fa-plus mr-2"></i> 添加成员
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="member in members" :key="member.id" class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all">
            <span class="text-gray-900 font-medium">{{ member.name }}</span>
            <button @click="deleteMember(member.id)" class="text-gray-400 hover:text-danger transition-all">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 分类模态框 -->
      <div v-if="showCategoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold text-gray-900 mb-4">{{ categoryForm.isEditing ? '编辑分类' : '添加分类' }}</h3>
          <form @submit.prevent="saveCategory" class="space-y-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">分类名称</label>
              <input type="text" v-model="categoryForm.name" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">类型</label>
              <select v-model="categoryForm.type" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                <option value="expense">支出</option>
                <option value="income">收入</option>
              </select>
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="closeCategoryModal" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-all">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 子分类模态框 -->
      <div v-if="showChildModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold text-gray-900 mb-4">添加子分类</h3>
          <form @submit.prevent="saveChildCategory" class="space-y-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">子分类名称</label>
              <input type="text" v-model="childForm.name" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="closeChildModal" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-all">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 商家模态框 -->
      <div v-if="showMerchantModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold text-gray-900 mb-4">添加商家</h3>
          <form @submit.prevent="saveMerchant" class="space-y-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">商家名称</label>
              <input type="text" v-model="merchantForm.name" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="showMerchantModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-all">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 项目模态框 -->
      <div v-if="showProjectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold text-gray-900 mb-4">添加项目</h3>
          <form @submit.prevent="saveProject" class="space-y-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">项目名称</label>
              <input type="text" v-model="projectForm.name" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="showProjectModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-all">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 成员模态框 -->
      <div v-if="showMemberModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold text-gray-900 mb-4">添加成员</h3>
          <form @submit.prevent="saveMember" class="space-y-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">成员名称</label>
              <input type="text" v-model="memberForm.name" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="showMemberModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-all">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  setup() {
    const categories = ref(JSON.parse(localStorage.getItem(getBookKey('categories')) || JSON.stringify(defaultCategories)));
    const merchants = ref(JSON.parse(localStorage.getItem(getBookKey('merchants')) || JSON.stringify([
      { id: 1, name: '沃尔玛' },
      { id: 2, name: '星巴克' },
      { id: 3, name: '滴滴出行' },
      { id: 4, name: '美团' }
    ])));
    const projects = ref(JSON.parse(localStorage.getItem(getBookKey('projects')) || JSON.stringify([
      { id: 1, name: '家庭开支' },
      { id: 2, name: '工作报销' },
      { id: 3, name: '旅游基金' }
    ])));
    const members = ref(JSON.parse(localStorage.getItem(getBookKey('members')) || JSON.stringify([
      { id: 1, name: '本人' },
      { id: 2, name: '配偶' },
      { id: 3, name: '孩子' },
      { id: 4, name: '父母' }
    ])));

    const showCategoryModal = ref(false);
    const showChildModal = ref(false);
    const showMerchantModal = ref(false);
    const showProjectModal = ref(false);
    const showMemberModal = ref(false);

    const categoryForm = ref({ id: null, name: '', type: 'expense', isEditing: false });
    const childForm = ref({ parentId: null, name: '' });
    const merchantForm = ref({ name: '' });
    const projectForm = ref({ name: '' });
    const memberForm = ref({ name: '' });

    const closeCategoryModal = () => {
      showCategoryModal.value = false;
      categoryForm.value = { id: null, name: '', type: 'expense', isEditing: false };
    };

    const editCategory = (category) => {
      categoryForm.value = { ...category, isEditing: true };
      showCategoryModal.value = true;
    };

    const saveCategory = () => {
      if (categoryForm.value.isEditing) {
        const index = categories.value.findIndex(c => c.id === categoryForm.value.id);
        if (index !== -1) {
          categories.value[index].name = categoryForm.value.name;
          categories.value[index].type = categoryForm.value.type;
        }
      } else {
        const newCategory = {
          id: Date.now(),
          name: categoryForm.value.name,
          type: categoryForm.value.type,
          children: []
        };
        categories.value.push(newCategory);
      }
      localStorage.setItem(getBookKey('categories'), JSON.stringify(categories.value));
      closeCategoryModal();
    };

    const deleteCategory = (categoryId) => {
      if (confirm('确定要删除此分类吗？相关的子分类也会被删除。')) {
        categories.value = categories.value.filter(c => c.id !== categoryId);
        localStorage.setItem(getBookKey('categories'), JSON.stringify(categories.value));
      }
    };

    const addChildCategory = (parent) => {
      childForm.value.parentId = parent.id;
      showChildModal.value = true;
    };

    const closeChildModal = () => {
      showChildModal.value = false;
      childForm.value = { parentId: null, name: '' };
    };

    const saveChildCategory = () => {
      const parent = categories.value.find(c => c.id === childForm.value.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push({
          id: Date.now(),
          name: childForm.value.name
        });
        localStorage.setItem(getBookKey('categories'), JSON.stringify(categories.value));
      }
      closeChildModal();
    };

    const deleteChildCategory = (parentId, childId) => {
      if (confirm('确定要删除此子分类吗？')) {
        const parent = categories.value.find(c => c.id === parentId);
        if (parent && parent.children) {
          parent.children = parent.children.filter(c => c.id !== childId);
          localStorage.setItem(getBookKey('categories'), JSON.stringify(categories.value));
        }
      }
    };

    const saveMerchant = () => {
      const newMerchant = {
        id: Date.now(),
        name: merchantForm.value.name
      };
      merchants.value.push(newMerchant);
      localStorage.setItem(getBookKey('merchants'), JSON.stringify(merchants.value));
      showMerchantModal.value = false;
      merchantForm.value = { name: '' };
    };

    const deleteMerchant = (merchantId) => {
      if (confirm('确定要删除此商家吗？')) {
        merchants.value = merchants.value.filter(m => m.id !== merchantId);
        localStorage.setItem(getBookKey('merchants'), JSON.stringify(merchants.value));
      }
    };

    const saveProject = () => {
      const newProject = {
        id: Date.now(),
        name: projectForm.value.name
      };
      projects.value.push(newProject);
      localStorage.setItem(getBookKey('projects'), JSON.stringify(projects.value));
      showProjectModal.value = false;
      projectForm.value = { name: '' };
    };

    const deleteProject = (projectId) => {
      if (confirm('确定要删除此项目吗？')) {
        projects.value = projects.value.filter(p => p.id !== projectId);
        localStorage.setItem(getBookKey('projects'), JSON.stringify(projects.value));
      }
    };

    const saveMember = () => {
      const newMember = {
        id: Date.now(),
        name: memberForm.value.name
      };
      members.value.push(newMember);
      localStorage.setItem(getBookKey('members'), JSON.stringify(members.value));
      showMemberModal.value = false;
      memberForm.value = { name: '' };
    };

    const deleteMember = (memberId) => {
      if (confirm('确定要删除此成员吗？')) {
        members.value = members.value.filter(m => m.id !== memberId);
        localStorage.setItem(getBookKey('members'), JSON.stringify(members.value));
      }
    };

    return {
      categories,
      merchants,
      projects,
      members,
      showCategoryModal,
      showChildModal,
      showMerchantModal,
      showProjectModal,
      showMemberModal,
      categoryForm,
      childForm,
      merchantForm,
      projectForm,
      memberForm,
      closeCategoryModal,
      editCategory,
      saveCategory,
      deleteCategory,
      addChildCategory,
      closeChildModal,
      saveChildCategory,
      deleteChildCategory,
      saveMerchant,
      deleteMerchant,
      saveProject,
      deleteProject,
      saveMember,
      deleteMember
    };
  }
};

// 管理员页面
const AdminView = {
  template: `
    <div class="space-y-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <i class="fas fa-cog text-primary mr-2"></i>
          管理员中心
        </h2>
        
        <!-- 用户管理 -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-users text-primary mr-2"></i>
            用户管理
          </h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50 transition-all">
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.username }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ new Date(user.createdAt).toLocaleString() }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <span class="px-3 py-1 text-xs rounded-full font-medium" :class="user.isAdmin ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'">
                      {{ user.isAdmin ? '管理员' : '普通用户' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <button @click="resetPassword(user)" class="text-blue-600 hover:text-blue-800 mr-3 transition-all">
                      <i class="fas fa-key mr-1"></i> 重置密码
                    </button>
                    <button @click="deleteUser(user)" class="text-danger hover:text-red-800 transition-all" v-if="!user.isAdmin">
                      <i class="fas fa-trash mr-1"></i> 删除用户
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- 系统设置 -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-sliders-h text-primary mr-2"></i>
            系统设置
          </h3>
          <div class="space-y-6">
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
              <label class="block mb-3 text-sm font-medium text-gray-700">系统版本</label>
              <div class="flex items-center">
                <span class="text-lg font-bold text-gray-900 mr-4">{{ APP_VERSION }}</span>
                <button @click="checkForUpdates" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
                  <i class="fas fa-sync-alt mr-2"></i> 检查更新
                </button>
              </div>
              <div v-if="updateInfo.hasUpdate" class="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <p class="text-sm font-medium text-yellow-800"><i class="fas fa-exclamation-circle mr-2"></i>发现新版本：{{ updateInfo.version }}</p>
                <p class="text-xs text-yellow-600 mt-2">{{ updateInfo.releaseNotes }}</p>
                <button @click="downloadUpdate" class="mt-3 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md">
                  <i class="fas fa-download mr-2"></i> 下载更新
                </button>
              </div>
            </div>
            <div class="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg border border-green-100">
              <label class="block mb-3 text-sm font-medium text-gray-700">数据管理</label>
              <div class="flex flex-wrap gap-3">
                <button @click="exportAllData" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
                  <i class="fas fa-file-export mr-2"></i> 导出所有数据
                </button>
                <button @click="importData" class="px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-lg hover:from-gray-300 hover:to-gray-400 transition-all shadow-md">
                  <i class="fas fa-file-import mr-2"></i> 导入数据
                </button>
                <input type="file" ref="fileInput" accept=".json" @change="handleFileImport" class="hidden">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const users = ref(JSON.parse(localStorage.getItem('users') || '[]'));
    const updateInfo = ref({ hasUpdate: false, version: '', releaseNotes: '' });
    const fileInput = ref(null);

    const resetPassword = (user) => {
      if (confirm(`确定要将 ${user.username} 的密码重置为默认密码 '123456' 吗？`)) {
        user.password = '123456';
        localStorage.setItem('users', JSON.stringify(users.value));
        alert('密码已重置');
      }
    };

    const deleteUser = (user) => {
      if (confirm(`确定要删除用户 ${user.username} 吗？`)) {
        users.value = users.value.filter(u => u.id !== user.id);
        localStorage.setItem('users', JSON.stringify(users.value));
        alert('用户已删除');
      }
    };

    const checkForUpdates = async () => {
      const update = await checkForUpdates();
      updateInfo.value = update;
    };

    const downloadUpdate = async () => {
      const result = await downloadUpdate(updateInfo.value.version);
      if (result.success) {
        if (confirm('更新已下载完成，是否立即应用？')) {
          applyUpdate();
        }
      } else {
        alert('下载更新失败：' + result.error);
      }
    };

    const exportAllData = () => {
      const allData = {
        users: JSON.parse(localStorage.getItem('users') || '[]'),
        books: {
          default: {
            accounts: JSON.parse(localStorage.getItem('accounts_default') || '[]'),
            transactions: JSON.parse(localStorage.getItem('transactions_default') || '[]'),
            categories: JSON.parse(localStorage.getItem('categories_default') || '[]'),
            merchants: JSON.parse(localStorage.getItem('merchants_default') || '[]'),
            projects: JSON.parse(localStorage.getItem('projects_default') || '[]'),
            members: JSON.parse(localStorage.getItem('members_default') || '[]')
          }
        }
      };
      
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mymoney888_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    };

    const importData = () => {
      fileInput.value.click();
    };

    const handleFileImport = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (confirm('确定要导入数据吗？这将覆盖现有数据。')) {
              if (data.users) {
                localStorage.setItem('users', JSON.stringify(data.users));
              }
              if (data.books && data.books.default) {
                localStorage.setItem('accounts_default', JSON.stringify(data.books.default.accounts || []));
                localStorage.setItem('transactions_default', JSON.stringify(data.books.default.transactions || []));
                localStorage.setItem('categories_default', JSON.stringify(data.books.default.categories || []));
                localStorage.setItem('merchants_default', JSON.stringify(data.books.default.merchants || []));
                localStorage.setItem('projects_default', JSON.stringify(data.books.default.projects || []));
                localStorage.setItem('members_default', JSON.stringify(data.books.default.members || []));
              }
              alert('数据导入成功');
              window.location.reload();
            }
          } catch (error) {
            alert('导入失败：文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };

    return { 
      users, 
      updateInfo, 
      fileInput, 
      APP_VERSION,
      resetPassword, 
      deleteUser, 
      checkForUpdates, 
      downloadUpdate, 
      exportAllData, 
      importData, 
      handleFileImport 
    };
  }
};

// 路由配置
const routes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/assets', component: AssetsView },
  { path: '/accounts', component: AccountsView },
  { path: '/stats', component: StatsView },
  { path: '/dimensions', component: DimensionsView },
  { path: '/admin', component: AdminView }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  // 不需要登录的页面
  const publicPages = ['/login', '/register'];
  const isPublicPage = publicPages.includes(to.path);
  
  // 未登录且访问非公共页面，重定向到登录
  if (!currentUser && !isPublicPage) {
    next('/login');
    return;
  }
  
  // 管理员权限检查
  if (to.path === '/admin' && !currentUser.isAdmin) {
    alert('您没有权限访问此页面');
    next('/');
    return;
  }
  
  next();
});

// 主应用
const App = {
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- 顶部导航 -->
      <nav v-if="currentUser" class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <router-link to="/" class="text-xl font-bold text-primary">
                mymoney888
              </router-link>
            </div>
            <div class="flex items-center space-x-4">
              <router-link to="/" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                记账
              </router-link>
              <router-link to="/assets" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                资产
              </router-link>
              <router-link to="/accounts" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                账户
              </router-link>
              <router-link to="/stats" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                统计
              </router-link>
              <router-link to="/dimensions" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                维度
              </router-link>
              <router-link v-if="currentUser.isAdmin" to="/admin" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                管理员
              </router-link>
              <div class="relative">
                <button @click="showUserMenu = !showUserMenu" class="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none">
                  <span>{{ currentUser.username }}</span>
                  <svg class="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button @click="logout" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <!-- 主要内容 -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  `,
  setup() {
    const currentUser = ref(JSON.parse(localStorage.getItem('currentUser') || 'null'));
    const showUserMenu = ref(false);

    const logout = () => {
      localStorage.removeItem('currentUser');
      window.location.hash = '/login';
    };

    return { currentUser, showUserMenu, logout };
  }
};

// 应用初始化
const app = createApp(App);
app.use(router);
app.mount('#app');

// 检查更新
checkAndApplyUpdate();
