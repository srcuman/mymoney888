# 数据库设计文档

## 版本信息
- 版本：4.0.0
- 日期：2026-04-19
- 描述：项目重命名为发发，架构优化

## 核心设计原则

### 1. 唯一事实来源
- `transactions`（交易记录）是唯一的事实来源
- 所有其他数据都是对交易的"标签"
- 衍生数据（余额、已用额度等）由交易实时计算，**不存储**

### 2. 标签化存储
- 成员、商家、标签、支付渠道作为交易标签存储
- 通过标签关联到交易，而非独立重复存储
- 统一存储在 `dimensions` 表中

### 3. 简化数据库
- 移除触发器（TRIGGER）- 需在应用层实现
- 移除存储过程（PROCEDURE）- 需在应用层实现
- 移除事件调度器（EVENT）- 需在应用层实现
- 所有功能只需普通数据库用户权限即可运行

---

## 数据库结构概览

### 表分类

| 类别 | 表名 | 说明 |
|------|------|------|
| **核心数据** | transactions | 交易记录，唯一事实来源 |
| **基础定义** | accounts | 账户定义（不含余额） |
| | categories | 收支分类（一级、二级） |
| | dimensions | 维度数据（成员/商家/标签/支付渠道） |
| **辅助功能** | credit_cards | 信用卡定义（不含可用额度） |
| | credit_card_bills | 信用卡账单 |
| | loans | 贷款定义（不含剩余金额） |
| | loan_payments | 贷款还款记录 |
| | investment_accounts | 投资账户定义（不含总资产） |
| | investment_holdings | 投资明细（持仓） |
| | nav_history | 净值历史 |
| | investment_transfers | 投资内部转账 |
| | investment_profit_records | 投资损益记录 |
| **系统数据** | ledgers | 账套列表 |
| | users | 用户列表 |
| | user_settings | 用户设置 |
| | user_defaults | 用户默认配置 |
| | sync_logs | 同步日志 |

---

## 详细表结构

### 1. users（用户表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 用户ID（自增） |
| name | VARCHAR(100) | NOT NULL | 用户名 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |
| last_login_at | TIMESTAMP | | 最后登录时间 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |

### 2. ledgers（账套表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(50) | PRIMARY KEY | 账套ID |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| name | VARCHAR(100) | NOT NULL | 账套名称 |
| description | TEXT | | 账套描述 |
| icon | VARCHAR(50) | | 图标 |
| color | VARCHAR(20) | | 颜色 |
| is_default | BOOLEAN | DEFAULT FALSE | 是否默认账套 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |
| sort_order | INTEGER | DEFAULT 0 | 排序 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 3. accounts（账户表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 账户ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| name | VARCHAR(100) | NOT NULL | 账户名称 |
| account_type | VARCHAR(50) | DEFAULT 'general' | 账户类型 |
| currency | VARCHAR(10) | DEFAULT 'CNY' | 币种 |
| initial_balance | DECIMAL(15,2) | DEFAULT 0.00 | 初始余额 |
| description | TEXT | | 账户描述 |
| icon | VARCHAR(50) | | 图标 |
| color | VARCHAR(20) | | 颜色 |
| sort_order | INTEGER | DEFAULT 0 | 排序 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**账户类型 (account_type)**：
- `general` - 一般账户
- `cash` - 现金
- `bank` - 银行卡
- `alipay` - 支付宝
- `wechat` - 微信
- `credit_card` - 信用卡（关联）
- `investment` - 投资账户

**注意**：账户不存储 `balance`，余额由交易实时计算：
```
account.balance = SUM(收入交易) - SUM(支出交易) + initial_balance
```

### 4. categories（分类表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 分类ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| name | VARCHAR(100) | NOT NULL | 分类名称 |
| type | VARCHAR(20) | NOT NULL | 分类类型 |
| icon | VARCHAR(50) | | 图标 |
| color | VARCHAR(20) | | 颜色 |
| parent_id | INTEGER | FOREIGN KEY (self) | 父分类ID |
| sort_order | INTEGER | DEFAULT 0 | 排序 |
| is_default | BOOLEAN | DEFAULT FALSE | 是否默认分类 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**分类类型 (type)**：
- `expense` - 支出分类
- `income` - 收入分类

