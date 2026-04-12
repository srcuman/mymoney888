# 信用卡模块

## 模块概述

信用卡模块是记账系统的核心扩展功能之一，用于管理信用卡的账单、还款和消费分析。

## 核心理念

> **信用卡模块是记账的延伸，不是替代。所有消费最终都记录为交易，通过标签关联到信用卡。**

## 数据架构

### 层级结构

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: 核心事实 (transactions)                           │
│  每一笔信用卡消费/还款都是独立交易                           │
│  - type: 'expense' (消费) / 'income' (还款)                  │
│  - credit_card_id: 关联的信用卡ID                            │
│  - is_repayment: 是否为还款                                  │
│  - billing_month: 账单月份                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓ 标签关联
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: 信用卡定义 (credit_cards)                          │
│  - id, name, bank_name, credit_limit                         │
│  - bill_day, due_day                                        │
│  - linked_account_id: 关联的支付账户                          │
└─────────────────────────────────────────────────────────────┘
                           ↓ 计算
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: 衍生数据 (运行时计算)                               │
│  - used_credit = SUM(expense) - SUM(repayment)              │
│  - available_credit = credit_limit - used_credit            │
│  - bill_amount = 本月已出账消费总额                          │
└─────────────────────────────────────────────────────────────┘
```

### 数据库表结构

```sql
-- credit_cards 表（定义层，不含衍生数据）
CREATE TABLE credit_cards (
    id INT PRIMARY KEY,
    name VARCHAR(100),           -- 卡片名称
    card_number VARCHAR(50),      -- 卡号（脱敏）
    linked_account_id INT,        -- 关联账户ID
    credit_limit DECIMAL(15,2),   -- 信用额度（定义值）
    bill_day INT,                 -- 账单日
    due_day INT,                  -- 还款日
    bank_name VARCHAR(100),       -- 银行名称
    -- 注意：不含 used_credit, available_credit 等衍生数据
);

-- credit_card_bills 表（账单定义）
CREATE TABLE credit_card_bills (
    id INT PRIMARY KEY,
    credit_card_id INT,           -- 关联信用卡
    bill_month VARCHAR(7),        -- 账单月份 YYYY-MM
    statement_date DATE,          -- 出账日期
    due_date DATE,                -- 到期还款日
    total_amount DECIMAL(15,2),   -- 账单总额
    min_payment DECIMAL(15,2),   -- 最低还款额
    status ENUM('unpaid','partial','paid'), -- 状态
    -- 注意：paid_amount, remaining_amount 由交易计算
);
```

## 数据触发逻辑

### 场景1: 信用卡消费

**用户操作**: 在交易记录中添加一笔消费

**数据流程**:

```javascript
// 1. 创建交易记录
{
    type: 'expense',
    amount: 1000.00,
    account_id: linked_account_id,  // 关联的支付账户
    category_id: '餐饮',
    credit_card_id: 'card_001',     // 信用卡标签
    is_credit_card_expense: true,
    billing_month: '2026-04',       // 本月账单
    description: '餐厅消费'
}

// 2. 信用卡已用额度计算
used_credit = Σ(transactions WHERE credit_card_id = 'card_001' 
                   AND type = 'expense') 
            - Σ(transactions WHERE credit_card_id = 'card_001' 
                   AND is_repayment = true)

// 3. 可用额度计算
available_credit = credit_limit - used_credit
```

### 场景2: 信用卡还款

**用户操作**: 还清信用卡账单

**数据流程**:

```javascript
// 1. 创建还款交易（收入类型，从储蓄卡转入信用卡）
{
    type: 'income',                    // 还款视为"收入"到信用卡账户
    amount: 5000.00,
    account_id: linked_account_id,     // 关联的信用卡账户
    category_id: '还款转账',            -- 或专门的还款分类
    credit_card_id: 'card_001',
    is_repayment: true,
    description: '还清4月账单'
}

// 2. 还款后已用额度减少
used_credit = used_credit - 5000.00
```

### 场景3: 账单生成

**触发条件**: 账单日（每月固定日期）

**数据流程**:

```javascript
// 1. 系统自动生成或手动创建账单记录
{
    credit_card_id: 'card_001',
    bill_month: '2026-03',
    statement_date: '2026-04-01',  // 账单日
    due_date: '2026-04-20',         // 还款日
    total_amount: Σ(本月已出账消费),  // 从交易计算
    status: 'unpaid'
}

// 2. 账单金额计算
total_amount = Σ(transactions WHERE credit_card_id = 'card_001'
                                 AND billing_month = '2026-03'
                                 AND type = 'expense'
                                 AND is_credit_card_expense = true)
```

## 关键计算公式

| 数据项 | 计算公式 | 说明 |
|--------|----------|------|
| 已用额度 | `SUM(expense) - SUM(repayment)` | 消费减去已还金额 |
| 可用额度 | `credit_limit - used_credit` | 总额度减去已用 |
| 账单金额 | `Σ(账单周期内消费)` | 按账单周期聚合 |
| 本期应还 | `bill.total_amount - bill.paid_amount` | 账单减已还 |

## 界面功能

### 1. 信用卡列表

- 显示所有信用卡基本信息
- 实时显示已用/可用额度（计算值）
- 账单日、还款日提醒

### 2. 账单管理

- 查看历史账单
- 账单状态（未还/部分还/已还）
- 快速还款操作

### 3. 消费分析

- 月度消费趋势图
- 消费分类占比
- 商户消费排行

## 依赖关系

```
信用卡模块
├── 依赖: transactions (核心数据)
├── 依赖: accounts (账户关联)
├── 依赖: categories (消费分类)
└── 提供: credit_card 相关统计
```

## 扩展场景

### 预授权/分期

```javascript
// 预授权场景
{
    type: 'expense',
    amount: 5000.00,
    credit_card_id: 'card_001',
    is_pre_authorization: true,
    description: '酒店押金预授权'
}

// 分期场景
{
    type: 'expense',
    amount: 1666.67,
    credit_card_id: 'card_001',
    is_installment: true,
    installment_id: 'inst_001',     // 分期ID
    installment_index: 1,            // 第1期
    installment_total: 3,           // 共3期
    description: '手机分期付款'
}
```

## 注意事项

1. **数据一致性**: 信用卡账户余额应与实际消费记录一致
2. **还款冲销**: 还款金额必须关联到具体消费，可设置默认冲销规则
3. **账单周期**: 注意账单日与还款日的时区处理
4. **历史数据**: 重装/迁移时，保留所有交易记录即可重建信用卡数据

## 相关文件

- `src/modules/credit-cards/CreditCardsView.vue` - 信用卡管理界面
- `src/services/core-data-store.js` - 数据存储层（信用卡相关方法）
- `database/init-db.sql` - 数据库表结构
