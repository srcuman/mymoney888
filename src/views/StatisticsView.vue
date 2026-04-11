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
      
      <!-- 分类筛选 -->
      <div class="mb-6">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类筛选</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 收入分类 -->
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">收入分类</label>
            <div class="relative">
              <button @click="toggleDropdown('incomeCategories')" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm flex justify-between items-center">
                <span>{{ filters.category.length > 0 ? `已选择 ${filters.category.length} 个分类` : '选择收入分类' }}</span>
                <span>{{ dropdowns.incomeCategories ? '▼' : '▶' }}</span>
              </button>
              <div v-if="dropdowns.incomeCategories" class="absolute z-10 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-700 mt-1">
                <div v-if="incomeCategoryList.length > 0" class="p-2 border-b border-gray-200 dark:border-gray-700">
                  <button @click="selectAllIncomeCategories()" class="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left px-2 py-1 rounded">全选</button>
                </div>
                <div v-for="category in incomeCategoryList" :key="'income-' + category.name" class="p-2">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="filters.category.includes(category.name)" @change="selectCategory(category.name)" class="mr-2">
                    <label class="text-sm text-gray-700 dark:text-gray-300">{{ category.name }}</label>
                  </div>
                  <div v-if="category.children && category.children.length > 0" class="ml-6 mt-1">
                    <div v-for="subcategory in category.children" :key="'income-sub-' + subcategory.name" class="flex items-center mb-1">
                      <input type="checkbox" :checked="filters.category.includes(subcategory.name)" @change="selectCategory(subcategory.name)" class="mr-2">
                      <label class="text-xs text-gray-600 dark:text-gray-400">{{ subcategory.name }}</label>
                    </div>
                  </div>
                </div>
                <div v-if="incomeCategoryList.length === 0" class="p-2 text-sm text-gray-500 dark:text-gray-400">无收入分类数据</div>
              </div>
            </div>
          </div>
          <!-- 支出分类 -->
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">支出分类</label>
            <div class="relative">
              <button @click="toggleDropdown('expenseCategories')" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm flex justify-between items-center">
                <span>{{ filters.category.length > 0 ? `已选择 ${filters.category.length} 个分类` : '选择支出分类' }}</span>
                <span>{{ dropdowns.expenseCategories ? '▼' : '▶' }}</span>
              </button>
              <div v-if="dropdowns.expenseCategories" class="absolute z-10 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-700 mt-1">
                <div v-if="expenseCategoryList.length > 0" class="p-2 border-b border-gray-200 dark:border-gray-700">
                  <button @click="selectAllExpenseCategories()" class="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left px-2 py-1 rounded">全选</button>
                </div>
                <div v-for="category in expenseCategoryList" :key="'expense-' + category.name" class="p-2">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="filters.category.includes(category.name)" @change="selectCategory(category.name)" class="mr-2">
                    <label class="text-sm text-gray-700 dark:text-gray-300">{{ category.name }}</label>
                  </div>
                  <div v-if="category.children && category.children.length > 0" class="ml-6 mt-1">
                    <div v-for="subcategory in category.children" :key="'expense-sub-' + subcategory.name" class="flex items-center mb-1">
                      <input type="checkbox" :checked="filters.category.includes(subcategory.name)" @change="selectCategory(subcategory.name)" class="mr-2">
                      <label class="text-xs text-gray-600 dark:text-gray-400">{{ subcategory.name }}</label>
                    </div>
                  </div>
                </div>
                <div v-if="expenseCategoryList.length === 0" class="p-2 text-sm text-gray-500 dark:text-gray-400">无支出分类数据</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 维度筛选 -->
      <div class="mb-6">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">维度筛选</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- 成员 -->
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">成员</label>
            <div class="relative">
              <button @click="toggleDropdown('members')" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm flex justify-between items-center">
                <span>{{ filters.member.length > 0 ? `已选择 ${filters.member.length} 个成员` : '选择成员' }}</span>
                <span>{{ dropdowns.members ? '▼' : '▶' }}</span>
              </button>
              <div v-if="dropdowns.members" class="absolute z-10 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-700 mt-1">
                <div v-if="members.length > 0" class="p-2 border-b border-gray-200 dark:border-gray-700">
                  <button @click="filters.member = members.map(m => m.name)" class="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left px-2 py-1 rounded">全选</button>
                </div>
                <!-- 空值选项 -->
                <div class="p-2">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="filters.member.includes('__EMPTY__')" @change="selectMember('__EMPTY__')" class="mr-2">
                    <label class="text-sm text-gray-700 dark:text-gray-300">未设置</label>
                  </div>
                </div>
                <div v-for="member in members" :key="member.id" class="p-2">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="filters.member.includes(member.name)" @change="selectMember(member.name)" class="mr-2">
                    <label class="text-sm text-gray-700 dark:text-gray-300">{{ member.name }}</label>
                  </div>
                </div>
                <div v-if="members.length === 0" class="p-2 text-sm text-gray-500 dark:text-gray-400">无成员数据</div>
              </div>
            </div>
          </div>
          <!-- 商家 -->
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">商家</label>
            <div class="relative">
              <button @click="toggleDropdown('merchants')" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm flex justify-between items-center">
                <span>{{ filters.merchant.length > 0 ? `已选择 ${filters.merchant.length} 个商家` : '选择商家' }}</span>
                <span>{{ dropdowns.merchants ? '▼' : '▶' }}</span>
              </button>
              <div v-if="dropdowns.merchants" class="absolute z-10 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-700 mt-1">
                <div v-if="merchants.length > 0" class="p-2 border-b border-gray-200 dark:border-gray-700">
                  <button @click="filters.merchant = merchants.map(m => m.name)" class="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left px-2 py-1 rounded">全选</button>
                </div>
                <!-- 空值选项 -->
                <div class="p-2">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="filters.merchant.includes('__EMPTY__')" @change="selectMerchant('__EMPTY__')" class="mr-2">
                    <label class="text-sm text-gray-700 dark:text-gray-300">未设置</label>
                  </div>
                </div>
                <div v-for="merchant in merchants" :key="merchant.id" class="p-2">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="filters.merchant.includes(merchant.name)" @change="selectMerchant(merchant.name)" class="mr-2">
                    <label class="text-sm text-gray-700 dark:text-gray-300">{{ merchant.name }}</label>
                  </div>
                </div>
                <div v-if="merchants.length === 0" class="p-2 text-sm text-gray-500 dark:text-gray-400">无商家数据</div>
              </div>
            </div>
          </div>
          <!-- 标签 -->
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">标签</label>
            <div class="relative">
              <button @click="toggleDropdown('tags')" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm flex justify-between items-center">
                <span>{{ filters.tag.length > 0 ? `已选择 ${filters.tag.length} 个标签` : '选择标签' }}</span>
                <span>{{ dropdowns.tags ? '▼' : '▶' }}</span>
              </button>
              <div v-if="dropdowns.tags" class="absolute z-10 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-700 mt-1">
                <div v-if="tags.length > 0" class="p-2 border-b border-gray-200 dark:border-gray-700">
                  <button @click="filters.tag = tags.map(t => t.name)" class="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left px-2 py-1 rounded">全选</button>
                </div>
                <!-- 空值选项 -->
                <div class="p-2">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="filters.tag.includes('__EMPTY__')" @change="selectTag('__EMPTY__')" class="mr-2">
                    <label class="text-sm text-gray-700 dark:text-gray-300">未设置</label>
                  </div>
                </div>
                <div v-for="tag in tags" :key="tag.id" class="p-2">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="filters.tag.includes(tag.name)" @change="selectTag(tag.name)" class="mr-2">
                    <label class="text-sm text-gray-700 dark:text-gray-300">{{ tag.name }}</label>
                  </div>
                </div>
                <div v-if="tags.length === 0" class="p-2 text-sm text-gray-500 dark:text-gray-400">无标签数据</div>
              </div>
            </div>
          </div>
          <!-- 支付渠道 -->
          <div>
            <label class="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">支付渠道</label>
            <div class="relative">
              <button @click="toggleDropdown('paymentChannels')" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm flex justify-between items-center">
                <span>{{ filters.paymentChannel.length > 0 ? `已选择 ${filters.paymentChannel.length} 个支付渠道` : '选择支付渠道' }}</span>
                <span>{{ dropdowns.paymentChannels ? '▼' : '▶' }}</span>
              </button>
              <div v-if="dropdowns.paymentChannels" class="absolute z-10 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-700 mt-1">
                <div v-if="paymentChannels.length > 0" class="p-2 border-b border-gray-200 dark:border-gray-700">
                  <button @click="filters.paymentChannel = paymentChannels.map(c => c.name)" class="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left px-2 py-1 rounded">全选</button>
                </div>
                <!-- 空值选项 -->
                <div class="p-2">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="filters.paymentChannel.includes('__EMPTY__')" @change="selectPaymentChannel('__EMPTY__')" class="mr-2">
                    <label class="text-sm text-gray-700 dark:text-gray-300">未设置</label>
                  </div>
                </div>
                <div v-for="channel in paymentChannels" :key="channel.id" class="p-2">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="filters.paymentChannel.includes(channel.name)" @change="selectPaymentChannel(channel.name)" class="mr-2">
                    <label class="text-sm text-gray-700 dark:text-gray-300">{{ channel.name }}</label>
                  </div>
                </div>
                <div v-if="paymentChannels.length === 0" class="p-2 text-sm text-gray-500 dark:text-gray-400">无支付渠道数据</div>
              </div>
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