### 5. transactions（交易记录表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 交易ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| account_id | INTEGER | FOREIGN KEY | 账户ID |
| to_account_id | INTEGER | FOREIGN KEY | 目标账户ID（转账用） |
| category_id | INTEGER | FOREIGN KEY | 分类ID |
| type | VARCHAR(20) | NOT NULL | 交易类型 |
| amount | DECIMAL(15,2) | NOT NULL | 交易金额 |
| description | TEXT | | 交易描述 |
| notes | TEXT | | 备注 |
| transaction_date | DATE | NOT NULL | 交易日期 |
| transaction_time | TIME | | 交易时间 |
| member | VARCHAR(100) | | 成员（标签） |
| merchant | VARCHAR(100) | | 商家（标签） |
| tags | JSONB | | 标签数组 |
| payment_channel | VARCHAR(50) | | 支付渠道（标签） |
| project | VARCHAR(100) | | 项目（标签） |
| is_credit_card_expense | BOOLEAN | DEFAULT FALSE | 是否信用卡消费 |
| credit_card_id | VARCHAR(50) | | 信用卡ID |
| billing_month | VARCHAR(7) | | 账单月份(YYYY-MM) |
| is_repayment | BOOLEAN | DEFAULT FALSE | 是否还款 |
| loan_id | VARCHAR(50) | | 贷款ID |
| investment_account_id | VARCHAR(50) | | 投资账户ID |
| is_recurring | BOOLEAN | DEFAULT FALSE | 是否周期性交易 |
| recurring_pattern | VARCHAR(50) | | 周期模式 |
| recurring_end_date | DATE | | 周期结束日期 |
| attachments | JSONB | | 附件 |
| status | VARCHAR(20) | DEFAULT 'completed' | 状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |
| synced_at | TIMESTAMP | | 同步时间 |

**交易类型 (type)**：
- `expense` - 支出
- `income` - 收入
- `transfer` - 转账

**状态 (status)**：
- `pending` - 待处理
- `completed` - 已完成
- `cancelled` - 已取消

### 6. dimensions（维度配置表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 维度ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| type | VARCHAR(50) | NOT NULL | 维度类型 |
| name | VARCHAR(100) | NOT NULL | 维度名称 |
| icon | VARCHAR(50) | | 图标 |
| color | VARCHAR(20) | | 颜色 |
| extra_data | JSONB | | 扩展数据 |
| usage_count | INTEGER | DEFAULT 0 | 使用次数 |
| is_favorite | BOOLEAN | DEFAULT FALSE | 是否收藏 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |
| sort_order | INTEGER | DEFAULT 0 | 排序 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**维度类型 (type)**：
- `members` - 成员
- `merchants` - 商家
- `tags` - 标签
- `paymentChannels` - 支付渠道

### 7. credit_cards（信用卡表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 信用卡ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| name | VARCHAR(100) | NOT NULL | 信用卡名称 |
| bank | VARCHAR(100) | | 银行名称 |
| card_number | VARCHAR(50) | | 卡号 |
| credit_limit | DECIMAL(15,2) | NOT NULL | 信用额度 |
| available_credit | DECIMAL(15,2) | | 可用额度（计算得出） |
| billing_day | INTEGER | | 账单日 |
| repayment_day | INTEGER | | 还款日 |
| repayment_date | DATE | | 还款日期 |
| linked_account_id | INTEGER | FOREIGN KEY | 关联账户ID |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**注意**：可用额度由交易实时计算：
```
available_credit = credit_limit - SUM(信用卡消费) + SUM(还款)
```

