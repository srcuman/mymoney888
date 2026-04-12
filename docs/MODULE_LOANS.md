# 贷款模块

## 模块概述

贷款模块用于管理各类贷款（房贷、车贷、消费贷等）的还款计划、还款记录和剩余金额计算。所有还款操作都通过交易记录驱动，用户可自由选择支出或转账方式。

## 核心理念

> **贷款还款本质上是交易**：用户可选择：
> - **支出模式**: 从还款账户直接支出，记录为 expense
> - **转账模式**: 从其他账户转入还款账户（适合公积金冲还贷等场景），记录为 transfer

## 数据架构

### 层级结构

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: 核心事实 (transactions)                               │
│  每笔还款都是独立交易                                             │
│  - 支出模式: type='expense', account=还款账户                   │
│  - 转账模式: type='transfer', from=其他账户, to=还款账户        │
│  - loan_id: 关联贷款标签                                         │
│  - principal: 本金金额                                           │
│  - interest: 利息金额                                            │
│  - payment_type: 'regular'(常规) / 'early'(提前) / 'extra'(追加)│
└─────────────────────────────────────────────────────────────────┘
                            ↓ 标签关联
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: 贷款定义 (loans)                                       │
│  - id, name, type (房贷/车贷/消费贷/公积金贷)                     │
│  - total_amount: 贷款总额                                       │
│  - interest_rate: 年利率                                         │
│  - term_months: 贷款期限（月）                                    │
│  - monthly_payment: 月供金额                                     │
│  - start_date: 起始日期                                          │
│  - repayment_day: 每月还款日                                     │
│  - linked_account_id: 默认扣款账户                              │
│  - status: 'active'(正常) / 'paid'(已还清) / 'transferred'(已转出)│
└─────────────────────────────────────────────────────────────────┘
                            ↓ 标签关联
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: 还款计划 (loan_schedule)                               │
│  - loan_id: 关联贷款                                             │
│  - planned_date: 计划还款日                                      │
│  - planned_amount: 计划金额                                      │
│  - planned_principal: 计划本金                                   │
│  - planned_interest: 计划利息                                    │
│  - status: planned/paid/partial/overdue                         │
│  - actual_transaction_id: 实际还款交易ID                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓ 计算
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: 衍生数据 (运行时计算)                                   │
│  - remaining_amount = total_amount - Σ(已还本金)               │
│  - paid_periods = COUNT(已还期数)                                │
│  - total_paid = Σ(已还总额)                                     │
│  - total_interest = Σ(已还利息)                                 │
│  - remaining_periods = term_months - paid_periods              │
└─────────────────────────────────────────────────────────────────┘
```

### 数据库表结构

```sql
-- loans 表（贷款定义）
CREATE TABLE IF NOT EXISTS loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    ledger_id VARCHAR(50) DEFAULT 'default' COMMENT '账套ID',
    name VARCHAR(100) NOT NULL COMMENT '贷款名称',
    type VARCHAR(50) NOT NULL COMMENT '贷款类型: mortgage/car/personal/credit/provident/other',
    institution VARCHAR(100) COMMENT '贷款机构',
    total_amount DECIMAL(15,2) NOT NULL COMMENT '贷款总额',
    interest_rate DECIMAL(8,4) NOT NULL COMMENT '年利率',
    term_months INT NOT NULL COMMENT '期限（月）',
    monthly_payment DECIMAL(15,2) COMMENT '月供金额',
    start_date DATE NOT NULL COMMENT '起始日期',
    repayment_day INT DEFAULT 1 COMMENT '每月还款日(1-28)',
    linked_account_id INT COMMENT '默认扣款账户',
    repayment_method ENUM('equal_principal', 'equal_payment', 'bullet', 'other') 
        DEFAULT 'equal_payment' COMMENT '还款方式: 等额本息/等额本金/到期还本/其他',
    status ENUM('active', 'paid', 'transferred', 'closed') DEFAULT 'active' 
        COMMENT '状态: 正常/已还清/已转出/已结清',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- loan_schedule 表（还款计划）
