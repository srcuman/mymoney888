# 数据存储架构设计

## 版本：v4.0.0（数据为核心，标签化存储架构）

## 目录

1. [架构概述](#架构概述)
2. [核心理念](#核心理念)
3. [数据层次](#数据层次)
4. [独立模块设计](#独立模块设计)
5. [存储架构](#存储架构)
6. [同步策略](#同步策略)
7. [数据表设计](#数据表设计)
8. [衍生数据计算规则](#衍生数据计算规则)
9. [未来扩展](#未来扩展)

---

## 架构概述

本应用采用**"数据为核心，标签化存储"**架构：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ★★★ 数据为核心，标签化存储，无损迭代 ★★★                                  │
│                                                                             │
│   核心：transactions（交易是唯一事实）                                       │
│   标签：members, merchants, tags, paymentChannels → 交易的属性              │
│   衍生：balance, usedCredit, totalValue → 使用时计算，不存储                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 核心原则

1. **数据唯一化**
   - 核心数据只有一份，不冗余存储
   - `transactions`（交易）是唯一的事实来源
   - 所有其他数据都是对核心数据的"标签"

2. **标签化存储**
   - 非核心数据不做独立存储
   - 成员、商户、标签、支付渠道都是交易的属性标签
   - 分类是预定义标签，关联到交易

3. **衍生数据计算**
   - 账户余额 = SUM(交易)
   - 信用卡已用额度 = SUM(交易)
   - 投资账户净值 = 从净值历史计算
   - 所有衍生数据不长期存储，仅在使用时计算

4. **未来保障**
   - 新功能只是给数据打新标签
   - 旧数据无需迁移，只需补充标签
   - 系统升级不影响已有数据完整性

---

## 数据层次

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
│  │ loans: { id, name, totalAmount, interestRate, ... }                │   │
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
│  │ project: 项目                                                       │   │
│  │ notes: 备注                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                               ↓ 实时计算
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 4: 衍生数据 (使用时可计算，不存储)                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ account.balance = SUM(where account=id)                              │   │
│  │ credit_card.usedCredit = SUM(where creditCard=id)                   │   │
│  │ loan.remainingAmount = totalAmount - SUM(payments)                 │   │
│  │ investment.totalValue = latest(net_value_history)                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 独立模块设计

### 模块与数据关系

| 模块 | 定义数据 | 关联方式 | 衍生数据计算 |
|------|---------|---------|-------------|
| **信用卡** | credit_cards, credit_card_bills | credit_card_id 标签 | usedCredit = SUM(expenses) - SUM(repayments) |
| **贷款** | loans, loan_payments | loan_id 标签 | remainingAmount = totalAmount - SUM(paidPrincipal) |
| **投资** | investment_accounts, investment_details, net_value_history | investment_account_id 标签 | totalValue = latest(net_value_history) |

### 信用卡模块

```javascript
// 信用卡定义（存储）
{
  id: 'cc_xxx',
  name: '招商信用卡',
  credit_limit: 50000,
  bill_day: 5,
  due_day: 23
}

// 信用卡交易（关联）
{
  id: 't_xxx',
  type: 'expense',
  amount: 1000,
  credit_card_id: 'cc_xxx',  // 标签
  is_repayment: false
}

// 计算已用额度
usedCredit = SUM(expenses where credit_card_id = 'cc_xxx') 
           - SUM(repayments where credit_card_id = 'cc_xxx')
```

### 贷款模块

```javascript
// 贷款定义（存储）
{
  id: 'loan_xxx',
  name: '房屋贷款',
  total_amount: 2000000,
  interest_rate: 0.049,
  period_months: 360
}

// 还款记录（存储）
{
  id: 'lp_xxx',
  loan_id: 'loan_xxx',  // 标签
  period_number: 1,
  amount: 10600,
  principal: 2400,
  interest: 8200,
  status: 'paid'
}

// 计算剩余金额
remainingAmount = totalAmount - SUM(paidPrincipal where loan_id = 'loan_xxx')
paidPeriods = COUNT(status = 'paid' where loan_id = 'loan_xxx')
```

### 投资模块

```javascript
// 投资账户定义（存储）
{
  id: 'inv_xxx',
  name: '我的基金',
  type: 'fund'
}

// 净值历史记录（存储）
{
  id: 'nvh_xxx',
  account_id: 'inv_xxx',  // 标签
  date: '2026-04-12',
  total_value: 150000,
  daily_change: 1200
}

// 获取最新净值
latestValue = MAX(net_value_history where account_id = 'inv_xxx' order by date)
```

---

## 存储架构

### 双重存储：DataStore（本地）+ PostgreSQL（远程备份）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          数据存储架构                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        前端 CoreDataStore                            │   │
│  │                                                                     │   │
│  │   transactions ──────► 唯一事实来源                                   │   │
│  │        │                                                          │   │
│  │        ▼                                                          │   │
│  │   calculateBalance() ────► 实时计算账户余额                          │   │
│  │   calculateUsedCredit() ──► 实时计算信用卡额度                        │   │
│  │   calculateLoanRemaining() ► 实时计算贷款剩余                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      server.js API                                   │   │
│  │                                                                     │   │
│  │   /api/datastore/save ────► DATA_DIR/ledgers/{ledgerId}/*.json      │   │
│  │                                                                     │   │
│  │   /api/sync ──────────────► PostgreSQL (远程备份)                   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 数据流

```
用户操作（添加/编辑/删除）
        │
        ▼
┌───────────────────────┐
│    CoreDataStore      │
│    (更新内存数据)       │
└───────────────────────┘
        │
        ├──────────────────┐
        ▼                  ▼
┌───────────────┐  ┌───────────────┐
│  事件通知      │  │   API 保存    │
│  (通知组件刷新) │  │ (DATA_DIR)   │
└───────────────┘  └───────────────┘
        │                  │
        ▼                  ▼
┌───────────────────────────────────────┐
│      PostgreSQL (异步同步)             │
└───────────────────────────────────────┘
```

---

## 同步策略

### 同步表列表

| 表名 | 类型 | 说明 |
|------|------|------|
| transactions | 核心 | 交易记录 |
| accounts | 定义 | 账户定义 |
| categories | 定义 | 分类定义 |
| credit_cards | 定义 | 信用卡定义 |
| credit_card_bills | 事实 | 信用卡账单 |
| loans | 定义 | 贷款定义 |
| loan_payments | 事实 | 贷款还款记录 |
| investment_accounts | 定义 | 投资账户定义 |
| investment_details | 事实 | 投资明细 |
| net_value_history | 事实 | 净值历史记录 |
| dimensions | 定义 | 维度配置 |

### 同步规则

| 场景 | 行为 |
|------|------|
| 应用启动（已登录） | API(DATA_DIR) → 内存 |
| 用户操作 | 内存 → API → MySQL（异步） |
| 离线操作 | 内存 → DATA_DIR（待上线后同步） |

---

## 数据表设计

### transactions 表（核心）

```sql
CREATE TABLE transactions (
    -- 账户引用
    account_id INT NOT NULL,
    to_account_id INT,
    
    -- 分类引用
    category_id INT,
    
    -- 维度标签（核心扩展）
    member VARCHAR(100),         -- 成员
    merchant VARCHAR(100),       -- 商户
    tags JSON,                   -- 标签数组
    payment_channel VARCHAR(50),-- 支付渠道
    project VARCHAR(100),        -- 项目
    
    -- 信用卡标签
    credit_card_id VARCHAR(50),
    is_repayment TINYINT,
    
    -- 贷款标签
    loan_id VARCHAR(50),
    
    -- 投资标签
    investment_account_id VARCHAR(50),
    
    -- 交易信息
    type ENUM('expense', 'income', 'transfer'),
    amount DECIMAL(15, 2),
    ...
);
```

### 关键设计点

1. **标签字段**：`credit_card_id`, `loan_id`, `investment_account_id` 作为标签关联
2. **无衍生字段**：`accounts.balance`, `loans.remaining_amount` 等由计算得出
3. **可扩展**：新增功能只需添加新标签字段

---

## 衍生数据计算规则

### 账户余额

```javascript
calculateAccountBalance(accountId) {
  // 收入：+amount（到账账户）
  // 支出：-amount（出账账户）
  // 转账：出账账户-amount，到账账户+amount
  
  const income = SUM(transactions.where(
    account == accountId AND type == 'income'
  ))
  
  const expense = SUM(transactions.where(
    account == accountId AND type == 'expense'
  ))
  
  const transferOut = SUM(transactions.where(
    fromAccount == accountId AND type == 'transfer'
  ))
  
  const transferIn = SUM(transactions.where(
    toAccount == accountId AND type == 'transfer'
  ))
  
  return initialBalance + income - expense - transferOut + transferIn
}
```

### 信用卡已用额度

```javascript
calculateCreditCardUsed(cardId) {
  const spent = SUM(transactions.where(
    credit_card_id == cardId AND type == 'expense'
  ))
  
  const repaid = SUM(transactions.where(
    credit_card_id == cardId AND type == 'income' AND is_repayment == true
  ))
  
  return spent - repaid
}
```

### 贷款剩余金额

```javascript
calculateLoanRemaining(loanId) {
  const loan = loans.find(loanId)
  const totalPaid = SUM(loan_payments.where(
    loan_id == loanId AND status == 'paid'
  ))
  
  return loan.total_amount - totalPaid
}
```

---

## 未来扩展

### 添加新功能示例：添加"项目"功能

**旧方案（破坏性）**：
1. 创建 `projects` 表
2. 添加外键约束
3. 修改现有代码

**新方案（无损）**：
1. `transactions.project` 字段已存在
2. 创建 `dimensions` 记录（项目预定义）
3. 用户选择或自由输入项目名
4. 无需迁移旧数据

### 添加新功能示例：添加"预算"功能

1. 创建 `budgets` 表（定义表）
2. `budgets` 关联 `categories` 和时间段
3. `transactions` 通过已有 `category_id` 标签关联
4. 计算：`budget_remaining = budget_limit - SUM(transactions.where(category = budget.category))`

---

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/datastore/save` | POST | 保存数据到 DATA_DIR |
| `/api/datastore/load` | GET | 从 DATA_DIR 加载数据 |
| `/api/sync` | POST | 同步数据到 PostgreSQL |
| `/api/sync` | GET | 从 PostgreSQL 获取数据 |
| `/api/sync/all` | GET | 获取用户所有数据 |
| `/api/backup` | POST | 手动备份到 JSON |
| `/api/restore/:table` | POST | 从 JSON 恢复 |

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 3.9.0 | 2026-04-12 | 确立"数据为核心，标签化存储"架构 |
| 3.9.x | 2026-04-13 | DataStore + PostgreSQL 双存储 |
