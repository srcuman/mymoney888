<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">投资管理</h2>
        <button @click="openAddInvestmentAccountModal" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
          添加投资账户
        </button>
      </div>
      
      <!-- 投资账户列表 -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                账户名称
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                账户类型
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                总资产
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                盈亏
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="account in investmentAccounts" :key="account.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ account.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ account.type }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ account.totalAsset.toFixed(2) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div :class="account.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="text-sm font-medium">
                  {{ account.profitLoss >= 0 ? '+' : '' }}{{ account.profitLoss.toFixed(2) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="openEditInvestmentAccountModal(account)" class="text-primary hover:text-blue-700 mr-3">
                  编辑
                </button>
                <button @click="deleteInvestmentAccount(account.id)" class="text-danger hover:text-red-700">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="investmentAccounts.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        暂无投资账户数据
      </div>
    </div>
    
    <!-- 投资明细 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">投资明细</h2>
        <div class="flex gap-2">
          <button @click="refreshAllNetValues" :disabled="isRefreshing" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50">
            {{ isRefreshing ? '更新中...' : '刷新净值' }}
          </button>
          <button @click="openAddInvestmentDetailModal" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
            添加投资明细
          </button>
        </div>
      </div>
      
      <!-- 投资明细列表 -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                投资账户
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                品种
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                代码
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                名称
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                份额
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                成本价
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                现价
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                净值日期
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                市值
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                盈亏
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="detail in investmentDetails" :key="detail.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ detail.accountName }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ detail.type }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ detail.code }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ detail.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ detail.shares.toFixed(4) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ detail.costPrice.toFixed(2) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ detail.currentPrice.toFixed(2) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ detail.netValueDate || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ (detail.shares * detail.currentPrice).toFixed(2) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div :class="(detail.currentPrice - detail.costPrice) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="text-sm font-medium">
                  {{ ((detail.currentPrice - detail.costPrice) * detail.shares).toFixed(2) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="openEditInvestmentDetailModal(detail)" class="text-primary hover:text-blue-700 mr-3">
                  编辑
                </button>
                <button @click="deleteInvestmentDetail(detail.id)" class="text-danger hover:text-red-700">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="investmentDetails.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        暂无投资明细数据
      </div>
    </div>
    
    <!-- 添加投资账户模态框 -->
    <div v-if="showAddInvestmentAccountModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">添加投资账户</h3>
        <form @submit.prevent="addInvestmentAccount">
          <div class="mb-4">
            <label for="accountName" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账户名称</label>
            <input type="text" id="accountName" v-model="newInvestmentAccount.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="accountType" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账户类型</label>
            <select id="accountType" v-model="newInvestmentAccount.type" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择账户类型</option>
              <option value="基金">基金</option>
              <option value="股票">股票</option>
              <option value="债券">债券</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="accountDescription" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
            <textarea id="accountDescription" v-model="newInvestmentAccount.description" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"></textarea>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showAddInvestmentAccountModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium">
              取消
            </button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 编辑投资账户模态框 -->
    <div v-if="showEditInvestmentAccountModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">编辑投资账户</h3>
        <form @submit.prevent="updateInvestmentAccount">
          <div class="mb-4">
            <label for="editAccountName" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账户名称</label>
            <input type="text" id="editAccountName" v-model="editInvestmentAccount.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="editAccountType" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">账户类型</label>
            <select id="editAccountType" v-model="editInvestmentAccount.type" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择账户类型</option>
              <option value="基金">基金</option>
              <option value="股票">股票</option>
              <option value="债券">债券</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="editAccountDescription" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
            <textarea id="editAccountDescription" v-model="editInvestmentAccount.description" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"></textarea>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showEditInvestmentAccountModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium">
              取消
            </button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 添加投资明细模态框 -->
    <div v-if="showAddInvestmentDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">添加投资明细</h3>
        <form @submit.prevent="addInvestmentDetail">
          <div class="mb-4">
            <label for="detailAccount" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">投资账户</label>
            <select id="detailAccount" v-model="newInvestmentDetail.accountId" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择投资账户</option>
              <option v-for="account in investmentAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="detailType" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">品种类型</label>
            <select id="detailType" v-model="newInvestmentDetail.type" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择品种类型</option>
              <option value="基金">基金</option>
              <option value="股票">股票</option>
              <option value="债券">债券</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="detailCode" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">代码</label>
            <input type="text" id="detailCode" v-model="newInvestmentDetail.code" @keydown.enter.prevent="handleCodeChange" @blur="handleCodeBlur" placeholder="输入6位代码后按回车或移出焦点获取信息" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div v-if="apiLogs.length > 0" class="mb-4">
            <label class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">后台动作日志</label>
            <div class="bg-gray-100 dark:bg-gray-700 rounded-md p-3 max-h-40 overflow-y-auto text-xs">
              <div v-for="(log, index) in apiLogs" :key="index" class="mb-1 last:mb-0">
                <span class="text-gray-500 dark:text-gray-400">{{ log.time }}</span>
                <span class="ml-2">{{ log.message }}</span>
              </div>
              <div v-if="apiResponseTime > 0" class="mt-2 text-gray-500 dark:text-gray-400">
                响应时间: {{ apiResponseTime }}ms
              </div>
            </div>
          </div>
          <div class="mb-4">
            <label for="detailName" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">名称</label>
            <input type="text" id="detailName" v-model="newInvestmentDetail.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="detailShares" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">份额</label>
            <input type="number" id="detailShares" v-model.number="newInvestmentDetail.shares" step="0.0001" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="detailCostPrice" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">成本价</label>
            <input type="number" id="detailCostPrice" v-model.number="newInvestmentDetail.costPrice" step="0.0001" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="detailCurrentPrice" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">现价</label>
            <input type="number" id="detailCurrentPrice" v-model.number="newInvestmentDetail.currentPrice" step="0.0001" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showAddInvestmentDetailModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium">
              取消
            </button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 编辑投资明细模态框 -->
    <div v-if="showEditInvestmentDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">编辑投资明细</h3>
        <form @submit.prevent="updateInvestmentDetail">
          <div class="mb-4">
            <label for="editDetailAccount" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">投资账户</label>
            <select id="editDetailAccount" v-model="editInvestmentDetail.accountId" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择投资账户</option>
              <option v-for="account in investmentAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="editDetailType" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">品种类型</label>
            <select id="editDetailType" v-model="editInvestmentDetail.type" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择品种类型</option>
              <option value="基金">基金</option>
              <option value="股票">股票</option>
              <option value="债券">债券</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="editDetailCode" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">代码</label>
            <input type="text" id="editDetailCode" v-model="editInvestmentDetail.code" @keydown.enter.prevent="handleEditCodeChange" @blur="handleEditCodeBlur" placeholder="输入6位代码后按回车或移出焦点获取信息" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="editDetailName" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">名称</label>
            <input type="text" id="editDetailName" v-model="editInvestmentDetail.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="editDetailShares" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">份额</label>
            <input type="number" id="editDetailShares" v-model.number="editInvestmentDetail.shares" step="0.0001" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="editDetailCostPrice" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">成本价</label>
            <input type="number" id="editDetailCostPrice" v-model.number="editInvestmentDetail.costPrice" step="0.0001" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="editDetailCurrentPrice" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">现价</label>
            <input type="number" id="editDetailCurrentPrice" v-model.number="editInvestmentDetail.currentPrice" step="0.0001" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showEditInvestmentDetailModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium">
              取消
            </button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 投资统计分析 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">投资统计分析</h2>
      
      <!-- 收益概览 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-blue-600 dark:text-blue-400">总投资资产</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalInvestmentAsset.toFixed(2) }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-green-600 dark:text-green-400">总收益</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalProfitLoss >= 0 ? '+' : '' }}{{ totalProfitLoss.toFixed(2) }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-purple-600 dark:text-purple-400">总收益率</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalProfitRate >= 0 ? '+' : '' }}{{ totalProfitRate.toFixed(2) }}%</p>
        </div>
        <div class="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-yellow-600 dark:text-yellow-400">持仓数量</h3>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ investmentDetails.length }}</p>
        </div>
      </div>
      
      <!-- 数据可视化图表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- 持仓类型分布图表 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">持仓类型分布</h3>
          <div class="h-64">
            <canvas ref="typeDistributionChart"></canvas>
          </div>
        </div>
        
        <!-- 账户资产分布图表 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">账户资产分布</h3>
          <div class="h-64">
            <canvas ref="accountDistributionChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- 持仓分析 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- 按品种类型分析 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">持仓类型分析</h3>
          <div class="space-y-3">
            <div v-for="(item, index) in typeDistribution" :key="index" class="flex justify-between items-center">
              <span class="text-gray-700 dark:text-gray-300">{{ item.type }}</span>
              <div class="flex items-center">
                <span class="text-gray-900 dark:text-white font-medium mr-2">{{ item.amount.toFixed(2) }}</span>
                <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div :class="item.color" class="h-2 rounded-full" :style="{ width: item.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 按账户分析 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">账户资产分析</h3>
          <div class="space-y-3">
            <div v-for="(account, index) in investmentAccounts" :key="index" class="flex justify-between items-center">
              <span class="text-gray-700 dark:text-gray-300">{{ account.name }}</span>
              <div class="flex items-center">
                <span class="text-gray-900 dark:text-white font-medium mr-2">{{ account.totalAsset.toFixed(2) }}</span>
                <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="bg-primary h-2 rounded-full" :style="{ width: (account.totalAsset / totalInvestmentAsset * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 收益分析 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">收益分析</h3>
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <label class="text-sm text-gray-600 dark:text-gray-400 mr-2">时间区间:</label>
              <select v-model="profitTimeRange" @change="updateProfitAnalysisChart" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white">
                <option value="all">全部时间</option>
                <option value="1m">近1月</option>
                <option value="3m">近3月</option>
                <option value="6m">近6月</option>
                <option value="1y">近1年</option>
                <option value="ytd">今年至今</option>
              </select>
            </div>
          </div>
        </div>
        <div class="h-64">
          <canvas ref="profitAnalysisChart"></canvas>
        </div>
      </div>
      
      <!-- 收益明细 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">收益明细</h3>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ filteredProfitDetails.length }} 个投资品种
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  投资品种
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  持仓市值
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  持仓成本
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  盈亏
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  收益率
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  持仓占比
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="detail in filteredProfitDetails" :key="detail.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{{ detail.name }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ detail.code }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ (detail.shares * detail.currentPrice).toFixed(2) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ (detail.shares * detail.costPrice).toFixed(2) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div :class="(detail.currentPrice - detail.costPrice) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="text-sm font-medium">
                    {{ ((detail.currentPrice - detail.costPrice) * detail.shares).toFixed(2) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div :class="(detail.currentPrice - detail.costPrice) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="text-sm font-medium">
                    {{ ((detail.currentPrice - detail.costPrice) / detail.costPrice * 100).toFixed(2) }}%
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ ((detail.shares * detail.currentPrice) / totalInvestmentAsset * 100).toFixed(2) }}%</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="investmentDetails.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          暂无投资明细数据
        </div>
      </div>
    </div>

    <!-- 历史净值记录 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">净值历史记录</h2>
        <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ netValueHistory.length }} 条记录</span>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                日期
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                品种
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                名称
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                净值
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                更新时间
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(record, index) in netValueHistory.slice().reverse().slice(0, 50)" :key="index">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ record.date }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ record.code }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ record.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ record.price.toFixed(4) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ formatUpdateTime(record.updateTime) }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="netValueHistory.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        暂无净值历史记录
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import syncService from '../services/sync-service.js'