CREATE TABLE IF NOT EXISTS loan_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    loan_id INT NOT NULL COMMENT '关联贷款',
    period_number INT NOT NULL COMMENT '期数号',
    planned_date DATE NOT NULL COMMENT '计划还款日',
    planned_principal DECIMAL(15,2) NOT NULL COMMENT '计划本金',
    planned_interest DECIMAL(15,2) NOT NULL COMMENT '计划利息',
    planned_amount DECIMAL(15,2) NOT NULL COMMENT '计划还款额',
    actual_date DATE COMMENT '实际还款日',
    actual_principal DECIMAL(15,2) COMMENT '实际本金',
    actual_interest DECIMAL(15,2) COMMENT '实际利息',
    actual_amount DECIMAL(15,2) COMMENT '实际还款额',
    status ENUM('planned', 'paid', 'partial', 'overdue', 'early') DEFAULT 'planned' 
        COMMENT '状态: 待还/已还/部分/逾期/提前',
    actual_transaction_id INT COMMENT '实际还款交易ID',
    notes TEXT COMMENT '备注',
    INDEX idx_loan_id (loan_id),
    INDEX idx_planned_date (planned_date),
    INDEX idx_status (status),
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- loan_interest_history 表（利率调整历史）
CREATE TABLE IF NOT EXISTS loan_interest_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    loan_id INT NOT NULL COMMENT '关联贷款',
    effective_date DATE NOT NULL COMMENT '生效日期',
    old_rate DECIMAL(8,4) COMMENT '原利率',
    new_rate DECIMAL(8,4) NOT NULL COMMENT '新利率',
    change_type VARCHAR(50) COMMENT '调整类型: lpr_base/lpr_adjust/fixed/other',
    notes TEXT,
    INDEX idx_loan_id (loan_id),
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);
```

## 数据触发逻辑

### 场景1: 添加新贷款

**用户操作**: 创建新的贷款记录

**数据流程**:

```javascript
// 1. 创建贷款定义
{
    id: 'loan_001',
    name: '购房商业贷款',
    type: 'mortgage',
    institution: '中国建设银行',
    total_amount: 2000000.00,
    interest_rate: 0.049,
    term_months: 360,
    monthly_payment: 10614.53,
    start_date: '2025-01-01',
    repayment_day: 15,
    linked_account_id: 123,           // 默认建设银行储蓄卡
    repayment_method: 'equal_payment'  // 等额本息
}

// 2. 系统自动生成还款计划（可选）
// 计算每期本金/利息分解
for (i = 1; i <= 360; i++) {
    const schedule = calculatePaymentSchedule(loan, i);
    // 生成 360 期还款计划记录
}
```

### 场景2: 每月还款 - 支出模式

**用户操作**: 从银行卡直接扣除月供（常规支出）

**数据流程**:

```
┌─────────────────────────────────────────────────────────────────┐
│ transaction (支出)                                                │
│ - type: 'expense'                                                │
│ - amount: 10614.53                                               │
│ - account_id: 建设银行储蓄卡 (123)                                │
│ - category_id: '贷款还款'                                         │
│ - loan_id: 'loan_001'                                            │
│ - tags: ['月供', '常规还款']                                      │
│ - description: '2026年1月房贷还款'                                 │
│ - transaction_date: '2026-01-15'                                  │
│                                                                 │
│ // 还款分解（可选）                                               │
│ - principal: 8422.20                                             │
│ - interest: 2192.33                                               │
│ - payment_index: 13                                              │
│ - payment_total: 360                                             │
└─────────────────────────────────────────────────────────────────┘

// 更新还款计划状态
loan_schedule.status = 'paid'
loan_schedule.actual_date = '2026-01-15'
loan_schedule.actual_transaction_id = transaction_id
```

### 场景3: 每月还款 - 转账模式

**用户操作**: 公积金转账冲还贷

**适用场景**:
- 公积金冲还贷（公积金账户 → 还款账户）
- 他行转账还贷（其他银行卡 → 还款账户）
- 手动凑钱还款（多个账户凑齐月供）

**数据流程**:

```
步骤1: 创建转账交易
┌─────────────────────────────────────────────────────────────────┐
│ transaction (转账)                                                │
│ - type: 'transfer'                                               │
│ - from_account: 公积金账户 (456)                                  │
│ - to_account: 建设银行还款账户 (789)                              │
│ - amount: 5000.00  (公积金月冲金额)                               │
│ - loan_id: 'loan_001'                                            │
│ - tags: ['公积金冲还贷', '转账还款']                              │
│ - description: '2026年1月公积金冲还贷'                            │
│ - transaction_date: '2026-01-15'                                 │
│                                                                 │
│ // 附加信息                                                      │
│ - principal: 3500.00                                             │
│ - interest: 1500.00                                              │
└─────────────────────────────────────────────────────────────────┘

步骤2: 如果公积金不够，用户补充差额（另一笔交易）
┌─────────────────────────────────────────────────────────────────┐
│ transaction (支出)                                                │
│ - type: 'expense'                                                │
│ - amount: 5614.53  (月供 - 公积金冲还)                           │
│ - account_id: 建设银行储蓄卡 (123)                                │
│ - category_id: '贷款还款'                                         │
│ - loan_id: 'loan_001'                                            │
│ - tags: ['月供', '商贷补充', '转账还款']                          │
│ - related_transfer_id: 前一笔公积金转账ID                        │
└─────────────────────────────────────────────────────────────────┘

