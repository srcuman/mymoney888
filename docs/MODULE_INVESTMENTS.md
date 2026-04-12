# 投资模块

## 模块概述

投资模块用于管理各类投资账户（基金、股票、债券、理财等）的买入、卖出、分红、净值波动等，所有操作都通过交易记录驱动。

## 核心理念

> **投资模块的每笔操作都是交易**：
> - 买入 = 转账交易（资金账户 → 投资账户现金）+ 手续费支出交易
> - 卖出 = 转账交易（投资账户现金 → 资金账户）+ 手续费支出交易
> - 分红 = 收入交易
> - 净值波动 = 收入交易（盈利为正数，亏损为负数）
> - **净值波动只在配置的期间末记录，期间内多次更新自动更新该交易**

## 数据架构

### 层级结构

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: 核心事实 (transactions)                                │
│  所有操作都是交易                                                 │
│  - 买入: 转账 transaction + 手续费支出 transaction               │
│  - 卖出: 转账 transaction + 手续费支出 transaction               │
│  - 分红: 收入 transaction                                       │
│  - 净值波动: 收入 transaction (盈利正数/亏损负数)               │
│  - type: transfer / income / expense                           │
│  - investment_account_id: 投资账户标签                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓ 标签关联
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: 投资账户定义 (investment_accounts)                    │
│  - id, name, type (基金/股票/债券/理财)                          │
│  - currency: 币种                                               │
│  - cash_account_id: 现金子账户ID (用于记录未投资的资金)         │
│  - linked_account_ids: 关联的资金账户列表                       │
│  - nav_update_frequency: 净值更新周期                          │
│    (monthly/quarterly/half_yearly/yearly)                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓ 持仓关联
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: 投资明细 (investment_holdings)                        │
│  - account_id: 所属投资账户                                       │
│  - code: 品种代码                                                │
│  - name: 品种名称                                                │
│  - shares: 当前持有份额                                          │
│  - cost_price: 成本价（平均）                                     │
│  - current_price: 当前价格（手动/自动更新）                       │
│  - last_nav_update: 最后净值更新日期                             │
│  - current_period_nav_tx_id: 当前期间波动交易ID (用于更新)       │
└─────────────────────────────────────────────────────────────────┘
                            ↓ 净值记录
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: 净值历史 (nav_history)                                │
│  - holding_id: 持仓ID                                            │
│  - record_date: 记录日期                                         │
│  - nav: 单位净值                                                 │
│  - total_value: 总市值                                           │
│  - is_period_end: 是否期间末                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓ 计算
┌─────────────────────────────────────────────────────────────────┐
│  Layer 5: 衍生数据 (运行时计算)                                   │
│  - market_value = shares × current_price                       │
│  - unrealized_pnl = market_value - cost_basis                   │
│  - unrealized_pnl_pct = unrealized_pnl / cost_basis × 100%     │
│  - total_asset = Σ(所有持仓市值) + 现金余额                      │
└─────────────────────────────────────────────────────────────────┘
```

### 数据库表结构

```sql
-- investment_accounts 表（投资账户定义）
CREATE TABLE IF NOT EXISTS investment_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    ledger_id VARCHAR(50) DEFAULT 'default' COMMENT '账套ID',
    name VARCHAR(100) NOT NULL COMMENT '账户名称',
    type VARCHAR(50) NOT NULL COMMENT '账户类型: fund/stock/bond/wealth/forex/crypto',
    currency VARCHAR(10) DEFAULT 'CNY' COMMENT '币种',
    cash_account_id INT COMMENT '现金子账户ID（内部资金池）',
    nav_update_frequency ENUM('monthly', 'quarterly', 'half_yearly', 'yearly') 
        DEFAULT 'monthly' COMMENT '净值更新频率',
    description TEXT COMMENT '描述',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_ledger_id (ledger_id)
);

