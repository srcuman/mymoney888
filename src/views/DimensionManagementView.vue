<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">维度管理</h2>
      
      <div class="mb-6">
        <div class="flex space-x-4 mb-4">
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
        </div>

        <!-- 收支分类 -->
        <div v-if="activeTab === 'categories'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">收支分类管理</h3>
            <button @click="showAddCategoryModal = true" class="px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              添加分类
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <h4 class="font-medium text-gray-700 dark:text-gray-300">支出分类</h4>
              <div v-for="category in expenseCategories" :key="category.id" class="space-y-2">
                <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <div class="flex items-center">
                    <button v-if="category.children && category.children.length > 0" @click="toggleCategory(category.id)" class="mr-2 text-gray-500 dark:text-gray-400">
                      {{ expandedCategories.includes(category.id) ? '▼' : '▶' }}
                    </button>
                    <span class="text-gray-900 dark:text-white font-medium">{{ category.name }}</span>
                  </div>
                  <div class="flex space-x-2">
                    <button @click="addSubCategory(category)" class="text-primary hover:text-blue-700 dark:hover:text-blue-400 text-sm">添加子分类</button>
                    <button @click="editCategory(category)" class="text-primary hover:text-blue-700 dark:hover:text-blue-400 text-sm">编辑</button>
                    <button @click="deleteCategory(category.id)" class="text-danger hover:text-red-700 dark:hover:text-red-400 text-sm">删除</button>
                  </div>
                </div>
                <div v-if="expandedCategories.includes(category.id) && category.children && category.children.length > 0" class="ml-6 space-y-2">
                  <div v-for="subCategory in category.children" :key="subCategory.id" class="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-600 rounded-md">
                    <span class="text-gray-800 dark:text-gray-300">{{ subCategory.name }}</span>
                    <div class="flex space-x-2">
                      <button @click="editCategory(subCategory, category.id)" class="text-primary hover:text-blue-700 dark:hover:text-blue-400 text-xs">编辑</button>
                      <button @click="deleteSubCategory(category.id, subCategory.id)" class="text-danger hover:text-red-700 dark:hover:text-red-400 text-xs">删除</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <h4 class="font-medium text-gray-700 dark:text-gray-300">收入分类</h4>
              <div v-for="category in incomeCategories" :key="category.id" class="space-y-2">
                <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <div class="flex items-center">
                    <button v-if="category.children && category.children.length > 0" @click="toggleCategory(category.id)" class="mr-2 text-gray-500 dark:text-gray-400">
                      {{ expandedCategories.includes(category.id) ? '▼' : '▶' }}
                    </button>
                    <span class="text-gray-900 dark:text-white font-medium">{{ category.name }}</span>
                  </div>
                  <div class="flex space-x-2">
                    <button @click="addSubCategory(category)" class="text-primary hover:text-blue-700 dark:hover:text-blue-400 text-sm">添加子分类</button>
                    <button @click="editCategory(category)" class="text-primary hover:text-blue-700 dark:hover:text-blue-400 text-sm">编辑</button>
                    <button @click="deleteCategory(category.id)" class="text-danger hover:text-red-700 dark:hover:text-red-400 text-sm">删除</button>
                  </div>
                </div>
                <div v-if="expandedCategories.includes(category.id) && category.children && category.children.length > 0" class="ml-6 space-y-2">
                  <div v-for="subCategory in category.children" :key="subCategory.id" class="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-600 rounded-md">
                    <span class="text-gray-800 dark:text-gray-300">{{ subCategory.name }}</span>
                    <div class="flex space-x-2">
                      <button @click="editCategory(subCategory, category.id)" class="text-primary hover:text-blue-700 dark:hover:text-blue-400 text-xs">编辑</button>
                      <button @click="deleteSubCategory(category.id, subCategory.id)" class="text-danger hover:text-red-700 dark:hover:text-red-400 text-xs">删除</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 成员 -->
        <div v-if="activeTab === 'members'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">成员管理</h3>
            <button @click="showAddMemberModal = true" class="px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              添加成员
            </button>
          </div>
          <div class="space-y-3">
            <div v-for="member in members" :key="member.id" class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-3">
                  <span class="text-primary dark:text-blue-400 font-bold">{{ member.name.charAt(0) }}</span>
                </div>
                <span class="text-gray-900 dark:text-white">{{ member.name }}</span>
              </div>
              <div class="flex space-x-2">
                <button @click="editMember(member)" class="text-primary hover:text-blue-700 dark:hover:text-blue-400">编辑</button>
                <button @click="deleteMember(member.id)" class="text-danger hover:text-red-700 dark:hover:text-red-400">删除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 商家 -->
        <div v-if="activeTab === 'merchants'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">商家管理</h3>
            <button @click="showAddMerchantModal = true" class="px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              添加商家
            </button>
          </div>
          <div class="space-y-3">
            <div v-for="merchant in merchants" :key="merchant.id" class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <span class="text-gray-900 dark:text-white">{{ merchant.name }}</span>
              <div class="flex space-x-2">
                <button @click="editMerchant(merchant)" class="text-primary hover:text-blue-700 dark:hover:text-blue-400">编辑</button>
                <button @click="deleteMerchant(merchant.id)" class="text-danger hover:text-red-700 dark:hover:text-red-400">删除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签 -->
        <div v-if="activeTab === 'tags'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">标签管理</h3>
            <button @click="showAddTagModal = true" class="px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              添加标签
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <div v-for="tag in tags" :key="tag.id" class="flex items-center px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded-full">
              <span class="text-gray-900 dark:text-white mr-2">{{ tag.name }}</span>
              <button @click="deleteTag(tag.id)" class="text-danger hover:text-red-700 dark:hover:text-red-400">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模态框 -->
    <!-- 添加/编辑分类 -->
    <div v-if="showAddCategoryModal || showEditCategoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ showEditCategoryModal ? (isSubCategory ? '编辑子分类' : '编辑分类') : (isSubCategory ? '添加子分类' : '添加分类') }}</h3>
        <form @submit.prevent="saveCategory" class="space-y-4">
          <div>
            <label for="category-name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">分类名称</label>
            <input type="text" id="category-name" v-model="categoryForm.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div v-if="!isSubCategory">
            <label for="category-type" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">类型</label>
            <select id="category-type" v-model="categoryForm.type" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </div>
          <div v-if="isSubCategory">
            <label for="parent-category" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">父分类</label>
            <select id="parent-category" v-model="categoryForm.parentId" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
              <option value="">请选择父分类</option>
              <option v-for="category in parentCategories" :key="category.id" :value="category.id">{{ category.name }}</option>
            </select>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showAddCategoryModal = false; showEditCategoryModal = false; resetCategoryForm()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
              取消
            </button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 添加/编辑成员 -->
    <div v-if="showAddMemberModal || showEditMemberModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ showEditMemberModal ? '编辑成员' : '添加成员' }}</h3>
        <form @submit.prevent="saveMember" class="space-y-4">
          <div>
            <label for="member-name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">成员名称</label>
            <input type="text" id="member-name" v-model="memberForm.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showAddMemberModal = false; showEditMemberModal = false; resetMemberForm()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
              取消
            </button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 添加/编辑商家 -->
    <div v-if="showAddMerchantModal || showEditMerchantModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ showEditMerchantModal ? '编辑商家' : '添加商家' }}</h3>
        <form @submit.prevent="saveMerchant" class="space-y-4">
          <div>
            <label for="merchant-name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">商家名称</label>
            <input type="text" id="merchant-name" v-model="merchantForm.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showAddMerchantModal = false; showEditMerchantModal = false; resetMerchantForm()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
              取消
            </button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 添加标签 -->
    <div v-if="showAddTagModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">添加标签</h3>
        <form @submit.prevent="saveTag" class="space-y-4">
          <div>
            <label for="tag-name" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">标签名称</label>
            <input type="text" id="tag-name" v-model="tagForm.name" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white">
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showAddTagModal = false; resetTagForm()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md text-sm font-medium">
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

