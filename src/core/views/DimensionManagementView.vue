<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">维度管理</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        💡 提示：已被交易使用的维度只能修改名称，不能删除
      </p>
      
      <div class="mb-6">
        <div class="flex space-x-4 mb-4 flex-wrap">
          <button @click="activeTab = 'categories'" :class="activeTab === 'categories' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-4 py-2 rounded-md font-medium">
            收支分类
          </button>
          <button @click="activeTab = 'members'" :class="activeTab === 'members' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-4 py-2 rounded-md font-medium">
            成员
          </button>
          <button @click="activeTab = 'merchants'" :class="activeTab === 'merchants' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-4 py-2 rounded-md font-medium">
            商家
          </button>
          <button @click="activeTab = 'tags'" :class="activeTab === 'tags' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-4 py-2 rounded-md font-medium">
            标签
          </button>
          <button @click="activeTab = 'payment-channels'" :class="activeTab === 'payment-channels' ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'" class="px-4 py-2 rounded-md font-medium">
            支付渠道
          </button>
        </div>

        <!-- 收支分类 -->
        <div v-if="activeTab === 'categories'">
          <div class="flex justify-between items-center mb-4">
            <div class="flex space-x-4">
              <button @click="isSubCategory = false" :class="!isSubCategory ? 'bg-primary text-white' : 'bg-gray-200'" class="px-4 py-2 rounded-md">
                一级分类
              </button>
              <button @click="isSubCategory = true" :class="isSubCategory ? 'bg-primary text-white' : 'bg-gray-200'" class="px-4 py-2 rounded-md">
                二级分类
              </button>
            </div>
            <button @click="openAddCategoryModal" class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
              添加分类
            </button>
          </div>

          <!-- 一级分类 -->
          <div v-if="!isSubCategory" class="space-y-4">
            <div>
              <h3 class="font-semibold text-red-600 mb-2">支出分类</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div v-for="cat in expenseCategories" :key="cat.id" class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  <span>{{ cat.name }}</span>
                  <div>
                    <button @click="openEditCategoryModal(cat)" class="text-blue-500 hover:text-blue-700 mr-2">✏️</button>
                    <button @click="deleteCategory(cat.id)" class="text-red-500 hover:text-red-700">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-green-600 mb-2">收入分类</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div v-for="cat in incomeCategories" :key="cat.id" class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  <span>{{ cat.name }}</span>
                  <div>
                    <button @click="openEditCategoryModal(cat)" class="text-blue-500 hover:text-blue-700 mr-2">✏️</button>
                    <button @click="deleteCategory(cat.id)" class="text-red-500 hover:text-red-700">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 二级分类 -->
          <div v-else class="space-y-4">
            <div>
              <h3 class="font-semibold text-red-600 mb-2">支出分类</h3>
              <div v-for="parent in expenseCategories" :key="parent.id" class="mb-4">
                <div class="font-medium mb-2 flex items-center justify-between">
                  <span>{{ parent.name }}</span>
                  <button @click="openAddSubCategoryModal(parent.id, 'expense')" class="text-sm text-primary">+ 添加子分类</button>
                </div>
                <div class="ml-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div v-for="child in getSubCategories(parent.id)" :key="child.id" class="flex items-center justify-between bg-gray-50 dark:bg-gray-600 p-2 rounded text-sm">
                    <span>{{ child.name }}</span>
                    <button @click="deleteCategory(child.id)" class="text-red-500 hover:text-red-700">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-green-600 mb-2">收入分类</h3>
              <div v-for="parent in incomeCategories" :key="parent.id" class="mb-4">
                <div class="font-medium mb-2 flex items-center justify-between">
                  <span>{{ parent.name }}</span>
                  <button @click="openAddSubCategoryModal(parent.id, 'income')" class="text-sm text-primary">+ 添加子分类</button>
                </div>
                <div class="ml-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div v-for="child in getSubCategories(parent.id)" :key="child.id" class="flex items-center justify-between bg-gray-50 dark:bg-gray-600 p-2 rounded text-sm">
                    <span>{{ child.name }}</span>
                    <button @click="deleteCategory(child.id)" class="text-red-500 hover:text-red-700">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 成员管理 -->
        <div v-if="activeTab === 'members'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold">成员列表</h3>
            <button @click="openAddMemberModal" class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
              添加成员
            </button>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div v-for="member in membersWithUsage" :key="member.id" class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <span :class="member.isUsed ? 'font-semibold' : ''">{{ member.name }}<span v-if="member.isUsed" class="text-xs text-gray-400 ml-1">(使用中)</span></span>
              <div>
                <button @click="openEditMemberModal(member)" class="text-blue-500 hover:text-blue-700 mr-2">✏️</button>
                <button v-if="!member.isUsed" @click="deleteMember(member.id)" class="text-red-500 hover:text-red-700">🗑️</button>
                <span v-else class="text-gray-400 text-xs">不可删除</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 商家管理 -->
        <div v-if="activeTab === 'merchants'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold">商家列表</h3>
            <button @click="openAddMerchantModal" class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
              添加商家
            </button>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div v-for="merchant in merchantsWithUsage" :key="merchant.id" class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <span :class="merchant.isUsed ? 'font-semibold' : ''">{{ merchant.name }}<span v-if="merchant.isUsed" class="text-xs text-gray-400 ml-1">(使用中)</span></span>
              <div>
                <button @click="openEditMerchantModal(merchant)" class="text-blue-500 hover:text-blue-700 mr-2">✏️</button>
                <button v-if="!merchant.isUsed" @click="deleteMerchant(merchant.id)" class="text-red-500 hover:text-red-700">🗑️</button>
                <span v-else class="text-gray-400 text-xs">不可删除</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签管理 -->
        <div v-if="activeTab === 'tags'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold">标签列表</h3>
            <button @click="openAddTagModal" class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
              添加标签
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="tag in tagsWithUsage" :key="tag.id" class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full flex items-center">
              {{ tag.name }}<span v-if="tag.isUsed" class="text-xs ml-1">(使用中)</span>
              <button @click="openEditTagModal(tag)" class="ml-2 text-blue-500 hover:text-blue-700">✏️</button>
              <button v-if="!tag.isUsed" @click="deleteTag(tag.id)" class="ml-1 text-red-500 hover:text-red-700">×</button>
            </span>
          </div>
        </div>

        <!-- 支付渠道管理 -->
        <div v-if="activeTab === 'payment-channels'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold">支付渠道列表</h3>
            <button @click="openAddPaymentChannelModal" class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
              添加支付渠道
            </button>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div v-for="channel in channelsWithUsage" :key="channel.id" class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <span :class="channel.isUsed ? 'font-semibold' : ''">{{ channel.name }}<span v-if="channel.isUsed" class="text-xs text-gray-400 ml-1">(使用中)</span></span>
              <div>
                <button @click="openEditPaymentChannelModal(channel)" class="text-blue-500 hover:text-blue-700 mr-2">✏️</button>
                <button v-if="!channel.isUsed" @click="deletePaymentChannel(channel.id)" class="text-red-500 hover:text-red-700">🗑️</button>
                <span v-else class="text-gray-400 text-xs">不可删除</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加分类模态框 -->
    <div v-if="showAddCategoryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddCategoryModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-semibold mb-4">{{ categoryForm.parentId ? '添加子分类' : '添加分类' }}</h3>
        <div class="space-y-4">
          <div v-if="!categoryForm.parentId">
            <label class="block text-sm font-medium mb-1">分类类型</label>
            <select v-model="categoryForm.type" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">分类名称</label>
            <input v-model="categoryForm.name" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="请输入分类名称">
          </div>
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showAddCategoryModal = false; categoryForm.parentId = null" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">取消</button>
          <button @click="saveCategory" class="px-4 py-2 bg-primary text-white rounded-md">保存</button>
        </div>
      </div>
    </div>

    <!-- 编辑分类模态框 -->
    <div v-if="showEditCategoryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showEditCategoryModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-semibold mb-4">编辑分类</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">分类名称</label>
            <input v-model="categoryForm.name" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
          </div>
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showEditCategoryModal = false" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">取消</button>
          <button @click="saveCategory" class="px-4 py-2 bg-primary text-white rounded-md">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加成员模态框 -->
    <div v-if="showAddMemberModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddMemberModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-semibold mb-4">添加成员</h3>
        <div>
          <label class="block text-sm font-medium mb-1">成员名称</label>
          <input v-model="memberForm.name" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="请输入成员名称">
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showAddMemberModal = false" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">取消</button>
          <button @click="saveMember" class="px-4 py-2 bg-primary text-white rounded-md">保存</button>
        </div>
      </div>
    </div>

    <!-- 编辑成员模态框 -->
    <div v-if="showEditMemberModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showEditMemberModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-semibold mb-4">编辑成员</h3>
        <div>
          <label class="block text-sm font-medium mb-1">成员名称</label>
          <input v-model="memberForm.name" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showEditMemberModal = false" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">取消</button>
          <button @click="saveMember" class="px-4 py-2 bg-primary text-white rounded-md">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加商家模态框 -->
    <div v-if="showAddMerchantModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddMerchantModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-semibold mb-4">添加商家</h3>
        <div>
          <label class="block text-sm font-medium mb-1">商家名称</label>
          <input v-model="merchantForm.name" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="请输入商家名称">
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showAddMerchantModal = false" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">取消</button>
          <button @click="saveMerchant" class="px-4 py-2 bg-primary text-white rounded-md">保存</button>
        </div>
      </div>
    </div>

    <!-- 编辑商家模态框 -->
    <div v-if="showEditMerchantModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showEditMerchantModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-semibold mb-4">编辑商家</h3>
        <div>
          <label class="block text-sm font-medium mb-1">商家名称</label>
          <input v-model="merchantForm.name" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showEditMerchantModal = false" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">取消</button>
          <button @click="saveMerchant" class="px-4 py-2 bg-primary text-white rounded-md">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑标签模态框 -->
    <div v-if="showAddTagModal || showEditTagModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeTagModal">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-semibold mb-4">{{ showEditTagModal ? '编辑标签' : '添加标签' }}</h3>
        <div>
          <label class="block text-sm font-medium mb-1">标签名称</label>
          <input v-model="tagForm.name" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="请输入标签名称">
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="closeTagModal" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">取消</button>
          <button @click="saveTag" class="px-4 py-2 bg-primary text-white rounded-md">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加支付渠道模态框 -->
    <div v-if="showAddPaymentChannelModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddPaymentChannelModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-semibold mb-4">添加支付渠道</h3>
        <div>
          <label class="block text-sm font-medium mb-1">支付渠道名称</label>
          <input v-model="paymentChannelForm.name" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="请输入支付渠道名称">
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showAddPaymentChannelModal = false" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">取消</button>
          <button @click="savePaymentChannel" class="px-4 py-2 bg-primary text-white rounded-md">保存</button>
        </div>
      </div>
    </div>

    <!-- 编辑支付渠道模态框 -->
    <div v-if="showEditPaymentChannelModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showEditPaymentChannelModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 class="text-lg font-semibold mb-4">编辑支付渠道</h3>
        <div>
          <label class="block text-sm font-medium mb-1">支付渠道名称</label>
          <input v-model="paymentChannelForm.name" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showEditPaymentChannelModal = false" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">取消</button>
          <button @click="savePaymentChannel" class="px-4 py-2 bg-primary text-white rounded-md">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import coreDataStore from '../../services/core-data-store.js'