-- investment_holdings 表（投资明细/持仓）
CREATE TABLE IF NOT EXISTS investment_holdings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    account_id INT NOT NULL COMMENT '投资账户ID',
    investment_type VARCHAR(50) NOT NULL COMMENT '投资类型: fund/stock/bond/wealth',
    code VARCHAR(50) NOT NULL COMMENT '品种代码',
    name VARCHAR(100) NOT NULL COMMENT '品种名称',
    shares DECIMAL(15,4) DEFAULT 0 COMMENT '持有份额',
    cost_price DECIMAL(15,4) DEFAULT 0 COMMENT '成本价',
    cost_basis DECIMAL(15,2) DEFAULT 0 COMMENT '成本总额',
    current_price DECIMAL(15,4) DEFAULT 0 COMMENT '当前价格/净值',
    last_nav_update DATE COMMENT '最后净值更新日期',
    current_period_nav_tx_id INT COMMENT '当前期间波动交易ID（用于更新）',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否持仓中',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_account_id (account_id),
    INDEX idx_code (code),
    INDEX idx_user_id (user_id)
);

-- nav_history 表（净值历史）
CREATE TABLE IF NOT EXISTS nav_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    holding_id INT NOT NULL COMMENT '持仓ID',
    record_date DATE NOT NULL COMMENT '记录日期',
    nav DECIMAL(15,4) NOT NULL COMMENT '单位净值',
    total_value DECIMAL(15,2) NOT NULL COMMENT '当日总市值',
    is_period_end TINYINT(1) DEFAULT 0 COMMENT '是否期间末日',
    nav_tx_id INT COMMENT '期间波动交易ID（期间末生成）',
    notes TEXT,
    INDEX idx_holding_id (holding_id),
    INDEX idx_record_date (record_date),
    UNIQUE KEY uk_holding_date (holding_id, record_date)
);

-- investment_transfers 表（投资内部转账记录）
-- 用于记录：从投资账户现金转入具体持仓的交易
-- 这笔交易不写入核心 transactions 表，仅在投资模块内部记录
CREATE TABLE IF NOT EXISTS investment_transfers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    holding_id INT NOT NULL COMMENT '持仓ID',
    transfer_type ENUM('buy', 'sell', 'dividend_reinvest', 'split') NOT NULL 
        COMMENT '转账类型',
    shares DECIMAL(15,4) NOT NULL COMMENT '份额变动',
    price DECIMAL(15,4) NOT NULL COMMENT '成交价格',
    amount DECIMAL(15,2) NOT NULL COMMENT '成交金额（不含手续费）',
    fee DECIMAL(15,2) DEFAULT 0 COMMENT '手续费金额',
    fee_account_id INT COMMENT '手续费扣款账户ID（为空则从现金扣）',
    transfer_date DATE NOT NULL COMMENT '转账日期',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_holding_id (holding_id),
    INDEX idx_transfer_date (transfer_date)
);
```

## 数据触发逻辑

### 场景1: 添加投资账户

**用户操作**: 创建新的投资账户

**数据流程**:

```javascript
// 1. 创建投资账户
{
    id: 'inv_001',
    name: '天天基金账户',
    type: 'fund',
    currency: 'CNY',
    nav_update_frequency: 'monthly',  // 月度更新净值
    linked_account_ids: [123, 124]    // 关联银行卡、支付宝
}

// 2. 系统自动创建现金子账户
{
    name: '天天基金账户-现金',
    type: 'investment_cash',
    parent_id: 'inv_001',
    initial_balance: 0
}
```

### 场景2: 基金定投（买入）+ 手续费

**用户操作**: 每月从银行卡定投1000元到基金，产生10元手续费

**数据流程**:

```
步骤1: 用户创建转账交易（从银行卡转入投资账户现金）
┌─────────────────────────────────────────────────────────────────┐
│ transaction (转账)                                              │
│ - type: 'transfer'                                              │
│ - from_account: 银行卡 (123)                                     │
│ - to_account: 天天基金-现金 (inv_cash_001)                       │
│ - amount: 1000.00                                                │
│ - category: null (转账无分类)                                    │
│ - tags: ['基金定投', '买入']                                     │
│ - investment_account_id: 'inv_001'                              │
└─────────────────────────────────────────────────────────────────┘

步骤2: 用户在投资管理中录入具体买入
┌─────────────────────────────────────────────────────────────────┐
│ investment_transfer (投资内部转账)                              │
│ - holding_id: 'hold_001' (沪深300ETF)                           │
│ - transfer_type: 'buy'                                         │
│ - shares: 200.00                                                │
│ - price: 4.95                                                   │
│ - amount: 990.00  (不含手续费)                                  │
│ - fee: 10.00                                                    │
│ - fee_account_id: null  (从现金账户扣手续费)                    │
│ - date: 2026-04-30                                              │
└─────────────────────────────────────────────────────────────────┘