// 活跃标签页
const activeTab = ref('categories')

// 收支分类
const expenseCategories = ref([])
const incomeCategories = ref([])

// 成员
const members = ref([])

// 商家
const merchants = ref([])

// 标签
const tags = ref([])

// 展开的分类
const expandedCategories = ref([])

// 是否为子分类
const isSubCategory = ref(false)

// 模态框状态
const showAddCategoryModal = ref(false)
const showEditCategoryModal = ref(false)
const showAddMemberModal = ref(false)
const showEditMemberModal = ref(false)
const showAddMerchantModal = ref(false)
const showEditMerchantModal = ref(false)
const showAddTagModal = ref(false)

// 表单数据
const categoryForm = ref({ id: null, name: '', type: 'expense', parentId: null })
const memberForm = ref({ id: null, name: '' })
const merchantForm = ref({ id: null, name: '' })
const tagForm = ref({ id: null, name: '' })

// 父分类列表
const parentCategories = computed(() => {
  return categoryForm.value.type === 'expense' ? expenseCategories.value : incomeCategories.value
})

// 重置表单
const resetCategoryForm = () => { categoryForm.value = { id: null, name: '', type: 'expense', parentId: null }; isSubCategory.value = false }
const resetMemberForm = () => { memberForm.value = { id: null, name: '' } }
const resetMerchantForm = () => { merchantForm.value = { id: null, name: '' } }
const resetTagForm = () => { tagForm.value = { id: null, name: '' } }

