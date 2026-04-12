# MyMoney888 - 家庭记账管理系统

[![版本](https://img.shields.io/badge/version-3.8.0-blue.svg)](https://github.com/srcuman/mymoney888)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## ⭐ 核心理念

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ★★★ 记账是核心，其他功能都是辅助记账而存在的 ★★★                          │
│                                                                             │
│   核心：transactions, accounts, categories                                 │
│   辅助：creditCards, loans → 服务于记账的交易                              │
│   扩展：investmentAccounts → 整合到资产总览                                │
│                                                                             │
│   原则：所有数据变更必须通过 CoreDataStore，确保联动一致                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
mymoney888/
├── src/
│   ├── core/                      # 【核心模块】记账相关
│   │   ├── views/
│   │   │   ├── HomeView.vue            # 首页/记账界面
│   │   │   ├── AccountsView.vue         # 账户管理
│   │   │   └── DimensionManagementView.vue  # 维度管理
│   │   └── components/
│   │       └── QuickAddComponent.vue    # 快速记账组件
│   │
│   ├── modules/                   # 【功能模块】独立功能
│   │   ├── statistics/            # 统计分析
│   │   │   └── StatisticsView.vue
│   │   ├── credit-cards/          # 信用卡管理
│   │   │   └── CreditCardsView.vue
│   │   ├── loans/                 # 贷款管理
│   │   │   └── LoansView.vue
│   │   ├── investments/           # 投资管理
│   │   │   └── InvestmentsView.vue
│   │   ├── annual-review/         # 年度回顾
│   │   │   └── AnnualReviewView.vue
│   │   └── data/                  # 数据管理
│   │       ├── AssetsView.vue
│   │       └── ImportExportView.vue
│   │
│   ├── system/                    # 【系统模块】
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── UserManagementView.vue
│   │   └── LedgerManagementView.vue
│   │
│   ├── services/
│   │   └── core-data-store.js     # 核心数据存储服务
│   │
│   ├── router/
│   │   └── index.js
│   │
│   ├── App.vue
│   └── main.js
│
├── server.js                      # Node.js 后端服务
└── README.md
```

---

## 🏗️ 架构设计原则

### 1. 模块独立性

每个功能模块（modules/*）是独立的：
- **独立文件结构**：每个模块有自己的视图文件
- **共享数据层**：所有模块都通过 CoreDataStore 访问数据
- **松耦合设计**：模块之间不直接依赖，通过事件和数据层通信

### 2. 核心数据存储 (CoreDataStore)

**唯一真实数据源**：localStorage（按账套隔离）

```
┌─────────────────────────────────────────────────────────────┐
│  Vue组件  ◄────►  CoreDataStore(响应式包装)  ◄────►  localStorage │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼ 异步同步
┌─────────────────────────────────────────────────────────────┐
│                    MySQL (服务器主数据源)                      │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼ 定时备份
┌─────────────────────────────────────────────────────────────┐
│                 JSON文件 (Docker Volume)                      │
└─────────────────────────────────────────────────────────────┘
```

### 3. 数据分类

| 类别 | 数据 | 说明 |
|------|------|------|
| **核心数据** | transactions, accounts, categories | 记账必须依赖 |
| **辅助数据** | creditCards, loans, repaymentPlans | 服务记账的交易 |
| **扩展数据** | investmentAccounts, investmentDetails | 记账的补充 |
| **维度数据** | members, merchants, tags, paymentChannels | 记账的标签 |
| **系统数据** | ledgers, users | 应用配置 |

---

## 🔄 数据联动规则

### 核心记账联动

```
交易添加 ──→ 自动更新账户余额
交易编辑 ──→ 自动调整账户余额（还原旧 + 应用新）
交易删除 ──→ 自动还原账户余额
```

### 辅助功能联动

**信用卡**：
- 创建信用卡 → 自动创建关联账户
- 消费交易 → 自动更新信用卡可用额度
- 还款交易 → 转为转账（从借记卡到信用卡）

**贷款**：
- 创建贷款 → 自动创建关联账户
- 还款交易 → 关联贷款账户

**投资管理**：
- 创建投资账户 → 自动创建关联账户
- 设置损益记录周期（每月/每季/每年）
- 周期到期自动生成对应交易（投资收益/损失）
- 净值更新 → 自动更新关联账户余额

### 维度管理保护

```
维度被交易使用 ──→ 只允许修改名称，不允许删除
维度未被使用 ──→ 可正常删除
```

---

## 📊 数据存储

### 本地存储 (localStorage)

| 键名 | 数据类型 | 账套隔离 |
|------|----------|----------|
| transactions_{账套ID} | 交易记录 | ✅ |
| accounts_{账套ID} | 账户余额 | ✅ |
| categories_{账套ID} | 收支分类 | ✅ |
| members | 成员 | ❌ |
| merchants | 商户 | ❌ |
| tags | 标签 | ❌ |
| paymentChannels | 支付渠道 | ❌ |
| ledgers | 账套列表 | ❌ |

### 服务器存储 (MySQL)

与 localStorage 结构一一对应，通过 `userId` 隔离用户数据。

---

## 🚀 功能模块

### 核心模块 (core/)

| 模块 | 功能 |
|------|------|
| **HomeView** | 记账界面、交易流水查询、快速记账 |
| **AccountsView** | 账户创建/编辑/删除、余额管理 |
| **DimensionManagement** | 收支分类、成员、商户、标签、支付渠道管理 |

### 功能模块 (modules/)

| 模块 | 功能 |
|------|------|
| **statistics** | 收支统计、趋势分析、预算管理 |
| **credit-cards** | 信用卡账单、还款提醒、自动记账 |
| **loans** | 贷款管理、还款计划、利息计算 |
| **investments** | 投资账户、净值跟踪、损益记录 |
| **annual-review** | 年度收支汇总、资产变化分析 |
| **data** | 数据导入/导出、资产总览 |

### 系统模块 (system/)

| 模块 | 功能 |
|------|------|
| **LoginView** | 用户登录 |
| **RegisterView** | 用户注册 |
| **UserManagement** | 用户管理（管理员） |
| **LedgerManagement** | 账套管理、多账套支持 |

---

## 🔧 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI 框架**: Tailwind CSS
- **图表库**: Chart.js
- **后端**: Node.js + Express
- **数据库**: MySQL
- **数据持久化**: localStorage + MySQL + JSON文件

---

## 📝 开发指南

### 添加新模块

1. 在 `src/modules/` 下创建新目录
2. 创建 `{ModuleName}View.vue`
3. 在 `src/router/index.js` 添加路由
4. 在 `App.vue` 侧边栏添加导航项

### 使用 CoreDataStore

```javascript
import coreDataStore from '../services/core-data-store.js'

// 添加数据
await coreDataStore.add('transactions', transactionData)

// 更新数据
await coreDataStore.update('transactions', id, updates)

// 删除数据
await coreDataStore.remove('transactions', id)

// 获取数据（响应式）
const transactions = coreDataStore.get('transactions')

// 获取原始数据
const list = coreDataStore.getRaw('transactions')

// 查找单条
const item = coreDataStore.find('transactions', t => t.id === id)

// 核心记账方法（自动联动）
await coreDataStore.addTransaction(transactionData)
await coreDataStore.updateTransaction(id, updates)
await coreDataStore.deleteTransaction(id)
```

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- **作者**: srcuman
- **仓库**: https://gitee.com/srcuman/mymoney888

---

**版本历史**:
- **v3.8.0** - 模块化重构，核心数据存储独立，维度管理保护
- **v3.7.0** - 统一数据存储架构
- **v3.6.x** - 投资管理、贷款管理等功能完善
- **v3.5.x** - 多账套支持
- **v3.0.x** - 基础记账功能