// 投资账户列表
const investmentAccounts = ref([])

// 投资明细列表
const investmentDetails = ref([])

// 筛选后的投资明细（用于收益分析）
const filteredProfitDetails = computed(() => {
  return filterInvestmentDetailsByTimeRange()
})

// 历史净值记录 (用于收益分析)
const netValueHistory = ref([])

// 图表引用
const typeDistributionChart = ref(null)
const accountDistributionChart = ref(null)
const profitAnalysisChart = ref(null)

// 收益分析时间区间筛选
const profitTimeRange = ref('all')

// 图表实例
let typeChartInstance = null
let accountChartInstance = null
let profitChartInstance = null

// 添加投资账户模态框
const showAddInvestmentAccountModal = ref(false)

// 编辑投资账户模态框
const showEditInvestmentAccountModal = ref(false)

// 添加投资明细模态框
const showAddInvestmentDetailModal = ref(false)

// 编辑投资明细模态框
const showEditInvestmentDetailModal = ref(false)

// 新投资账户
const newInvestmentAccount = ref({
  name: '',
  type: '',
  description: ''
})

// 编辑投资账户
const editInvestmentAccount = ref({
  id: '',
  name: '',
  type: '',
  description: ''
})

// 新投资明细
const newInvestmentDetail = ref({
  accountId: '',
  type: '',
  code: '',
  name: '',
  shares: 0,
  costPrice: 0,
  currentPrice: 0
})

