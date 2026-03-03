const { createApp, ref, computed, onMounted, nextTick } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// 版本控制
const APP_VERSION = '1.0.0';
const GITHUB_REPO = 'https://api.github.com/repos/yourusername/mymoney888/releases/latest';

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
          url: data.html_url
        };
      }
    }
  } catch (error) {
    console.log('版本检查失败:', error);
  }
  return { hasUpdate: false };
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
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">管理员注册码（可选）</label>
            <input type="text" v-model="adminCode" placeholder="输入管理员注册码注册为管理员" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            <p class="mt-1 text-xs text-gray-500">管理员注册码：admin123</p>
          </div>
          <button type="submit" 
            class="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            注册
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
      
      const isAdmin = adminCode.value === 'admin123';
      const user = { 
        id: Date.now(),
        username: username.value, 
        password: password.value,
        name: username.value,
        isAdmin: isAdmin,
        createdAt: new Date().toISOString()
      };
      
      users.push(user);
      localStorage.setItem('users', JSON.stringify(users));
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      if (username.value === 'test' && isAdmin) {
        createSampleData(user.id);
      }
      
      window.location.hash = '/';
    };
    
    const createSampleData = (userId) => {
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      const sampleAccounts = [
        { id: 1, userId, name: '现金', type: 'cash', balance: 5000 },
        { id: 2, userId, name: '工商银行', type: 'bank', balance: 20000 },
        { id: 3, userId, name: '支付宝', type: 'alipay', balance: 8000 },
        { id: 4, userId, name: '微信钱包', type: 'wechat', balance: 3000 },
        { id: 5, userId, name: '股票账户', type: 'investment', balance: 15000 },
        { id: 6, userId, name: '信用卡', type: 'debt', balance: -5000 }
      ];
      
      const sampleTransactions = [
        { id: 1, userId, type: 'income', amount: 15000, categoryId: 81, accountId: 2, merchantId: null, projectId: null, memberId: null, description: '月薪', date: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)) },
        { id: 2, userId, type: 'income', amount: 5000, categoryId: 82, accountId: 2, merchantId: null, projectId: null, memberId: null, description: '季度奖金', date: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 15)) },
        { id: 3, userId, type: 'income', amount: 2000, categoryId: 83, accountId: 5, merchantId: null, projectId: null, memberId: null, description: '股票收益', date: formatDate(new Date(now.getFullYear(), now.getMonth() - 2, 20)) },
        { id: 4, userId, type: 'expense', amount: 50, categoryId: 12, accountId: 1, merchantId: 2, projectId: 1, memberId: 1, description: '午餐', date: formatDate(now.getFullYear(), now.getMonth(), 5) },
        { id: 5, userId, type: 'expense', amount: 30, categoryId: 22, accountId: 4, merchantId: 3, projectId: 1, memberId: 1, description: '打车', date: formatDate(now.getFullYear(), now.getMonth(), 3) },
        { id: 6, userId, type: 'expense', amount: 200, categoryId: 32, accountId: 3, merchantId: 1, projectId: 1, memberId: 1, description: '超市购物', date: formatDate(now.getFullYear(), now.getMonth(), 10) },
        { id: 7, userId, type: 'expense', amount: 100, categoryId: 41, accountId: 1, description: '电影', date: formatDate(now.getFullYear(), now.getMonth(), 15) },
        { id: 8, userId, type: 'expense', amount: 3000, categoryId: 51, accountId: 2, projectId: null, memberId: null, description: '房租', date: formatDate(now.getFullYear(), now.getMonth(), 1) },
        { id: 9, userId, type: 'expense', amount: 500, categoryId: 61, accountId: 3, projectId: null, memberId: null, description: '买药', date: formatDate(now.getFullYear(), now.getMonth() - 1, 20) },
        { id: 10, userId, type: 'expense', amount: 200, categoryId: 71, accountId: 2, projectId: 2, memberId: 1, description: '买书', date: formatDate(now.getFullYear(), now.getMonth() - 2, 10) },
        { id: 11, userId, type: 'expense', amount: 150, categoryId: 14, accountId: 4, merchantId: 4, projectId: 1, memberId: 2, description: '奶茶', date: formatDate(now.getFullYear(), now.getMonth() - 1, 25) },
        { id: 12, userId, type: 'expense', amount: 80, categoryId: 21, accountId: 1, projectId: null, memberId: null, description: '地铁', date: formatDate(now.getFullYear(), now.getMonth() - 1, 18) },
        { id: 13, userId, type: 'income', amount: 15000, categoryId: 81, accountId: 2, merchantId: null, projectId: null, memberId: null, description: '月薪', date: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)) },
        { id: 14, userId, type: 'expense', amount: 2000, categoryId: 33, accountId: 2, projectId: 3, memberId: 1, description: '买手机', date: formatDate(new Date(now.getFullYear() - 1, now.getMonth() + 6, 15)) },
        { id: 15, userId, type: 'expense', amount: 5000, categoryId: 43, accountId: 5, projectId: 3, memberId: 1, description: '旅游', date: formatDate(new Date(now.getFullYear() - 1, now.getMonth() + 8, 1)) },
        { id: 16, userId, type: 'expense', amount: 300, categoryId: 12, accountId: 1, merchantId: 2, projectId: 1, memberId: 1, description: '午餐', date: formatDate(new Date(now.getFullYear() - 1, now.getMonth() + 10, 20)) },
        { id: 17, userId, type: 'income', amount: 1000, categoryId: 84, accountId: 2, merchantId: null, projectId: null, memberId: null, description: '兼职收入', date: formatDate(new Date(now.getFullYear() - 1, now.getMonth() + 3, 10)) },
        { id: 18, userId, type: 'expense', amount: 150, categoryId: 41, accountId: 4, projectId: null, memberId: null, description: '游戏充值', date: formatDate(new Date(now.getFullYear() - 1, now.getMonth() + 5, 5)) },
        { id: 19, userId, type: 'expense', amount: 400, categoryId: 62, accountId: 3, projectId: null, memberId: null, description: '看病', date: formatDate(new Date(now.getFullYear() - 1, now.getMonth() + 7, 15)) },
        { id: 20, userId, type: 'expense', amount: 2500, categoryId: 51, accountId: 2, projectId: null, memberId: null, description: '房租', date: formatDate(new Date(now.getFullYear() - 1, now.getMonth(), 1)) }
      ];
      
      localStorage.setItem(getBookKey('accounts'), JSON.stringify(sampleAccounts));
      localStorage.setItem(getBookKey('transactions'), JSON.stringify(sampleTransactions));
    };
    
    const formatDate = (year, month, day) => {
      const d = new Date(year, month, day);
      return d.toISOString().split('T')[0];
    };
    
    return { username, password, confirmPassword, adminCode, handleRegister };
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
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">快速记账</h2>
        <form @submit.prevent="addTransaction" class="space-y-4">
          <!-- 第一行：类型和金额 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">类型</label>
              <div class="flex space-x-4">
                <button type="button" @click="transactionType = 'expense'" 
                  :class="transactionType === 'expense' ? 'bg-danger text-white' : 'bg-gray-200 text-gray-800'" 
                  class="flex-1 py-2 px-4 rounded-md font-medium">
                  支出
                </button>
                <button type="button" @click="transactionType = 'income'" 
                  :class="transactionType === 'income' ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-800'" 
                  class="flex-1 py-2 px-4 rounded-md font-medium">
                  收入
                </button>
                <button type="button" @click="transactionType = 'transfer'" 
                  :class="transactionType === 'transfer' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'" 
                  class="flex-1 py-2 px-4 rounded-md font-medium">
                  转账
                </button>
              </div>
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">金额</label>
              <div class="relative">
                <input type="text" v-model="amountInput" @blur="calculateAmount" @keyup.enter="calculateAmount" required 
                  placeholder="支持计算，如：100+50"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <button v-if="calculatedAmount !== null" @click="applyCalculatedAmount" type="button"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-secondary text-white text-xs rounded hover:bg-green-600">
                  使用 {{ calculatedAmount.toFixed(2) }}
                </button>
              </div>
              <p v-if="calcError" class="text-xs text-danger mt-1">{{ calcError }}</p>
            </div>
          </div>

          <!-- 第二行：分类选择（平铺所有明细分类） -->
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">分类</label>
            <select v-model="transaction.categoryId" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="">请选择转出账户</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">
                  {{ account.name }} ({{ account.balance.toFixed(2) }})
                </option>
              </select>
            </div>
            <div v-if="transactionType === 'transfer'">
              <label class="block mb-2 text-sm font-medium text-gray-700">转入账户</label>
              <select v-model="transaction.toAccountId" required 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="">请选择转入账户</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">
                  {{ account.name }} ({{ account.balance.toFixed(2) }})
                </option>
              </select>
            </div>
            <div v-if="transactionType !== 'transfer'">
              <label class="block mb-2 text-sm font-medium text-gray-700">商家</label>
              <select v-model="transaction.merchantId" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="">请选择项目（可选）</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">成员</label>
              <select v-model="transaction.memberId" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="">请选择成员（可选）</option>
                <option v-for="member in members" :key="member.id" :value="member.id">{{ member.name }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">备注</label>
            <input type="text" v-model="transaction.description" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
          </div>
          <button type="submit" class="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700">
            保存
          </button>
        </form>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">最近交易</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">账户</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商家</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">成员</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(t, index) in recentTransactions" :key="index">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ t.date }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span v-if="t.type === 'expense'" class="text-danger font-medium">支出</span>
                  <span v-else-if="t.type === 'income'" class="text-secondary font-medium">收入</span>
                  <span v-else class="text-purple-600 font-medium">转账</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <span v-if="t.type === 'transfer'">{{ getAccountName(t.fromAccountId) }} → {{ getAccountName(t.toAccountId) }}</span>
                  <span v-else>{{ getCategoryName(t.categoryId) }}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium" :class="t.type === 'expense' ? 'text-danger' : t.type === 'income' ? 'text-secondary' : 'text-purple-600'">
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
                  <button @click="copyTransaction(t)" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-copy"></i> 复制
                  </button>
                  <button @click="editTransaction(t)" class="text-primary hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i> 修改
                  </button>
                  <button @click="deleteTransaction(t)" class="text-danger hover:text-red-800">
                    <i class="fas fa-trash"></i> 删除
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
              } else {
                accounts.value[accountIndex].balance -= transaction.value.amount;
              }
            }
          }
          
          // 更新localStorage（使用账套前缀）
          localStorage.setItem(getBookKey('transactions'), JSON.stringify(transactions.value));
          localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
          
          // 重置编辑状态
          editingTransactionId.value = null;
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
          
          transactions.value.unshift(newTransaction);
          localStorage.setItem(getBookKey('transactions'), JSON.stringify(transactions.value));
          
          accounts.value[fromAccountIndex].balance -= transaction.value.amount;
          accounts.value[toAccountIndex].balance += transaction.value.amount;
          localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
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
          transactions.value.unshift(newTransaction);
          localStorage.setItem(getBookKey('transactions'), JSON.stringify(transactions.value));
          
          const accountIndex = accounts.value.findIndex(a => a.id === newTransaction.accountId);
          if (accountIndex !== -1) {
            if (newTransaction.type === 'income') {
              accounts.value[accountIndex].balance += newTransaction.amount;
            } else {
              accounts.value[accountIndex].balance -= newTransaction.amount;
            }
            localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
          }
        }
      }
      
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
      transactionType.value = 'expense';
    };

    const copyTransaction = (t) => {
      editingTransactionId.value = null;
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
      if (confirm('确定要删除这笔交易吗？')) {
        // 找到交易在数组中的索引
        const index = transactions.value.findIndex(transaction => transaction.id === t.id);
        if (index !== -1) {
          // 先更新账户余额
          if (t.type === 'transfer') {
            // 转账：转出账户增加金额，转入账户减少金额
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
          transactions.value.splice(index, 1);
          
          // 更新localStorage（使用账套前缀）
          localStorage.setItem(getBookKey('transactions'), JSON.stringify(transactions.value));
          localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
        }
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
        <h2 class="text-xl font-bold text-gray-900 mb-4">资产概览</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg">
            <h3 class="text-sm font-medium text-blue-600">总资产</h3>
            <p class="text-2xl font-bold text-gray-900">{{ totalAssets.toFixed(2) }}</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <h3 class="text-sm font-medium text-green-600">本月收入</h3>
            <p class="text-2xl font-bold text-gray-900">{{ monthlyIncome.toFixed(2) }}</p>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <h3 class="text-sm font-medium text-red-600">本月支出</h3>
            <p class="text-2xl font-bold text-gray-900">{{ monthlyExpense.toFixed(2) }}</p>
          </div>
        </div>
        
        <h3 class="text-lg font-semibold text-gray-900 mb-3">账户资产</h3>
        <div class="space-y-3">
          <div v-for="account in accounts" :key="account.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-md">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <span class="text-primary font-bold">{{ account.name.charAt(0) }}</span>
              </div>
              <span class="text-gray-900 font-medium">{{ account.name }}</span>
            </div>
            <span class="text-xl font-bold text-gray-900">{{ account.balance.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const accounts = ref([
      { id: 1, name: '现金', balance: 1000 },
      { id: 2, name: '银行卡', balance: 5000 },
      { id: 3, name: '支付宝', balance: 2000 },
      { id: 4, name: '微信', balance: 1500 }
    ]);
    const transactions = ref([
      { id: 1, type: 'expense', amount: 50, category: '餐饮', account: 1, description: '午餐', date: '2026-03-01' },
      { id: 2, type: 'income', amount: 5000, category: '工资', account: 2, description: '月薪', date: '2026-03-01' }
    ]);

    const totalAssets = computed(() => accounts.value.reduce((total, account) => total + account.balance, 0));
    const monthlyIncome = computed(() => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return transactions.value.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((total, t) => total + t.amount, 0);
    });
    const monthlyExpense = computed(() => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return transactions.value.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((total, t) => total + t.amount, 0);
    });

    return { accounts, totalAssets, monthlyIncome, monthlyExpense };
  }
};

// 维度管理页面
const DimensionsView = {
  template: `
    <div class="space-y-8">
      <!-- 分类管理 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900">分类管理</h2>
          <button @click="showCategoryModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
            添加分类
          </button>
        </div>
        
        <div class="space-y-4">
          <div v-for="category in categories" :key="category.id" class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center">
                <span class="text-lg font-medium text-gray-900">{{ category.name }}</span>
                <span :class="category.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="ml-2 px-2 py-1 text-xs rounded-full">
                  {{ category.type === 'income' ? '收入' : '支出' }}
                </span>
              </div>
              <div class="flex space-x-2">
                <button @click="addChildCategory(category)" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                  添加子分类
                </button>
                <button @click="editCategory(category)" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                  编辑
                </button>
                <button @click="deleteCategory(category.id)" class="px-3 py-1 bg-danger hover:bg-red-600 text-white rounded-md text-sm font-medium">
                  删除
                </button>
              </div>
            </div>
            <div v-if="category.children && category.children.length > 0" class="ml-4 mt-2 space-y-2">
              <div v-for="child in category.children" :key="child.id" class="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span class="text-gray-700">{{ child.name }}</span>
                <button @click="deleteChildCategory(category.id, child.id)" class="text-gray-400 hover:text-danger">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 商家管理 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900">商家管理</h2>
          <button @click="showMerchantModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
            添加商家
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="merchant in merchants" :key="merchant.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-md">
            <span class="text-gray-900">{{ merchant.name }}</span>
            <button @click="deleteMerchant(merchant.id)" class="text-gray-400 hover:text-danger">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 项目管理 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900">项目管理</h2>
          <button @click="showProjectModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
            添加项目
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="project in projects" :key="project.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-md">
            <span class="text-gray-900">{{ project.name }}</span>
            <button @click="deleteProject(project.id)" class="text-gray-400 hover:text-danger">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 成员管理 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900">成员管理</h2>
          <button @click="showMemberModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
            添加成员
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="member in members" :key="member.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-md">
            <span class="text-gray-900">{{ member.name }}</span>
            <button @click="deleteMember(member.id)" class="text-gray-400 hover:text-danger">
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">类型</label>
              <select v-model="categoryForm.type" required 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="expense">支出</option>
                <option value="income">收入</option>
              </select>
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="closeCategoryModal" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="closeChildModal" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="showMerchantModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="showProjectModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="showMemberModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  setup() {
    // 从localStorage加载数据（使用账套前缀）
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

    // 模态框状态
    const showCategoryModal = ref(false);
    const showChildModal = ref(false);
    const showMerchantModal = ref(false);
    const showProjectModal = ref(false);
    const showMemberModal = ref(false);

    // 表单数据
    const categoryForm = ref({ id: null, name: '', type: 'expense', isEditing: false });
    const childForm = ref({ parentId: null, name: '' });
    const merchantForm = ref({ name: '' });
    const projectForm = ref({ name: '' });
    const memberForm = ref({ name: '' });

    // 分类管理
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

    // 子分类管理
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
        if (!parent.children) parent.children = [];
        const newChild = {
          id: Date.now(),
          name: childForm.value.name,
          type: parent.type
        };
        parent.children.push(newChild);
        localStorage.setItem(getBookKey('categories'), JSON.stringify(categories.value));
      }
      closeChildModal();
    };

    const deleteChildCategory = (parentId, childId) => {
      const parent = categories.value.find(c => c.id === parentId);
      if (parent && parent.children) {
        parent.children = parent.children.filter(c => c.id !== childId);
        localStorage.setItem(getBookKey('categories'), JSON.stringify(categories.value));
      }
    };

    // 商家管理
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

    // 项目管理
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

    // 成员管理
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

// 账户管理页面
const AccountsView = {
  template: `
    <div class="space-y-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900">账户管理</h2>
          <button @click="showModal = true" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
            添加账户
          </button>
        </div>
        
        <div class="space-y-4">
          <div v-for="type in accountTypes" :key="type.id" class="mb-6">
            <h3 class="text-lg font-semibold text-gray-700 mb-3">{{ type.name }}</h3>
            <div class="space-y-2">
              <div v-for="account in getAccountsByType(type.id)" :key="account.id" class="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                <div class="flex items-center">
                  <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <i :class="type.icon" class="text-primary text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">{{ account.name }}</h3>
                    <p class="text-sm text-gray-500">余额: ¥{{ account.balance.toFixed(2) }}</p>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <button @click="editAccount(account)" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                    编辑
                  </button>
                  <button @click="deleteAccount(account.id)" class="px-3 py-1 bg-danger hover:bg-red-600 text-white rounded-md text-sm font-medium">
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold text-gray-900 mb-4">{{ isEditing ? '编辑账户' : '添加账户' }}</h3>
          <form @submit.prevent="saveAccount" class="space-y-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">账户名称</label>
              <input type="text" v-model="formData.name" required 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">账户类型</label>
              <select v-model="formData.type" required 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option v-for="type in accountTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">初始余额</label>
              <input type="number" v-model.number="formData.balance" required step="0.01" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="closeModal" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
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
      { id: 4, name: '微信钱包', type: 'wechat', balance: 1500 },
      { id: 5, name: '股票账户', type: 'investment', balance: 10000 },
      { id: 6, name: '信用卡', type: 'debt', balance: -2000 }
    ])));
    
    const showModal = ref(false);
    const isEditing = ref(false);
    const formData = ref({ id: null, name: '', type: 'cash', balance: 0 });

    const closeModal = () => {
      showModal.value = false;
      isEditing.value = false;
      formData.value = { id: null, name: '', type: 'cash', balance: 0 };
    };

    const editAccount = (account) => {
      formData.value = { ...account };
      isEditing.value = true;
      showModal.value = true;
    };

    const getAccountsByType = (typeId) => {
      return accounts.value.filter(a => a.type === typeId);
    };

    const saveAccount = () => {
      if (isEditing.value) {
        const index = accounts.value.findIndex(a => a.id === formData.value.id);
        if (index !== -1) {
          accounts.value[index] = { ...formData.value };
        }
      } else {
        const newAccount = {
          id: Date.now(),
          name: formData.value.name,
          type: formData.value.type,
          balance: formData.value.balance
        };
        accounts.value.push(newAccount);
      }
      localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
      closeModal();
    };

    const deleteAccount = (accountId) => {
      if (confirm('确定要删除此账户吗？')) {
        accounts.value = accounts.value.filter(a => a.id !== accountId);
        localStorage.setItem(getBookKey('accounts'), JSON.stringify(accounts.value));
      }
    };

    return { accounts, accountTypes, showModal, isEditing, formData, closeModal, editAccount, getAccountsByType, saveAccount, deleteAccount };
  }
};

