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
        <button @click="openAddInvestmentDetailModal" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
          添加投资明细
        </button>
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
            <input type="text" id="detailCode" v-model="newInvestmentDetail.code" @keyup.enter="handleCodeChange(newInvestmentDetail.code)" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
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
            <input type="number" id="detailCostPrice" v-model.number="newInvestmentDetail.costPrice" step="0.01" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="detailCurrentPrice" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">现价</label>
            <input type="number" id="detailCurrentPrice" v-model.number="newInvestmentDetail.currentPrice" step="0.01" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
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
            <input type="text" id="editDetailCode" v-model="editInvestmentDetail.code" @keyup.enter="handleEditCodeChange(editInvestmentDetail.code)" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
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
            <input type="number" id="editDetailCostPrice" v-model.number="editInvestmentDetail.costPrice" step="0.01" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="editDetailCurrentPrice" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">现价</label>
            <input type="number" id="editDetailCurrentPrice" v-model.number="editInvestmentDetail.currentPrice" step="0.01" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
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
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">收益分析</h3>
        <div class="h-64">
          <canvas ref="profitAnalysisChart"></canvas>
        </div>
      </div>
      
      <!-- 收益明细 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">收益明细</h3>
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
              <tr v-for="detail in investmentDetails" :key="detail.id">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'

// 投资账户列表
const investmentAccounts = ref([])

// 投资明细列表
const investmentDetails = ref([])

// 图表引用
const typeDistributionChart = ref(null)
const accountDistributionChart = ref(null)
const profitAnalysisChart = ref(null)

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
const addInvestmentAccount = () => {
  const newAccount = {
    id: Date.now().toString(),
    name: newInvestmentAccount.value.name,
    type: newInvestmentAccount.value.type,
    description: newInvestmentAccount.value.description,
    totalAsset: 0,
    profitLoss: 0
  }
  investmentAccounts.value.push(newAccount)
  saveInvestmentAccounts()
  showAddInvestmentAccountModal.value = false
}

// 更新投资账户
const updateInvestmentAccount = () => {
  const index = investmentAccounts.value.findIndex(a => a.id === editInvestmentAccount.value.id)
  if (index !== -1) {
    investmentAccounts.value[index] = {
      ...investmentAccounts.value[index],
      name: editInvestmentAccount.value.name,
      type: editInvestmentAccount.value.type,
      description: editInvestmentAccount.value.description
    }
    saveInvestmentAccounts()
    showEditInvestmentAccountModal.value = false
  }
}

// 删除投资账户
const deleteInvestmentAccount = (id) => {
  investmentAccounts.value = investmentAccounts.value.filter(a => a.id !== id)
  investmentDetails.value = investmentDetails.value.filter(d => d.accountId !== id)
  saveInvestmentAccounts()
  saveInvestmentDetails()
}