// 编辑投资明细
const editInvestmentDetail = ref({
  id: '',
  accountId: '',
  type: '',
  code: '',
  name: '',
  shares: 0,
  costPrice: 0,
  currentPrice: 0
})

// API日志
const apiLogs = ref([])

// API响应时间
const apiResponseTime = ref(0)

// 刷新状态
const isRefreshing = ref(false)

// 打开添加投资账户模态框
const openAddInvestmentAccountModal = () => {
  newInvestmentAccount.value = {
    name: '',
    type: '',
    description: ''
  }
  showAddInvestmentAccountModal.value = true
}

// 打开编辑投资账户模态框
const openEditInvestmentAccountModal = (account) => {
  editInvestmentAccount.value = { ...account }
  showEditInvestmentAccountModal.value = true
}

// 打开添加投资明细模态框
const openAddInvestmentDetailModal = () => {
  newInvestmentDetail.value = {
    accountId: '',
    type: '',
    code: '',
    name: '',
    shares: 0,
    costPrice: 0,
    currentPrice: 0
  }
  showAddInvestmentDetailModal.value = true
}

// 打开编辑投资明细模态框
const openEditInvestmentDetailModal = (detail) => {
  editInvestmentDetail.value = { ...detail }
  showEditInvestmentDetailModal.value = true
}

// 添加投资账户
const addInvestmentAccount = async () => {
  const newAccount = {
    id: Date.now().toString(),
    name: newInvestmentAccount.value.name,
    type: newInvestmentAccount.value.type,
    description: newInvestmentAccount.value.description,
    totalAsset: 0,
    profitLoss: 0
  }
  investmentAccounts.value.push(newAccount)
  await saveInvestmentAccounts()
  showAddInvestmentAccountModal.value = false
}

// 更新投资账户
const updateInvestmentAccount = async () => {
  const index = investmentAccounts.value.findIndex(a => a.id === editInvestmentAccount.value.id)
  if (index !== -1) {
    investmentAccounts.value[index] = {
      ...investmentAccounts.value[index],
      name: editInvestmentAccount.value.name,
      type: editInvestmentAccount.value.type,
      description: editInvestmentAccount.value.description
    }
    await saveInvestmentAccounts()
    showEditInvestmentAccountModal.value = false
  }
}

// 删除投资账户
const deleteInvestmentAccount = async (id) => {
  investmentAccounts.value = investmentAccounts.value.filter(a => a.id !== id)
  investmentDetails.value = investmentDetails.value.filter(d => d.accountId !== id)
  await saveInvestmentAccounts()
  await saveInvestmentDetails()
}