步骤3: 系统自动创建手续费支出交易
┌─────────────────────────────────────────────────────────────────┐
│ transaction (支出)                                              │
│ - type: 'expense'                                               │
│ - amount: 10.00                                                 │
│ - account_id: 天天基金-现金 (inv_cash_001)                       │
│ - category_id: '投资费用'                                        │
│ - tags: ['申购费', '手续费']                                     │
│ - investment_account_id: 'inv_001'                             │
│ - holding_id: 'hold_001'                                       │
│ - related_transfer_id: investment_transfer_id                  │
│ - description: '沪深300ETF申购费'                               │
└─────────────────────────────────────────────────────────────────┘

步骤4: 系统更新持仓
new_shares = old_shares + 200.00
new_cost_basis = old_cost_basis + 990.00 + 10.00  // 手续费计入成本
new_cost_price = new_cost_basis / new_shares

// 投资账户现金变化
// 转入 1000.00
// 买入 990.00 + 手续费 10.00 = 1000.00
// 现金余额不变
```

### 场景3: 基金赎回（卖出）+ 手续费

**用户操作**: 赎回部分基金，产生5元赎回费

**数据流程**:

```
步骤1: 用户在投资管理中录入卖出
┌─────────────────────────────────────────────────────────────────┐
│ investment_transfer (投资内部转账)                              │
│ - holding_id: 'hold_001' (沪深300ETF)                           │
│ - transfer_type: 'sell'                                        │
│ - shares: -500.00  (减少500份)                                  │
│ - price: 5.20                                                   │
│ - amount: 2600.00  (卖出金额，不含手续费)                       │
│ - fee: 5.00                                                     │
│ - fee_account_id: null  (从现金账户扣手续费)                    │
│ - date: 2026-04-30                                              │
└─────────────────────────────────────────────────────────────────┘

步骤2: 系统自动创建手续费支出交易
┌─────────────────────────────────────────────────────────────────┐
│ transaction (支出)                                              │
│ - type: 'expense'                                               │
│ - amount: 5.00                                                  │
│ - account_id: 天天基金-现金 (inv_cash_001)                      │
│ - category_id: '投资费用'                                        │
│ - tags: ['赎回费', '手续费']                                     │
│ - investment_account_id: 'inv_001'                             │
│ - holding_id: 'hold_001'                                       │
│ - related_transfer_id: investment_transfer_id                  │
│ - description: '沪深300ETF赎回费'                               │
└─────────────────────────────────────────────────────────────────┘

步骤3: 系统更新持仓
new_shares = old_shares - 500.00
sold_cost = 500 × cost_price  // 卖出部分的成本

步骤4: 用户创建转账交易（从投资账户现金转出到银行卡）
┌─────────────────────────────────────────────────────────────────┐
│ transaction (转账)                                              │
│ - type: 'transfer'                                             │
│ - from_account: 天天基金-现金 (inv_cash_001)                    │
│ - to_account: 银行卡 (123)                                      │
│ - amount: 2595.00  (2600 - 5手续费)                             │
│ - tags: ['基金赎回', '卖出']                                     │
│ - investment_account_id: 'inv_001'                             │
│ - holding_id: 'hold_001'                                       │
│ - realized_pnl: 2595 - sold_cost  (本次卖出已实现盈利)          │
└─────────────────────────────────────────────────────────────────┘
```

### 场景4: 分红再投资

**用户操作**: 收到基金分红，选择红利再投

**数据流程**:

```
步骤1: 系统检测到分红（用户录入或自动同步）
┌─────────────────────────────────────────────────────────────────┐
│ transaction (收入)                                              │
│ - type: 'income'                                                │
│ - amount: 100.00  (分红金额)                                    │
│ - account_id: 天天基金-现金 (inv_cash_001)                       │
│ - category_id: '基金分红'                                        │
│ - investment_account_id: 'inv_001'                              │
│ - holding_id: 'hold_001'                                        │
│ - dividend_per_share: 0.05                                     │
│ - shares_reinvested: 20.00  (再投份额)                          │
└─────────────────────────────────────────────────────────────────┘