// 活跃标签页
const activeTab = ref('categories')

// 是否为子分类
const isSubCategory = ref(false)

// 收支分类（从 dimensions 获取）
const dimensions = computed(() => coreDataStore.get('dimensions').value || {})
const expenseCategories = ref([])
const incomeCategories = ref([])

// 成员/商家/标签/支付渠道（独立存储）
const members = ref([])
const merchants = ref([])
const tags = ref([])
const paymentChannels = ref([])

// 带使用状态的计算属性
const membersWithUsage = computed(() => 
  members.value.map(m => ({ ...m, isUsed: coreDataStore.isDimensionUsed('members', m.name) }))
)
const merchantsWithUsage = computed(() => 
  merchants.value.map(m => ({ ...m, isUsed: coreDataStore.isDimensionUsed('merchants', m.name) }))
)
const tagsWithUsage = computed(() => 
  tags.value.map(t => ({ ...t, isUsed: coreDataStore.isDimensionUsed('tags', t.name) }))
)
const channelsWithUsage = computed(() => 
  paymentChannels.value.map(c => ({ ...c, isUsed: coreDataStore.isDimensionUsed('paymentChannels', c.name) }))
)

// 模态框状态
const showAddCategoryModal = ref(false)
const showEditCategoryModal = ref(false)
const showAddMemberModal = ref(false)
const showEditMemberModal = ref(false)
const showAddMerchantModal = ref(false)
const showEditMerchantModal = ref(false)
const showAddTagModal = ref(false)
const showEditTagModal = ref(false)
const showAddPaymentChannelModal = ref(false)
const showEditPaymentChannelModal = ref(false)