// 两笔交易共同构成完整月供
```

### 场景4: 提前还款

**用户操作**: 一次性提前还清部分本金

**数据流程**:

```javascript
// 1. 用户选择还款方式
{
    // 方式A: 支出模式（从银行卡直接扣）
    payment_mode: 'expense',
    amount: 100000.00,
    account_id: 银行卡
    
    // 方式B: 转账模式（从他行转入还款账户）
    payment_mode: 'transfer',
    from_account: 他行账户,
    to_account: 还款账户,
    amount: 100000.00
}

// 2. 创建提前还款交易
{
    type: 'expense' | 'transfer',
    amount: 100000.00,
    loan_id: 'loan_001',
    payment_type: 'early',
    principal: 100000.00,           // 全部冲抵本金
    interest: 0,                    // 可能需另付当期利息
    description: '提前还本金10万',
    reduce_term: true,              // 减少期限，月供不变
    // 或 reduce_payment: true     // 减少月供，期限不变
}

// 3. 更新还款计划
// 如果选择减少期限，后续计划期数相应减少
// 如果选择减少月供，重新计算每期金额

// 4. 剩余金额立即更新
remaining_amount = remaining_amount - 100000.00
```

### 场景5: 部分提前还款 + 转账

**用户操作**: 他行卡转账提前还款 + 公积金部分冲还

**数据流程**:

```
步骤1: 转账提前还款
┌─────────────────────────────────────────────────────────────────┐
│ transaction (转账)                                                │
│ - type: 'transfer'                                               │
│ - from_account: 他行账户                                         │
│ - to_account: 建设银行还款账户                                    │
│ - amount: 200000.00  (提前还款本金)                              │
│ - loan_id: 'loan_001'                                            │
│ - payment_type: 'early'                                          │
│ - principal: 200000.00                                           │
│ - description: '提前还款20万'                                    │
└─────────────────────────────────────────────────────────────────┘

步骤2: 公积金冲还本期月供
┌─────────────────────────────────────────────────────────────────┐
│ transaction (转账)                                                │
│ - type: 'transfer'                                               │
│ - from_account: 公积金账户                                        │
│ - to_account: 建设银行还款账户                                    │
│ - amount: 5000.00                                                │
│ - loan_id: 'loan_001'                                            │
│ - payment_type: 'regular'                                        │
│ - principal: 3500.00                                             │
│ - interest: 1500.00                                             │
│ - description: '本期公积金冲还'                                   │
└─────────────────────────────────────────────────────────────────┘

步骤3: 补充商贷差额
┌─────────────────────────────────────────────────────────────────┐
│ transaction (支出)                                                │
│ - type: 'expense'                                                │
│ - amount: 5614.53                                                │
│ - account_id: 银行卡                                            │
│ - loan_id: 'loan_001'                                            │
│ - payment_type: 'regular'                                        │
│ - description: '补充商贷月供差额'                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 场景6: 利率调整（LPR）

**用户操作**: 贷款执行LPR利率调整

**数据流程**:

```javascript
// 1. 记录利率调整历史
{
    loan_id: 'loan_001',
    effective_date: '2026-01-01',
    old_rate: 0.049,
    new_rate: 0.0435,
    change_type: 'lpr_adjust',
    lpr_base: 0.0345,           // 当期LPR基点
    spread: 0.001               // 加点
}

// 2. 更新贷款当前利率
loan.current_interest_rate = 0.0435

// 3. 重新计算月供（根据用户选择）
// 选择A: 保持月供不变，缩短期限
new_term_months = calculateNewTerm(remaining_principal, new_rate, monthly_payment)
loan.term_months = new_term_months

// 选择B: 保持期限不变，减少月供
new_monthly_payment = calculateNewPayment(remaining_principal, new_rate, remaining_term)

// 4. 重新生成后续还款计划
regenerateSchedule(loan)
```

### 场景7: 贷款展期/延期

**用户操作**: 贷款到期，申请展期

**数据流程**:

```javascript
// 1. 原贷款标记为已展期
{
    id: 'loan_001',
    status: 'closed',           // 或 'extended'
    closed_date: '2026-05-01',
    closure_reason: '展期',
    new_loan_id: 'loan_001_new'
}

// 2. 创建新贷款继承剩余本金
{
    id: 'loan_001_new',
    name: '购房贷款(展期)',
    type: 'mortgage',
    total_amount: remaining_amount,  // 继承剩余本金
    start_date: '2026-05-01',
    // 新贷款参数
}
```

### 场景8: 贷款转出（还清）

