# 发发 - 轻量级记账系统

## v3.9.0 版本说明

### 核心架构升级

本次升级重点解决了数据持久化和维度管理的问题：

1. **CoreDataStore 重构**
   - 统一数据存储结构，区分核心数据与辅助数据
   - 修复维度数据（成员、商家、标签、支付渠道）持久化问题
   - 优化账套切换时的数据加载逻辑

2. **数据架构优化**
   - `dimensions` 字段独立存储维度数据
   - 修复API请求失败时的数据初始化问题
   - 账套切换事件派发时机调整

---

## 核心设计原则

### 1. 功能优先级

**核心功能（必须做好）：**
- 记账功能 - 收支记录的核心入口
- 账户管理 - 现金、银行、支付宝、微信等账户
- 分类管理 - 收支分类（一级、二级）
- 交易查询 - 全部交易查询、筛选

**辅助功能（外挂式扩展）：**
- 信用卡管理 - 账单、已用额度
- 贷款管理 - 贷款账户、还款记录
- 投资管理 - 投资账户、收益记录
- 年度复盘 - 年度统计

### 2. 数据存储原则

**唯一事实来源：**
- `transactions` - 交易记录是唯一的事实来源
- 所有余额、已用额度等衍生数据通过计算得出，不长期存储

**标签化存储：**
- 成员、商家、标签、支付渠道作为交易标签存储
- 通过标签关联到交易，而非独立重复存储

**基础数据独立存储：**
- 分类（categories）- 存储分类定义
- 账户（accounts）- 存储账户定义
- 维度（dimensions）- 存储成员、商家、标签、支付渠道

### 3. 数据同步架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 CoreDataStore                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ transactions (唯一事实来源)                          │    │
│  │ accounts, categories (基础定义)                      │    │
│  │ dimensions (成员/商家/标签/支付渠道)                 │    │
│  │ credit_cards, loans, investments (辅助功能)          │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ localStorage ◄────────────► PostgreSQL             │    │
│  │ (本地优先)      双向同步      (远程备份)             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**同步规则：**
- 变更时自动同步到 PostgreSQL（防止数据丢失）
- 启动时从 PostgreSQL 加载（如有）
- 离线操作缓存，联网后自动同步

---

## 项目结构

```
mymoney888/
├── src/
│   ├── core/                      # 核心功能（记账相关）
│   │   ├── views/
│   │   │   ├── HomeView.vue            # 主页/记账界面
│   │   │   ├── AccountsView.vue         # 账户管理
│   │   │   ├── DimensionManagementView.vue  # 维度管理
│   │   │   ├── TransactionView.vue      # 交易记录
│   │   │   └── SearchView.vue           # 搜索界面
│   │   └── components/
│   │       └── QuickAddComponent.vue    # 快捷记账组件
│   ├── modules/                   # 辅助功能模块
│   │   ├── statistics/            # 统计分屏
│   │   ├── credit-cards/          # 信用卡管理
│   │   ├── loans/                 # 贷款管理
│   │   ├── investments/           # 投资管理
│   │   ├── annual-review/         # 年度复盘
│   │   ├── data/                  # 数据管理
│   │   │   └── AssetsView.vue     # 资产概览
│   │   └── system/                # 系统功能
│   │       ├── Login, Register, UserManagement, LedgerManagement
│   ├── services/
│   │   ├── core-data-store.js     # 核心数据存储
│   │   ├── mysql-sync-service.js  # MySQL同步服务（旧）
│   │   ├── postgres-sync-service.js # PostgreSQL同步服务
│   │   └── api-service.js         # API服务
│   ├── router/
│   │   └── index.js
│   ├── App.vue
│   └── main.js
├── server.js                      # Node.js 后端服务
├── database/                      # 数据库脚本
├── docs/                          # 文档
└── README.md
```

---

## 数据分类

| 类别 | 数据 | 说明 |
|------|------|------|
| **核心数据** | transactions | 交易记录，唯一事实来源 |
| **基础定义** | accounts | 账户定义（现金、银行、支付宝等） |
| | categories | 收支分类（一级、二级） |
| | dimensions | 维度数据（成员、商家、标签、支付渠道） |
| **辅助功能** | credit_cards | 信用卡账户 |
| | loans | 贷款账户 |
| | investments | 投资账户 |
| **系统数据** | ledgers | 账套列表 |
| | users | 用户列表 |
| | user_settings | 用户设置 |

---

## 版本历史

### v3.9.0
- 修复数据持久化和维度管理问题
- CoreDataStore 重构
- 账套切换逻辑优化

### v3.8.x
- 数据库迁移：MySQL → PostgreSQL
- 投资/贷款模块重构
- DataStore + PostgreSQL 双向存储架构

### v3.7.0
- 统一数据存储架构
- 核心记账功能完善
- DataStore 模块化