// 格式化更新时间显示
const formatUpdateTime = (isoTime) => {
  if (!isoTime) return '-'
  const date = new Date(isoTime)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// 记录API日志
const addApiLog = (message) => {
  const now = new Date()
  const time = now.toLocaleTimeString()
  apiLogs.value.push({ time, message })
  // 限制日志数量
  if (apiLogs.value.length > 10) {
    apiLogs.value.shift()
  }
}

// 带超时的fetch函数
const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// 使用JSONP方式获取天天基金数据（解决CORS和代理问题）
const fetchTianTianFundJSONP = (code) => {
  return new Promise((resolve, reject) => {
    const url = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`
    const script = document.createElement('script')
    script.src = url
    
    // 天天基金API固定返回 jsonpgz({...}) 格式
    window.jsonpgz = (data) => {
      if (script.parentNode) script.parentNode.removeChild(script)
      delete window.jsonpgz
      resolve(data)
    }
    
    script.onerror = () => {
      if (script.parentNode) script.parentNode.removeChild(script)
      delete window.jsonpgz
      reject(new Error('网络错误'))
    }
    
    // 超时处理
    setTimeout(() => {
      if (window.jsonpgz) {
        if (script.parentNode) script.parentNode.removeChild(script)
        delete window.jsonpgz
        reject(new Error('请求超时'))
      }
    }, 10000)
    
    document.head.appendChild(script)
  })
}

// 调用单个API的函数
const fetchSingleAPI = async (url, source) => {
  const startTime = Date.now()
  try {
    console.log(`[${source}] 请求: ${url}`)
    const response = await fetchWithTimeout(url, { method: 'GET' })
    const elapsed = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.text()
      console.log(`[${source}] 成功 (${elapsed}ms)`)
      return { source, data, elapsed, success: true }
    } else {
      console.log(`[${source}] HTTP错误: ${response.status}`)
      return { source, data: null, elapsed, success: false }
    }
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.log(`[${source}] 失败: ${error.message} (${elapsed}ms)`)
    return { source, data: null, elapsed, success: false }
  }
}

// 解析天天基金数据 (UTF-8 JSON)
const parseTianTianFundData = (data) => {
  try {
    console.log('天天基金原始数据:', data?.substring?.(0, 100) || data)
    // 格式: jsonpgz({...});
    const match = data.match(/jsonpgz\((.+)\)/)
    if (!match) {
      console.log('天天基金: 无法匹配jsonpgz格式')
      return null
    }
    
    const fundData = JSON.parse(match[1])
    console.log('天天基金解析数据:', fundData)
    if (!fundData.name) return null
    
    // gsz是估算净值，dwjz是昨日净值
    const price = parseFloat(fundData.gsz) || parseFloat(fundData.dwjz) || 0
    
    return {
      name: fundData.name,
      price,
      updateDate: fundData.gztime || fundData.jzrq || new Date().toISOString().split('T')[0]
    }
  } catch (e) {
    console.log('天天基金解析失败:', e.message)
    return null
  }
}

// 解析东方财富股票数据 (UTF-8 JSON)
const parseEastMoneyStockData = (data) => {
  try {
    const json = JSON.parse(data)
    const stockData = json.data
    if (!stockData || !stockData.f58) return null
    
    // f43是当前价格(单位：分)，需要转元
    const price = (stockData.f43 || 0) / 100
    
    return {
      name: stockData.f58,
      price,
      code: stockData.f57
    }
  } catch (e) {
    console.log('东方财富股票解析失败:', e.message)
    return null
  }
}

// 解析东方财富基金历史净值数据
const parseEastMoneyFundData = (data) => {
  try {
    const json = JSON.parse(data)
    const fundData = json.Data
    if (!fundData || !fundData.LSJZList || fundData.LSJZList.length === 0) {
      console.log('东方财富基金: 无净值数据')
      return null
    }
    
    const latest = fundData.LSJZList[0]
    return {
      name: '',  // 需要额外API获取名称，暂时用代码
      price: parseFloat(latest.DWJZ) || 0,
      updateDate: latest.FSRQ
    }
  } catch (e) {
    console.log('东方财富基金解析失败:', e.message)
    return null
  }
}

// 根据代码获取投资品种信息
const fetchInvestmentInfo = async (code, userSelectedType = null) => {
  console.log('========== 获取投资信息 ==========')
  console.log('代码:', code, '| 类型:', userSelectedType || '自动检测')
  
  // 检查代码格式
  if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
    throw new Error('代码格式不正确，请输入6位数字代码')
  }
  
  // 基金代码前缀: 1/5/4/8/0/2开头
  const fundPrefixes = ['1', '5', '4', '8', '0', '2', '15']
  const isPossibleFund = fundPrefixes.some(p => code.startsWith(p))
  
  // 股票代码前缀: 6(沪市)/0(深市)/3(创业板)/8(北交所)
  const stockPrefixes = ['6', '0', '3', '8']
  const isPossibleStock = stockPrefixes.some(p => code.startsWith(p))
  
  // 用户指定类型
  const userWantsFund = userSelectedType === '基金'
  const userWantsStock = userSelectedType === '股票'
  
  // 构建API任务
  const apiTasks = []
  
  // 1. 股票 - 东方财富API (推荐，支持UTF-8)
  if (userWantsStock || (isPossibleStock && !userWantsFund)) {
    // secid: 0=深市, 1=沪市
    const secid = code.startsWith('6') ? `1.${code}` : `0.${code}`
    apiTasks.push({
      url: `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f43,f57,f58`,
      source: '东方财富股票',
      type: 'stock'
    })
  }
  
  // 2. 基金 - 天天基金API（使用JSONP方式）
  if (userWantsFund || (isPossibleFund && !userWantsStock)) {
    // 排除6/3开头(明显是股票)
    if (!code.startsWith('6') && !code.startsWith('3')) {
      // 使用JSONP方式获取基金数据
      try {
        console.log('正在通过JSONP获取天天基金数据...')
        const fundData = await fetchTianTianFundJSONP(code)
        console.log('天天基金数据:', fundData)
        
        if (fundData && fundData.name) {
          const price = parseFloat(fundData.gsz) || parseFloat(fundData.dwjz) || 0
          return {
            name: fundData.name,
            type: '基金',
            currentPrice: price,
            updateDate: fundData.gztime || fundData.jzrq || new Date().toISOString().split('T')[0]
          }
        }
      } catch (e) {
        console.log('天天基金JSONP失败:', e.message)
      }
    }
  }
  
  // 股票请求
  if (apiTasks.length === 0) {
    throw new Error('无法识别代码类型，请手动选择品种类型')
  }
  
  console.log('API任务:', apiTasks.map(t => t.source).join(', '))
  
  // 并行请求
  const results = await Promise.all(
    apiTasks.map(task => fetchSingleAPI(task.url, task.source))
  )
  
  // 解析结果 - 优先返回有效数据
  for (const result of results) {
    if (!result.success || !result.data) continue
    
    // 东方财富股票
    if (result.source === '东方财富股票') {
      const parsed = parseEastMoneyStockData(result.data)
      if (parsed && parsed.name && parsed.price > 0) {
        console.log('========== 成功: 东方财富股票 ==========')
        console.log('名称:', parsed.name, '| 价格:', parsed.price)
        return {
          name: parsed.name,
          type: '股票',
          currentPrice: parsed.price,
          updateDate: new Date().toISOString().split('T')[0]
        }
      }
    }
    
    // 天天基金
    if (result.source === '天天基金') {
      const parsed = parseTianTianFundData(result.data)
      if (parsed && parsed.name && parsed.price > 0) {
        console.log('========== 成功: 天天基金 ==========')
        console.log('名称:', parsed.name, '| 净值:', parsed.price, '| 日期:', parsed.updateDate)
        return {
          name: parsed.name,
          type: '基金',
          currentPrice: parsed.price,
          updateDate: parsed.updateDate
        }
      }
    }
    
    // 东方财富基金
    if (result.source === '东方财富基金') {
      const parsed = parseEastMoneyFundData(result.data)
      if (parsed && parsed.price > 0) {
        console.log('========== 成功: 东方财富基金 ==========')
        console.log('净值:', parsed.price, '| 日期:', parsed.updateDate)
        return {
          name: `基金${code}`,  // 东方财富基金API不返回名称
          type: '基金',
          currentPrice: parsed.price,
          updateDate: parsed.updateDate
        }
      }
    }
  }
  
  console.log('========== 所有API失败 ==========')
  throw new Error(`无法获取代码 ${code} 的信息`)
}

// 监听代码变化，自动获取投资品种信息
const handleCodeChange = async () => {
  const code = newInvestmentDetail.value.code
  console.log('handleCodeChange called with code:', code)
  await fetchAndFillInvestmentInfo(code, 'new')
}

const handleCodeBlur = async () => {
  const code = newInvestmentDetail.value.code
  if (code && code.length === 6 && /^\d+$/.test(code)) {
    await fetchAndFillInvestmentInfo(code, 'new')
  }
}

// 监听编辑模式下的代码变化
const handleEditCodeChange = async () => {
  const code = editInvestmentDetail.value.code
  console.log('handleEditCodeChange called with code:', code)
  await fetchAndFillInvestmentInfo(code, 'edit')
}

const handleEditCodeBlur = async () => {
  const code = editInvestmentDetail.value.code
  if (code && code.length === 6 && /^\d+$/.test(code)) {
    await fetchAndFillInvestmentInfo(code, 'edit')
  }
}

// 统一的获取投资信息并填充的方法
const fetchAndFillInvestmentInfo = async (code, mode) => {
  if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
    return
  }
  
  const targetRef = mode === 'edit' ? editInvestmentDetail : newInvestmentDetail
  
  try {
    addApiLog(`开始获取代码 ${code} 的投资信息...`)
    console.log(`Fetching investment info for code:`, code)
    
    // 传递用户选择的品种类型，用于API判断
    const userSelectedType = targetRef.value.type || null
    
    const startTime = Date.now()
    const info = await fetchInvestmentInfo(code, userSelectedType)
    const endTime = Date.now()
    apiResponseTime.value = endTime - startTime
    
    targetRef.value.name = info.name
    targetRef.value.type = info.type
    targetRef.value.currentPrice = info.currentPrice
    targetRef.value.netValueDate = info.updateDate || new Date().toISOString().split('T')[0]
    
    addApiLog(`获取成功: ${info.name} (${info.type}) 现价: ${info.currentPrice}，耗时: ${apiResponseTime.value}ms`)
    console.log(`获取成功:`, info)
  } catch (error) {
    addApiLog(`获取失败: ${error.message}`)
    console.error(`获取失败:`, error)
    // 只清空自动填充的字段，保留用户已选择的类型
    // type由用户手动选择，不自动清空，避免循环调用
    targetRef.value.name = ''
    targetRef.value.currentPrice = 0
  }
}

// 添加投资明细
const addInvestmentDetail = async () => {
  const account = investmentAccounts.value.find(a => a.id === newInvestmentDetail.value.accountId)
  const today = new Date().toISOString().split('T')[0]
  const newDetail = {
    id: Date.now().toString(),
    accountId: newInvestmentDetail.value.accountId,
    accountName: account ? account.name : '',
    type: newInvestmentDetail.value.type,
    code: newInvestmentDetail.value.code,
    name: newInvestmentDetail.value.name,
    shares: newInvestmentDetail.value.shares,
    costPrice: newInvestmentDetail.value.costPrice,
    currentPrice: newInvestmentDetail.value.currentPrice,
    netValueDate: today,
    updateDate: today
  }
  investmentDetails.value.push(newDetail)
  updateAccountAsset(newInvestmentDetail.value.accountId)
  await saveInvestmentDetails()
  // 异步记录净值历史（不阻塞UI）
  recordNetValue(newDetail).catch(err => console.error('记录净值失败:', err))
  showAddInvestmentDetailModal.value = false
}

// 更新投资明细
const updateInvestmentDetail = async () => {
  const index = investmentDetails.value.findIndex(d => d.id === editInvestmentDetail.value.id)
  if (index !== -1) {
    const oldAccountId = investmentDetails.value[index].accountId
    const today = new Date().toISOString().split('T')[0]
    investmentDetails.value[index] = {
      ...investmentDetails.value[index],
      accountId: editInvestmentDetail.value.accountId,
      accountName: investmentAccounts.value.find(a => a.id === editInvestmentDetail.value.accountId)?.name || '',
      type: editInvestmentDetail.value.type,
      code: editInvestmentDetail.value.code,
      name: editInvestmentDetail.value.name,
      shares: editInvestmentDetail.value.shares,
      costPrice: editInvestmentDetail.value.costPrice,
      currentPrice: editInvestmentDetail.value.currentPrice,
      updateDate: today
    }
    updateAccountAsset(oldAccountId)
    updateAccountAsset(editInvestmentDetail.value.accountId)
    await saveInvestmentDetails()
    showEditInvestmentDetailModal.value = false
  }
}

// 删除投资明细
const deleteInvestmentDetail = async (id) => {
  const detail = investmentDetails.value.find(d => d.id === id)
  if (detail) {
    investmentDetails.value = investmentDetails.value.filter(d => d.id !== id)
    updateAccountAsset(detail.accountId)
    await saveInvestmentDetails()
  }
}

// 更新账户资产
const updateAccountAsset = async (accountId) => {
  const account = investmentAccounts.value.find(a => a.id === accountId)
  if (account) {
    const accountDetails = investmentDetails.value.filter(d => d.accountId === accountId)
    const totalAsset = accountDetails.reduce((total, d) => total + d.shares * d.currentPrice, 0)
    const totalCost = accountDetails.reduce((total, d) => total + d.shares * d.costPrice, 0)
    const profitLoss = totalAsset - totalCost
    
    account.totalAsset = totalAsset
    account.profitLoss = profitLoss
    await saveInvestmentAccounts()
  }
}

// 保存投资账户到本地存储并同步数据库
const saveInvestmentAccounts = async () => {
  localStorage.setItem('investmentAccounts', JSON.stringify(investmentAccounts.value))
  // 同步到数据库
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user && user.id && navigator.onLine) {
      await syncService.syncOnDataChange('investmentAccounts')
    }
  } catch (error) {
    console.error('同步投资账户到数据库失败:', error)
  }
  // 通知其他组件投资账户已更新
  window.dispatchEvent(new CustomEvent('investmentAccountsUpdated'))
}

// 保存投资明细到本地存储并同步数据库
const saveInvestmentDetails = async () => {
  localStorage.setItem('investmentDetails', JSON.stringify(investmentDetails.value))
  // 同步到数据库
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user && user.id && navigator.onLine) {
      await syncService.syncOnDataChange('investmentDetails')
    }
  } catch (error) {
    console.error('同步投资明细到数据库失败:', error)
  }
  // 通知其他组件投资账户已更新（因为明细变化会影响账户余额）
  window.dispatchEvent(new CustomEvent('investmentAccountsUpdated'))
}

// 保存历史净值记录（本地+数据库）
const saveNetValueHistory = async () => {
  // 保存到本地
  localStorage.setItem('netValueHistory', JSON.stringify(netValueHistory.value))
  
  // 同步到数据库
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user && user.id && navigator.onLine) {
      await syncService.updateServerData('netValueHistory', user.id, netValueHistory.value)
      console.log('净值历史已同步到数据库')
    }
  } catch (error) {
    console.error('同步净值历史到数据库失败:', error)
  }
}

// 加载历史净值记录（优先本地，合并数据库数据）
const loadNetValueHistory = async () => {
  // 先从本地加载
  const saved = localStorage.getItem('netValueHistory')
  if (saved) {
    netValueHistory.value = JSON.parse(saved)
  }
  
  // 尝试从数据库获取更新的数据
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user && user.id && navigator.onLine) {
      const serverData = await syncService.getServerData('netValueHistory', user.id, null)
      if (serverData && serverData.length > 0) {
        // 合并本地和服务器数据
        const localIds = new Set(netValueHistory.value.map(h => `${h.code}-${h.date}`))
        const newRecords = serverData.filter(h => !localIds.has(`${h.code}-${h.date}`))
        
        if (newRecords.length > 0) {
          netValueHistory.value = [...netValueHistory.value, ...newRecords]
          netValueHistory.value.sort((a, b) => new Date(b.date) - new Date(a.date))
          localStorage.setItem('netValueHistory', JSON.stringify(netValueHistory.value))
          console.log(`从数据库同步了 ${newRecords.length} 条净值记录`)
        }
      }
    }
  } catch (error) {
    console.error('从数据库加载净值历史失败:', error)
  }
}

// 记录净值到历史（异步保存到本地和数据库）
const recordNetValue = async (detail) => {
  const today = new Date().toISOString().split('T')[0]
  const existing = netValueHistory.value.find(
    h => h.code === detail.code && h.date === today
  )
  
  if (existing) {
    existing.price = detail.currentPrice
    existing.updateTime = new Date().toISOString()
  } else {
    netValueHistory.value.push({
      code: detail.code,
      name: detail.name,
      date: today,
      price: detail.currentPrice,
      updateTime: new Date().toISOString()
    })
  }
  await saveNetValueHistory()
}

// 刷新所有净值
const refreshAllNetValues = async () => {
  if (isRefreshing.value || investmentDetails.value.length === 0) return
  
  isRefreshing.value = true
  addApiLog('开始刷新所有净值...')
  
  let successCount = 0
  let failCount = 0
  
  for (const detail of investmentDetails.value) {
    try {
      const info = await fetchInvestmentInfo(detail.code, detail.type)
      if (info.currentPrice) {
        detail.currentPrice = info.currentPrice
        detail.netValueDate = info.updateDate || new Date().toISOString().split('T')[0]
        recordNetValue(detail)
        successCount++
        addApiLog(`${detail.name}: ${info.currentPrice}`)
      }
    } catch (error) {
      failCount++
      console.error(`刷新 ${detail.code} 失败:`, error)
    }
  }
  
  for (const account of investmentAccounts.value) {
    await updateAccountAsset(account.id)
  }
  
  await saveInvestmentDetails()
  await saveInvestmentAccounts()
  
  addApiLog(`刷新完成: 成功${successCount}个, 失败${failCount}个`)
  isRefreshing.value = false
}

// 计算总投资资产
const totalInvestmentAsset = computed(() => {
  return investmentAccounts.value.reduce((total, account) => total + account.totalAsset, 0)
})

// 计算总收益
const totalProfitLoss = computed(() => {
  return investmentAccounts.value.reduce((total, account) => total + account.profitLoss, 0)
})

// 计算总收益率
const totalProfitRate = computed(() => {
  const totalCost = totalInvestmentAsset.value - totalProfitLoss.value
  return totalCost > 0 ? (totalProfitLoss.value / totalCost) * 100 : 0
})

// 计算持仓类型分布
const typeDistribution = computed(() => {
  const typeMap = {}
  const typeColors = {
    '基金': 'bg-blue-500',
    '股票': 'bg-green-500',
    '债券': 'bg-yellow-500',
    '其他': 'bg-purple-500'
  }
  
  // 统计各类型的资产
  investmentDetails.value.forEach(detail => {
    const type = detail.type
    const value = detail.shares * detail.currentPrice
    if (typeMap[type]) {
      typeMap[type] += value
    } else {
      typeMap[type] = value
    }
  })
  
  // 转换为数组并计算百分比
  const distribution = Object.entries(typeMap).map(([type, amount]) => ({
    type,
    amount,
    percentage: totalInvestmentAsset.value > 0 ? (amount / totalInvestmentAsset.value) * 100 : 0,
    color: typeColors[type] || 'bg-gray-500'
  }))
  
  // 按金额排序
  return distribution.sort((a, b) => b.amount - a.amount)
})

// 初始化图表
const initCharts = async () => {
  await nextTick()
  updateCharts()
}

// 更新图表
const updateCharts = () => {
  updateTypeDistributionChart()
  updateAccountDistributionChart()
  updateProfitAnalysisChart()
}

// 更新持仓类型分布图表
const updateTypeDistributionChart = () => {
  if (!typeDistributionChart.value) return
  
  const ctx = typeDistributionChart.value.getContext('2d')
  
  // 销毁旧图表
  if (typeChartInstance) {
    typeChartInstance.destroy()
  }
  
  const typeData = typeDistribution.value
  const labels = typeData.map(item => item.type)
  const data = typeData.map(item => item.amount)
  const backgroundColor = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(153, 102, 255, 0.7)'
  ]
  
  typeChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColor,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0
              return `${context.label}: ${value.toFixed(2)} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// 更新账户资产分布图表
const updateAccountDistributionChart = () => {
  if (!accountDistributionChart.value) return
  
  const ctx = accountDistributionChart.value.getContext('2d')
  
  // 销毁旧图表
  if (accountChartInstance) {
    accountChartInstance.destroy()
  }
  
  const labels = investmentAccounts.value.map(account => account.name)
  const data = investmentAccounts.value.map(account => account.totalAsset)
  const backgroundColor = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)'
  ]
  
  accountChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColor,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0
              return `${context.label}: ${value.toFixed(2)} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// 更新收益分析图表
const updateProfitAnalysisChart = () => {
  if (!profitAnalysisChart.value) return
  
  const ctx = profitAnalysisChart.value.getContext('2d')
  
  // 销毁旧图表
  if (profitChartInstance) {
    profitChartInstance.destroy()
  }
  
  // 根据时间区间筛选净值历史数据
  const filteredDetails = filterInvestmentDetailsByTimeRange()
  
  const labels = filteredDetails.map(detail => detail.name)
  const profitData = filteredDetails.map(detail => {
    return (detail.currentPrice - detail.costPrice) * detail.shares
  })
  const backgroundColor = profitData.map(profit => {
    return profit >= 0 ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'
  })
  
  profitChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '盈亏',
        data: profitData,
        backgroundColor: backgroundColor,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toFixed(2)
            }
          }
        }
      }
    }
  })
}

// 根据时间区间筛选投资明细
const filterInvestmentDetailsByTimeRange = () => {
  if (profitTimeRange.value === 'all') {
    return investmentDetails.value
  }
  
  const now = new Date()
  let startDate = null
  
  switch (profitTimeRange.value) {
    case '1m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      break
    case '3m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      break
    case '6m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      break
    case '1y':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      break
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1) // 今年1月1日
      break
    default:
      return investmentDetails.value
  }
  
  // 过滤净值历史记录
  return investmentDetails.value.filter(detail => {
    if (!detail.lastUpdateDate) return true // 没有日期的显示
    const updateDate = new Date(detail.lastUpdateDate)
    return updateDate >= startDate
  })
}

// 从本地存储加载数据
const loadData = async () => {
  const savedAccounts = localStorage.getItem('investmentAccounts')
  const savedDetails = localStorage.getItem('investmentDetails')
  
  if (savedAccounts) {
    investmentAccounts.value = JSON.parse(savedAccounts)
  }
  
  if (savedDetails) {
    investmentDetails.value = JSON.parse(savedDetails)
  }
  
  await loadNetValueHistory()
}

// 定时更新持仓产品净值
const scheduleNetValueUpdate = () => {
  // 每天的更新时间：9:30, 11:30, 15:30
  const updateTimes = [
    { hour: 9, minute: 30 },
    { hour: 11, minute: 30 },
    { hour: 15, minute: 30 }
  ]
  
  // 计算下一次更新的时间
  const getNextUpdateTime = () => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    for (const time of updateTimes) {
      const updateTime = time.hour * 60 + time.minute
      if (updateTime > currentTime) {
        const nextUpdate = new Date(now)
        nextUpdate.setHours(time.hour, time.minute, 0, 0)
        return nextUpdate
      }
    }
    
    // 如果当天的更新时间都过了，就设置为第二天的第一个更新时间
    const nextDay = new Date(now)
    nextDay.setDate(nextDay.getDate() + 1)
    nextDay.setHours(updateTimes[0].hour, updateTimes[0].minute, 0, 0)
    return nextDay
  }
  
  // 更新所有投资明细的净值
  const updateAllNetValues = async () => {
    console.log('Updating all investment net values...')
    
    for (const detail of investmentDetails.value) {
      try {
        const info = await fetchInvestmentInfo(detail.code)
        if (info.currentPrice) {
          detail.currentPrice = info.currentPrice
          detail.netValueDate = info.updateDate || new Date().toISOString().split('T')[0]
          detail.updateDate = new Date().toISOString().split('T')[0]
          recordNetValue(detail)
        }
      } catch (error) {
        console.error(`Failed to update net value for ${detail.code}:`, error)
      }
    }
    
    // 更新账户资产
    for (const account of investmentAccounts.value) {
      await updateAccountAsset(account.id)
    }
    
    // 保存数据
    await saveInvestmentDetails()
    await saveInvestmentAccounts()
    
    console.log('Net value update completed')
  }
  
  // 初始执行一次更新
  updateAllNetValues()
  
  // 设置定时任务
  const setNextUpdate = () => {
    const nextUpdateTime = getNextUpdateTime()
    const timeUntilUpdate = nextUpdateTime - new Date()
    
    console.log(`Next net value update scheduled at: ${nextUpdateTime}`)
    
    setTimeout(() => {
      updateAllNetValues()
      setNextUpdate() // 递归设置下一次更新
    }, timeUntilUpdate)
  }
  
  // 启动定时任务
  setNextUpdate()
}

// 监听数据变化，更新图表
watch([investmentAccounts, investmentDetails], () => {
  updateCharts()
}, { deep: true })

// 组件挂载时启动定时更新
onMounted(async () => {
  await loadData()
  initCharts()
  scheduleNetValueUpdate()
})
</script>