### 8. credit_card_bills（信用卡账单表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 账单ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| credit_card_id | VARCHAR(50) | | 信用卡ID |
| billing_month | VARCHAR(7) | NOT NULL | 账单月份(YYYY-MM) |
| statement_date | DATE | | 账单日期 |
| due_date | DATE | | 到期还款日 |
| total_amount | DECIMAL(15,2) | | 账单总额 |
| min_payment | DECIMAL(15,2) | | 最低还款额 |
| is_paid | BOOLEAN | DEFAULT FALSE | 是否已还清 |
| is_overdue | BOOLEAN | DEFAULT FALSE | 是否逾期 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 9. loans（贷款表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 贷款ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| name | VARCHAR(100) | NOT NULL | 贷款名称 |
| type | VARCHAR(50) | | 贷款类型 |
| total_amount | DECIMAL(15,2) | NOT NULL | 贷款总额 |
| interest_rate | DECIMAL(5,2) | | 年利率 |
| loan_term | INTEGER | | 贷款期限（月） |
| monthly_payment | DECIMAL(15,2) | | 月供 |
| start_date | DATE | | 贷款开始日期 |
| end_date | DATE | | 贷款结束日期 |
| linked_account_id | INTEGER | FOREIGN KEY | 关联账户ID |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**注意**：剩余金额由还款记录实时计算：
```
remaining_amount = total_amount - SUM(还款金额)
```

### 10. loan_payments（贷款还款记录表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 还款ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| loan_id | VARCHAR(50) | NOT NULL | 贷款ID |
| payment_date | DATE | NOT NULL | 还款日期 |
| amount | DECIMAL(15,2) | NOT NULL | 还款金额 |
| principal | DECIMAL(15,2) | | 本金部分 |
| interest | DECIMAL(15,2) | | 利息部分 |
| notes | TEXT | | 备注 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 11. investment_accounts（投资账户表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 投资账户ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| name | VARCHAR(100) | NOT NULL | 账户名称 |
| type | VARCHAR(50) | | 账户类型 |
| description | TEXT | | 账户描述 |
| linked_account_id | INTEGER | FOREIGN KEY | 关联账户ID |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**注意**：总资产由持仓实时计算，不存储。

### 12. investment_holdings（投资持仓表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 持仓ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| account_id | VARCHAR(50) | NOT NULL | 投资账户ID |
| investment_type | VARCHAR(50) | | 投资类型 |
| code | VARCHAR(50) | | 代码 |
| name | VARCHAR(100) | NOT NULL | 名称 |
| shares | DECIMAL(15,4) | DEFAULT 0 | 持有份额 |
| cost | DECIMAL(15,4) | DEFAULT 0 | 成本 |
| nav | DECIMAL(15,4) | | 最新净值 |
| nav_date | DATE | | 净值日期 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 13. nav_history（净值历史表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 记录ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| code | VARCHAR(50) | NOT NULL | 投资代码 |
| name | VARCHAR(100) | | 名称 |
| nav | DECIMAL(15,4) | NOT NULL | 净值 |
| date | DATE | NOT NULL | 日期 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 14. investment_profit_records（投资损益记录表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 记录ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| ledger_id | VARCHAR(50) | DEFAULT 'default' | 账套ID |
| account_id | VARCHAR(50) | NOT NULL | 投资账户ID |
| holding_id | VARCHAR(50) | | 持仓ID |
| type | VARCHAR(20) | | 类型（浮盈/浮亏/已实现） |
| profit | DECIMAL(15,2) | | 收益金额 |
| profit_rate | DECIMAL(10,4) | | 收益率 |
| notes | TEXT | | 备注 |
| record_date | DATE | | 记录日期 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 15. sync_logs（同步日志表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 日志ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| sync_type | VARCHAR(20) | | 同步类型 |
| table_name | VARCHAR(50) | | 表名 |
| record_count | INTEGER | | 记录数 |
| status | VARCHAR(20) | | 状态 |
| error_message | TEXT | | 错误信息 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 16. user_settings（用户设置表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 设置ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| setting_key | VARCHAR(100) | NOT NULL | 设置键 |
| setting_value | TEXT | | 设置值 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 17. user_defaults（用户默认配置表）
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | SERIAL | PRIMARY KEY | 配置ID（自增） |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| default_account_id | INTEGER | | 默认账户ID |
| default_category_id | INTEGER | | 默认分类ID |
| default_member | VARCHAR(100) | | 默认成员 |
| default_merchant | VARCHAR(100) | | 默认商家 |
| default_payment_channel | VARCHAR(50) | | 默认支付渠道 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