// 根据代码获取投资品种信息
const fetchInvestmentInfo = async (code) => {
  console.log('Fetching investment info for code:', code)
  
  // 检查代码格式
  if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
    throw new Error('代码格式不正确，请输入6位数字代码')
  }
  
  // 存储不同API的结果
  const apiResults = []
  
  // 1. 尝试天天基金实时估值（JSONP）
  const tianTianFundUrl = `http://fundgz.1234567.com.cn/js/${code}.js`
  
  try {
    console.log('尝试调用天天基金实时估值API:', tianTianFundUrl)
    const tianTianResponse = await fetch(tianTianFundUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    console.log('天天基金实时估值API响应状态:', tianTianResponse.status)
    
    // 检查响应状态
    if (tianTianResponse.status === 200) {
      const tianTianData = await tianTianResponse.text()
      console.log('天天基金实时估值API响应数据:', tianTianData)
      
      // 解析JSONP格式数据
      if (tianTianData && tianTianData.includes('jsonpgz(') && tianTianData.includes(')')) {
        const jsonStr = tianTianData.replace('jsonpgz(', '').replace(');', '')
        try {
          const fundData = JSON.parse(jsonStr)
          if (fundData.name && fundData.dwjz) {
            // 处理乱码问题
            let fundName = fundData.name
            try {
              // 尝试解码可能的编码问题
              fundName = decodeURIComponent(escape(fundData.name))
            } catch (e) {
              console.log('解码基金名称失败:', e)
            }
            console.log('成功获取天天基金数据:', fundName)
            apiResults.push({
              source: '天天基金实时估值',
              name: fundName,
              type: '基金',
              currentPrice: parseFloat(parseFloat(fundData.dwjz).toFixed(4)) || 0,
              updateDate: fundData.jzrq || new Date().toISOString().split('T')[0]
            })
          }
        } catch (parseError) {
          console.log('解析JSONP数据失败:', parseError)
        }
      }
    }
  } catch (tianTianError) {
    console.log('天天基金实时估值API调用失败:', tianTianError)
  }
  
  // 2. 尝试天天基金基本信息（JS）
  const tianTianInfoUrl = `http://fund.eastmoney.com/pingzhongdata/${code}.js`
  
  try {
    console.log('尝试调用天天基金基本信息API:', tianTianInfoUrl)
    const tianTianInfoResponse = await fetch(tianTianInfoUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    console.log('天天基金基本信息API响应状态:', tianTianInfoResponse.status)
    
    // 检查响应状态
    if (tianTianInfoResponse.status === 200) {
      const tianTianInfoData = await tianTianInfoResponse.text()
      console.log('天天基金基本信息API响应数据:', tianTianInfoData)
      
      // 解析JS变量定义
      if (tianTianInfoData) {
        // 提取基金名称
        const nameMatch = tianTianInfoData.match(/var fS_name = "([^"]+)"/)
        if (nameMatch && nameMatch[1]) {
          console.log('成功获取天天基金基本信息:', nameMatch[1])
          // 这里只获取名称，价格需要从其他API获取
          apiResults.push({
            source: '天天基金基本信息',
            name: nameMatch[1],
            type: '基金',
            currentPrice: 0, // 价格需要从其他API获取
            updateDate: new Date().toISOString().split('T')[0]
          })
        }
      }
    }
  } catch (tianTianInfoError) {
    console.log('天天基金基本信息API调用失败:', tianTianInfoError)
  }
  
  // 3. 尝试腾讯财经（实时行情）- 上海股票
  const tencentShUrl = `http://qt.gtimg.cn/q=sh${code}`
  
  try {
    console.log('尝试调用腾讯财经API（上海）:', tencentShUrl)
    const tencentShResponse = await fetch(tencentShUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    console.log('腾讯财经API（上海）响应状态:', tencentShResponse.status)
    
    // 检查响应状态
    if (tencentShResponse.status === 200) {
      const tencentShData = await tencentShResponse.text()
      console.log('腾讯财经API（上海）响应数据:', tencentShData)
      
      // 解析腾讯财经数据
      if (tencentShData && tencentShData.includes('=') && !tencentShData.includes('v_pv_none_match')) {
        const parts = tencentShData.split('=')
        if (parts.length > 1) {
          const data = parts[1].replace(/"/g, '').split('~')
          if (data.length > 4 && data[1] && data[1] !== '' && data[3] && data[3] !== '') {
            console.log('成功获取腾讯财经上海股票数据:', data[1])
            apiResults.push({
              source: '腾讯财经上海',
              name: data[1],
              type: '股票',
              currentPrice: parseFloat(parseFloat(data[3]).toFixed(4)) || 0,
              updateDate: new Date().toISOString().split('T')[0]
            })
          }
        }
      }
    }
  } catch (tencentShError) {
    console.log('腾讯财经API（上海）调用失败:', tencentShError)
  }
  
  // 4. 尝试腾讯财经（实时行情）- 深圳股票
  const tencentSzUrl = `http://qt.gtimg.cn/q=sz${code}`
  
  try {
    console.log('尝试调用腾讯财经API（深圳）:', tencentSzUrl)
    const tencentSzResponse = await fetch(tencentSzUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    console.log('腾讯财经API（深圳）响应状态:', tencentSzResponse.status)
    
    // 检查响应状态
    if (tencentSzResponse.status === 200) {
      const tencentSzData = await tencentSzResponse.text()
      console.log('腾讯财经API（深圳）响应数据:', tencentSzData)
      
      // 解析腾讯财经数据
      if (tencentSzData && tencentSzData.includes('=') && !tencentSzData.includes('v_pv_none_match')) {
        const parts = tencentSzData.split('=')
        if (parts.length > 1) {
          const data = parts[1].replace(/"/g, '').split('~')
          if (data.length > 4 && data[1] && data[1] !== '' && data[3] && data[3] !== '') {
            console.log('成功获取腾讯财经深圳股票数据:', data[1])
            apiResults.push({
              source: '腾讯财经深圳',
              name: data[1],
              type: '股票',
              currentPrice: parseFloat(parseFloat(data[3]).toFixed(4)) || 0,
              updateDate: new Date().toISOString().split('T')[0]
            })
          }
        }
      }
    }
  } catch (tencentSzError) {
    console.log('腾讯财经API（深圳）调用失败:', tencentSzError)
  }
  
  // 分析API结果
  console.log('所有API结果:', apiResults)
  
  if (apiResults.length > 0) {
    // 优先使用权威数据源的结果
    // 1. 天天基金实时估值（基金）
    const tianTianFundResult = apiResults.find(r => r.source === '天天基金实时估值')
    if (tianTianFundResult) {
      console.log('使用天天基金实时估值结果:', tianTianFundResult)
      return {
        name: tianTianFundResult.name,
        type: tianTianFundResult.type,
        currentPrice: tianTianFundResult.currentPrice,
        updateDate: tianTianFundResult.updateDate
      }
    }
    
    // 2. 腾讯财经上海（股票）
    const tencentShResult = apiResults.find(r => r.source === '腾讯财经上海')
    if (tencentShResult) {
      console.log('使用腾讯财经上海结果:', tencentShResult)
      return {
        name: tencentShResult.name,
        type: tencentShResult.type,
        currentPrice: tencentShResult.currentPrice,
        updateDate: tencentShResult.updateDate
      }
    }
    
    // 3. 腾讯财经深圳（股票）
    const tencentSzResult = apiResults.find(r => r.source === '腾讯财经深圳')
    if (tencentSzResult) {
      console.log('使用腾讯财经深圳结果:', tencentSzResult)
      return {
        name: tencentSzResult.name,
        type: tencentSzResult.type,
        currentPrice: tencentSzResult.currentPrice,
        updateDate: tencentSzResult.updateDate
      }
    }
    
    // 4. 天天基金基本信息（基金）
    const tianTianInfoResult = apiResults.find(r => r.source === '天天基金基本信息')
    if (tianTianInfoResult) {
      console.log('使用天天基金基本信息结果:', tianTianInfoResult)
      return {
        name: tianTianInfoResult.name,
        type: tianTianInfoResult.type,
        currentPrice: tianTianInfoResult.currentPrice,
        updateDate: tianTianInfoResult.updateDate
      }
    }
    
    // 5. 使用第一个有效结果
    const firstResult = apiResults[0]
    console.log('使用第一个有效结果:', firstResult)
    return {
      name: firstResult.name,
      type: firstResult.type,
      currentPrice: firstResult.currentPrice,
      updateDate: firstResult.updateDate
    }
  }
  
  // 所有API都失败
  console.log('所有API调用失败，无法获取数据')
  throw new Error(`无法获取代码 ${code} 的信息，请检查代码是否正确，或手动输入名称`)
}

// 监听代码变化，自动获取投资品种信息
const handleCodeChange = async (code) => {
  console.log('handleCodeChange called with code:', code)
  // 只在用户按Enter键且代码长度为6位时触发API调用
  if (code && code.length === 6) {
    try {
      console.log('Fetching investment info for code:', code)
      const info = await fetchInvestmentInfo(code)
      console.log('Received investment info:', info)
      newInvestmentDetail.value.name = info.name
      newInvestmentDetail.value.type = info.type
      newInvestmentDetail.value.currentPrice = info.currentPrice
      console.log('Updated newInvestmentDetail:', newInvestmentDetail.value)
    } catch (error) {
      console.error('Failed to fetch investment info:', error)
      // 清空自动填充的字段，让用户手动输入
      newInvestmentDetail.value.name = ''
      newInvestmentDetail.value.type = ''
      newInvestmentDetail.value.currentPrice = 0
      alert(error.message || '无法获取该代码的信息，请检查代码是否正确，或手动输入名称')
    }
  } else {
    console.log('Code length is not 6:', code?.length)
  }
}

// 监听编辑模式下的代码变化
const handleEditCodeChange = async (code) => {
  console.log('handleEditCodeChange called with code:', code)
  // 只在用户按Enter键且代码长度为6位时触发API调用
  if (code && code.length === 6) {
    try {
      console.log('Fetching investment info for code:', code)
      const info = await fetchInvestmentInfo(code)
      console.log('Received investment info:', info)
      editInvestmentDetail.value.name = info.name
      editInvestmentDetail.value.type = info.type
      editInvestmentDetail.value.currentPrice = info.currentPrice
      console.log('Updated editInvestmentDetail:', editInvestmentDetail.value)
    } catch (error) {
      console.error('Failed to fetch investment info:', error)
      // 清空自动填充的字段，让用户手动输入
      editInvestmentDetail.value.name = ''
      editInvestmentDetail.value.type = ''
      editInvestmentDetail.value.currentPrice = 0
      alert(error.message || '无法获取该代码的信息，请检查代码是否正确，或手动输入名称')
    }
  } else {
    console.log('Code length is not 6:', code?.length)
  }
}

// 添加投资明细
const addInvestmentDetail = () => {
  const account = investmentAccounts.value.find(a => a.id === newInvestmentDetail.value.accountId)
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
    updateDate: new Date().toISOString().split('T')[0]
  }
  investmentDetails.value.push(newDetail)
  updateAccountAsset(newInvestmentDetail.value.accountId)
  saveInvestmentDetails()
  showAddInvestmentDetailModal.value = false
}

// 更新投资明细
const updateInvestmentDetail = () => {
  const index = investmentDetails.value.findIndex(d => d.id === editInvestmentDetail.value.id)
  if (index !== -1) {
    const oldAccountId = investmentDetails.value[index].accountId
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
      updateDate: new Date().toISOString().split('T')[0]
    }
    updateAccountAsset(oldAccountId)
    updateAccountAsset(editInvestmentDetail.value.accountId)
    saveInvestmentDetails()
    showEditInvestmentDetailModal.value = false
  }
}

// 删除投资明细
const deleteInvestmentDetail = (id) => {
  const detail = investmentDetails.value.find(d => d.id === id)
  if (detail) {
    investmentDetails.value = investmentDetails.value.filter(d => d.id !== id)
    updateAccountAsset(detail.accountId)
    saveInvestmentDetails()
  }
}

// 更新账户资产
const updateAccountAsset = (accountId) => {
  const account = investmentAccounts.value.find(a => a.id === accountId)
  if (account) {
    const accountDetails = investmentDetails.value.filter(d => d.accountId === accountId)
    const totalAsset = accountDetails.reduce((total, d) => total + d.shares * d.currentPrice, 0)
    const totalCost = accountDetails.reduce((total, d) => total + d.shares * d.costPrice, 0)
    const profitLoss = totalAsset - totalCost
    
    account.totalAsset = totalAsset
    account.profitLoss = profitLoss
    saveInvestmentAccounts()
  }
}

// 保存投资账户到本地存储
const saveInvestmentAccounts = () => {
  localStorage.setItem('investmentAccounts', JSON.stringify(investmentAccounts.value))
}

// 保存投资明细到本地存储
const saveInvestmentDetails = () => {
  localStorage.setItem('investmentDetails', JSON.stringify(investmentDetails.value))
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
  
  const labels = investmentDetails.value.map(detail => detail.name)
  const profitData = investmentDetails.value.map(detail => {
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

// 从本地存储加载数据
const loadData = () => {
  const savedAccounts = localStorage.getItem('investmentAccounts')
  const savedDetails = localStorage.getItem('investmentDetails')
  
  if (savedAccounts) {
    investmentAccounts.value = JSON.parse(savedAccounts)
  }
  
  if (savedDetails) {
    investmentDetails.value = JSON.parse(savedDetails)
  }
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
          detail.updateDate = info.updateDate || new Date().toISOString().split('T')[0]
        }
      } catch (error) {
        console.error(`Failed to update net value for ${detail.code}:`, error)
      }
    }
    
    // 更新账户资产
    for (const account of investmentAccounts.value) {
      updateAccountAsset(account.id)
    }
    
    // 保存数据
    saveInvestmentDetails()
    saveInvestmentAccounts()
    
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
onMounted(() => {
  loadData()
  initCharts()
  scheduleNetValueUpdate()
})
</script>