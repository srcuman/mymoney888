<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">收支统计</h2>
      
      <!-- 时间范围选择 -->
      <div class="mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex space-x-2">
            <button @click="setTimeRange('today')" :class="activeTimeRange === 'today' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              今日
            </button>
            <button @click="setTimeRange('yesterday')" :class="activeTimeRange === 'yesterday' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              昨日
            </button>
            <button @click="setTimeRange('thisWeek')" :class="activeTimeRange === 'thisWeek' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              本周
            </button>
            <button @click="setTimeRange('thisMonth')" :class="activeTimeRange === 'thisMonth' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              本月
            </button>
            <button @click="setTimeRange('lastMonth')" :class="activeTimeRange === 'lastMonth' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              上月
            </button>
            <button @click="setTimeRange('thisYear')" :class="activeTimeRange === 'thisYear' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              今年
            </button>
            <button @click="setTimeRange('lastYear')" :class="activeTimeRange === 'lastYear' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              去年
            </button>
            <button @click="setTimeRange('twoYearsAgo')" :class="activeTimeRange === 'twoYearsAgo' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-3 py-1 rounded-md text-sm font-medium">
              前年
            </button>
          </div>
          <div class="flex space-x-2">
            <input type="date" v-model="dateRange.start" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm">
            <span class="text-gray-500 dark:text-gray-400">至</span>
            <input type="date" v-model="dateRange.end" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm">
            <button @click="applyDateRange" class="px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              应用
            </button>
          </div>
        </div>
      </div>
      
      <!-- 维度筛选 -->
      <div class="mb-6">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">维度筛选</h3>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">成员</label>
            <div class="border border-gray-300 dark:border-gray-600 rounded-md p-2 max-h-32 overflow-y-auto dark:bg-gray-700">
              <div v-if="members.length > 0" class="flex items-center mb-2">
                <input type="checkbox" id="select-all-members" @change="toggleSelectAll('member')" class="mr-2">
                <label for="select-all-members" class="text-sm font-medium text-gray-700 dark:text-gray-300">全选</label>
              </div>
              <!-- 空值选项 -->
              <div class="flex items-center mb-1">
                <input type="checkbox" id="member-empty" value="__EMPTY__" v-model="filters.member" class="mr-2">
                <label for="member-empty" class="text-sm text-gray-700 dark:text-gray-300">未设置</label>
              </div>
              <div v-for="member in members" :key="member.id" class="flex items-center mb-1">
                <input type="checkbox" :id="'member-' + member.id" :value="member.name" v-model="filters.member" class="mr-2">
                <label :for="'member-' + member.id" class="text-sm text-gray-700 dark:text-gray-300">{{ member.name }}</label>
              </div>
              <div v-if="members.length === 0" class="text-sm text-gray-500 dark:text-gray-400">无成员数据</div>
            </div>
          </div>
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">商家</label>
            <div class="border border-gray-300 dark:border-gray-600 rounded-md p-2 max-h-32 overflow-y-auto dark:bg-gray-700">
              <div v-if="merchants.length > 0" class="flex items-center mb-2">
                <input type="checkbox" id="select-all-merchants" @change="toggleSelectAll('merchant')" class="mr-2">
                <label for="select-all-merchants" class="text-sm font-medium text-gray-700 dark:text-gray-300">全选</label>
              </div>
              <!-- 空值选项 -->
              <div class="flex items-center mb-1">
                <input type="checkbox" id="merchant-empty" value="__EMPTY__" v-model="filters.merchant" class="mr-2">
                <label for="merchant-empty" class="text-sm text-gray-700 dark:text-gray-300">未设置</label>
              </div>
              <div v-for="merchant in merchants" :key="merchant.id" class="flex items-center mb-1">
                <input type="checkbox" :id="'merchant-' + merchant.id" :value="merchant.name" v-model="filters.merchant" class="mr-2">
                <label :for="'merchant-' + merchant.id" class="text-sm text-gray-700 dark:text-gray-300">{{ merchant.name }}</label>
              </div>
              <div v-if="merchants.length === 0" class="text-sm text-gray-500 dark:text-gray-400">无商家数据</div>
            </div>
          </div>
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">标签</label>
            <div class="border border-gray-300 dark:border-gray-600 rounded-md p-2 max-h-32 overflow-y-auto dark:bg-gray-700">
              <div v-if="tags.length > 0" class="flex items-center mb-2">
                <input type="checkbox" id="select-all-tags" @change="toggleSelectAll('tag')" class="mr-2">
                <label for="select-all-tags" class="text-sm font-medium text-gray-700 dark:text-gray-300">全选</label>
              </div>
              <!-- 空值选项 -->
              <div class="flex items-center mb-1">
                <input type="checkbox" id="tag-empty" value="__EMPTY__" v-model="filters.tag" class="mr-2">
                <label for="tag-empty" class="text-sm text-gray-700 dark:text-gray-300">未设置</label>
              </div>
              <div v-for="tag in tags" :key="tag.id" class="flex items-center mb-1">
                <input type="checkbox" :id="'tag-' + tag.id" :value="tag.name" v-model="filters.tag" class="mr-2">
                <label :for="'tag-' + tag.id" class="text-sm text-gray-700 dark:text-gray-300">{{ tag.name }}</label>
              </div>
              <div v-if="tags.length === 0" class="text-sm text-gray-500 dark:text-gray-400">无标签数据</div>
            </div>
          </div>
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">支付渠道</label>
            <div class="border border-gray-300 dark:border-gray-600 rounded-md p-2 max-h-32 overflow-y-auto dark:bg-gray-700">
              <div v-if="paymentChannels.length > 0" class="flex items-center mb-2">
                <input type="checkbox" id="select-all-channels" @change="toggleSelectAll('paymentChannel')" class="mr-2">
                <label for="select-all-channels" class="text-sm font-medium text-gray-700 dark:text-gray-300">全选</label>
              </div>
              <!-- 空值选项 -->
              <div class="flex items-center mb-1">
                <input type="checkbox" id="channel-empty" value="__EMPTY__" v-model="filters.paymentChannel" class="mr-2">
                <label for="channel-empty" class="text-sm text-gray-700 dark:text-gray-300">未设置</label>
              </div>
              <div v-for="channel in paymentChannels" :key="channel.id" class="flex items-center mb-1">
                <input type="checkbox" :id="'channel-' + channel.id" :value="channel.name" v-model="filters.paymentChannel" class="mr-2">
                <label :for="'channel-' + channel.id" class="text-sm text-gray-700 dark:text-gray-300">{{ channel.name }}</label>
              </div>
              <div v-if="paymentChannels.length === 0" class="text-sm text-gray-500 dark:text-gray-400">无支付渠道数据</div>
            </div>
          </div>
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">分类</label>
            <div class="border border-gray-300 dark:border-gray-600 rounded-md p-2 max-h-32 overflow-y-auto dark:bg-gray-700">
              <div v-if="incomeCategoryList.length > 0 || expenseCategoryList.length > 0" class="flex items-center mb-2">
                <input type="checkbox" id="select-all-categories" @change="toggleSelectAll('category')" class="mr-2">
                <label for="select-all-categories" class="text-sm font-medium text-gray-700 dark:text-gray-300">全选</label>
              </div>
              <!-- 收入分类 -->
              <div v-if="incomeCategoryList.length > 0" class="mb-3">
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">收入分类</div>
                <div v-for="category in incomeCategoryList" :key="'income-' + category.name" class="mb-1">
                  <div class="flex items-center">
                    <input type="checkbox" :id="'income-category-' + category.name" :value="category.name" v-model="filters.category" class="mr-2">
                    <label :for="'income-category-' + category.name" class="text-sm text-gray-700 dark:text-gray-300">{{ category.name }}</label>
                  </div>
                  <!-- 子分类 -->
                  <div v-if="category.subcategories && category.subcategories.length > 0" class="ml-6 mt-1">
                    <div v-for="subcategory in category.subcategories" :key="'income-sub-' + subcategory.name" class="flex items-center mb-1">
                      <input type="checkbox" :id="'income-subcategory-' + subcategory.name" :value="subcategory.name" v-model="filters.category" class="mr-2">
                      <label :for="'income-subcategory-' + subcategory.name" class="text-xs text-gray-600 dark:text-gray-400">{{ subcategory.name }}</label>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 支出分类 -->
              <div v-if="expenseCategoryList.length > 0">
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">支出分类</div>
                <div v-for="category in expenseCategoryList" :key="'expense-' + category.name" class="mb-1">
                  <div class="flex items-center">
                    <input type="checkbox" :id="'expense-category-' + category.name" :value="category.name" v-model="filters.category" class="mr-2">
                    <label :for="'expense-category-' + category.name" class="text-sm text-gray-700 dark:text-gray-300">{{ category.name }}</label>
                  </div>
                  <!-- 子分类 -->
                  <div v-if="category.subcategories && category.subcategories.length > 0" class="ml-6 mt-1">
                    <div v-for="subcategory in category.subcategories" :key="'expense-sub-' + subcategory.name" class="flex items-center mb-1">
                      <input type="checkbox" :id="'expense-subcategory-' + subcategory.name" :value="subcategory.name" v-model="filters.category" class="mr-2">
                      <label :for="'expense-subcategory-' + subcategory.name" class="text-xs text-gray-600 dark:text-gray-400">{{ subcategory.name }}</label>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="incomeCategoryList.length === 0 && expenseCategoryList.length === 0" class="text-sm text-gray-500 dark:text-gray-400">无分类数据</div>
            </div>
          </div>
        </div>
        <div class="mt-3 flex justify-end">
          <button @click="resetFilters" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium">
            重置筛选
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- 收支分类明细 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">收支分类明细</h3>
          <div class="space-y-6">
            <div v-if="expenseCategories.length > 0">
              <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">支出分类</h4>
              <div class="space-y-3">
                <div v-for="(item, index) in expenseCategories" :key="index" class="flex justify-between items-center">
                  <span class="text-gray-700 dark:text-gray-300">{{ item.category }}</span>
                  <div class="flex items-center">
                    <span class="text-danger font-medium mr-2">{{ item.amount.toFixed(2) }}</span>
                    <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div class="bg-danger h-2 rounded-full" :style="{ width: item.percentage + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="incomeCategories.length > 0">
              <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">收入分类</h4>
              <div class="space-y-3">
                <div v-for="(item, index) in incomeCategories" :key="index" class="flex justify-between items-center">
                  <span class="text-gray-700 dark:text-gray-300">{{ item.category }}</span>
                  <div class="flex items-center">
                    <span class="text-secondary font-medium mr-2">{{ item.amount.toFixed(2) }}</span>
                    <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div class="bg-secondary h-2 rounded-full" :style="{ width: item.percentage + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="expenseCategories.length === 0 && incomeCategories.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              根据筛选条件，暂无数据
            </div>
          </div>
        </div>
        
        <!-- 收支占比饼图 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">收支占比</h3>
          <div class="h-64 flex items-center justify-center">
            <div class="w-full h-full">
              <!-- 饼图占位 -->
              <div class="bg-gray-100 dark:bg-gray-700 rounded-full h-48 w-48 mx-auto flex items-center justify-center">
                <p class="text-gray-500 dark:text-gray-400">饼图：收支分类占比</p>
              </div>
              <!-- 图例 -->
              <div class="mt-4 grid grid-cols-2 gap-2">
                <div v-for="(item, index) in expenseCategories.slice(0, 4)" :key="index" class="flex items-center">
                  <div class="w-3 h-3 rounded-full bg-danger mr-2"></div>
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.category }}</span>
                </div>
                <div v-for="(item, index) in incomeCategories.slice(0, 4)" :key="index" class="flex items-center">
                  <div class="w-3 h-3 rounded-full bg-secondary mr-2"></div>
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.category }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 收支趋势柱状图 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">收支趋势</h3>
        <div class="h-64 flex items-center justify-center">
          <div class="w-full h-full">
            <!-- 柱状图占位 -->
            <div class="bg-gray-100 dark:bg-gray-700 rounded-lg h-full w-full flex items-center justify-center">
              <p class="text-gray-500 dark:text-gray-400">柱状图：月度收支趋势</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 收支概览卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-blue-600 dark:text-blue-400">总收入</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ yearlyIncome.toFixed(2) }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">较上期 <span class="text-green-600 dark:text-green-400">+12.5%</span></p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-red-600 dark:text-red-400">总支出</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ yearlyExpense.toFixed(2) }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">较上期 <span class="text-red-600 dark:text-red-400">+8.3%</span></p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-green-600 dark:text-green-400">结余</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ yearlyBalance.toFixed(2) }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">较上期 <span class="text-green-600 dark:text-green-400">+25.7%</span></p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-purple-600 dark:text-purple-400">交易次数</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalTransactions }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">较上期 <span class="text-green-600 dark:text-green-400">+5.2%</span></p>
        </div>
      </div>
      
      <!-- 消费分析洞察 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">消费洞察</h3>
        <div class="space-y-3">
          <div class="flex items-start">
            <div class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mr-3 mt-0.5">
              <span class="text-yellow-600 dark:text-yellow-400">💡</span>
            </div>
            <div>
              <h4 class="text-md font-medium text-gray-900 dark:text-white">消费提醒</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">您本月餐饮支出占总支出的35%，建议适当控制。</p>
            </div>
          </div>
          <div class="flex items-start">
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
              <span class="text-blue-600 dark:text-blue-400">📊</span>
            </div>
            <div>
              <h4 class="text-md font-medium text-gray-900 dark:text-white">支出趋势</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">您最近3个月的支出呈现上升趋势，平均每月增长8.3%。</p>
            </div>
          </div>
          <div class="flex items-start">
            <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
              <span class="text-green-600 dark:text-green-400">🎯</span>
            </div>
            <div>
              <h4 class="text-md font-medium text-gray-900 dark:text-white">省钱建议</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">根据您的消费习惯，建议优化购物和娱乐支出，每月可节省约500元。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">年度概览</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-blue-600 dark:text-blue-400">年度总收入</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ yearlyIncome.toFixed(2) }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-red-600 dark:text-red-400">年度总支出</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ yearlyExpense.toFixed(2) }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-green-600 dark:text-green-400">年度结余</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ yearlyBalance.toFixed(2) }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-purple-600 dark:text-purple-400">交易次数</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalTransactions }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 交易记录