// 表单数据
const categoryForm = ref({ id: null, name: '', type: 'expense', parentId: null })
const memberForm = ref({ id: null, name: '' })
const merchantForm = ref({ id: null, name: '' })
const tagForm = ref({ id: null, name: '' })
const paymentChannelForm = ref({ id: null, name: '' })

// 加载数据
const loadDimensions = () => {
  const dims = coreDataStore.get('dimensions').value || {}
  expenseCategories.value = dims.expenseCategories || []
  incomeCategories.value = dims.incomeCategories || []
  members.value = coreDataStore.get('members').value || []
  merchants.value = coreDataStore.get('merchants').value || []
  tags.value = coreDataStore.get('tags').value || []
  paymentChannels.value = coreDataStore.get('paymentChannels').value || []
}

// 保存维度数据
const saveDimensions = () => {
  coreDataStore.set('dimensions', {
    expenseCategories: expenseCategories.value,
    incomeCategories: incomeCategories.value
  }, { skipSync: true })
}

// 获取子分类
const getSubCategories = (parentId) => {
  const allCategories = [...expenseCategories.value, ...incomeCategories.value]
  const parent = allCategories.find(c => c.id === parentId)
  if (parent && parent.children) {
    return parent.children
  }
  return []
}

// 打开添加分类模态框
const openAddCategoryModal = () => {
  categoryForm.value = { id: null, name: '', type: 'expense', parentId: null }
  showAddCategoryModal.value = true
}