// 统计分析页面
const StatisticsView = {
  template: `
    <div class="space-y-8">
      <!-- 查询条件 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">查询条件</h2>
        
        <div class="flex flex-wrap gap-2 mb-4">
          <button @click="setQuickFilter('today')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200">
            今天
          </button>
          <button @click="setQuickFilter('week')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200">
            本周
          </button>
          <button @click="setQuickFilter('month')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200">
            本月
          </button>
          <button @click="setQuickFilter('quarter')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200">
            本季度
          </button>
          <button @click="setQuickFilter('halfYear')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200">
            近半年
          </button>
          <button @click="setQuickFilter('year')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200">
            近一年
          </button>
          <button @click="setQuickFilter('thisYear')" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200">
            今年
          </button>
          <button @click="setQuickFilter('lastYear')" class="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-md text-sm font-medium hover:bg-indigo-200">
            去年
          </button>
          <button @click="setQuickFilter('beforeLastYear')" class="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-md text-sm font-medium hover:bg-indigo-200">
            前年
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">开始日期</label>
            <input type="date" v-model="filters.startDate" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">结束日期</label>
            <input type="date" v-model="filters.endDate" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">交易类型</label>
            <select v-model="filters.type" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
              <option value="">全部</option>
              <option value="income">收入</option>
              <option value="expense">支出</option>
            </select>
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">账户</label>
            <select v-model="filters.accountId" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
              <option value="">全部账户</option>
              <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
            </select>
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">分类</label>
            <select v-model="filters.categoryId" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
              <option value="">全部分类</option>
              <optgroup v-for="cat in categories" :key="cat.id" :label="cat.name">
                <option v-if="cat.children && cat.children.length > 0" v-for="child in cat.children" :key="child.id" :value="child.id">
                  {{ cat.name }} > {{ child.name }}
                </option>
                <option v-else :value="cat.id">{{ cat.name }}</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">商家</label>
            <select v-model="filters.merchantId" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
              <option value="">全部商家</option>
              <option v-for="merchant in merchants" :key="merchant.id" :value="merchant.id">{{ merchant.name }}</option>
            </select>
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">项目</label>
            <select v-model="filters.projectId" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
              <option value="">全部项目</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
            </select>
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700">成员</label>
            <select v-model="filters.memberId" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
              <option value="">全部成员</option>
              <option v-for="member in members" :key="member.id" :value="member.id">{{ member.name }}</option>
            </select>
          </div>
        </div>
        <div class="mt-4 flex space-x-4">
          <button @click="applyFilters" class="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
            查询
          </button>
          <button @click="resetFilters" class="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            重置
          </button>
        </div>
      </div>

      <!-- 统计概览 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">统计概览</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <h3 class="text-sm font-medium text-blue-600">总收入</h3>
            <p class="text-2xl font-bold text-gray-900">{{ totalIncome.toFixed(2) }}</p>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <h3 class="text-sm font-medium text-red-600">总支出</h3>
            <p class="text-2xl font-bold text-gray-900">{{ totalExpense.toFixed(2) }}</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <h3 class="text-sm font-medium text-green-600">结余</h3>
            <p class="text-2xl font-bold text-gray-900">{{ balance.toFixed(2) }}</p>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg">
            <h3 class="text-sm font-medium text-purple-600">交易次数</h3>
            <p class="text-2xl font-bold text-gray-900">{{ filteredTransactions.length }}</p>
          </div>
        </div>
      </div>

      <!-- 同比环比分析 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">对比分析</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 同比分析 -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">同比分析（去年同期）</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">本期收入</span>
                <span class="font-medium text-gray-900">{{ totalIncome.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">去年同期收入</span>
                <span class="font-medium text-gray-900">{{ yoyIncome.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center p-2 rounded" :class="yoyIncomeChange >= 0 ? 'bg-green-50' : 'bg-red-50'">
                <span class="text-gray-600">收入同比</span>
                <span class="font-bold" :class="yoyIncomeChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ yoyIncomeChange >= 0 ? '+' : '' }}{{ yoyIncomeChange.toFixed(1) }}%
                </span>
              </div>
              <div class="border-t pt-3 mt-3">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">本期支出</span>
                  <span class="font-medium text-gray-900">{{ totalExpense.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">去年同期支出</span>
                  <span class="font-medium text-gray-900">{{ yoyExpense.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center p-2 rounded" :class="yoyExpenseChange <= 0 ? 'bg-green-50' : 'bg-red-50'">
                  <span class="text-gray-600">支出同比</span>
                  <span class="font-bold" :class="yoyExpenseChange <= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ yoyExpenseChange >= 0 ? '+' : '' }}{{ yoyExpenseChange.toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 环比分析 -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">环比分析（上一周期）</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">本期收入</span>
                <span class="font-medium text-gray-900">{{ totalIncome.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">上期收入</span>
                <span class="font-medium text-gray-900">{{ momIncome.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center p-2 rounded" :class="momIncomeChange >= 0 ? 'bg-green-50' : 'bg-red-50'">
                <span class="text-gray-600">收入环比</span>
                <span class="font-bold" :class="momIncomeChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ momIncomeChange >= 0 ? '+' : '' }}{{ momIncomeChange.toFixed(1) }}%
                </span>
              </div>
              <div class="border-t pt-3 mt-3">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">本期支出</span>
                  <span class="font-medium text-gray-900">{{ totalExpense.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">上期支出</span>
                  <span class="font-medium text-gray-900">{{ momExpense.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center p-2 rounded" :class="momExpenseChange <= 0 ? 'bg-green-50' : 'bg-red-50'">
                  <span class="text-gray-600">支出环比</span>
                  <span class="font-bold" :class="momExpenseChange <= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ momExpenseChange >= 0 ? '+' : '' }}{{ momExpenseChange.toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 饼图展示 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">支出分类分布</h3>
          <div class="h-80">
            <canvas ref="expenseChart"></canvas>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">收入分类分布</h3>
          <div class="h-80">
            <canvas ref="incomeChart"></canvas>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">账户余额分布</h3>
        <div class="h-80">
          <canvas ref="accountChart"></canvas>
        </div>
      </div>

      <!-- 详细数据 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">交易明细</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">账户</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商家</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">成员</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(t, index) in filteredTransactions.slice(0, 20)" :key="index">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ t.date }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span v-if="t.type === 'expense'" class="text-danger font-medium">支出</span>
                  <span v-else-if="t.type === 'income'" class="text-secondary font-medium">收入</span>
                  <span v-else class="text-purple-600 font-medium">转账</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <span v-if="t.type === 'transfer'">{{ getAccountName(t.fromAccountId) }} → {{ getAccountName(t.toAccountId) }}</span>
                  <span v-else>{{ getCategoryName(t.categoryId) }}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium" :class="t.type === 'expense' ? 'text-danger' : t.type === 'income' ? 'text-secondary' : 'text-purple-600'">
                  {{ t.type === 'expense' ? '-' : t.type === 'income' ? '+' : '' }}{{ t.amount.toFixed(2) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <span v-if="t.type === 'transfer'">{{ getAccountName(t.toAccountId) }}</span>
                  <span v-else>{{ getAccountName(t.accountId) }}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ getMerchantName(t.merchantId) || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ getProjectName(t.projectId) || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ getMemberName(t.memberId) || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  setup() {
    const expenseChart = ref(null);
    const incomeChart = ref(null);
    const accountChart = ref(null);
    
    const filters = ref({
      startDate: '',
      endDate: '',
      type: '',
      accountId: '',
      categoryId: '',
      merchantId: '',
      projectId: '',
      memberId: ''
    });

    const transactions = ref(JSON.parse(localStorage.getItem(getBookKey('transactions')) || '[]'));
    const categories = ref(JSON.parse(localStorage.getItem(getBookKey('categories')) || JSON.stringify(defaultCategories)));
    const accounts = ref(JSON.parse(localStorage.getItem(getBookKey('accounts')) || '[]'));
    const merchants = ref(JSON.parse(localStorage.getItem(getBookKey('merchants')) || '[]'));
    const projects = ref(JSON.parse(localStorage.getItem(getBookKey('projects')) || '[]'));
    const members = ref(JSON.parse(localStorage.getItem(getBookKey('members')) || '[]'));

    const filteredTransactions = ref([...transactions.value]);

    const applyFilters = () => {
      let result = [...transactions.value];
      
      if (filters.value.startDate) {
        result = result.filter(t => t.date >= filters.value.startDate);
      }
      if (filters.value.endDate) {
        result = result.filter(t => t.date <= filters.value.endDate);
      }
      if (filters.value.type) {
        result = result.filter(t => t.type === filters.value.type);
      }
      if (filters.value.accountId) {
        result = result.filter(t => t.accountId === parseInt(filters.value.accountId));
      }
      if (filters.value.categoryId) {
        result = result.filter(t => t.categoryId === parseInt(filters.value.categoryId));
      }
      if (filters.value.merchantId) {
        result = result.filter(t => t.merchantId === parseInt(filters.value.merchantId));
      }
      if (filters.value.projectId) {
        result = result.filter(t => t.projectId === parseInt(filters.value.projectId));
      }
      if (filters.value.memberId) {
        result = result.filter(t => t.memberId === parseInt(filters.value.memberId));
      }
      
      filteredTransactions.value = result;
      updateCharts();
    };

    const resetFilters = () => {
      filters.value = {
        startDate: '',
        endDate: '',
        type: '',
        accountId: '',
        categoryId: '',
        merchantId: '',
        projectId: '',
        memberId: ''
      };
      filteredTransactions.value = [...transactions.value];
      updateCharts();
    };

    const setQuickFilter = (type) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      let startDate = '';
      
      switch (type) {
        case 'today':
          startDate = today;
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate = monthStart.toISOString().split('T')[0];
          break;
        case 'quarter':
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
          startDate = quarterStart.toISOString().split('T')[0];
          break;
        case 'halfYear':
          const halfYearMonth = Math.floor(now.getMonth() / 6) * 6;
          const halfYearStart = new Date(now.getFullYear(), halfYearMonth, 1);
          startDate = halfYearStart.toISOString().split('T')[0];
          break;
        case 'year':
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          startDate = yearAgo.toISOString().split('T')[0];
          break;
        case 'thisYear':
          const thisYearStart = new Date(now.getFullYear(), 0, 1);
          startDate = thisYearStart.toISOString().split('T')[0];
          break;
        case 'lastYear':
          const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
          const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
          filters.value.startDate = lastYearStart.toISOString().split('T')[0];
          filters.value.endDate = lastYearEnd.toISOString().split('T')[0];
          applyFilters();
          return;
        case 'beforeLastYear':
          const beforeLastYearStart = new Date(now.getFullYear() - 2, 0, 1);
          const beforeLastYearEnd = new Date(now.getFullYear() - 2, 11, 31);
          filters.value.startDate = beforeLastYearStart.toISOString().split('T')[0];
          filters.value.endDate = beforeLastYearEnd.toISOString().split('T')[0];
          applyFilters();
          return;
      }
      
      filters.value.startDate = startDate;
      filters.value.endDate = today;
      applyFilters();
    };

    const totalIncome = computed(() => {
      return filteredTransactions.value.filter(t => t.type === 'income').reduce((total, t) => total + t.amount, 0);
    });

    const totalExpense = computed(() => {
      return filteredTransactions.value.filter(t => t.type === 'expense').reduce((total, t) => total + t.amount, 0);
    });

    const balance = computed(() => totalIncome.value - totalExpense.value);

    // 同比分析（去年同期）
    const yoyIncome = computed(() => {
      if (!filters.value.startDate || !filters.value.endDate) return 0;
      const start = new Date(filters.value.startDate);
      const end = new Date(filters.value.endDate);
      const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
      
      const lastYearStart = new Date(start);
      lastYearStart.setFullYear(start.getFullYear() - 1);
      const lastYearEnd = new Date(end);
      lastYearEnd.setFullYear(end.getFullYear() - 1);
      
      return transactions.value
        .filter(t => t.type === 'income' && t.date >= lastYearStart.toISOString().split('T')[0] && t.date <= lastYearEnd.toISOString().split('T')[0])
        .reduce((total, t) => total + t.amount, 0);
    });

    const yoyExpense = computed(() => {
      if (!filters.value.startDate || !filters.value.endDate) return 0;
      const start = new Date(filters.value.startDate);
      const end = new Date(filters.value.endDate);
      
      const lastYearStart = new Date(start);
      lastYearStart.setFullYear(start.getFullYear() - 1);
      const lastYearEnd = new Date(end);
      lastYearEnd.setFullYear(end.getFullYear() - 1);
      
      return transactions.value
        .filter(t => t.type === 'expense' && t.date >= lastYearStart.toISOString().split('T')[0] && t.date <= lastYearEnd.toISOString().split('T')[0])
        .reduce((total, t) => total + t.amount, 0);
    });

    const yoyIncomeChange = computed(() => {
      if (yoyIncome.value === 0) return totalIncome.value > 0 ? 100 : 0;
      return ((totalIncome.value - yoyIncome.value) / yoyIncome.value) * 100;
    });

    const yoyExpenseChange = computed(() => {
      if (yoyExpense.value === 0) return totalExpense.value > 0 ? 100 : 0;
      return ((totalExpense.value - yoyExpense.value) / yoyExpense.value) * 100;
    });

    // 环比分析（上一周期）
    const momIncome = computed(() => {
      if (!filters.value.startDate || !filters.value.endDate) return 0;
      const start = new Date(filters.value.startDate);
      const end = new Date(filters.value.endDate);
      const daysDiff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      
      const prevStart = new Date(start);
      prevStart.setDate(start.getDate() - daysDiff);
      const prevEnd = new Date(end);
      prevEnd.setDate(end.getDate() - daysDiff);
      
      return transactions.value
        .filter(t => t.type === 'income' && t.date >= prevStart.toISOString().split('T')[0] && t.date <= prevEnd.toISOString().split('T')[0])
        .reduce((total, t) => total + t.amount, 0);
    });

    const momExpense = computed(() => {
      if (!filters.value.startDate || !filters.value.endDate) return 0;
      const start = new Date(filters.value.startDate);
      const end = new Date(filters.value.endDate);
      const daysDiff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      
      const prevStart = new Date(start);
      prevStart.setDate(start.getDate() - daysDiff);
      const prevEnd = new Date(end);
      prevEnd.setDate(end.getDate() - daysDiff);
      
      return transactions.value
        .filter(t => t.type === 'expense' && t.date >= prevStart.toISOString().split('T')[0] && t.date <= prevEnd.toISOString().split('T')[0])
        .reduce((total, t) => total + t.amount, 0);
    });

    const momIncomeChange = computed(() => {
      if (momIncome.value === 0) return totalIncome.value > 0 ? 100 : 0;
      return ((totalIncome.value - momIncome.value) / momIncome.value) * 100;
    });

    const momExpenseChange = computed(() => {
      if (momExpense.value === 0) return totalExpense.value > 0 ? 100 : 0;
      return ((totalExpense.value - momExpense.value) / momExpense.value) * 100;
    });

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

    const updateCharts = () => {
      updateExpenseChart();
      updateIncomeChart();
      updateAccountChart();
    };

    const updateExpenseChart = () => {
      const ctx = expenseChart.value?.getContext('2d');
      if (!ctx) return;

      const expenses = filteredTransactions.value.filter(t => t.type === 'expense');
      const categoryMap = {};
      expenses.forEach(t => {
        const categoryName = getCategoryName(t.categoryId);
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + t.amount;
      });

      const labels = Object.keys(categoryMap);
      const data = Object.values(categoryMap);
      const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
        '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
        '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#ec4899', '#f43f5e'
      ];

      if (window.expenseChartInstance) {
        window.expenseChartInstance.destroy();
      }

      window.expenseChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
    };

    const updateIncomeChart = () => {
      const ctx = incomeChart.value?.getContext('2d');
      if (!ctx) return;

      const incomes = filteredTransactions.value.filter(t => t.type === 'income');
      const categoryMap = {};
      incomes.forEach(t => {
        const categoryName = getCategoryName(t.categoryId);
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + t.amount;
      });

      const labels = Object.keys(categoryMap);
      const data = Object.values(categoryMap);
      const colors = [
        '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b',
        '#f97316', '#ef4444', '#ec4899', '#d946ef', '#a855f7',
        '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4',
        '#14b8a6', '#0d9488'
      ];

      if (window.incomeChartInstance) {
        window.incomeChartInstance.destroy();
      }

      window.incomeChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
    };

    const updateAccountChart = () => {
      const ctx = accountChart.value?.getContext('2d');
      if (!ctx) return;

      const labels = accounts.value.map(a => a.name);
      const data = accounts.value.map(a => a.balance);
      const colors = data.map(v => v >= 0 ? '#10b981' : '#ef4444');

      if (window.accountChartInstance) {
        window.accountChartInstance.destroy();
      }

      window.accountChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data.map(Math.abs),
            backgroundColor: colors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
    };

    onMounted(() => {
      nextTick(() => {
        updateCharts();
      });
    });

    return {
      filters,
      filteredTransactions,
      transactions,
      categories,
      accounts,
      merchants,
      projects,
      members,
      totalIncome,
      totalExpense,
      balance,
      yoyIncome,
      yoyExpense,
      yoyIncomeChange,
      yoyExpenseChange,
      momIncome,
      momExpense,
      momIncomeChange,
      momExpenseChange,
      expenseChart,
      incomeChart,
      accountChart,
      applyFilters,
      resetFilters,
      setQuickFilter,
      getCategoryName,
      getAccountName,
      getMerchantName,
      getProjectName,
      getMemberName
    };
  }
};

// 管理员用户管理页面
const AdminView = {
  template: `
    <div class="space-y-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">用户管理</h2>
        <p class="text-gray-600 mb-6">管理系统中的所有用户账户</p>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ user.username }}
                  <span v-if="currentUser.id === user.id" class="ml-2 text-xs text-gray-500">(当前用户)</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span v-if="user.isAdmin" class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    管理员
                  </span>
                  <span v-else class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    普通用户
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(user.createdAt) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                  <button @click="resetPassword(user)" class="text-primary hover:text-blue-700">
                    重置密码
                  </button>
                  <button v-if="currentUser.id !== user.id" @click="deleteUser(user)" class="text-danger hover:text-red-700">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 重置密码模态框 -->
      <div v-if="showResetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold text-gray-900 mb-4">重置用户密码</h3>
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">用户: <span class="font-medium">{{ selectedUser?.username }}</span></p>
          </div>
          <form @submit.prevent="confirmResetPassword" class="space-y-4">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">新密码</label>
              <input type="password" v-model="newPassword" required 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">确认新密码</label>
              <input type="password" v-model="confirmPassword" required 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="closeResetModal" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                取消
              </button>
              <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
                确认重置
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  setup() {
    const currentUser = ref(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    const users = ref(JSON.parse(localStorage.getItem('users') || '[]'));
    const showResetModal = ref(false);
    const selectedUser = ref(null);
    const newPassword = ref('');
    const confirmPassword = ref('');

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    };

    const resetPassword = (user) => {
      selectedUser.value = user;
      showResetModal.value = true;
      newPassword.value = '';
      confirmPassword.value = '';
    };

    const closeResetModal = () => {
      showResetModal.value = false;
      selectedUser.value = null;
      newPassword.value = '';
      confirmPassword.value = '';
    };

    const confirmResetPassword = () => {
      if (newPassword.value !== confirmPassword.value) {
        alert('密码确认不一致');
        return;
      }

      if (newPassword.value.length < 6) {
        alert('密码长度至少6位');
        return;
      }

      const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id);
      if (userIndex !== -1) {
        users.value[userIndex].password = newPassword.value;
        localStorage.setItem('users', JSON.stringify(users.value));
        alert(`用户 ${selectedUser.value.username} 的密码已重置`);
        closeResetModal();
      }
    };

    const deleteUser = (user) => {
      if (confirm(`确定要删除用户 ${user.username} 吗？此操作不可恢复。`)) {
        users.value = users.value.filter(u => u.id !== user.id);
        localStorage.setItem('users', JSON.stringify(users.value));
        alert('用户已删除');
      }
    };

    return {
      currentUser,
      users,
      showResetModal,
      selectedUser,
      newPassword,
      confirmPassword,
      formatDate,
      resetPassword,
      closeResetModal,
      confirmResetPassword,
      deleteUser
    };
  }
};