const transactions = ref([
  { id: 1, type: 'expense', amount: 50, category: '餐饮', account: 1, description: '午餐', date: '2026-03-01' },
  { id: 2, type: 'income', amount: 5000, category: '工资', account: 2, description: '月薪', date: '2026-03-01' },
  { id: 3, type: 'expense', amount: 200, category: '购物', account: 3, description: '超市购物', date: '2026-02-29' },
  { id: 4, type: 'expense', amount: 30, category: '交通', account: 4, description: '打车', date: '2026-02-29' },
  { id: 5, type: 'expense', amount: 100, category: '娱乐', account: 1, description: '电影', date: '2026-02-28' },
  { id: 6, type: 'income', amount: 500, category: '投资', account: 2, description: '股息', date: '2026-02-20' }
])

// 时间范围
const dateRange = ref({
  start: '',
  end: ''
})

// 活跃时间范围
const activeTimeRange = ref('thisMonth')

// 筛选条件
const filters = ref({
  member: [],
  merchant: [],
  tag: [],
  paymentChannel: [],
  category: []
})

// 成员列表
const members = ref([])

// 商家列表
const merchants = ref([])

// 标签列表
const tags = ref([])

// 支付渠道列表
const paymentChannels = ref([])

// 收入分类列表
const incomeCategoryList = ref([])

