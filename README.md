# MyMoney888 - 家庭记账管理系统

[![版本](https://img.shields.io/badge/version-3.8.0-blue.svg)](https://github.com/srcuman/mymoney888)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## ⭐ 核心理念

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ★★★ 记账是核心，其他功能都是辅助记账而存在的 ★★★                            │
│                                                                             │
│   核心：transactions, accounts, categories                                  │
│   辅助：creditCards, loans → 服务于记账的交易                               │
│   扩展：investmentAccounts → 整合到资产总览                                  │
│                                                                             │
│   原则：所有数据变更必须通过 CoreDataStore，确保联动一致                      │
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
│   │   ├── credit-cards/          # 信用卡管理
│   │   ├── loans/                 # 贷款管理
│   │   ├── investments/           # 投资管理
│   │   ├── annual-review/         # 年度回顾
│   │   └── data/                  # 数据管理
│   │
│   ├── system/                    # 【系统模块】
│   │   └── Login, Register, UserManagement, LedgerManagement
│   │
│   ├── services/
│   │   ├── core-data-store.js     # 核心数据存储
│   │   ├── mysql-sync-service.js  # MySQL同步服务
│   │   ├── sync-service.js        # 同步服务（旧）
│   │   └── api-service.js         # API服务
│   │
│   ├── router/
│   │   └── index.js
│   │
│   ├── App.vue
│   └── main.js
│
├── docs/                          # 文档
│   ├── BRANCH_STRATEGY.md         # 分支策略
│   ├── DATA_STORAGE_ARCHITECTURE.md # 数据存储架构
│   └── ...
│
├── server.js                      # Node.js 后端服务
├── database/                      # 数据库脚本
└── README.md
```

---

## 🏗️ 架构设计原则

### 1. 模块独立性

每个功能模块（modules/*）是独立的：
- **独立文件结构**：每个模块有自己的视图文件
- **共享数据层**：所有模块都通过 CoreDataStore 访问数据
- **松耦合设计**：模块之间不直接依赖，通过事件和数据层通信

**目的**：独立模块只是为了更好的记账使用。有它更好，没它也能做最基础的记账。

### 2. 核心数据存储 (CoreDataStore)

```
┌─────────────────────────────────────────────────────────────┐
│  Vue组件  ◄────►  CoreDataStore(响应式包装)  ◄────►  localStorage │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼ 异步同步
┌─────────────────────────────────────────────────────────────┐
│                    MySQL (服务器备份)                          │
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

## 📊 数据存储

### 存储架构：DataStore + MySQL（双份存储）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          数据存储双份架构                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────┐         ┌───────────────────────┐              │
│  │   DataStore (本地层)   │  同步    │   MySQL (云端层)       │              │
│  │                       │◄───────►│                       │              │
│  │  • localStorage       │         │  • 用户数据备份         │              │
│  │  • 响应式数据          │         │  • 多设备同步           │              │
│  │  • 账套隔离            │         │  • 数据恢复             │              │
│  │                       │         │                       │              │
│  │  目的：                │         │  目的：                │              │
│  │  减少冗余，引用机制     │         │  云端备份，安全持久     │              │
│  │  支持本地文件存储       │         │                       │              │
│  └───────────────────────┘         └───────────────────────┘              │
│                                                                             │
│  数据同步策略：                                                              │
│  • 变更时自动同步到 MySQL（防抖 2 秒）                                         │
│  • 启动时从 MySQL 拉取（如有）                                                │
│  • 离线操作暂存，联网后自动同步                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 设计理念：减少冗余，引用机制

类似代码中的版本号概念：
- **一处写入，多处引用**
- 例如：分类 ID 在多处使用，但分类定义只存储一份
- 修改时只改一处，所有引用自动生效

```
transactions          categories           accounts
┌─────────────┐      ┌─────────────┐     ┌─────────────┐
│ category:   │ ────►│ id: "cat1"  │     │ id: "acc1"  │
│   "餐饮-午餐" │      │ name: "餐饮" │     │ name: "银行卡" │
│ account:    │      │ children:   │     │ balance:    │
│   "acc1"    │ ─────────► [...]   │     │   5000      │
└─────────────┘      └─────────────┘     └─────────────┘
       │
       ▼ 引用（不重复存储数据）
┌─────────────┐
│ merchant:   │
│   "麦当劳"   │  ────►  merchants[] 只存储一次
└─────────────┘
```

### DataStore 本地存储

| 键名 | 数据类型 | 账套隔离 | 说明 |
|------|----------|----------|------|
| transactions_{账套ID} | 交易记录 | ✅ | 核心数据 |
| accounts_{账套ID} | 账户余额 | ✅ | 账户数据 |
| categories_{账套ID} | 收支分类 | ✅ | 分类数据 |
| dimensions | 维度数据 | ❌ | 成员/商户/标签/支付渠道 |
| ledgers | 账套列表 | ❌ | 账套管理 |

### MySQL 服务器存储

通过 `user_id` + `ledger_id` 隔离用户和账套数据。详见 [DATABASE_DESIGN.md](DATABASE_DESIGN.md)。

---

## 🔄 数据联动规则

### 核心记账联动

```
交易添加 ──→ 自动更新账户余额
交易编辑 ──→ 自动调整账户余额（还原旧 + 应用新）
交易删除 ──→ 自动还原账户余额
```

### 账户联动

```
添加账户 ──→ 同步创建关联账户（投资/信用卡）
更新账户 ──→ 同步更新关联账户余额
删除账户 ──→ 清理关联账户和数据
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
- **数据持久化**: DataStore (localStorage) + MySQL

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

// 账户方法（自动联动）
await coreDataStore.addAccount(accountData)
await coreDataStore.updateAccount(id, updates)
await coreDataStore.deleteAccount(id)

// 信用卡方法（自动联动）
await coreDataStore.addCreditCard(cardData)
await coreDataStore.repayCreditCard(fromAccountId, cardId, amount)

// 投资方法（自动联动）
await coreDataStore.addInvestmentAccount(accountData)
await coreDataStore.updateNetValue(accountId, newValue)
```

### 使用 MySQL 同步服务

```javascript
import mysqlSyncService from '../services/mysql-sync-service.js'

// 手动同步
await mysqlSyncService.sync()

// 全量同步（推送+拉取）
await mysqlSyncService.fullSync()

// 获取同步状态
const status = mysqlSyncService.getStatus()
```

---

## 📚 文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目概述 |
| [DATABASE_DESIGN.md](DATABASE_DESIGN.md) | 数据库设计 |
| [DATA_STORAGE_ARCHITECTURE.md](docs/DATA_STORAGE_ARCHITECTURE.md) | 数据存储架构 |
| [BRANCH_STRATEGY.md](docs/BRANCH_STRATEGY.md) | 分支策略 |
| [DEPLOY.md](DEPLOY.md) | 部署指南 |

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- **作者**: srcuman
- **仓库**: https://gitee.com/srcuman/mymoney888

---

**版本历史**:
- **v3.8.0** - 模块化重构，DataStore + MySQL 双份存储，数据引用机制
- **v3.7.0** - 统一数据存储架构
- **v3.6.x** - 投资管理、贷款管理等功能完善
- **v3.5.x** - 多账套支持
- **v3.0.x** - 基础记账功能