步骤2: 用户在投资管理中录入分红再投
┌─────────────────────────────────────────────────────────────────┐
│ investment_transfer (投资内部转账)                              │
│ - holding_id: 'hold_001'                                        │
│ - transfer_type: 'dividend_reinvest'                            │
│ - shares: 20.00                                                 │
│ - price: 5.00                                                   │
│ - amount: 100.00                                                │
│ - fee: 0                                                        │
└─────────────────────────────────────────────────────────────────┘

步骤3: 系统更新持仓
new_shares = old_shares + 20.00
// 分红再投不增加成本
```

### 场景5: 净值波动自动生成交易（关键）

**用户操作**: 定期更新净值，系统在期间末自动生成波动交易

**核心规则**:
1. 净值波动只记录为**收入交易**（盈利正数，亏损负数）
2. 只在配置的**期间末**生成交易
3. 期间内多次更新净值，自动**更新**已存在的交易记录

**配置说明**:
- `monthly`: 每月末生成波动交易
- `quarterly`: 每季度末生成波动交易
- `half_yearly`: 每年6月末、12月末生成波动交易
- `yearly`: 每年末生成波动交易

**数据流程（假设季度末配置）**:

```
场景A: 季度内第一次更新净值（4月）

步骤1: 用户更新当前持仓净值
┌─────────────────────────────────────────────────────────────────┐
│ nav_history 新增记录                                            │
│ - holding_id: 'hold_001'                                       │
│ - record_date: 2026-04-30                                       │
│ - nav: 5.30  (季度初3月31日为5.00)                              │
│ - total_value: shares × 5.30                                   │
│ - is_period_end: false  (4月不是季度末)                          │
└─────────────────────────────────────────────────────────────────┘

步骤2: 持仓中保存当前期间信息
hold_001.current_period_nav_tx_id = null  // 尚未到季度末，不生成交易

步骤3: 用户可继续更新净值，每次只更新 nav_history 和 current_price


场景B: 季度末更新净值（6月），首次生成波动交易

步骤1: 用户更新当前持仓净值
┌─────────────────────────────────────────────────────────────────┐
│ nav_history 新增记录                                            │
│ - holding_id: 'hold_001'                                       │
│ - record_date: 2026-06-30                                       │
│ - nav: 5.50  (季度初3月31日为5.00)                              │
│ - total_value: shares × 5.50                                    │
│ - is_period_end: true  (6月是季度末)                            │
└─────────────────────────────────────────────────────────────────┘

步骤2: 系统判断是季度末，生成波动交易
// 计算期间浮动盈亏
period_change = (5.50 - 5.00) × shares = +500.00  (盈利)

┌─────────────────────────────────────────────────────────────────┐
│ transaction (收入)                                              │
│ - type: 'income'                                               │
│ - amount: 500.00  (正数=盈利)                                  │
│ - account_id: 天天基金-现金 (inv_cash_001)                      │
│ - category_id: '投资浮动盈亏'                                   │
│ - tags: ['净值波动', '盈利']                                    │
│ - investment_account_id: 'inv_001'                             │
│ - holding_id: 'hold_001'                                       │
│ - period_start_nav: 5.00                                       │
│ - period_end_nav: 5.50                                         │
│ - period_type: 'quarterly'                                     │
│ - description: 'Q2季度浮动盈利'                                  │
└─────────────────────────────────────────────────────────────────┘

步骤3: 更新持仓中的交易ID
hold_001.current_period_nav_tx_id = nav_tx_id


场景C: 季度内再次更新净值（5月），自动更新季度末交易

步骤1: 用户更新当前持仓净值
┌─────────────────────────────────────────────────────────────────┐
│ nav_history 新增记录                                            │
│ - holding_id: 'hold_001'                                       │
│ - record_date: 2026-05-31                                       │
│ - nav: 5.40  (季度初3月31日为5.00)                              │
│ - total_value: shares × 5.40                                   │
│ - is_period_end: false  (5月不是季度末)                          │
└─────────────────────────────────────────────────────────────────┘

步骤2: 系统检测到存在未到期末的期间交易
// 有 current_period_nav_tx_id，说明上季度末已生成交易
// 但当前是5月，季度末是6月，需要更新那笔交易

// 计算从季度初到现在的浮盈
new_period_change = (5.40 - 5.00) × shares = +400.00