// 支出分类列表
const expenseCategoryList = ref([])

// 所有分类列表
const allCategories = computed(() => {
  const categories = new Set()
  
  // 从收入分类列表中添加分类
  incomeCategoryList.value.forEach(category => {
    categories.add(category.name)
    // 添加子分类
    if (category.subcategories) {
      category.subcategories.forEach(subcategory => {
        categories.add(subcategory.name)
      })
    }
  })
  
  // 从支出分类列表中添加分类
  expenseCategoryList.value.forEach(category => {
    categories.add(category.name)
    // 添加子分类
    if (category.subcategories) {
      category.subcategories.forEach(subcategory => {
        categories.add(subcategory.name)
      })
    }
  })
  
  // 从现有交易中添加分类（确保不遗漏）
  transactions.value.forEach(t => {
    if (t.category) {
      categories.add(t.category)
    }
  })
  
  return Array.from(categories)
})

// 过滤后的交易记录
const filteredTransactions = computed(() => {
  let result = transactions.value
  
  // 时间范围过滤
  if (dateRange.value.start && dateRange.value.end) {
    result = result.filter(t => {
      return t.date >= dateRange.value.start && t.date <= dateRange.value.end
    })
  }
  
  // 成员过滤（多选）
  if (filters.value.member.length > 0) {
    result = result.filter(t => {
      const hasEmpty = filters.value.member.includes('__EMPTY__')
      return filters.value.member.includes(t.member) || (hasEmpty && !t.member)
    })
  }
  
  // 商家过滤（多选）
  if (filters.value.merchant.length > 0) {
    result = result.filter(t => {
      const hasEmpty = filters.value.merchant.includes('__EMPTY__')
      return filters.value.merchant.includes(t.merchant) || (hasEmpty && !t.merchant)
    })
  }
  
  // 标签过滤（多选）
  if (filters.value.tag.length > 0) {
    result = result.filter(t => {
      const hasEmpty = filters.value.tag.includes('__EMPTY__')
      return filters.value.tag.includes(t.tag) || (hasEmpty && !t.tag)
    })
  }
  
  // 支付渠道过滤（多选）
  if (filters.value.paymentChannel.length > 0) {
    result = result.filter(t => {
      const hasEmpty = filters.value.paymentChannel.includes('__EMPTY__')
      return filters.value.paymentChannel.includes(t.paymentChannel) || (hasEmpty && !t.paymentChannel)
    })
  }
  
  // 分类过滤（多选）
  if (filters.value.category.length > 0) {
    result = result.filter(t => filters.value.category.includes(t.category))
  }
  
  return result
})

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    member: [],
    merchant: [],
    tag: [],
    paymentChannel: [],
    category: []
  }
}