// 切换分类展开/折叠
const toggleCategory = (categoryId) => {
  const index = expandedCategories.value.indexOf(categoryId)
  if (index === -1) {
    expandedCategories.value.push(categoryId)
  } else {
    expandedCategories.value.splice(index, 1)
  }
}

// 添加子分类
const addSubCategory = (parentCategory) => {
  isSubCategory.value = true
  categoryForm.value = {
    id: null,
    name: '',
    type: parentCategory.type,
    parentId: parentCategory.id
  }
  showAddCategoryModal.value = true
  showEditCategoryModal.value = false
}

// 编辑分类
const editCategory = (category, parentId = null) => {
  if (parentId) {
    // 编辑子分类
    isSubCategory.value = true
    categoryForm.value = {
      ...category,
      parentId: parentId
    }
  } else {
    // 编辑主分类
    isSubCategory.value = false
    categoryForm.value = { ...category }
  }
  showEditCategoryModal.value = true
  showAddCategoryModal.value = false
}

// 保存分类
const saveCategory = () => {
  if (showEditCategoryModal.value) {
    if (isSubCategory.value) {
      // 更新子分类
      const parentCategory = categoryForm.value.type === 'expense' 
        ? expenseCategories.value.find(c => c.id === categoryForm.value.parentId)
        : incomeCategories.value.find(c => c.id === categoryForm.value.parentId)
      if (parentCategory && parentCategory.children) {
        const index = parentCategory.children.findIndex(c => c.id === categoryForm.value.id)
        if (index !== -1) {
          parentCategory.children[index] = { ...categoryForm.value }
        }
      }
    } else {
      // 更新主分类
      if (categoryForm.value.type === 'expense') {
        const index = expenseCategories.value.findIndex(c => c.id === categoryForm.value.id)
        if (index !== -1) expenseCategories.value[index] = { ...categoryForm.value }
      } else {
        const index = incomeCategories.value.findIndex(c => c.id === categoryForm.value.id)
        if (index !== -1) incomeCategories.value[index] = { ...categoryForm.value }
      }
    }
  } else {
    const newCategory = {
      id: Date.now().toString(),
      name: categoryForm.value.name,
      type: categoryForm.value.type
    }
    if (isSubCategory.value) {
      // 添加子分类
      const parentCategory = categoryForm.value.type === 'expense' 
        ? expenseCategories.value.find(c => c.id === categoryForm.value.parentId)
        : incomeCategories.value.find(c => c.id === categoryForm.value.parentId)
      if (parentCategory) {
        if (!parentCategory.children) {
          parentCategory.children = []
        }
        parentCategory.children.push(newCategory)
      }
    } else {
      // 添加主分类
      if (categoryForm.value.type === 'expense') {
        expenseCategories.value.push(newCategory)
      } else {
        incomeCategories.value.push(newCategory)
      }
    }
  }
  saveDimensions()
  showAddCategoryModal.value = false
  showEditCategoryModal.value = false
  resetCategoryForm()
}

// 删除分类
const deleteCategory = (categoryId) => {
  expenseCategories.value = expenseCategories.value.filter(c => c.id !== categoryId)
  incomeCategories.value = incomeCategories.value.filter(c => c.id !== categoryId)
  saveDimensions()
}

// 删除子分类
const deleteSubCategory = (parentId, subCategoryId) => {
  // 检查支出分类
  const expenseParent = expenseCategories.value.find(c => c.id === parentId)
  if (expenseParent && expenseParent.children) {
    expenseParent.children = expenseParent.children.filter(c => c.id !== subCategoryId)
  }
  // 检查收入分类
  const incomeParent = incomeCategories.value.find(c => c.id === parentId)
  if (incomeParent && incomeParent.children) {
    incomeParent.children = incomeParent.children.filter(c => c.id !== subCategoryId)
  }
  saveDimensions()
}

// 编辑成员
const editMember = (member) => {
  memberForm.value = { ...member }
  showEditMemberModal.value = true
  showAddMemberModal.value = false
}