// 打开添加子分类模态框
const openAddSubCategoryModal = (parentId, type) => {
  categoryForm.value = { id: null, name: '', type, parentId }
  showAddCategoryModal.value = true
}

// 打开编辑分类模态框
const openEditCategoryModal = (category) => {
  categoryForm.value = { ...category }
  showEditCategoryModal.value = true
}

// 保存分类
const saveCategory = async () => {
  if (!categoryForm.value.name.trim()) {
    alert('请输入分类名称')
    return
  }
  
  if (showEditCategoryModal.value) {
    // 编辑模式
    const categories = categoryForm.value.type === 'expense' ? expenseCategories.value : incomeCategories.value
    const index = categories.findIndex(c => c.id === categoryForm.value.id)
    if (index !== -1) {
      categories[index] = { ...categoryForm.value }
    }
  } else if (categoryForm.value.parentId) {
    // 添加子分类
    const categories = categoryForm.value.type === 'expense' ? expenseCategories.value : incomeCategories.value
    const parent = categories.find(c => c.id === categoryForm.value.parentId)
    if (parent) {
      if (!parent.children) parent.children = []
      parent.children.push({
        id: Date.now().toString(),
        name: categoryForm.value.name,
        type: categoryForm.value.type,
        parentId: categoryForm.value.parentId
      })
    }
  } else {
    // 添加一级分类
    const newCategory = {
      id: Date.now().toString(),
      name: categoryForm.value.name,
      type: categoryForm.value.type
    }
    if (categoryForm.value.type === 'expense') {
      expenseCategories.value.push(newCategory)
    } else {
      incomeCategories.value.push(newCategory)
    }
  }
  
  await saveDimensions()
  showAddCategoryModal.value = false
  showEditCategoryModal.value = false
  categoryForm.value = { id: null, name: '', type: 'expense', parentId: null }
}