**用户操作**: 提前还清全部贷款

**数据流程**:

```javascript
// 1. 创建最后一笔还清交易
{
    type: 'expense' | 'transfer',
    amount: remaining_amount,
    account_id: 银行卡,
    loan_id: 'loan_001',
    payment_type: 'full_settlement',
    principal: remaining_amount,
    interest: 0,
    description: '贷款结清'
}

// 2. 更新贷款状态
loan.status = 'paid'
loan.paid_date = transaction_date

// 3. 更新所有待还计划为已结清
loan_schedule.where(status = 'planned').update({
    status: 'cancelled',
    notes: '贷款已结清'
})
```

## 关键计算公式

### 等额本息

```
月供 = P × [r(1+r)^n] / [(1+r)^n - 1]

其中:
P = 贷款本金
r = 月利率 (年利率 / 12)
n = 还款期数
```

### 等额本金

```
每月本金 = P / n
每月利息 = (P - 已还本金累计) × r
每月还款额 = 每月本金 + 每月利息
```

### 剩余本金计算

```javascript
// 剩余本金 = 原始总额 - 累计已还本金
remaining_principal = total_amount - Σ(actual_principal)

// 累计已还本金从 transactions 表计算
total_principal_paid = SUM(transactions WHERE loan_id = ? AND type = 'expense' AND principal IS NOT NULL)
```

### 提前还款后重新计算

```javascript
// 减少期限（月供不变）
function calculateNewTerm(remainingPrincipal, newRate, currentPayment) {
    const monthlyRate = newRate / 12;
    // 逆算剩余期数
    const n = Math.log(currentPayment / (currentPayment - remainingPrincipal * monthlyRate)) / 
              Math.log(1 + monthlyRate);
    return Math.ceil(n);
}

// 减少月供（期限不变）
function calculateNewPayment(remainingPrincipal, newRate, remainingTerm) {
    const monthlyRate = newRate / 12;
    const payment = remainingPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, remainingTerm)) / 
                   (Math.pow(1 + monthlyRate, remainingTerm) - 1);
    return payment;
}
```

## 界面功能

### 1. 贷款列表

- 显示所有贷款基本信息
- 实时显示剩余金额、已还期数（计算值）
- 利率、期限、月供信息
- 贷款状态（正常/已还清）

### 2. 还款计划

- 查看全部还款计划
- 计划vs实际对比
- 逾期提醒
- 利率调整记录

### 3. 还款记录

- 历史还款明细
- 支出/转账模式区分
- 本金/利息分解
- 提前还款记录

### 4. 还款录入

- **还款方式选择**: 支出 / 转账
- **支出模式**: 选择还款账户，输入金额
- **转账模式**: 选择转入/转出账户，输入金额
- **还款分解**: 本金/利息手动或自动分解
- **期数标记**: 自动关联到对应期数

### 5. 贷款分析

- 已还本金vs利息占比
- 剩余期限可视化
- 提前还款节省利息计算
- LPR利率追踪

## 依赖关系

```
贷款模块
├── 依赖: transactions (核心数据)
├── 依赖: accounts (扣款账户/还款账户)
├── 依赖: categories (还款分类)
└── 提供: loan 相关统计
```

## 扩展场景

### 公积金组合贷款

```javascript
// 商业贷款部分
{
    id: 'loan_001a',
    name: '购房商贷',
    type: 'mortgage',
    portion: 'commercial',
    total_amount: 1200000.00
}

// 公积金贷款部分
{
    id: 'loan_001b',
    name: '购房公积金贷',
    type: 'provident',
    portion: 'provident_fund',
    total_amount: 800000.00
}

// 组合还款：分别录入，公积金优先冲公积金贷款
```

### 共同还款人

```javascript
// 标记共同还款人
{
    loan_id: 'loan_001',
    co_borrowers: [
        { user_id: 1, name: '本人', portion: 0.6 },
        { user_id: 2, name: '配偶', portion: 0.4 }
    ]
}
```

## 注意事项

1. **还款方式灵活**: 用户可自由选择支出或转账，两种方式都记录为交易
2. **本金利息分解**: 系统可自动计算分解比例，用户也可手动输入
3. **提前还款**: 两种模式都支持，部分银行可能要求预约
4. **利率历史**: 每次LPR调整都记录历史，便于总利息计算
5. **逾期处理**: 逾期记录单独标记，可能影响后续贷款
6. **迁移场景**: 导出还款交易记录 + 贷款定义即可重建状态

## 相关文件

- `src/modules/loans/LoansView.vue` - 贷款管理界面
- `src/services/core-data-store.js` - 数据存储层（贷款相关方法）
- `database/init-db.sql` - 数据库表结构