// 设置时间范围
const setTimeRange = (range) => {
  activeTimeRange.value = range
  const today = new Date()
  let startDate, endDate
  
  switch (range) {
    case 'today':
      startDate = today.toISOString().split('T')[0]
      endDate = startDate
      break
    case 'yesterday':
      startDate = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0]
      endDate = startDate
      break
    case 'thisWeek':
      // 计算本周一
      const monday = new Date(today)
      monday.setDate(today.getDate() - today.getDay() + 1)
      startDate = monday.toISOString().split('T')[0]
      endDate = today.toISOString().split('T')[0]
      break
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      endDate = today.toISOString().split('T')[0]
      break
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
      endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
      break
    case 'thisYear':
      startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
      endDate = today.toISOString().split('T')[0]
      break
    case 'lastYear':
      startDate = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0]
      endDate = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
      break
    case 'twoYearsAgo':
      startDate = new Date(today.getFullYear() - 2, 0, 1).toISOString().split('T')[0]
      endDate = new Date(today.getFullYear() - 2, 11, 31).toISOString().split('T')[0]
      break
  }
  
  dateRange.value.start = startDate
  dateRange.value.end = endDate
}

// 应用日期范围
const applyDateRange = () => {
  activeTimeRange.value = 'custom'
}

// 全选/取消全选
const toggleSelectAll = (filterType) => {
  const checkbox = document.getElementById(`select-all-${filterType === 'member' ? 'members' : filterType === 'merchant' ? 'merchants' : filterType === 'tag' ? 'tags' : filterType === 'paymentChannel' ? 'channels' : 'categories'}`)
  const isChecked = checkbox.checked
  
  switch (filterType) {
    case 'member':
      filters.value.member = isChecked ? members.value.map(m => m.name) : []
      break
    case 'merchant':
      filters.value.merchant = isChecked ? merchants.value.map(m => m.name) : []
      break
    case 'tag':
      filters.value.tag = isChecked ? tags.value.map(t => t.name) : []
      break
    case 'paymentChannel':
      filters.value.paymentChannel = isChecked ? paymentChannels.value.map(c => c.name) : []
      break
    case 'category':
      filters.value.category = isChecked ? allCategories.value : []
      break
  }
}