// 数据导入页面
const ImportView = {
  template: `
    <div class="space-y-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">数据导入</h2>
        <p class="text-gray-600 mb-6">支持从其他记账软件或支付宝、微信账单导入数据</p>
        
        <!-- 导入方式选择 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div 
            @click="importType = 'alipay'" 
            :class="importType === 'alipay' ? 'border-primary bg-blue-50' : 'border-gray-200'"
            class="border-2 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
          >
            <div class="flex items-center mb-2">
              <i class="fab fa-alipay text-blue-500 text-2xl mr-2"></i>
              <h3 class="font-semibold text-gray-900">支付宝账单</h3>
            </div>
            <p class="text-sm text-gray-600">导入支付宝CSV账单文件</p>
          </div>
          
          <div 
            @click="importType = 'wechat'" 
            :class="importType === 'wechat' ? 'border-primary bg-green-50' : 'border-gray-200'"
            class="border-2 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
          >
            <div class="flex items-center mb-2">
              <i class="fab fa-weixin text-green-500 text-2xl mr-2"></i>
              <h3 class="font-semibold text-gray-900">微信账单</h3>
            </div>
            <p class="text-sm text-gray-600">导入微信CSV账单文件</p>
          </div>
          
          <div 
            @click="importType = 'generic'" 
            :class="importType === 'generic' ? 'border-primary bg-gray-50' : 'border-gray-200'"
            class="border-2 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
          >
            <div class="flex items-center mb-2">
              <i class="fas fa-file-csv text-gray-500 text-2xl mr-2"></i>
              <h3 class="font-semibold text-gray-900">通用导入</h3>
            </div>
            <p class="text-sm text-gray-600">导入其他软件CSV数据</p>
          </div>
        </div>

        <!-- 文件上传区域 -->
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
          <input 
            type="file" 
            ref="fileInput"
            @change="handleFileSelect"
            accept=".csv,.xlsx,.xls"
            class="hidden"
          >
          <div @click="$refs.fileInput.click()" class="cursor-pointer">
            <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
            <p class="text-lg font-medium text-gray-700 mb-2">点击或拖拽文件到此处上传</p>
            <p class="text-sm text-gray-500">支持 CSV、Excel 格式</p>
          </div>
        </div>

        <!-- 文件信息 -->
        <div v-if="selectedFile" class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <i class="fas fa-file text-primary text-xl mr-3"></i>
              <div>
                <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
                <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
            </div>
            <button @click="selectedFile = null; previewData = []" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- 字段映射配置 -->
        <div v-if="previewData.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">字段映射配置</h3>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">日期字段</label>
                <select v-model="fieldMapping.date" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option v-for="field in availableFields" :key="field" :value="field">{{ field }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">金额字段</label>
                <select v-model="fieldMapping.amount" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option v-for="field in availableFields" :key="field" :value="field">{{ field }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">类型字段</label>
                <select v-model="fieldMapping.type" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">自动识别</option>
                  <option v-for="field in availableFields" :key="field" :value="field">{{ field }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">分类/备注字段</label>
                <select v-model="fieldMapping.category" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option v-for="field in availableFields" :key="field" :value="field">{{ field }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据预览 -->
        <div v-if="previewData.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">数据预览 (前5条)</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">分类/备注</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(row, index) in previewData.slice(0, 5)" :key="index">
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{{ formatDate(getFieldValue(row, fieldMapping.date)) }}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm">
                    <span :class="detectType(row) === 'income' ? 'text-green-600' : 'text-red-600'" class="font-medium">
                      {{ detectType(row) === 'income' ? '收入' : '支出' }}
                    </span>
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm font-medium" :class="detectType(row) === 'income' ? 'text-green-600' : 'text-red-600'">
                    {{ formatAmount(getFieldValue(row, fieldMapping.amount)) }}
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{{ getFieldValue(row, fieldMapping.category) || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 导入按钮 -->
        <div v-if="previewData.length > 0" class="flex space-x-4">
          <button 
            @click="importData" 
            :disabled="isImporting"
            class="flex-1 py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isImporting">
              <i class="fas fa-spinner fa-spin mr-2"></i>导入中...
            </span>
            <span v-else>
              确认导入 ({{ previewData.length }} 条记录)
            </span>
          </button>
          <button 
            @click="selectedFile = null; previewData = []" 
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            取消
          </button>
        </div>

        <!-- 导入结果 -->
        <div v-if="importResult" class="mt-6 p-4 rounded-lg" :class="importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
          <div class="flex items-center">
            <i :class="importResult.success ? 'fas fa-check-circle text-green-500' : 'fas fa-exclamation-circle text-red-500'" class="text-xl mr-3"></i>
            <div>
              <p class="font-medium" :class="importResult.success ? 'text-green-800' : 'text-red-800'">
                {{ importResult.message }}
              </p>
              <p v-if="importResult.details" class="text-sm mt-1" :class="importResult.success ? 'text-green-600' : 'text-red-600'">
                {{ importResult.details }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 导入说明 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">导入说明</h3>
        <div class="space-y-4 text-sm text-gray-600">
          <div>
            <h4 class="font-medium text-gray-900 mb-2">支付宝账单导入</h4>
            <ol class="list-decimal list-inside space-y-1 ml-4">
              <li>打开支付宝APP → 我的 → 账单</li>
              <li>点击右上角"..." → 开具交易流水证明</li>
              <li>选择"用于个人对账" → 选择时间范围</li>
              <li>输入邮箱接收CSV文件</li>
              <li>解压后上传CSV文件即可</li>
            </ol>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 mb-2">微信账单导入</h4>
            <ol class="list-decimal list-inside space-y-1 ml-4">
              <li>打开微信 → 我 → 服务 → 钱包</li>
              <li>点击右上角"账单" → 常见问题</li>
              <li>选择"下载账单" → 用于个人对账</li>
              <li>选择时间范围并输入邮箱</li>
              <li>解压后上传CSV文件即可</li>
            </ol>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 mb-2">通用CSV导入</h4>
            <p class="ml-4">支持自定义字段映射，文件需包含：日期、金额、类型(收入/支出)、分类等字段</p>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const importType = ref('alipay');
    const selectedFile = ref(null);
    const previewData = ref([]);
    const availableFields = ref([]);
    const isImporting = ref(false);
    const importResult = ref(null);
    
    const fieldMapping = ref({
      date: '',
      amount: '',
      type: '',
      category: ''
    });

    // 支付宝默认字段映射
    const alipayMapping = {
      date: '交易时间',
      amount: '金额',
      type: '收/支',
      category: '交易分类'
    };

    // 微信默认字段映射
    const wechatMapping = {
      date: '交易时间',
      amount: '金额(元)',
      type: '收/支',
      category: '商品'
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        selectedFile.value = file;
        parseCSV(file);
      }
    };

    const parseCSV = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          // 解析表头
          const headers = parseCSVLine(lines[0]);
          availableFields.value = headers;
          
          // 根据导入类型设置默认映射
          if (importType.value === 'alipay') {
            fieldMapping.value = { ...alipayMapping };
          } else if (importType.value === 'wechat') {
            fieldMapping.value = { ...wechatMapping };
          } else {
            // 通用导入，自动匹配字段
            fieldMapping.value = {
              date: headers.find(h => h.includes('时间') || h.includes('日期') || h.toLowerCase().includes('date')) || headers[0],
              amount: headers.find(h => h.includes('金额') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('money')) || headers[1],
              type: headers.find(h => h.includes('类型') || h.includes('收/支') || h.toLowerCase().includes('type')) || '',
              category: headers.find(h => h.includes('分类') || h.includes('商品') || h.includes('备注') || h.toLowerCase().includes('category')) || headers[2]
            };
          }
          
          // 解析数据行
          const data = [];
          for (let i = 1; i < lines.length && i <= 100; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index];
              });
              data.push(row);
            }
          }
          previewData.value = data;
        }
      };
      reader.readAsText(file, 'UTF-8');
    };

    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const getFieldValue = (row, field) => {
      return row[field] || '';
    };

    const detectType = (row) => {
      if (fieldMapping.value.type) {
        const typeValue = getFieldValue(row, fieldMapping.value.type);
        if (importType.value === 'alipay') {
          return typeValue === '收入' ? 'income' : 'expense';
        } else if (importType.value === 'wechat') {
          return typeValue === '收入' ? 'income' : 'expense';
        }
        return typeValue.includes('收入') ? 'income' : 'expense';
      }
      
      // 自动识别：根据金额正负
      const amount = parseFloat(getFieldValue(row, fieldMapping.value.amount).replace(/[￥,]/g, ''));
      return amount >= 0 ? 'income' : 'expense';
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      // 尝试解析各种日期格式
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr.split(' ')[0] || dateStr;
      }
      return date.toISOString().split('T')[0];
    };

    const formatAmount = (amountStr) => {
      if (!amountStr) return '0.00';
      const amount = parseFloat(amountStr.replace(/[￥,]/g, ''));
      return Math.abs(amount).toFixed(2);
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const importData = () => {
      isImporting.value = true;
      
      setTimeout(() => {
        try {
          const transactions = JSON.parse(localStorage.getItem(getBookKey('transactions')) || '[]');
          const accounts = JSON.parse(localStorage.getItem(getBookKey('accounts')) || '[]');
          const defaultAccount = accounts.length > 0 ? accounts[0].id : 1;
          
          let successCount = 0;
          let skipCount = 0;
          
          previewData.value.forEach(row => {
            const amount = parseFloat(getFieldValue(row, fieldMapping.value.amount).replace(/[￥,]/g, ''));
            const type = detectType(row);
            const date = formatDate(getFieldValue(row, fieldMapping.value.date));
            const category = getFieldValue(row, fieldMapping.value.category) || '其他';
            
            if (!isNaN(amount) && amount !== 0) {
              transactions.push({
                id: Date.now() + Math.random(),
                type: type,
                amount: Math.abs(amount),
                category: category,
                account: defaultAccount,
                description: category,
                date: date
              });
              successCount++;
            } else {
              skipCount++;
            }
          });
          
          localStorage.setItem(getBookKey('transactions'), JSON.stringify(transactions));
          
          importResult.value = {
            success: true,
            message: `成功导入 ${successCount} 条记录`,
            details: skipCount > 0 ? `跳过 ${skipCount} 条无效记录` : null
          };
          
          // 清空预览数据
          previewData.value = [];
          selectedFile.value = null;
        } catch (error) {
          importResult.value = {
            success: false,
            message: '导入失败',
            details: error.message
          };
        } finally {
          isImporting.value = false;
        }
      }, 1000);
    };

    return {
      importType,
      selectedFile,
      previewData,
      availableFields,
      fieldMapping,
      isImporting,
      importResult,
      handleFileSelect,
      getFieldValue,
      detectType,
      formatDate,
      formatAmount,
      formatFileSize,
      importData
    };
  }
};

// 我的一年回顾页面
const YearReviewView = {
  template: `
    <div class="space-y-8">
      <!-- 年度选择 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900">我的一年回顾</h2>
          <div class="flex items-center space-x-4">
            <button @click="changeYear(-1)" class="p-2 hover:bg-gray-100 rounded-full">
              <i class="fas fa-chevron-left text-gray-600"></i>
            </button>
            <span class="text-xl font-bold text-primary">{{ selectedYear }}年</span>
            <button @click="changeYear(1)" class="p-2 hover:bg-gray-100 rounded-full" :disabled="selectedYear >= currentYear">
              <i class="fas fa-chevron-right text-gray-600"></i>
            </button>
          </div>
        </div>
        <p class="text-gray-600 mt-2">回顾您的财务年度，发现消费习惯，规划未来</p>
      </div>

      <!-- 年度总览卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h3 class="text-sm font-medium opacity-90">年度总收入</h3>
          <p class="text-3xl font-bold mt-2">¥{{ yearStats.totalIncome.toFixed(2) }}</p>
          <p class="text-sm mt-1 opacity-80">{{ yearStats.incomeTransactions }}笔收入</p>
        </div>
        <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
          <h3 class="text-sm font-medium opacity-90">年度总支出</h3>
          <p class="text-3xl font-bold mt-2">¥{{ yearStats.totalExpense.toFixed(2) }}</p>
          <p class="text-sm mt-1 opacity-80">{{ yearStats.expenseTransactions }}笔支出</p>
        </div>
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <h3 class="text-sm font-medium opacity-90">年度结余</h3>
          <p class="text-3xl font-bold mt-2">¥{{ yearStats.balance.toFixed(2) }}</p>
          <p class="text-sm mt-1 opacity-80">储蓄率 {{ yearStats.savingsRate.toFixed(1) }}%</p>
        </div>
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <h3 class="text-sm font-medium opacity-90">日均支出</h3>
          <p class="text-3xl font-bold mt-2">¥{{ yearStats.avgDailyExpense.toFixed(2) }}</p>
          <p class="text-sm mt-1 opacity-80">全年{{ yearStats.activeDays }}天有消费</p>
        </div>
      </div>

      <!-- 智能洞察 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>年度洞察
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <i class="fas fa-trophy text-blue-500 mt-1"></i>
              <div>
                <h4 class="font-semibold text-gray-900">最高收入月份</h4>
                <p class="text-gray-600">{{ yearStats.bestIncomeMonth }}收入 ¥{{ yearStats.bestIncomeAmount.toFixed(2) }}</p>
              </div>
            </div>
            <div class="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
              <i class="fas fa-fire text-red-500 mt-1"></i>
              <div>
                <h4 class="font-semibold text-gray-900">最高支出月份</h4>
                <p class="text-gray-600">{{ yearStats.worstExpenseMonth }}支出 ¥{{ yearStats.worstExpenseAmount.toFixed(2) }}</p>
              </div>
            </div>
            <div class="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <i class="fas fa-piggy-bank text-green-500 mt-1"></i>
              <div>
                <h4 class="font-semibold text-gray-900">最节省月份</h4>
                <p class="text-gray-600">{{ yearStats.bestSavingsMonth }}结余 ¥{{ yearStats.bestSavingsAmount.toFixed(2) }}</p>
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <div class="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
              <i class="fas fa-chart-line text-purple-500 mt-1"></i>
              <div>
                <h4 class="font-semibold text-gray-900">最大单笔支出</h4>
                <p class="text-gray-600">{{ yearStats.maxExpenseCategory }} ¥{{ yearStats.maxExpenseAmount.toFixed(2) }}</p>
              </div>
            </div>
            <div class="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
              <i class="fas fa-shopping-bag text-orange-500 mt-1"></i>
              <div>
                <h4 class="font-semibold text-gray-900">消费最多类别</h4>
                <p class="text-gray-600">{{ yearStats.topExpenseCategory }} 占比 {{ yearStats.topExpenseCategoryPercent.toFixed(1) }}%</p>
              </div>
            </div>
            <div class="flex items-start space-x-3 p-4 bg-teal-50 rounded-lg">
              <i class="fas fa-calendar-check text-teal-500 mt-1"></i>
              <div>
                <h4 class="font-semibold text-gray-900">消费频率</h4>
                <p class="text-gray-600">平均每{{ yearStats.avgDaysBetweenExpense.toFixed(1) }}天消费一次</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 月度趋势图 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">月度收支趋势</h3>
        <div class="h-80">
          <canvas ref="monthlyChart"></canvas>
        </div>
      </div>

      <!-- 支出分类排行 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">支出分类排行</h3>
        <div class="space-y-3">
          <div v-for="(item, index) in yearStats.expenseRanking" :key="index" class="flex items-center">
            <span class="w-8 text-center font-bold text-gray-500">{{ index + 1 }}</span>
            <div class="flex-1 mx-4">
              <div class="flex justify-between mb-1">
                <span class="text-gray-700">{{ item.name }}</span>
                <span class="text-gray-900 font-medium">¥{{ item.amount.toFixed(2) }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-primary h-2 rounded-full" :style="{ width: item.percent + '%' }"></div>
              </div>
            </div>
            <span class="w-16 text-right text-sm text-gray-500">{{ item.percent.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- 年度总结语 -->
      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-white text-center">
        <h3 class="text-2xl font-bold mb-4">{{ yearStats.summaryTitle }}</h3>
        <p class="text-lg opacity-90">{{ yearStats.summaryText }}</p>
      </div>
    </div>
  `,
  setup() {
    const monthlyChart = ref(null);
    const selectedYear = ref(new Date().getFullYear());
    const currentYear = new Date().getFullYear();
    
    const transactions = ref(JSON.parse(localStorage.getItem(getBookKey('transactions')) || '[]'));
    const categories = ref(JSON.parse(localStorage.getItem(getBookKey('categories')) || JSON.stringify(defaultCategories)));
    
    const changeYear = (delta) => {
      const newYear = selectedYear.value + delta;
      if (newYear <= currentYear && newYear >= 2020) {
        selectedYear.value = newYear;
        nextTick(() => {
          updateMonthlyChart();
        });
      }
    };
    
    const yearTransactions = computed(() => {
      return transactions.value.filter(t => {
        const year = parseInt(t.date.split('-')[0]);
        return year === selectedYear.value;
      });
    });
    
    const getCategoryName = (categoryId) => {
      if (!categoryId) return '其他';
      for (const parent of categories.value) {
        if (parent.id === categoryId) return parent.name;
        const child = parent.children?.find(c => c.id === categoryId);
        if (child) return child.name;
      }
      return '其他';
    };
    
    const yearStats = computed(() => {
      const yearTrans = yearTransactions.value;
      const incomeTrans = yearTrans.filter(t => t.type === 'income');
      const expenseTrans = yearTrans.filter(t => t.type === 'expense');
      
      const totalIncome = incomeTrans.reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = expenseTrans.reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
      
      // 月度统计
      const monthlyData = {};
      for (let i = 1; i <= 12; i++) {
        monthlyData[i] = { income: 0, expense: 0 };
      }
      yearTrans.forEach(t => {
        const month = parseInt(t.date.split('-')[1]);
        if (t.type === 'income') {
          monthlyData[month].income += t.amount;
        } else if (t.type === 'expense') {
          monthlyData[month].expense += t.amount;
        }
      });
      
      // 最佳/最差月份
      let bestIncomeMonth = '';
      let bestIncomeAmount = 0;
      let worstExpenseMonth = '';
      let worstExpenseAmount = 0;
      let bestSavingsMonth = '';
      let bestSavingsAmount = -Infinity;
      
      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      
      for (let i = 1; i <= 12; i++) {
        if (monthlyData[i].income > bestIncomeAmount) {
          bestIncomeAmount = monthlyData[i].income;
          bestIncomeMonth = monthNames[i - 1];
        }
        if (monthlyData[i].expense > worstExpenseAmount) {
          worstExpenseAmount = monthlyData[i].expense;
          worstExpenseMonth = monthNames[i - 1];
        }
        const savings = monthlyData[i].income - monthlyData[i].expense;
        if (savings > bestSavingsAmount) {
          bestSavingsAmount = savings;
          bestSavingsMonth = monthNames[i - 1];
        }
      }
      
      // 支出分类统计
      const categoryMap = {};
      expenseTrans.forEach(t => {
        const name = getCategoryName(t.categoryId);
        categoryMap[name] = (categoryMap[name] || 0) + t.amount;
      });
      
      const expenseRanking = Object.entries(categoryMap)
        .map(([name, amount]) => ({ name, amount, percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0 }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      const topExpenseCategory = expenseRanking.length > 0 ? expenseRanking[0].name : '-';
      const topExpenseCategoryPercent = expenseRanking.length > 0 ? expenseRanking[0].percent : 0;
      
      // 最大单笔支出
      let maxExpenseAmount = 0;
      let maxExpenseCategory = '-';
      expenseTrans.forEach(t => {
        if (t.amount > maxExpenseAmount) {
          maxExpenseAmount = t.amount;
          maxExpenseCategory = getCategoryName(t.categoryId);
        }
      });
      
      // 活跃天数
      const activeDays = new Set(expenseTrans.map(t => t.date)).size;
      const avgDailyExpense = activeDays > 0 ? totalExpense / activeDays : 0;
      const avgDaysBetweenExpense = activeDays > 0 ? 365 / activeDays : 0;
      
      // 总结语
      let summaryTitle = '';
      let summaryText = '';
      
      if (savingsRate >= 30) {
        summaryTitle = '🎉 理财达人';
        summaryText = `您在${selectedYear.value}年表现非常出色！储蓄率达到${savingsRate.toFixed(1)}%，为未来的财务目标打下了坚实的基础。继续保持！`;
      } else if (savingsRate >= 10) {
        summaryTitle = '👍 稳健理财';
        summaryText = `您在${selectedYear.value}年的财务状况良好，储蓄率为${savingsRate.toFixed(1)}%。适当控制支出，您会做得更好！`;
      } else if (savingsRate >= 0) {
        summaryTitle = '💪 继续努力';
        summaryText = `您在${selectedYear.value}年基本实现了收支平衡。建议制定预算计划，培养储蓄习惯，为未来做准备。`;
      } else {
        summaryTitle = '⚠️ 需要关注';
        summaryText = `您在${selectedYear.value}年支出超过了收入。建议审视消费习惯，制定合理的理财计划，避免入不敷出。`;
      }
      
      return {
        totalIncome,
        totalExpense,
        balance,
        savingsRate,
        incomeTransactions: incomeTrans.length,
        expenseTransactions: expenseTrans.length,
        bestIncomeMonth,
        bestIncomeAmount,
        worstExpenseMonth,
        worstExpenseAmount,
        bestSavingsMonth,
        bestSavingsAmount,
        topExpenseCategory,
        topExpenseCategoryPercent,
        maxExpenseAmount,
        maxExpenseCategory,
        activeDays,
        avgDailyExpense,
        avgDaysBetweenExpense,
        expenseRanking,
        summaryTitle,
        summaryText,
        monthlyData
      };
    });
    
    const updateMonthlyChart = () => {
      const ctx = monthlyChart.value?.getContext('2d');
      if (!ctx) return;
      
      const stats = yearStats.value;
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const incomeData = months.map((_, i) => stats.monthlyData[i + 1].income);
      const expenseData = months.map((_, i) => stats.monthlyData[i + 1].expense);
      
      if (window.monthlyChartInstance) {
        window.monthlyChartInstance.destroy();
      }
      
      window.monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            {
              label: '收入',
              data: incomeData,
              backgroundColor: '#10b981',
              borderRadius: 4
            },
            {
              label: '支出',
              data: expenseData,
              backgroundColor: '#ef4444',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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
    };
    
    onMounted(() => {
      nextTick(() => {
        updateMonthlyChart();
      });
    });
    
    // 移除watch，避免循环依赖
    // 直接在changeYear函数中调用updateMonthlyChart
    
    return {
      monthlyChart,
      selectedYear,
      currentYear,
      yearStats,
      changeYear
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
  { path: '/dimensions', component: DimensionsView },
  { path: '/statistics', component: StatisticsView },
  { path: '/import', component: ImportView },
  { path: '/admin', component: AdminView },
  { path: '/year-review', component: YearReviewView }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  if (to.path === '/admin' && !currentUser.isAdmin) {
    alert('您没有权限访问此页面');
    next('/');
    return;
  }
  
  next();
});

// 根组件
const App = {
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav v-if="isAuthenticated" class="bg-white shadow-md">
        <div class="container mx-auto px-4 py-3">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-4">
              <router-link to="/" class="text-xl font-bold text-primary">个人记账</router-link>
              <div class="hidden md:flex space-x-6">
                <router-link to="/" class="text-gray-600 hover:text-primary">记账</router-link>
                <router-link to="/assets" class="text-gray-600 hover:text-primary">资产</router-link>
                <router-link to="/accounts" class="text-gray-600 hover:text-primary">账户管理</router-link>
                <router-link to="/dimensions" class="text-gray-600 hover:text-primary">维度管理</router-link>
                <router-link to="/statistics" class="text-gray-600 hover:text-primary">统计分析</router-link>
                <router-link to="/year-review" class="text-indigo-600 hover:text-indigo-700 font-medium">
                  <i class="fas fa-calendar-alt mr-1"></i>年度回顾
                </router-link>
                <router-link to="/import" class="text-gray-600 hover:text-primary">数据导入</router-link>
                <router-link v-if="currentUser.isAdmin" to="/admin" class="text-purple-600 hover:text-purple-700 font-medium">
                  管理员
                </router-link>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <!-- 账套选择器 -->
              <div class="relative">
                <select v-model="currentBookId" @change="switchBook" 
                  class="px-3 py-2 bg-purple-50 border border-purple-200 rounded-md text-sm font-medium text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option v-for="book in books" :key="book.id" :value="book.id">{{ book.name }}</option>
                </select>
                <button @click="showAddBookModal = true" class="ml-2 px-2 py-2 bg-purple-100 hover:bg-purple-200 rounded-md text-purple-700 text-sm">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <span class="text-sm text-gray-600">{{ currentUser.username }}</span>
              <button @click="exportData" class="px-4 py-2 bg-green-200 hover:bg-green-300 rounded-md text-sm font-medium text-green-800">
                导出数据
              </button>
              <button @click="logout" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main class="container mx-auto px-4 py-8">
        <router-view />
      </main>
      
      <!-- 新增账套模态框 -->
      <div v-if="showAddBookModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-96">
          <h3 class="text-lg font-bold text-gray-900 mb-4">新增账套</h3>
          <input v-model="newBookName" type="text" placeholder="请输入账套名称" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-primary focus:border-primary">
          <div class="flex justify-end space-x-3">
            <button @click="showAddBookModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
              取消
            </button>
            <button @click="addBook" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-700">
              确定
            </button>
          </div>
        </div>
      </div>
      
      <!-- 版本升级提示模态框 -->
      <div v-if="showUpdateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-96">
          <div class="flex items-center mb-4">
            <i class="fas fa-bell text-yellow-500 text-2xl mr-3"></i>
            <h3 class="text-lg font-bold text-gray-900">发现新版本</h3>
          </div>
          <p class="text-gray-600 mb-4">当前版本: {{ currentVersion }}</p>
          <p class="text-gray-600 mb-4">最新版本: {{ latestVersion }}</p>
          <div class="flex justify-end space-x-3">
            <button @click="showUpdateModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">
              稍后再说
            </button>
            <button @click="downloadUpdate" class="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-700">
              立即升级
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const isAuthenticated = ref(false);
    const currentUser = ref({});
    
    // 账套管理
    const currentBookId = ref(localStorage.getItem('currentBookId') || 'default');
    const books = ref(JSON.parse(localStorage.getItem('books') || JSON.stringify([{ id: 'default', name: '默认账套' }])));
    const showAddBookModal = ref(false);
    const newBookName = ref('');
    
    // 版本控制
    const currentVersion = ref(APP_VERSION);
    const latestVersion = ref('');
    const showUpdateModal = ref(false);
    const updateUrl = ref('');
    
    // 获取当前账套的localStorage key
    const getBookKey = (key) => `${key}_${currentBookId.value}`;
    
    const switchBook = () => {
      localStorage.setItem('currentBookId', currentBookId.value);
      // 刷新页面以加载新账套的数据
      window.location.reload();
    };
    
    const addBook = () => {
      if (!newBookName.value.trim()) {
        alert('请输入账套名称');
        return;
      }
      
      const newBook = {
        id: 'book_' + Date.now(),
        name: newBookName.value.trim()
      };
      
      books.value.push(newBook);
      localStorage.setItem('books', JSON.stringify(books.value));
      
      currentBookId.value = newBook.id;
      localStorage.setItem('currentBookId', newBook.id);
      
      showAddBookModal.value = false;
      newBookName.value = '';
      
      // 刷新页面
      window.location.reload();
    };
    
    // 检查版本更新
    const checkForUpdates = async () => {
      try {
        const response = await fetch(GITHUB_REPO);
        if (response.ok) {
          const data = await response.json();
          const latestVersionStr = data.tag_name.replace('v', '');
          if (compareVersions(latestVersionStr, APP_VERSION) > 0) {
            latestVersion.value = latestVersionStr;
            updateUrl.value = data.html_url;
            showUpdateModal.value = true;
          }
        }
      } catch (error) {
        console.log('版本检查失败:', error);
      }
    };
    
    // 下载更新
    const downloadUpdate = () => {
      window.open(updateUrl.value, '_blank');
      showUpdateModal.value = false;
    };
    
    const checkAuth = () => {
      const user = localStorage.getItem('currentUser');
      isAuthenticated.value = !!user;
      currentUser.value = JSON.parse(user || '{}');
      if (!isAuthenticated.value && window.location.hash !== '#/login' && window.location.hash !== '#/register') {
        window.location.hash = '#/login';
      }
    };

    const logout = () => {
      localStorage.removeItem('currentUser');
      isAuthenticated.value = false;
      currentUser.value = {};
      window.location.hash = '#/login';
    };

    const exportData = () => {
      const transactions = JSON.parse(localStorage.getItem(getBookKey('transactions')) || '[]');
      const accounts = JSON.parse(localStorage.getItem(getBookKey('accounts')) || '[]');
      const categories = JSON.parse(localStorage.getItem(getBookKey('categories')) || '[]');
      const merchants = JSON.parse(localStorage.getItem(getBookKey('merchants')) || '[]');
      const projects = JSON.parse(localStorage.getItem(getBookKey('projects')) || '[]');
      const members = JSON.parse(localStorage.getItem(getBookKey('members')) || '[]');
      
      // 辅助函数
      const getCategoryName = (categoryId) => {
        if (!categoryId) return '';
        for (const parent of categories) {
          if (parent.id === categoryId) return parent.name;
          const child = parent.children?.find(c => c.id === categoryId);
          if (child) return `${parent.name} > ${child.name}`;
        }
        return '';
      };
      
      const getAccountName = (accountId) => {
        if (!accountId) return '';
        const account = accounts.find(a => a.id === accountId);
        return account ? account.name : '';
      };
      
      const getMerchantName = (merchantId) => {
        if (!merchantId) return '';
        const merchant = merchants.find(m => m.id === merchantId);
        return merchant ? merchant.name : '';
      };
      
      const getProjectName = (projectId) => {
        if (!projectId) return '';
        const project = projects.find(p => p.id === projectId);
        return project ? project.name : '';
      };
      
      const getMemberName = (memberId) => {
        if (!memberId) return '';
        const member = members.find(m => m.id === memberId);
        return member ? member.name : '';
      };
      
      const getTypeText = (type) => {
        const typeMap = { 'income': '收入', 'expense': '支出', 'transfer': '转账' };
        return typeMap[type] || type;
      };
      
      // CSV表头
      const headers = ['日期', '类型', '金额', '分类', '账户', '转出账户', '转入账户', '商家', '项目', '成员', '备注'];
      
      // CSV内容
      const rows = transactions.map(t => {
        return [
          t.date,
          getTypeText(t.type),
          t.amount,
          getCategoryName(t.categoryId),
          getAccountName(t.accountId),
          getAccountName(t.fromAccountId),
          getAccountName(t.toAccountId),
          getMerchantName(t.merchantId),
          getProjectName(t.projectId),
          getMemberName(t.memberId),
          t.description || ''
        ].map(field => {
          // 处理包含逗号或引号的字段
          const str = String(field || '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',');
      });
      
      // BOM用于Excel正确识别UTF-8
      const BOM = '\uFEFF';
      const csvContent = BOM + headers.join(',') + '\n' + rows.join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `记账数据_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    onMounted(() => {
      checkAuth();
      window.addEventListener('hashchange', checkAuth);
      // 检查版本更新
      checkForUpdates();
    });

    return { 
      isAuthenticated, 
      currentUser, 
      logout, 
      exportData,
      currentBookId,
      books,
      showAddBookModal,
      newBookName,
      switchBook,
      addBook,
      // 版本控制
      currentVersion,
      latestVersion,
      showUpdateModal,
      downloadUpdate
    };
  }
};

// 创建应用
const app = createApp(App);
app.use(router);
app.mount('#app');