---

## 索引设计

| 表名 | 索引名 | 索引字段 | 描述 |
| :--- | :--- | :--- | :--- |
| users | idx_users_email | email | 加速邮箱查询 |
| users | idx_users_created_at | created_at | 加速创建时间查询 |
| accounts | idx_accounts_user_id | user_id | 加速用户查询 |
| accounts | idx_accounts_ledger_id | ledger_id | 加速账套查询 |
| accounts | idx_accounts_type | account_type | 加速类型查询 |
| categories | idx_categories_user_id | user_id | 加速用户查询 |
| categories | idx_categories_type | type | 加速类型查询 |
| categories | idx_categories_parent_id | parent_id | 加速父分类查询 |
| transactions | idx_transactions_user_id | user_id | 加速用户查询 |
| transactions | idx_transactions_ledger_id | ledger_id | 加速账套查询 |
| transactions | idx_transactions_account_id | account_id | 加速账户查询 |
| transactions | idx_transactions_to_account_id | to_account_id | 加速目标账户查询 |
| transactions | idx_transactions_category_id | category_id | 加速分类查询 |
| transactions | idx_transactions_type | type | 加速类型查询 |
| transactions | idx_transactions_date | transaction_date | 加速日期查询 |
| transactions | idx_transactions_member | member | 加速成员查询 |
| transactions | idx_transactions_merchant | merchant | 加速商家查询 |
| transactions | idx_transactions_credit_card_id | credit_card_id | 加速信用卡查询 |
| transactions | idx_transactions_loan_id | loan_id | 加速贷款查询 |
| dimensions | idx_dimensions_user_id | user_id | 加速用户查询 |
| dimensions | idx_dimensions_ledger_id | ledger_id | 加速账套查询 |
| dimensions | idx_dimensions_type | type | 加速类型查询 |
| dimensions | idx_dimensions_usage | usage_count | 加速使用频率查询 |
| dimensions | idx_dimensions_extra_data | extra_data (GIN) | JSONB索引 |
| credit_cards | idx_credit_cards_user_id | user_id | 加速用户查询 |
| credit_cards | idx_credit_cards_ledger_id | ledger_id | 加速账套查询 |
| loan_payments | idx_loan_payments_loan_id | loan_id | 加速贷款查询 |
| investment_holdings | idx_holdings_account_id | account_id | 加速账户查询 |
| nav_history | idx_nav_history_code_date | code, date | 加速代码日期查询 |

---

## 数据同步架构

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

**同步规则**：
- 变更时自动同步到 PostgreSQL（防止数据丢失）
- 启动时从 PostgreSQL 加载（如有）
- 离线操作缓存，联网后自动同步

**同步表列表**：
- transactions, accounts, categories, dimensions
- credit_cards, credit_card_bills
- loans, loan_payments
- investment_accounts, investment_holdings, nav_history, investment_profit_records
- ledgers, users, user_settings, user_defaults, sync_logs

---

## 衍生数据计算规则

| 数据 | 计算公式 |
|------|----------|
| account.balance | `SUM(income) - SUM(expense) + initial_balance` |
| credit_card.used_credit | `SUM(expense) - SUM(repayment)` |
| credit_card.available_credit | `credit_limit - used_credit` |
| loan.remaining_amount | `total_amount - SUM(payments)` |
| investment_account.total_value | `SUM(shares * nav)` |

---

## 版本历史

### v3.9.0 (2026-04-18)
- 统一 dimensions 表存储所有维度数据
- 移除衍生数据存储（balance, used_credit 等）
- 移除数据库触发器和存储过程
- 支持 localStorage + PostgreSQL 双向同步

### v3.5.9 (2026-04-12)
- 移除触发器、存储过程、事件调度器
- 在应用层实现数据同步和计算

### v3.5.x
- 支持多账套
- 投资/贷款管理

### v3.0.x
- 基础记账功能