// 计算支出分类统计
const expenseCategories = computed(() => {
  const expenses = filteredTransactions.value.filter(t => t.type === 'expense')
  const totalExpense = expenses.reduce((total, t) => total + t.amount, 0)
  
  const categoryMap = {}
  // 先初始化所有支出分类
  expenseCategoryList.value.forEach(category => {
    categoryMap[category.name] = 0
  })
  
  // 统计各分类金额
  expenses.forEach(t => {
    if (categoryMap[t.category] !== undefined) {
      categoryMap[t.category] += t.amount
    } else {
      categoryMap[t.category] = t.amount
    }
  })
  
  return Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
  })).sort((a, b) => b.amount - a.amount)
})

// 计算收入分类统计
const incomeCategories = computed(() => {
  const incomes = filteredTransactions.value.filter(t => t.type === 'income')
  const totalIncome = incomes.reduce((total, t) => total + t.amount, 0)
  
  const categoryMap = {}
  // 先初始化所有收入分类
  incomeCategoryList.value.forEach(category => {
    categoryMap[category.name] = 0
  })
  
  // 统计各分类金额
  incomes.forEach(t => {
    if (categoryMap[t.category] !== undefined) {
      categoryMap[t.category] += t.amount
    } else {
      categoryMap[t.category] = t.amount
    }
  })
  
  return Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
  })).sort((a, b) => b.amount - a.amount)
})