// 删除分类（不检查使用情况，分类可以删除）
const deleteCategory = async (categoryId) => {
  if (!confirm('确定要删除此分类吗？')) return
  
  // 从支出分类中删除
  let index = expenseCategories.value.findIndex(c => c.id === categoryId)
  if (index !== -1) {
    expenseCategories.value.splice(index, 1)
    await saveDimensions()
    return
  }
  
  // 从收入分类中删除
  index = incomeCategories.value.findIndex(c => c.id === categoryId)
  if (index !== -1) {
    incomeCategories.value.splice(index, 1)
    await saveDimensions()
    return
  }
  
  // 从子分类中删除
  for (const parent of [...expenseCategories.value, ...incomeCategories.value]) {
    if (parent.children) {
      index = parent.children.findIndex(c => c.id === categoryId)
      if (index !== -1) {
        parent.children.splice(index, 1)
        await saveDimensions()
        return
      }
    }
  }
}

// 打开添加成员模态框
const openAddMemberModal = () => {
  memberForm.value = { id: null, name: '' }
  showAddMemberModal.value = true
}

// 打开编辑成员模态框
const openEditMemberModal = (member) => {
  memberForm.value = { ...member }
  showEditMemberModal.value = true
}

// 保存成员
const saveMember = async () => {
  if (!memberForm.value.name.trim()) {
    alert('请输入成员名称')
    return
  }
  
  if (showEditMemberModal.value) {
    // 编辑：使用 coreDataStore 更新维度（会自动更新所有使用该维度的交易）
    await coreDataStore.updateDimension('members', memberForm.value.id, { name: memberForm.value.name })
  } else {
    // 添加
    await coreDataStore.addDimension('members', { name: memberForm.value.name })
  }
  
  loadDimensions()
  showAddMemberModal.value = false
  showEditMemberModal.value = false
  memberForm.value = { id: null, name: '' }
}

// 删除成员（检查使用情况）
const deleteMember = async (memberId) => {
  const member = members.value.find(m => m.id === memberId)
  if (member && coreDataStore.isDimensionUsed('members', member.name)) {
    alert('该成员已被交易使用，无法删除，只能修改名称')
    return
  }
  
  if (!confirm('确定要删除此成员吗？')) return
  await coreDataStore.deleteDimension('members', memberId)
  loadDimensions()
}

// 打开添加商家模态框
const openAddMerchantModal = () => {
  merchantForm.value = { id: null, name: '' }
  showAddMerchantModal.value = true
}

// 打开编辑商家模态框
const openEditMerchantModal = (merchant) => {
  merchantForm.value = { ...merchant }
  showEditMerchantModal.value = true
}

// 保存商家
const saveMerchant = async () => {
  if (!merchantForm.value.name.trim()) {
    alert('请输入商家名称')
    return
  }
  
  if (showEditMerchantModal.value) {
    await coreDataStore.updateDimension('merchants', merchantForm.value.id, { name: merchantForm.value.name })
  } else {
    await coreDataStore.addDimension('merchants', { name: merchantForm.value.name })
  }
  
  loadDimensions()
  showAddMerchantModal.value = false
  showEditMerchantModal.value = false
  merchantForm.value = { id: null, name: '' }
}

