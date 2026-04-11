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
            <input type="text" id="detailCode" v-model="newInvestmentDetail.code" @input="handleCodeChange(newInvestmentDetail.code)" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
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
            <input type="text" id="editDetailCode" v-model="editInvestmentDetail.code" @input="handleEditCodeChange(editInvestmentDetail.code)" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 投资账户列表
const investmentAccounts = ref([])

// 投资明细列表
const investmentDetails = ref([])

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
  // 这里使用模拟数据，实际项目中可以调用真实的API
  // 例如：基金可以使用天天基金网API，股票可以使用新浪财经API
  console.log('Fetching investment info for code:', code)
  
  // 模拟API响应
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟基金数据
      if (code.startsWith('1') || code.startsWith('2') || code.startsWith('5')) {
        resolve({
          name: `模拟基金${code}`,
          type: '基金',
          currentPrice: 1.2345 + Math.random() * 0.5
        })
      }
      // 模拟股票数据
      else if (code.length === 6) {
        resolve({
          name: `模拟股票${code}`,
          type: '股票',
          currentPrice: 10 + Math.random() * 50
        })
      }
      // 默认数据
      else {
        resolve({
          name: `投资品种${code}`,
          type: '其他',
          currentPrice: 1
        })
      }
    }, 500)
  })
}

// 监听代码变化，自动获取投资品种信息
const handleCodeChange = async (code) => {
  if (code && code.length >= 3) {
    try {
      const info = await fetchInvestmentInfo(code)
      newInvestmentDetail.value.name = info.name
      newInvestmentDetail.value.type = info.type
      newInvestmentDetail.value.currentPrice = info.currentPrice
    } catch (error) {
      console.error('Failed to fetch investment info:', error)
    }
  }
}

// 监听编辑模式下的代码变化
const handleEditCodeChange = async (code) => {
  if (code && code.length >= 3) {
    try {
      const info = await fetchInvestmentInfo(code)
      editInvestmentDetail.value.name = info.name
      editInvestmentDetail.value.type = info.type
      editInvestmentDetail.value.currentPrice = info.currentPrice
    } catch (error) {
      console.error('Failed to fetch investment info:', error)
    }
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
    currentPrice: newInvestmentDetail.value.currentPrice
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
      currentPrice: editInvestmentDetail.value.currentPrice
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

onMounted(() => {
  loadData()
})
</script>