// 更新已有的交易
UPDATE transaction SET amount = 400.00 WHERE id = current_period_nav_tx_id

// nav_history 更新关联
UPDATE nav_history SET nav_tx_id = current_period_nav_tx_id 
WHERE id = latest_nav_record_id


场景D: 季度末最终结算（6月30日），使用最终净值

步骤1: 用户更新最终净值
┌─────────────────────────────────────────────────────────────────┐
│ nav_history 新增记录                                            │
│ - holding_id: 'hold_001'                                       │
│ - record_date: 2026-06-30                                       │
│ - nav: 5.50                                                     │
│ - total_value: shares × 5.50                                    │
│ - is_period_end: true                                          │
│ - nav_tx_id: current_period_nav_tx_id  (关联已有交易)           │
└─────────────────────────────────────────────────────────────────┘

// 最终期间浮盈 = (5.50 - 5.00) × shares = +500.00
// 交易金额更新为最终值 500.00


场景E: 季度亏损情况

步骤1: 季度末净值下跌
nav: 4.80  (季度初5.00)

// 系统生成收入交易，金额为负数
┌─────────────────────────────────────────────────────────────────┐
│ transaction (收入)                                              │
│ - type: 'income'                                               │
│ - amount: -200.00  (负数=亏损)                                 │
│ - account_id: 天天基金-现金 (inv_cash_001)                      │
│ - category_id: '投资浮动盈亏'                                    │
│ - tags: ['净值波动', '亏损']                                    │
│ - description: 'Q2季度浮动亏损'                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 场景6: 手续费单独指定扣款账户

**用户操作**: 手续费从银行卡扣除（不从投资现金扣）

**数据流程**:

```
步骤1: 用户录入买入，指定手续费从银行卡扣
┌─────────────────────────────────────────────────────────────────┐
│ investment_transfer (投资内部转账)                              │
│ - holding_id: 'hold_001'                                       │
│ - transfer_type: 'buy'                                         │
│ - shares: 200.00                                                │
│ - price: 4.95                                                   │
│ - amount: 990.00  (不含手续费)                                  │
│ - fee: 10.00                                                    │
│ - fee_account_id: 123  (银行卡，单独扣手续费)                   │
│ - date: 2026-04-30                                              │
└─────────────────────────────────────────────────────────────────┘

步骤2: 系统创建两笔交易
┌─────────────────────────────────────────────────────────────────┐
│ transaction (转账)                                              │
│ - type: 'transfer'                                             │
│ - from_account: 银行卡 (123)                                    │
│ - to_account: 天天基金-现金 (inv_cash_001)                      │
│ - amount: 990.00                                                │
│ - tags: ['基金定投']                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ transaction (支出)                                              │
│ - type: 'expense'                                              │
│ - amount: 10.00                                                 │
│ - account_id: 银行卡 (123)  (手续费单独扣)                     │
│ - category_id: '投资费用'                                        │
│ - tags: ['申购费']                                              │
└─────────────────────────────────────────────────────────────────┘

步骤3: 系统更新持仓
// 成本 = 990.00（手续费不计入成本，因为单独扣了）
new_cost_basis = old_cost_basis + 990.00
```

## 关键计算公式

| 数据项 | 计算公式 | 说明 |
|--------|----------|------|
| 持有份额 | `初始份额 + Σ(买入) + Σ(卖出)` | 累计份额变动 |
| 成本均价 | `Σ(成交金额) / 持有份额` | 分批买入均价 |
| 市值 | `持有份额 × 当前价格` | 实时市值 |
| 浮盈/浮亏 | `(当前价 - 成本价) × 持有份额` | 未实现收益 |
| 盈亏比例 | `(当前价 - 成本价) / 成本价 × 100%` | 收益率 |
| 已实现盈亏 | `Σ(卖出成交额) - Σ(卖出成本)` | 已落袋收益 |
| 期间浮动盈亏 | `(期末净值 - 期初净值) × 持有份额` | 期间收益 |
| 总资产 | `Σ(各持仓市值) + 现金余额` | 账户汇总 |

### 净值波动交易生成逻辑