// 展开的分类
const expandedCategories = ref([])

// 下拉框显示状态
const dropdowns = ref({
  incomeCategories: false,
  expenseCategories: false,
  members: false,
  merchants: false,
  tags: false,
  paymentChannels: false
})

// 切换下拉框显示
const toggleDropdown = (key) => {
  dropdowns.value[key] = !dropdowns.value[key]
}

// 关闭所有下拉框
const closeAllDropdowns = () => {
  Object.keys(dropdowns.value).forEach(key => {
    dropdowns.value[key] = false
  })
}

// 选择分类
const selectCategory = (category) => {
  const index = filters.value.category.indexOf(category)
  if (index === -1) {
    filters.value.category.push(category)
  } else {
    filters.value.category.splice(index, 1)
  }
}

// 选择成员
const selectMember = (member) => {
  const index = filters.value.member.indexOf(member)
  if (index === -1) {
    filters.value.member.push(member)
  } else {
    filters.value.member.splice(index, 1)
  }
}

// 选择商家
const selectMerchant = (merchant) => {
  const index = filters.value.merchant.indexOf(merchant)
  if (index === -1) {
    filters.value.merchant.push(merchant)
  } else {
    filters.value.merchant.splice(index, 1)
  }
}

// 选择标签
const selectTag = (tag) => {
  const index = filters.value.tag.indexOf(tag)
  if (index === -1) {
    filters.value.tag.push(tag)
  } else {
    filters.value.tag.splice(index, 1)
  }
}