// 计算年度总收入
const yearlyIncome = computed(() => {
  return filteredTransactions.value
    .filter(t => t.type === 'income')
    .reduce((total, t) => total + t.amount, 0)
})

// 计算年度总支出
const yearlyExpense = computed(() => {
  return filteredTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((total, t) => total + t.amount, 0)
})

// 计算年度结余
const yearlyBalance = computed(() => {
  return yearlyIncome.value - yearlyExpense.value
})

// 计算总交易次数
const totalTransactions = computed(() => {
  return filteredTransactions.value.length
})

onMounted(() => {
  // 从本地存储加载数据
  const savedTransactions = localStorage.getItem('transactions')
  const savedDimensions = localStorage.getItem('dimensions')
  
  if (savedTransactions) {
    transactions.value = JSON.parse(savedTransactions)
  }
  
  if (savedDimensions) {
    const dimensions = JSON.parse(savedDimensions)
    members.value = dimensions.members || []
    merchants.value = dimensions.merchants || []
    tags.value = dimensions.tags || []
    paymentChannels.value = dimensions.paymentChannels || []
    incomeCategoryList.value = dimensions.incomeCategories || []
    expenseCategoryList.value = dimensions.expenseCategories || []
  }
  
  // 初始化时间范围为本月
  setTimeRange('thisMonth')
})
</script>