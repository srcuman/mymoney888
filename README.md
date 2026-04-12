# MyMoney888 - 家庭记账管理系统

[![版本](https://img.shields.io/badge/version-3.9.0-blue.svg)](https://github.com/srcuman/mymoney888)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![架构](https://img.shields.io/badge/arch-data--centric--tagged--storage-green.svg)](#核心理念)

---

## ⭐ 核心理念

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ★★★ 数据为核心，标签化存储，无损迭代 ★★★                                  │
│                                                                             │
│   核心：transactions（交易是唯一事实）                                       │
│   标签：members, merchants, tags, paymentChannels → 交易的属性                │
│   衍生：balance, usedCredit, totalValue → 使用时计算，不存储                  │
│                                                                             │
│   原则：所有数据变更必须通过 CoreDataStore，确保联动一致                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 核心原则详解

#### 1. 数据唯一化
- **transactions（交易）是唯一的事实来源**
- 每一笔交易包含：日期、金额、类型、账户、分类
- 其他所有数据都是对交易的"标签"

#### 2. 标签化存储
- 成员、商户、标签、支付渠道都是交易的属性标签
- 这些数据不独立存储，只在交易中使用时提取
- 新增功能 = 给交易打新的标签

#### 3. 衍生数据计算
- **账户余额** = SUM(相关交易)
- **信用卡已用额度** = SUM(相关交易)
- **投资账户净值** = 从净值历史计算
- 所有衍生数据不长期存储，仅在使用时计算

#### 4. 未来保障
- 旧数据无需迁移，只需补充新标签
- 系统升级不影响已有数据完整性
- 扩展功能不破坏核心数据

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
│   ├── DATA_STORAGE_ARCHITECTURE.md # 数据存储架构
│   ├── MODULE_CREDIT_CARDS.md      # 信用卡模块
│   ├── MODULE_LOANS.md             # 贷款模块
│   ├── MODULE_INVESTMENTS.md       # 投资模块
│   ├── MODULE_STATISTICS.md       # 统计模块
│   ├── MODULE_ANNUAL_REVIEW.md     # 年度回顾模块
│   ├── DEFAULT_DATA_GUIDE.md       # 预置数据指南
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

## 📊 数据存储架构

### 存储架构：DataStore（本地）+ MySQL（远程备份）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          数据存储架构                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        前端 CoreDataStore                            │   │
│  │                                                                     │   │
│  │   transactions ──────► 唯一事实来源                                   │   │
│  │        │                                                          │   │
│  │        ▼                                                          │   │
│  │   calculateBalance() ────► 实时计算账户余额                          │   │
│  │   calculateUsedCredit() ──► 实时计算信用卡额度                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      server.js API                                   │   │
│  │                                                                     │   │
│  │   /api/datastore/save ────► DATA_DIR/ledgers/{ledgerId}/*.json      │   │
│  │                                                                     │   │
│  │   /api/sync ──────────────► MySQL (远程备份)                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

数据流：
1. 用户操作 → CoreDataStore → API → DATA_DIR 文件
2. 同时 → 同步到 MySQL 远程备份
3. 读取时 ← 计算衍生数据（不读取存储的余额）
```

### 数据层次

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 1: 核心数据 (不可分割的事实)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ transactions: 每一笔交易是独立事实                                    │   │
│  │ { id, date, type, amount, fromAccount, toAccount, category,          │   │
│  │   member, merchant, tags, paymentChannel, notes, ... }              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                               ↓ 关联/引用
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 2: 基础定义 (不包含业务计算值)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ accounts: { id, name, category, currency, ... }                     │   │
│  │ categories: { id, name, type, parentId, icon, ... }                 │   │
│  │ credit_cards: { id, name, limit, linkedAccountId, ... }             │   │
│  │ investment_accounts: { id, name, currency, ... }                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                               ↓ 标签/属性
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 3: 交易标签 (依附于交易，不独立存在)                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ member: 交易参与者（谁付的钱/谁收的钱）                               │   │
│  │ merchant: 商户（哪里消费的）                                         │   │
│  │ tags: 多标签数组（自由打标签）                                       │   │
│  │ paymentChannel: 支付渠道（现金/支付宝/微信/银行卡...）              │   │
│  │ notes: 备注                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                               ↓ 实时计算
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 4: 衍生数据 (使用时可计算，不存储)                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ account.balance = SUM(where account=id)                             │   │
│  │ credit_card.usedCredit = SUM(where creditCard=id AND type=expense) │   │
│  │ investment.totalValue = FROM net_value_history                      │   │
│  │ statistics.xxx = 实时聚合                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 设计优势

| 传统设计 | 本项目设计 |
|----------|------------|
| 存储余额 | 实时计算余额 |
| 余额可能不一致 | 余额永远准确 |
| 新增功能需迁移数据 | 新增功能只需打标签 |
| 升级可能丢失数据 | 无损升级 |

### 文件存储 (DATA_DIR)

```
DATA_DIR/
└── ledgers/
    └── {ledgerId}/
        ├── datastore.json     # 完整数据备份
        ├── transactions.json   # 交易数据
        ├── accounts.json      # 账户定义（不含余额）
        ├── categories.json     # 分类定义
        ├── credit_cards.json   # 信用卡定义
        └── ...
```

### MySQL 服务器存储

通过 `user_id` + `ledger_id` 隔离用户和账套数据。详见 [DATABASE_DESIGN.md](DATABASE_DESIGN.md)。

### 环境变量配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATA_DIR` | 本地数据存储目录 | `./data` |
| `PORT` | API 服务端口 | `8888` |
| `MYSQL_HOST` | MySQL 主机 | `localhost` |
| `MYSQL_DATABASE` | 数据库名 | `mymoney888` |

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
- **数据持久化**: 本地文件 + MySQL 双重备份

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
# 创建数据库和表结构
mysql -u root -p < database/init-db.sql

# 初始化预置数据（账户、分类、成员等）
mysql -u root -p mymoney888 < database/init-default-data.sql
```

### 3. 配置环境变量

```bash
# 创建 .env 文件
cp .env.example .env

# 编辑配置
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=mymoney888
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

### 5. 访问应用

打开浏览器访问 http://localhost:8888

> 💡 首次使用，系统会自动加载预置账套数据，包括常用账户、收支分类、成员、商家等，开箱即用。

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

### 核心文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目概述 |
| [DATABASE_DESIGN.md](DATABASE_DESIGN.md) | 数据库设计 |
| [DATA_STORAGE_ARCHITECTURE.md](docs/DATA_STORAGE_ARCHITECTURE.md) | 数据存储架构 |
| [DEFAULT_DATA_GUIDE.md](docs/DEFAULT_DATA_GUIDE.md) | 预置数据指南 |
| [BRANCH_STRATEGY.md](docs/BRANCH_STRATEGY.md) | 分支策略 |
| [DEPLOY.md](DEPLOY.md) | 部署指南 |

### 功能模块文档

| 文档 | 说明 |
|------|------|
| [MODULE_CREDIT_CARDS.md](docs/MODULE_CREDIT_CARDS.md) | 信用卡模块 - 账单、还款、消费分析 |
| [MODULE_LOANS.md](docs/MODULE_LOANS.md) | 贷款模块 - 还款计划、利息计算 |
| [MODULE_INVESTMENTS.md](docs/MODULE_INVESTMENTS.md) | 投资模块 - 持仓、净值、盈亏 |
| [MODULE_STATISTICS.md](docs/MODULE_STATISTICS.md) | 统计模块 - 收支分析、趋势图表 |
| [MODULE_ANNUAL_REVIEW.md](docs/MODULE_ANNUAL_REVIEW.md) | 年度回顾 - 全年财务总结 |

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