// 保存成员
const saveMember = () => {
  if (showEditMemberModal.value) {
    const index = members.value.findIndex(m => m.id === memberForm.value.id)
    if (index !== -1) members.value[index] = { ...memberForm.value }
  } else {
    const newMember = {
      id: Date.now().toString(),
      name: memberForm.value.name
    }
    members.value.push(newMember)
  }
  saveDimensions()
  showAddMemberModal.value = false
  showEditMemberModal.value = false
  resetMemberForm()
}

// 删除成员
const deleteMember = (memberId) => {
  members.value = members.value.filter(m => m.id !== memberId)
  saveDimensions()
}

// 编辑商家
const editMerchant = (merchant) => {
  merchantForm.value = { ...merchant }
  showEditMerchantModal.value = true
  showAddMerchantModal.value = false
}

// 保存商家
const saveMerchant = () => {
  if (showEditMerchantModal.value) {
    const index = merchants.value.findIndex(m => m.id === merchantForm.value.id)
    if (index !== -1) merchants.value[index] = { ...merchantForm.value }
  } else {
    const newMerchant = {
      id: Date.now().toString(),
      name: merchantForm.value.name
    }
    merchants.value.push(newMerchant)
  }
  saveDimensions()
  showAddMerchantModal.value = false
  showEditMerchantModal.value = false
  resetMerchantForm()
}

// 删除商家
const deleteMerchant = (merchantId) => {
  merchants.value = merchants.value.filter(m => m.id !== merchantId)
  saveDimensions()
}

// 保存标签
const saveTag = () => {
  const newTag = {
    id: Date.now().toString(),
    name: tagForm.value.name
  }
  tags.value.push(newTag)
  saveDimensions()
  showAddTagModal.value = false
  resetTagForm()
}

// 删除标签
const deleteTag = (tagId) => {
  tags.value = tags.value.filter(t => t.id !== tagId)
  saveDimensions()
}

// 保存维度数据
const saveDimensions = () => {
  const dimensions = {
    expenseCategories: expenseCategories.value,
    incomeCategories: incomeCategories.value,
    members: members.value,
    merchants: merchants.value,
    tags: tags.value
  }
  localStorage.setItem('dimensions', JSON.stringify(dimensions))
}

onMounted(() => {
  // 从本地存储加载数据
  const savedDimensions = localStorage.getItem('dimensions')
  if (savedDimensions) {
    const dimensions = JSON.parse(savedDimensions)
    expenseCategories.value = dimensions.expenseCategories || []
    incomeCategories.value = dimensions.incomeCategories || []
    members.value = dimensions.members || []
    merchants.value = dimensions.merchants || []
    tags.value = dimensions.tags || []
  } else {
    // 默认分类
    expenseCategories.value = [
      { id: '1', name: '餐饮', type: 'expense', children: [
        { id: '1-1', name: '早餐', type: 'expense' },
        { id: '1-2', name: '午餐', type: 'expense' },
        { id: '1-3', name: '晚餐', type: 'expense' },
        { id: '1-4', name: '外卖', type: 'expense' },
        { id: '1-5', name: '零食', type: 'expense' }
      ]},
      { id: '2', name: '交通', type: 'expense', children: [
        { id: '2-1', name: '公交', type: 'expense' },
        { id: '2-2', name: '地铁', type: 'expense' },
        { id: '2-3', name: '打车', type: 'expense' },
        { id: '2-4', name: '加油', type: 'expense' },
        { id: '2-5', name: '停车', type: 'expense' }
      ]},
      { id: '3', name: '购物', type: 'expense', children: [
        { id: '3-1', name: '服饰', type: 'expense' },
        { id: '3-2', name: '电子产品', type: 'expense' },
        { id: '3-3', name: '家居用品', type: 'expense' },
        { id: '3-4', name: '化妆品', type: 'expense' }
      ]},
      { id: '4', name: '娱乐', type: 'expense', children: [
        { id: '4-1', name: '电影', type: 'expense' },
        { id: '4-2', name: '游戏', type: 'expense' },
        { id: '4-3', name: '旅游', type: 'expense' },
        { id: '4-4', name: '运动', type: 'expense' }
      ]},
      { id: '5', name: '医疗', type: 'expense' },
      { id: '6', name: '教育', type: 'expense' },
      { id: '7', name: '其他', type: 'expense' }
    ]
    incomeCategories.value = [
      { id: '1', name: '工资', type: 'income' },
      { id: '2', name: '投资', type: 'income', children: [
        { id: '2-1', name: '股票', type: 'income' },
        { id: '2-2', name: '基金', type: 'income' },
        { id: '2-3', name: '理财', type: 'income' }
      ]},
      { id: '3', name: '其他', type: 'income' }
    ]
    saveDimensions()
  }
})
</script>