// 删除商家（检查使用情况）
const deleteMerchant = async (merchantId) => {
  const merchant = merchants.value.find(m => m.id === merchantId)
  if (merchant && coreDataStore.isDimensionUsed('merchants', merchant.name)) {
    alert('该商家已被交易使用，无法删除，只能修改名称')
    return
  }
  
  if (!confirm('确定要删除此商家吗？')) return
  await coreDataStore.deleteDimension('merchants', merchantId)
  loadDimensions()
}

// 打开添加标签模态框
const openAddTagModal = () => {
  tagForm.value = { id: null, name: '' }
  showAddTagModal.value = true
}

// 打开编辑标签模态框
const openEditTagModal = (tag) => {
  tagForm.value = { ...tag }
  showEditTagModal.value = true
}

// 关闭标签模态框
const closeTagModal = () => {
  showAddTagModal.value = false
  showEditTagModal.value = false
  tagForm.value = { id: null, name: '' }
}

// 保存标签
const saveTag = async () => {
  if (!tagForm.value.name.trim()) {
    alert('请输入标签名称')
    return
  }
  
  if (showEditTagModal.value) {
    await coreDataStore.updateDimension('tags', tagForm.value.id, { name: tagForm.value.name })
  } else {
    await coreDataStore.addDimension('tags', { name: tagForm.value.name })
  }
  
  loadDimensions()
  closeTagModal()
}

// 删除标签（检查使用情况）
const deleteTag = async (tagId) => {
  const tag = tags.value.find(t => t.id === tagId)
  if (tag && coreDataStore.isDimensionUsed('tags', tag.name)) {
    alert('该标签已被交易使用，无法删除，只能修改名称')
    return
  }
  
  if (!confirm('确定要删除此标签吗？')) return
  await coreDataStore.deleteDimension('tags', tagId)
  loadDimensions()
}

// 打开添加支付渠道模态框
const openAddPaymentChannelModal = () => {
  paymentChannelForm.value = { id: null, name: '' }
  showAddPaymentChannelModal.value = true
}

// 打开编辑支付渠道模态框
const openEditPaymentChannelModal = (channel) => {
  paymentChannelForm.value = { ...channel }
  showEditPaymentChannelModal.value = true
}

// 保存支付渠道
const savePaymentChannel = async () => {
  if (!paymentChannelForm.value.name.trim()) {
    alert('请输入支付渠道名称')
    return
  }
  
  if (showEditPaymentChannelModal.value) {
    await coreDataStore.updateDimension('paymentChannels', paymentChannelForm.value.id, { name: paymentChannelForm.value.name })
  } else {
    await coreDataStore.addDimension('paymentChannels', { name: paymentChannelForm.value.name })
  }
  
  loadDimensions()
  showAddPaymentChannelModal.value = false
  showEditPaymentChannelModal.value = false
  paymentChannelForm.value = { id: null, name: '' }
}

// 删除支付渠道（检查使用情况）
const deletePaymentChannel = async (channelId) => {
  const channel = paymentChannels.value.find(c => c.id === channelId)
  if (channel && coreDataStore.isDimensionUsed('paymentChannels', channel.name)) {
    alert('该支付渠道已被交易使用，无法删除，只能修改名称')
    return
  }
  
  if (!confirm('确定要删除此支付渠道吗？')) return
  await coreDataStore.deleteDimension('paymentChannels', channelId)
  loadDimensions()
}

// 数据变更处理
const handleDataChanged = () => {
  loadDimensions()
}

// 监听账套切换
const handleLedgerChange = () => {
  loadDimensions()
}

onMounted(() => {
  loadDimensions()
  window.addEventListener('dataChanged', handleDataChanged)
  window.addEventListener('ledgerChanged', handleLedgerChange)
})

onUnmounted(() => {
  window.removeEventListener('dataChanged', handleDataChanged)
  window.removeEventListener('ledgerChanged', handleLedgerChange)
})
</script>