```javascript
// 核心算法
function handleNavUpdate(holding, newNav, newDate, frequency) {
    // 1. 获取期初净值（上一次期间末的净值）
    const periodStartNav = getPeriodStartNav(holding, newDate, frequency);
    
    // 2. 计算期间浮盈浮亏
    const periodChange = (newNav - periodStartNav) * holding.shares;
    
    // 3. 判断是否期间末
    const isPeriodEnd = isEndOfPeriod(newDate, frequency);
    
    // 4. 更新净值历史
    const navRecord = createNavHistory(holding.id, newDate, newNav, isPeriodEnd);
    
    // 5. 更新持仓当前价格
    updateHoldingPrice(holding.id, newNav);
    
    if (isPeriodEnd) {
        // 期间末：创建新交易
        const tx = createNavTransaction({
            type: 'income',
            amount: periodChange,  // 正数盈利，负数亏损
            account_id: holding.cash_account_id,
            holding_id: holding.id,
            period_start_nav: periodStartNav,
            period_end_nav: newNav,
            period_type: frequency
        });
        
        // 关联交易ID到持仓和净值记录
        holding.current_period_nav_tx_id = tx.id;
        navRecord.nav_tx_id = tx.id;
        
    } else if (holding.current_period_nav_tx_id) {
        // 期间中但有未结算交易：更新交易金额
        const currentTx = getTransaction(holding.current_period_nav_tx_id);
        currentTx.amount = periodChange;  // 更新为最新计算的期间盈亏
        currentTx.period_end_nav = newNav;
        navRecord.nav_tx_id = currentTx.id;
    }
    
    return navRecord;
}

// 判断是否期间末日
function isEndOfPeriod(date, frequency) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    
    switch (frequency) {
        case 'monthly':
            return isLastDayOfMonth(date);
        case 'quarterly':
            return [2, 5, 8, 11].includes(month) && isLastDayOfMonth(date);
        case 'half_yearly':
            return [5, 11].includes(month) && isLastDayOfMonth(date);
        case 'yearly':
            return month === 11 && isLastDayOfMonth(date); // 12月末
        default:
            return false;
    }
}
```

## 界面功能

### 1. 投资账户列表

- 按账户类型分组显示（基金/股票/债券/理财）
- 总资产、盈亏汇总（计算值）
- 净值更新周期显示
- 账户状态（活跃/冻结）

### 2. 持仓明细

- 按投资品种显示
- 份额、成本、当前价、市值
- 浮盈/浮亏金额/比例
- 当前期间已实现浮动盈亏（如果有交易）

### 3. 交易操作

- **买入**: 转账入口 + 手续费录入（可选单独账户）+ 投资明细录入
- **卖出**: 投资明细录入 + 转账出口 + 手续费录入（可选单独账户）
- **分红**: 收入交易录入 + 再投录入
- **净值更新**: 批量更新净值入口，显示期间浮动盈亏预览

### 4. 净值历史

- 资产变化曲线图
- 收益曲线
- 历史记录列表
- 波动损益交易记录（收入类型）
- 显示期初/期末净值对比

### 5. 设置

- 净值更新周期设置（月度/季度/半年度/年度）
- 关联资金账户管理
- 默认手续费扣款账户

## 依赖关系

```
投资模块
├── 依赖: transactions (核心数据，转账/收入/支出)
├── 依赖: accounts (资金账户 + 现金子账户)
├── 依赖: categories (分红、费用、浮动盈亏分类)
├── 依赖: tags (投资相关标签)
└── 提供: investment 相关统计
```

## 注意事项

1. **净值波动单一收入**: 波动只记录收入交易，亏损记录负数，不使用支出交易
2. **期间末结算**: 只有配置的周期末日才生成交易，期间内更新自动更新已存在的交易
3. **现金子账户**: 每个投资账户都有现金子账户，用于记录未投资资金和波动交易
4. **内部转账分离**: 从现金到持仓的转账记录在 investment_transfers，不在 transactions
5. **手续费灵活**: 手续费可从现金账户扣或单独指定银行卡扣
6. **成本计算**: 手续费计入成本的方式取决于扣款账户
7. **迁移场景**: 导出交易记录 + 持仓快照 + 净值历史即可完整迁移

## 相关文件

- `src/modules/investments/InvestmentsView.vue` - 投资管理界面
- `src/services/core-data-store.js` - 数据存储层（投资相关方法）
- `database/init-db.sql` - 数据库表结构