// 选择支付渠道
const selectPaymentChannel = (channel) => {
  const index = filters.value.paymentChannel.indexOf(channel)
  if (index === -1) {
    filters.value.paymentChannel.push(channel)
  } else {
    filters.value.paymentChannel.splice(index, 1)
  }
}

// 全选收入分类
const selectAllIncomeCategories = () => {
  filters.value.category = allCategories.value.filter(c => {
    return incomeCategoryList.value.some(ic => {
      return ic.name === c || (ic.children && ic.children.some(sc => sc.name === c))
    })
  })
}

// 全选支出分类
const selectAllExpenseCategories = () => {
  filters.value.category = allCategories.value.filter(c => {
    return expenseCategoryList.value.some(ec => {
      return ec.name === c || (ec.children && ec.children.some(sc => sc.name === c))
    })
  })
}

// 所有分类列表
const allCategories = computed(() => {
  const categories = new Set()
  
  // 从收入分类列表中添加分类
  incomeCategoryList.value.forEach(category => {
    categories.add(category.name)
    // 添加子分类
    if (category.children) {
      category.children.forEach(subcategory => {
        categories.add(subcategory.name)
      })
    }
  })
  
  // 从支出分类列表中添加分类
  expenseCategoryList.value.forEach(category => {
    categories.add(category.name)
    // 添加子分类
    if (category.children) {
      category.children.forEach(subcategory => {
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

// 全选收入分类
const toggleSelectAllIncomeCategories = () => {
  const checkbox = document.getElementById('select-all-income-categories')
  const isChecked = checkbox.checked
  
  const incomeCategoryNames = []
  incomeCategoryList.value.forEach(category => {
    incomeCategoryNames.push(category.name)
    if (category.subcategories) {
      category.subcategories.forEach(subcategory => {
        incomeCategoryNames.push(subcategory.name)
      })
    }
  })
  
  if (isChecked) {
    // 添加所有收入分类和子分类
    incomeCategoryNames.forEach(name => {
      if (!filters.value.category.includes(name)) {
        filters.value.category.push(name)
      }
    })
  } else {
    // 移除所有收入分类和子分类
    filters.value.category = filters.value.category.filter(name => {
      return !incomeCategoryNames.includes(name)
    })
  }
}

// 全选支出分类
const toggleSelectAllExpenseCategories = () => {
  const checkbox = document.getElementById('select-all-expense-categories')
  const isChecked = checkbox.checked
  
  const expenseCategoryNames = []
  expenseCategoryList.value.forEach(category => {
    expenseCategoryNames.push(category.name)
    if (category.children) {
      category.children.forEach(subcategory => {
        expenseCategoryNames.push(subcategory.name)
      })
    }
  })
  
  if (isChecked) {
    // 添加所有支出分类和子分类
    expenseCategoryNames.forEach(name => {
      if (!filters.value.category.includes(name)) {
        filters.value.category.push(name)
      }
    })
  } else {
    // 移除所有支出分类和子分类
    filters.value.category = filters.value.category.filter(name => {
      return !expenseCategoryNames.includes(name)
    })
  }
}

// 处理分类变化
const handleCategoryChange = (type, categoryName) => {
  const categoryList = type === 'income' ? incomeCategoryList.value : expenseCategoryList.value
  const category = categoryList.find(c => c.name === categoryName)
  
  if (!category || !category.children || category.children.length === 0) return
  
  // 当选择分类时，移除其所有子分类
  if (filters.value.category.includes(categoryName)) {
    category.children.forEach(subcategory => {
      const index = filters.value.category.indexOf(subcategory.name)
      if (index !== -1) {
        filters.value.category.splice(index, 1)
      }
    })
  }
}

// 处理子分类变化
const handleSubcategoryChange = (type, categoryName, subcategoryName) => {
  // 当选择子分类时，移除其父分类
  if (filters.value.category.includes(subcategoryName)) {
    const index = filters.value.category.indexOf(categoryName)
    if (index !== -1) {
      filters.value.category.splice(index, 1)
    }
  }
}

// 切换分类展开/折叠
const toggleCategory = (categoryName) => {
  const index = expandedCategories.value.indexOf(categoryName)
  if (index === -1) {
    expandedCategories.value.push(categoryName)
  } else {
    expandedCategories.value.splice(index, 1)
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

<style scoped>
/* 可以添加自定义样式 */
</style>