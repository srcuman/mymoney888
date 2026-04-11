# MyMoney888 数据库设计文档

## 版本信息
- **版本**: 3.5.1
- **创建日期**: 2026-03-28
- **最后更新**: 2026-04-10
- **数据库类型**: MySQL/MariaDB 8.0+
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

## 目录
1. [数据库概述](#数据库概述)
2. [表结构设计](#表结构设计)
3. [索引设计](#索引设计)
4. [视图设计](#视图设计)
5. [触发器设计](#触发器设计)
6. [存储过程设计](#存储过程设计)
7. [数据同步机制](#数据同步机制)
8. [数据完整性约束](#数据完整性约束)
9. [性能优化建议](#性能优化建议)

---

## 数据库概述

### 设计原则
1. **数据持久化**: 确保所有用户数据安全存储在数据库中
2. **双向同步**: 支持本地数据与数据库的双向同步
3. **数据一致性**: 通过触发器和约束保证数据一致性
4. **扩展性**: 设计支持未来功能扩展
5. **性能优化**: 合理的索引和查询优化

### 数据库架构
```
mymoney888 (数据库)
├── users (用户表)
├── ledgers (账套表)
├── payment_channels (支付渠道表)
├── accounts (账户表)
├── categories (分类表)
├── transactions (交易记录表)
├── sync_logs (同步日志表)
├── user_settings (用户设置表)
├── defaults (默认值设置表)
├── credit_cards (信用卡表)
├── credit_card_bills (信用卡账单表)
├── loans (贷款表)
├── loan_payments (贷款还款记录表)
├── installment_templates (分期模板表)
├── installments (分期记录表)
├── merchants (商家表)
├── projects (项目表)
├── members (成员表)
├── investment_accounts (投资账户表)
├── investment_details (投资明细表)
├── transaction_merchants (交易商家关联表)
├── transaction_projects (交易项目关联表)
├── transaction_members (交易成员关联表)
├── v_account_balance (账户余额视图)
└── v_user_statistics (用户统计视图)
```

---

## 表结构设计

### 1. users (用户表)

存储用户基本信息和认证信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| name | VARCHAR(100) | NOT NULL | 用户姓名 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 用户邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希值 |
| role | ENUM | DEFAULT 'user' | 用户角色 (admin/user) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| last_login_at | TIMESTAMP | NULL | 最后登录时间 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 (1=激活, 0=禁用) |

**设计说明**:
- 增加role字段，支持管理员和普通用户角色
- 首个注册账户默认为管理员
- 已有管理员时，只能由管理员添加新管理员

### 2. ledgers (账套表)

存储用户的账套信息，支持多账套管理。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 账套ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 账套名称 |
| description | TEXT | NULL | 账套描述 |
| is_default | TINYINT(1) | DEFAULT 0 | 是否为默认账套 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个用户可以创建多个账套
- 支持设置默认账套
- 账套可被禁用而不删除历史数据

### 3. payment_channels (支付渠道表)

存储支付渠道信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 支付渠道ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 支付渠道名称 |
| code | VARCHAR(50) | NULL | 支付渠道代码 |
| icon | VARCHAR(50) | NULL | 支付渠道图标 |
| color | VARCHAR(20) | NULL | 支付渠道颜色 |
| is_default | TINYINT(1) | DEFAULT 0 | 是否为默认支付渠道 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 支持多种支付渠道（支付宝、微信支付、云闪付等）
- 可设置默认支付渠道
- 支持自定义图标和颜色

### 4. accounts (账户表)

存储用户的各类账户信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 账户ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| ledger_id | INT | FOREIGN KEY, NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 账户名称 |
| balance | DECIMAL(15,2) | DEFAULT 0.00 | 账户余额 |
| account_type | VARCHAR(50) | DEFAULT 'general' | 账户类型 |
| description | TEXT | NULL | 账户描述 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**账户类型枚举值**:
- `general`: 普通账户
- `cash`: 现金账户
- `bank`: 银行卡账户
- `alipay`: 支付宝账户
- `wechat`: 微信账户
- `credit_card`: 信用卡账户

**设计说明**:
- 每个账户关联到一个用户和一个账套
- 余额字段使用DECIMAL类型确保精度
- 支持多种账户类型
- 账户可被禁用而不删除历史数据

### 5. categories (分类表)

存储收支分类信息，支持多级分类。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 分类ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 分类名称 |
| type | ENUM | NOT NULL | 分类类型 (expense/income) |
| icon | VARCHAR(50) | NULL | 分类图标 |
| color | VARCHAR(20) | NULL | 分类颜色 |
| parent_id | INT | FOREIGN KEY, NULL | 父分类ID |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| is_default | TINYINT(1) | DEFAULT 0 | 是否为默认分类 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 支持支出和收入两种分类类型
- 支持多级分类结构（通过parent_id）
- 预设默认分类（user_id=0）
- 支持自定义图标和颜色
- 可按sort_order排序显示

### 6. transactions (交易记录表)

存储所有交易记录，是系统的核心表。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 交易ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| ledger_id | INT | FOREIGN KEY, NULL | 账套ID |
| account_id | INT | FOREIGN KEY, NOT NULL | 账户ID |
| from_account_id | INT | FOREIGN KEY, NULL | 转出账户ID（转账用） |
| to_account_id | INT | FOREIGN KEY, NULL | 转入账户ID（转账用） |
| category_id | INT | FOREIGN KEY, NULL | 分类ID |
| payment_channel_id | INT | FOREIGN KEY, NULL | 支付渠道ID |
| type | ENUM | NOT NULL | 交易类型 (expense/income/transfer) |
| transfer_type | ENUM | NULL | 转账类型 (internal/external) |
| amount | DECIMAL(15,2) | NOT NULL | 交易金额 |
| description | TEXT | NULL | 交易描述 |
| transaction_date | DATE | NOT NULL | 交易日期 |
| transaction_time | TIME | NULL | 交易时间 |
| tags | JSON | NULL | 交易标签 |
| attachments | JSON | NULL | 附件信息 |
| is_recurring | TINYINT(1) | DEFAULT 0 | 是否为周期性交易 |
| recurring_pattern | VARCHAR(50) | NULL | 周期模式 |
| recurring_end_date | DATE | NULL | 周期结束日期 |
| status | ENUM | DEFAULT 'completed' | 交易状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| synced_at | TIMESTAMP | NULL | 同步时间 |

**交易类型枚举值**:
- `expense`: 支出
- `income`: 收入
- `transfer`: 转账

**转账类型枚举值**:
- `internal`: 内部转账（同一用户账户间）
- `external`: 外部转账（不同用户账户间）

**交易状态枚举值**:
- `pending`: 待处理
- `completed`: 已完成
- `cancelled`: 已取消

**周期模式枚举值**:
- `daily`: 每日
- `weekly`: 每周
- `monthly`: 每月
- `yearly`: 每年

**设计说明**:
- 每笔交易关联到用户、账户和分类
- 支持日期和时间的精确记录
- 使用JSON字段存储标签和附件
- 支持周期性交易
- 记录同步时间用于数据同步
- 支持转账功能，通过from_account_id和to_account_id实现

### 7. sync_logs (同步日志表)

记录所有数据同步操作的日志。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 日志ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| sync_type | ENUM | NOT NULL | 同步类型 |
| table_name | VARCHAR(50) | NOT NULL | 同步的表名 |
| record_count | INT | DEFAULT 0 | 同步记录数 |
| status | ENUM | DEFAULT 'success' | 同步状态 |
| error_message | TEXT | NULL | 错误信息 |
| sync_details | JSON | NULL | 同步详情 |
| started_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 开始时间 |
| completed_at | TIMESTAMP | NULL | 完成时间 |

**同步类型枚举值**:
- `local_to_db`: 本地到数据库
- `db_to_local`: 数据库到本地
- `bidirectional`: 双向同步

**同步状态枚举值**:
- `success`: 成功
- `failed`: 失败
- `partial`: 部分成功

**设计说明**:
- 记录每次同步操作的详细信息
- 支持多种同步类型
- 记录同步状态和错误信息
- 使用JSON字段存储详细同步数据

### 8. user_settings (用户设置表)

存储用户的个性化设置。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 设置ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| setting_key | VARCHAR(100) | NOT NULL | 设置键 |
| setting_value | TEXT | NULL | 设置值 |
| setting_type | VARCHAR(20) | DEFAULT 'string' | 设置类型 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设置类型枚举值**:
- `string`: 字符串
- `number`: 数字
- `boolean`: 布尔值
- `json`: JSON对象

**设计说明**:
- 支持键值对存储用户设置
- 每个用户可以有多个设置项
- 同一用户的同一设置键唯一
- 支持多种数据类型

### 9. defaults (默认值设置表)

存储用户的默认值设置，用于快速填充交易表单。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 默认值ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| ledger_id | INT | FOREIGN KEY, NULL | 账套ID |
| expense_category_id | INT | FOREIGN KEY, NULL | 默认支出分类ID |
| income_category_id | INT | FOREIGN KEY, NULL | 默认收入分类ID |
| member_id | INT | FOREIGN KEY, NULL | 默认成员ID |
| merchant_id | INT | FOREIGN KEY, NULL | 默认商家ID |
| project_id | INT | FOREIGN KEY, NULL | 默认项目ID |
| payment_channel_id | INT | FOREIGN KEY, NULL | 默认支付渠道ID |
| account_id | INT | FOREIGN KEY, NULL | 默认账户ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个用户可以设置默认值
- 支持按账套设置不同的默认值
- 默认值会在创建新交易时自动填充
- 包含常用维度的默认值设置

### 10. credit_cards (信用卡表)

存储信用卡账户信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 信用卡ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| account_id | INT | FOREIGN KEY, NOT NULL | 关联账户ID |
| card_number | VARCHAR(50) | NOT NULL | 卡号（脱敏） |
| card_name | VARCHAR(100) | NULL | 卡片名称 |
| credit_limit | DECIMAL(15,2) | NOT NULL | 信用额度 |
| available_credit | DECIMAL(15,2) | NULL | 可用额度 |
| bill_day | INT | NOT NULL | 账单日（1-31） |
| due_day | INT | NOT NULL | 还款日（1-31） |
| bank_name | VARCHAR(100) | NULL | 发卡银行 |
| card_type | VARCHAR(50) | DEFAULT 'general' | 卡片类型 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每张信用卡关联到一个账户
- 支持账单日和还款日设置
- 记录信用额度和可用额度
- 卡号存储脱敏后的信息
- 支持多种卡片类型

### 11. credit_card_bills (信用卡账单表)

存储信用卡账单信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 账单ID |
| credit_card_id | INT | FOREIGN KEY, NOT NULL | 信用卡ID |
| bill_date | DATE | NOT NULL | 账单日期 |
| due_date | DATE | NOT NULL | 还款到期日 |
| bill_amount | DECIMAL(15,2) | NOT NULL | 账单金额 |
| paid_amount | DECIMAL(15,2) | DEFAULT 0.00 | 已还金额 |
| remaining_amount | DECIMAL(15,2) | NULL | 剩余金额 |
| transaction_count | INT | DEFAULT 0 | 交易笔数 |
| status | ENUM | DEFAULT 'unpaid' | 账单状态 |
| paid_at | TIMESTAMP | NULL | 还款时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**账单状态枚举值**:
- `unpaid`: 未还款
- `partial_paid`: 部分还款
- `paid`: 已还清
- `overdue`: 逾期

**设计说明**:
- 每个账单关联到一张信用卡
- 记录账单金额和还款状态
- 支持部分还款和逾期状态
- 记录交易笔数用于统计分析

### 12. loans (贷款表)

存储贷款信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 贷款ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| account_id | INT | FOREIGN KEY, NULL | 还款账户ID |
| name | VARCHAR(100) | NOT NULL | 贷款名称 |
| type | ENUM | NOT NULL | 贷款类型 |
| total_amount | DECIMAL(15,2) | NOT NULL | 贷款总额 |
| remaining_amount | DECIMAL(15,2) | NOT NULL | 剩余本金 |
| interest_rate | DECIMAL(5,2) | NOT NULL | 年利率（%） |
| period_months | INT | NOT NULL | 贷款期限（月） |
| paid_periods | INT | DEFAULT 0 | 已还期数 |
| monthly_payment | DECIMAL(15,2) | NULL | 月供金额 |
| start_date | DATE | NOT NULL | 开始日期 |
| end_date | DATE | NULL | 结束日期 |
| next_payment_date | DATE | NULL | 下次还款日期 |
| status | ENUM | DEFAULT 'active' | 贷款状态 |
| description | TEXT | NULL | 贷款描述 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**贷款类型枚举值**:
- `mortgage`: 房贷
- `car_loan`: 车贷
- `personal_loan`: 个人贷款
- `business_loan`: 商业贷款
- `student_loan`: 助学贷款
- `other`: 其他

**贷款状态枚举值**:
- `active`: 进行中
- `paid_off`: 已还清
- `early_paid`: 提前还款
- `defaulted`: 违约

**设计说明**:
- 支持多种贷款类型
- 记录贷款金额、利率、期限等关键信息
- 追踪还款进度和剩余本金
- 支持等额本息等还款方式

### 13. loan_payments (贷款还款记录表)

存储贷款还款记录。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 还款记录ID |
| loan_id | INT | FOREIGN KEY, NOT NULL | 贷款ID |
| account_id | INT | FOREIGN KEY, NULL | 还款账户ID |
| period_number | INT | NOT NULL | 期数 |
| payment_date | DATE | NOT NULL | 还款日期 |
| amount | DECIMAL(15,2) | NOT NULL | 还款总额 |
| principal | DECIMAL(15,2) | NULL | 本金 |
| interest | DECIMAL(15,2) | NULL | 利息 |
| remaining_principal | DECIMAL(15,2) | NULL | 剩余本金 |
| status | ENUM | DEFAULT 'scheduled' | 还款状态 |
| notes | TEXT | NULL | 备注 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**还款状态枚举值**:
- `scheduled`: 计划中
- `paid`: 已还款
- `missed`: 已逾期
- `partial`: 部分还款

**设计说明**:
- 每笔还款关联到一笔贷款
- 记录本金和利息明细
- 追踪剩余本金
- 支持多种还款状态

### 14. installment_templates (分期模板表)

存储分期模板，用于快速创建分期记录。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 模板ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 模板名称 |
| total_amount | DECIMAL(15,2) | NOT NULL | 分期总额 |
| period_count | INT | NOT NULL | 分期期数 |
| period_amount | DECIMAL(15,2) | NOT NULL | 每期金额 |
| category_id | INT | FOREIGN KEY, NULL | 分类ID |
| account_id | INT | FOREIGN KEY, NULL | 账户ID |
| description | TEXT | NULL | 描述 |
| is_default | TINYINT(1) | DEFAULT 0 | 是否为默认模板 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 支持创建分期模板
- 可设置默认模板快速使用
- 关联到分类和账户
- 记录分期总额、期数、每期金额

### 15. installments (分期记录表)

存储分期记录详情。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 分期ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| template_id | INT | FOREIGN KEY, NULL | 模板ID |
| transaction_id | INT | FOREIGN KEY, NULL | 关联交易ID |
| installment_group_id | VARCHAR(50) | NOT NULL | 分期组ID |
| installment_number | INT | NOT NULL | 分期序号 |
| total_amount | DECIMAL(15,2) | NOT NULL | 分期总额 |
| period_amount | DECIMAL(15,2) | NOT NULL | 每期金额 |
| paid_amount | DECIMAL(15,2) | DEFAULT 0.00 | 已还金额 |
| remaining_amount | DECIMAL(15,2) | NULL | 剩余金额 |
| due_date | DATE | NOT NULL | 还款日期 |
| status | ENUM | DEFAULT 'pending' | 分期状态 |
| paid_at | TIMESTAMP | NULL | 还款时间 |
| description | TEXT | NULL | 描述 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**分期状态枚举值**:
- `pending`: 待还款
- `paid`: 已还款
- `overdue`: 已逾期
- `cancelled`: 已取消

**设计说明**:
- 通过installment_group_id关联同一分期的多期记录
- 关联到交易记录，实现与交易系统的联动
- 记录每期的还款状态
- 支持部分还款和逾期状态

### 16. merchants (商家表)

存储商家信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 商家ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 商家名称 |
| category | VARCHAR(50) | NULL | 商家分类 |
| address | TEXT | NULL | 商家地址 |
| phone | VARCHAR(20) | NULL | 联系电话 |
| website | VARCHAR(255) | NULL | 网站地址 |
| logo | VARCHAR(255) | NULL | 商家logo |
| is_favorite | TINYINT(1) | DEFAULT 0 | 是否收藏 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个商家关联到一个用户
- 支持商家分类管理
- 支持商家联系方式存储
- 支持商家收藏功能

### 17. projects (项目表)

存储项目信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 项目ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 项目名称 |
| description | TEXT | NULL | 项目描述 |
| start_date | DATE | NULL | 开始日期 |
| end_date | DATE | NULL | 结束日期 |
| budget | DECIMAL(15,2) | NULL | 项目预算 |
| actual_amount | DECIMAL(15,2) | DEFAULT 0.00 | 实际金额 |
| status | ENUM | DEFAULT 'active' | 项目状态 |
| color | VARCHAR(20) | NULL | 项目颜色 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**项目状态枚举值**:
- `active`: 进行中
- `completed`: 已完成
- `cancelled`: 已取消
- `planned`: 计划中

**设计说明**:
- 每个项目关联到一个用户
- 支持项目预算和实际金额跟踪
- 支持项目状态管理
- 支持项目颜色标识

### 18. members (成员表)

存储成员信息（用于多成员管理）。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 成员ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 所属用户ID |
| name | VARCHAR(100) | NOT NULL | 成员姓名 |
| relationship | VARCHAR(50) | NULL | 关系 |
| avatar | VARCHAR(255) | NULL | 头像 |
| email | VARCHAR(100) | NULL | 邮箱 |
| phone | VARCHAR(20) | NULL | 电话 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个成员关联到一个用户（主账户）
- 支持成员关系管理
- 支持成员联系方式存储
- 支持成员头像

### 19. investment_accounts (投资账户表)

存储投资账户信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 投资账户ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 账户名称 |
| balance | DECIMAL(15,2) | DEFAULT 0.00 | 账户余额 |
| asset_value | DECIMAL(15,2) | DEFAULT 0.00 | 资产价值 |
| profit_loss | DECIMAL(15,2) | DEFAULT 0.00 | 盈亏 |
| description | TEXT | NULL | 账户描述 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个投资账户关联到一个用户
- 记录账户余额、资产价值和盈亏
- 支持投资账户的激活和禁用

### 20. investment_details (投资明细表)

存储投资明细信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 投资明细ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| account_id | INT | FOREIGN KEY, NOT NULL | 投资账户ID |
| type | VARCHAR(50) | NOT NULL | 投资类型（基金、股票等） |
| code | VARCHAR(50) | NOT NULL | 投资代码 |
| name | VARCHAR(100) | NOT NULL | 投资名称 |
| shares | DECIMAL(10,4) | NOT NULL | 持有份额 |
| cost_price | DECIMAL(10,4) | NOT NULL | 成本价 |
| current_price | DECIMAL(10,4) | NOT NULL | 当前价 |
| total_cost | DECIMAL(15,2) | NOT NULL | 总成本 |
| current_value | DECIMAL(15,2) | NOT NULL | 当前价值 |
| profit_loss | DECIMAL(15,2) | NOT NULL | 盈亏 |
| last_updated | TIMESTAMP | NULL | 最后更新时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个投资明细关联到一个用户和一个投资账户
- 记录投资的类型、代码、名称、份额、成本价和当前价
- 计算并记录总成本、当前价值和盈亏
- 记录最后更新时间用于追踪净值更新

### 21. transaction_merchants (交易商家关联表)

关联交易和商家。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关联ID |
| transaction_id | INT | FOREIGN KEY, NOT NULL | 交易ID |
| merchant_id | INT | FOREIGN KEY, NOT NULL | 商家ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 22. transaction_projects (交易项目关联表)

关联交易和项目。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关联ID |
| transaction_id | INT | FOREIGN KEY, NOT NULL | 交易ID |
| project_id | INT | FOREIGN KEY, NOT NULL | 项目ID |
| amount | DECIMAL(15,2) | NOT NULL | 项目分配金额 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 23. transaction_members (交易成员关联表)

关联交易和成员。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关联ID |
| transaction_id | INT | FOREIGN KEY, NOT NULL | 交易ID |
| member_id | INT | FOREIGN KEY, NOT NULL | 成员ID |
| amount | DECIMAL(15,2) | NOT NULL | 成员分配金额 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

---

## 索引设计

### users表索引
```sql
INDEX idx_email (email)              -- 邮箱索引，用于登录查询
INDEX idx_created_at (created_at)    -- 创建时间索引，用于用户统计
```

### accounts表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户账户
INDEX idx_account_type (account_type) -- 账户类型索引，用于按类型筛选
```

### categories表索引
```sql
INDEX idx_user_id (user_id)         -- 用户ID索引，用于查询用户分类
INDEX idx_type (type)                -- 类型索引，用于按类型筛选
INDEX idx_parent_id (parent_id)      -- 父分类ID索引，用于查询子分类
```

### transactions表索引
```sql
INDEX idx_user_id (user_id)         -- 用户ID索引，用于查询用户交易
INDEX idx_account_id (account_id)    -- 账户ID索引，用于查询账户交易
INDEX idx_category_id (category_id)  -- 分类ID索引，用于按分类统计
INDEX idx_type (type)                -- 类型索引，用于按类型筛选
INDEX idx_transaction_date (transaction_date) -- 交易日期索引，用于日期范围查询
INDEX idx_created_at (created_at)    -- 创建时间索引，用于同步查询
```

### sync_logs表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户同步日志
INDEX idx_sync_type (sync_type)      -- 同步类型索引，用于按类型筛选
INDEX idx_status (status)            -- 状态索引，用于按状态筛选
INDEX idx_started_at (started_at)    -- 开始时间索引，用于时间范围查询
```

### user_settings表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户设置
INDEX idx_setting_key (setting_key)  -- 设置键索引，用于按键名查询
UNIQUE KEY unique_user_setting (user_id, setting_key) -- 用户设置唯一约束
```

### credit_cards表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户信用卡
INDEX idx_account_id (account_id)     -- 账户ID索引，用于关联查询
INDEX idx_bill_day (bill_day)        -- 账单日索引，用于账单日查询
INDEX idx_due_day (due_day)          -- 还款日索引，用于还款提醒
```

### credit_card_bills表索引
```sql
INDEX idx_credit_card_id (credit_card_id) -- 信用卡ID索引，用于查询信用卡账单
INDEX idx_bill_date (bill_date)         -- 账单日期索引，用于日期范围查询
INDEX idx_due_date (due_date)           -- 还款到期日索引，用于还款提醒
INDEX idx_status (status)               -- 账单状态索引，用于按状态筛选
```

### loans表索引
```sql
INDEX idx_user_id (user_id)              -- 用户ID索引，用于查询用户贷款
INDEX idx_account_id (account_id)         -- 账户ID索引，用于关联查询
INDEX idx_type (type)                    -- 贷款类型索引，用于按类型筛选
INDEX idx_status (status)                  -- 贷款状态索引，用于按状态筛选
INDEX idx_next_payment_date (next_payment_date) -- 下次还款日期索引，用于还款提醒
```

### loan_payments表索引
```sql
INDEX idx_loan_id (loan_id)              -- 贷款ID索引，用于查询贷款还款记录
INDEX idx_account_id (account_id)         -- 账户ID索引，用于关联查询
INDEX idx_payment_date (payment_date)     -- 还款日期索引，用于日期范围查询
INDEX idx_period_number (period_number)     -- 期数索引，用于按期数查询
INDEX idx_status (status)                  -- 还款状态索引，用于按状态筛选
```

### installment_templates表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户分期模板
INDEX idx_category_id (category_id)    -- 分类ID索引，用于关联查询
INDEX idx_account_id (account_id)      -- 账户ID索引，用于关联查询
```

### installments表索引
```sql
INDEX idx_user_id (user_id)                   -- 用户ID索引，用于查询用户分期记录
INDEX idx_template_id (template_id)             -- 模板ID索引，用于关联查询
INDEX idx_transaction_id (transaction_id)         -- 交易ID索引，用于关联查询
INDEX idx_installment_group_id (installment_group_id) -- 分期组ID索引，用于查询同一分期的记录
INDEX idx_due_date (due_date)                   -- 还款日期索引，用于还款提醒
INDEX idx_status (status)                         -- 分期状态索引，用于按状态筛选
```

### merchants表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引
INDEX idx_category (category)        -- 商家分类索引
INDEX idx_is_favorite (is_favorite)  -- 收藏状态索引
```

### projects表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引
INDEX idx_status (status)            -- 项目状态索引
INDEX idx_start_date (start_date)    -- 开始日期索引
INDEX idx_end_date (end_date)        -- 结束日期索引
```

### members表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引
INDEX idx_relationship (relationship) -- 关系索引
```

### investment_accounts表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户投资账户
INDEX idx_is_active (is_active)      -- 激活状态索引，用于筛选激活账户
```

### investment_details表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户投资明细
INDEX idx_account_id (account_id)     -- 投资账户ID索引，用于关联查询
INDEX idx_code (code)                -- 投资代码索引，用于快速查找
INDEX idx_type (type)                -- 投资类型索引，用于按类型筛选
```

### transaction_merchants表索引
```sql
INDEX idx_transaction_id (transaction_id) -- 交易ID索引
INDEX idx_merchant_id (merchant_id)     -- 商家ID索引
```

### transaction_projects表索引
```sql
INDEX idx_transaction_id (transaction_id) -- 交易ID索引
INDEX idx_project_id (project_id)       -- 项目ID索引
```

### transaction_members表索引
```sql
INDEX idx_transaction_id (transaction_id) -- 交易ID索引
INDEX idx_member_id (member_id)         -- 成员ID索引
```

---

## 视图设计

### 1. v_account_balance (账户余额视图)

提供账户的实时余额信息，包括总收入、总支出和当前余额。

```sql
CREATE OR REPLACE VIEW v_account_balance AS
SELECT 
    a.id,
    a.user_id,
    a.name,
    a.account_type,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
    a.balance + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as current_balance,
    a.is_active,
    a.created_at,
    a.updated_at
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY a.id, a.user_id, a.name, a.account_type, a.balance, a.is_active, a.created_at, a.updated_at;
```

**用途**:
- 实时查询账户余额
- 统计账户收支情况
- 生成财务报表

### 2. v_user_statistics (用户统计视图)

提供用户的整体统计信息。

```sql
CREATE OR REPLACE VIEW v_user_statistics AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(DISTINCT a.id) as account_count,
    COUNT(DISTINCT t.id) as transaction_count,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as balance,
    MIN(t.transaction_date) as first_transaction_date,
    MAX(t.transaction_date) as last_transaction_date
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY u.id, u.name;
```

**用途**:
- 用户整体财务状况统计
- 用户活跃度分析
- 生成用户报告

### 3. v_investment_account_summary (投资账户汇总视图)

提供投资账户的汇总信息，包括总资产价值、总盈亏等。

```sql
CREATE OR REPLACE VIEW v_investment_account_summary AS
SELECT 
    ia.id,
    ia.user_id,
    ia.name,
    ia.balance,
    ia.asset_value,
    ia.profit_loss,
    COUNT(id) as investment_count,
    ia.is_active,
    ia.created_at,
    ia.updated_at
FROM investment_accounts ia
LEFT JOIN investment_details id ON ia.id = id.account_id
GROUP BY ia.id, ia.user_id, ia.name, ia.balance, ia.asset_value, ia.profit_loss, ia.is_active, ia.created_at, ia.updated_at;
```

**用途**:
- 实时查询投资账户汇总信息
- 统计投资账户的资产价值和盈亏
- 生成投资报表

---

## 触发器设计

### 1. trg_update_account_balance_after_transaction

在插入交易记录后自动更新账户余额。

```sql
CREATE TRIGGER trg_update_account_balance_after_transaction
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    IF NEW.type = 'income' THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSE
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
END
```

**功能**: 
- 收入交易增加账户余额
- 支出交易减少账户余额

### 2. trg_update_account_balance_after_transaction_update

在更新交易记录后自动调整账户余额。

```sql
CREATE TRIGGER trg_update_account_balance_after_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    -- 恢复原始交易对余额的影响
    IF OLD.type = 'income' THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSE
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
    
    -- 应用新交易对余额的影响
    IF NEW.type = 'income' THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSE
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
END
```

**功能**:
- 先撤销原交易对余额的影响
- 再应用新交易对余额的影响

### 3. trg_update_account_balance_after_transaction_delete

在删除交易记录后自动恢复账户余额。

```sql
CREATE TRIGGER trg_update_account_balance_after_transaction_delete
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    IF OLD.type = 'income' THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSE
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
END
```

**功能**:
- 删除收入交易减少账户余额
- 删除支出交易增加账户余额

### 4. trg_update_investment_account_asset_value

在更新投资明细后自动更新投资账户的资产价值和盈亏。

```sql
CREATE TRIGGER trg_update_investment_account_asset_value
AFTER INSERT, UPDATE, DELETE ON investment_details
FOR EACH ROW
BEGIN
    -- 计算并更新投资账户的资产价值和盈亏
    UPDATE investment_accounts ia
    SET 
        asset_value = (SELECT COALESCE(SUM(current_value), 0) FROM investment_details WHERE account_id = ia.id),
        profit_loss = (SELECT COALESCE(SUM(profit_loss), 0) FROM investment_details WHERE account_id = ia.id)
    WHERE ia.id = NEW.account_id OR ia.id = OLD.account_id;
END
```

**功能**:
- 自动计算投资账户的资产价值和盈亏
- 确保投资账户信息与投资明细保持一致

---

## 存储过程设计

### 1. sp_sync_local_to_db

将本地数据同步到数据库。

```sql
CREATE PROCEDURE sp_sync_local_to_db(
    IN p_user_id INT,
    IN p_table_name VARCHAR(50),
    IN p_data JSON,
    OUT p_result INT
)
```

**参数**:
- `p_user_id`: 用户ID
- `p_table_name`: 表名
- `p_data`: JSON格式的数据
- `p_result`: 返回同步的记录数

**功能**:
- 解析JSON数据
- 根据表名执行相应的插入/更新操作
- 记录同步日志
- 返回同步的记录数

### 2. sp_sync_db_to_local

从数据库同步数据到本地。

```sql
CREATE PROCEDURE sp_sync_db_to_local(
    IN p_user_id INT,
    IN p_table_name VARCHAR(50),
    IN p_last_sync_time TIMESTAMP,
    OUT p_result JSON
)
```

**参数**:
- `p_user_id`: 用户ID
- `p_table_name`: 表名
- `p_last_sync_time`: 上次同步时间
- `p_result`: 返回JSON格式的数据

**功能**:
- 查询指定表的数据
- 支持增量同步（基于last_sync_time）
- 返回JSON格式的数据
- 记录同步日志

### 3. sp_bidirectional_sync

执行双向同步。

```sql
CREATE PROCEDURE sp_bidirectional_sync(
    IN p_user_id INT,
    IN p_local_accounts JSON,
    IN p_local_transactions JSON,
    IN p_local_categories JSON,
    IN p_local_credit_cards JSON,
    IN p_local_credit_card_bills JSON,
    IN p_local_loans JSON,
    IN p_local_loan_payments JSON,
    IN p_local_installment_templates JSON,
    IN p_local_installments JSON,
    IN p_local_investment_accounts JSON,
    IN p_local_investment_details JSON,
    OUT p_result JSON
)
```

**参数**:
- `p_user_id`: 用户ID
- `p_local_accounts`: 本地账户数据
- `p_local_transactions`: 本地交易数据
- `p_local_categories`: 本地分类数据
- `p_local_credit_cards`: 本地信用卡数据
- `p_local_credit_card_bills`: 本地信用卡账单数据
- `p_local_loans`: 本地贷款数据
- `p_local_loan_payments`: 本地贷款还款记录数据
- `p_local_installment_templates`: 本地分期模板数据
- `p_local_installments`: 本地分期记录数据
- `p_local_investment_accounts`: 本地投资账户数据
- `p_local_investment_details`: 本地投资明细数据
- `p_result`: 返回同步结果

**功能**:
- 先将本地数据同步到数据库
- 再将数据库数据同步到本地
- 返回详细的同步结果
- 记录同步日志
- 支持所有业务表的双向同步

---

## 数据同步机制

### 同步架构

```
┌─────────────────┐         ┌─────────────────┐
│   LocalStorage  │◄────────┤  Sync Service  │
│   (浏览器端)    │         │  (同步服务)     │
└─────────────────┘         └────────┬────────┘
                                    │
                                    ▼
                            ┌─────────────────┐
                            │   API Service   │
                            │  (API服务)      │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   MySQL DB      │
                            │  (数据库)       │
                            └─────────────────┘
```

### 同步流程

#### 1. 自动同步
- **触发条件**: 网络状态从离线变为在线
- **同步方式**: 增量同步
- **同步内容**: 所有表的数据
- **冲突解决**: 自动选择最新修改时间的数据

#### 2. 手动同步
- **触发方式**: 用户点击同步按钮
- **同步方式**: 全量同步或增量同步
- **同步内容**: 可选择特定表
- **冲突解决**: 提示用户选择解决方案

#### 3. 数据变更同步
- **触发条件**: 用户修改数据
- **同步方式**: 实时同步
- **同步内容**: 变更的数据
- **冲突解决**: 本地数据优先

### 冲突解决策略

#### 1. 时间戳比较
```javascript
if (local.updated_at > server.updated_at) {
    // 使用本地数据
} else if (server.updated_at > local.updated_at) {
    // 使用服务器数据
} else {
    // 同时修改，需要用户选择
}
```

#### 2. 冲突类型
- **local_newer**: 本地数据更新
- **server_newer**: 服务器数据更新
- **simultaneous**: 同时修改

#### 3. 解决方案
- **使用本地数据**: 覆盖服务器数据
- **使用服务器数据**: 覆盖本地数据
- **合并数据**: 智能合并冲突字段

### 同步状态管理

#### 状态定义
- `idle`: 空闲状态
- `syncing`: 同步中
- `success`: 同步成功
- `error`: 同步失败

#### 状态监控
```javascript
const syncStatus = {
    isOnline: true,           // 是否在线
    isSyncing: false,         // 是否正在同步
    lastSyncTime: '2026-03-28T10:00:00Z',  // 最后同步时间
    syncStatus: 'success',    // 同步状态
    hasErrors: false,         // 是否有错误
    errors: []                // 错误列表
}
```

### 离线支持

#### 离线操作
- 所有数据保存在LocalStorage
- 正常记录交易、账户等信息
- 标记未同步的数据

#### 在线同步
- 自动检测网络状态
- 连接后自动触发同步
- 同步未同步的数据
- 解决可能的冲突

---

## 数据完整性约束

### 外键约束
```sql
-- accounts表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (ledger_id) REFERENCES ledgers(id) ON DELETE SET NULL

-- categories表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL

-- transactions表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (ledger_id) REFERENCES ledgers(id) ON DELETE SET NULL
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE SET NULL
FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
FOREIGN KEY (payment_channel_id) REFERENCES payment_channels(id) ON DELETE SET NULL

-- sync_logs表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- user_settings表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- defaults表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (ledger_id) REFERENCES ledgers(id) ON DELETE SET NULL
FOREIGN KEY (expense_category_id) REFERENCES categories(id) ON DELETE SET NULL
FOREIGN KEY (income_category_id) REFERENCES categories(id) ON DELETE SET NULL
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
FOREIGN KEY (payment_channel_id) REFERENCES payment_channels(id) ON DELETE SET NULL
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL

-- payment_channels表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- ledgers表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- credit_cards表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE

-- credit_card_bills表
FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE CASCADE

-- loans表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL

-- loan_payments表
FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE

-- installment_templates表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL

-- installments表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (template_id) REFERENCES installment_templates(id) ON DELETE SET NULL
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL

-- merchants表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- projects表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- members表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- investment_accounts表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- investment_details表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (account_id) REFERENCES investment_accounts(id) ON DELETE CASCADE

-- transaction_merchants表
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE

-- transaction_projects表
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE

-- transaction_members表
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
```

### 唯一性约束
```sql
-- users表
UNIQUE KEY unique_email (email)

-- payment_channels表
UNIQUE KEY unique_user_channel (user_id, name)

-- accounts表
UNIQUE KEY unique_user_account (user_id, name)

-- categories表
UNIQUE KEY unique_user_category (user_id, name, type, parent_id)

-- credit_cards表
UNIQUE KEY unique_user_card (user_id, card_number)

-- investment_accounts表
UNIQUE KEY unique_user_investment_account (user_id, name)

-- investment_details表
UNIQUE KEY unique_account_investment (account_id, code)
```

---

## 性能优化建议

1. **索引优化**
   - 为经常查询的字段创建索引
   - 避免在索引字段上使用函数
   - 定期重建索引以保持性能

2. **查询优化**
   - 使用预处理语句
   - 避免使用SELECT *
   - 合理使用JOIN语句
   - 限制结果集大小

3. **存储优化**
   - 定期清理无用数据
   - 合理设置表的存储引擎
   - 分区表以提高查询性能

4. **缓存优化**
   - 使用Redis等缓存技术
   - 缓存热点数据
   - 合理设置缓存过期时间

5. **硬件优化**
   - 增加服务器内存
   - 使用SSD存储
   - 合理配置数据库服务器

6. **应用层优化**
   - 减少数据库连接次数
   - 使用连接池
   - 异步处理耗时操作

7. **监控与调优**
   - 监控数据库性能
   - 分析慢查询日志
   - 定期进行性能调优

---

## 总结

本数据库设计文档详细描述了MyMoney888系统的数据库结构，包括表结构、索引设计、视图设计、触发器设计、存储过程设计、数据同步机制、数据完整性约束和性能优化建议。

# MyMoney888 数据库设计文档

## 版本信息
- **版本**: 3.5.1
- **创建日期**: 2026-03-28
- **最后更新**: 2026-04-10
- **数据库类型**: MySQL/MariaDB 8.0+
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

## 目录
1. [数据库概述](#数据库概述)
2. [表结构设计](#表结构设计)
3. [索引设计](#索引设计)
4. [视图设计](#视图设计)
5. [触发器设计](#触发器设计)
6. [存储过程设计](#存储过程设计)
7. [数据同步机制](#数据同步机制)
8. [数据完整性约束](#数据完整性约束)
9. [性能优化建议](#性能优化建议)

---

## 数据库概述

### 设计原则
1. **数据持久化**: 确保所有用户数据安全存储在数据库中
2. **双向同步**: 支持本地数据与数据库的双向同步
3. **数据一致性**: 通过触发器和约束保证数据一致性
4. **扩展性**: 设计支持未来功能扩展
5. **性能优化**: 合理的索引和查询优化

### 数据库架构
```
mymoney888 (数据库)
├── users (用户表)
├── ledgers (账套表)
├── payment_channels (支付渠道表)
├── accounts (账户表)
├── categories (分类表)
├── transactions (交易记录表)
├── sync_logs (同步日志表)
├── user_settings (用户设置表)
├── defaults (默认值设置表)
├── credit_cards (信用卡表)
├── credit_card_bills (信用卡账单表)
├── loans (贷款表)
├── loan_payments (贷款还款记录表)
├── installment_templates (分期模板表)
├── installments (分期记录表)
├── merchants (商家表)
├── projects (项目表)
├── members (成员表)
├── investment_accounts (投资账户表)
├── investment_details (投资明细表)
├── transaction_merchants (交易商家关联表)
├── transaction_projects (交易项目关联表)
├── transaction_members (交易成员关联表)
├── v_account_balance (账户余额视图)
└── v_user_statistics (用户统计视图)
```

---

## 表结构设计

### 1. users (用户表)

存储用户基本信息和认证信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| name | VARCHAR(100) | NOT NULL | 用户姓名 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 用户邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希值 |
| role | ENUM | DEFAULT 'user' | 用户角色 (admin/user) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| last_login_at | TIMESTAMP | NULL | 最后登录时间 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 (1=激活, 0=禁用) |

**设计说明**:
- 增加role字段，支持管理员和普通用户角色
- 首个注册账户默认为管理员
- 已有管理员时，只能由管理员添加新管理员

### 2. ledgers (账套表)

存储用户的账套信息，支持多账套管理。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 账套ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 账套名称 |
| description | TEXT | NULL | 账套描述 |
| is_default | TINYINT(1) | DEFAULT 0 | 是否为默认账套 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个用户可以创建多个账套
- 支持设置默认账套
- 账套可被禁用而不删除历史数据

### 3. payment_channels (支付渠道表)

存储支付渠道信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 支付渠道ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 支付渠道名称 |
| code | VARCHAR(50) | NULL | 支付渠道代码 |
| icon | VARCHAR(50) | NULL | 支付渠道图标 |
| color | VARCHAR(20) | NULL | 支付渠道颜色 |
| is_default | TINYINT(1) | DEFAULT 0 | 是否为默认支付渠道 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 支持多种支付渠道（支付宝、微信支付、云闪付等）
- 可设置默认支付渠道
- 支持自定义图标和颜色

### 4. accounts (账户表)

存储用户的各类账户信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 账户ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| ledger_id | INT | FOREIGN KEY, NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 账户名称 |
| balance | DECIMAL(15,2) | DEFAULT 0.00 | 账户余额 |
| account_type | VARCHAR(50) | DEFAULT 'general' | 账户类型 |
| description | TEXT | NULL | 账户描述 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**账户类型枚举值**:
- `general`: 普通账户
- `cash`: 现金账户
- `bank`: 银行卡账户
- `alipay`: 支付宝账户
- `wechat`: 微信账户
- `credit_card`: 信用卡账户

**设计说明**:
- 每个账户关联到一个用户和一个账套
- 余额字段使用DECIMAL类型确保精度
- 支持多种账户类型
- 账户可被禁用而不删除历史数据

### 5. categories (分类表)

存储收支分类信息，支持多级分类。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 分类ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 分类名称 |
| type | ENUM | NOT NULL | 分类类型 (expense/income) |
| icon | VARCHAR(50) | NULL | 分类图标 |
| color | VARCHAR(20) | NULL | 分类颜色 |
| parent_id | INT | FOREIGN KEY, NULL | 父分类ID |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| is_default | TINYINT(1) | DEFAULT 0 | 是否为默认分类 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 支持支出和收入两种分类类型
- 支持多级分类结构（通过parent_id）
- 预设默认分类（user_id=0）
- 支持自定义图标和颜色
- 可按sort_order排序显示

### 6. transactions (交易记录表)

存储所有交易记录，是系统的核心表。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 交易ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| ledger_id | INT | FOREIGN KEY, NULL | 账套ID |
| account_id | INT | FOREIGN KEY, NOT NULL | 账户ID |
| from_account_id | INT | FOREIGN KEY, NULL | 转出账户ID（转账用） |
| to_account_id | INT | FOREIGN KEY, NULL | 转入账户ID（转账用） |
| category_id | INT | FOREIGN KEY, NULL | 分类ID |
| payment_channel_id | INT | FOREIGN KEY, NULL | 支付渠道ID |
| type | ENUM | NOT NULL | 交易类型 (expense/income/transfer) |
| transfer_type | ENUM | NULL | 转账类型 (internal/external) |
| amount | DECIMAL(15,2) | NOT NULL | 交易金额 |
| description | TEXT | NULL | 交易描述 |
| transaction_date | DATE | NOT NULL | 交易日期 |
| transaction_time | TIME | NULL | 交易时间 |
| tags | JSON | NULL | 交易标签 |
| attachments | JSON | NULL | 附件信息 |
| is_recurring | TINYINT(1) | DEFAULT 0 | 是否为周期性交易 |
| recurring_pattern | VARCHAR(50) | NULL | 周期模式 |
| recurring_end_date | DATE | NULL | 周期结束日期 |
| status | ENUM | DEFAULT 'completed' | 交易状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| synced_at | TIMESTAMP | NULL | 同步时间 |

**交易类型枚举值**:
- `expense`: 支出
- `income`: 收入
- `transfer`: 转账

**转账类型枚举值**:
- `internal`: 内部转账（同一用户账户间）
- `external`: 外部转账（不同用户账户间）

**交易状态枚举值**:
- `pending`: 待处理
- `completed`: 已完成
- `cancelled`: 已取消

**周期模式枚举值**:
- `daily`: 每日
- `weekly`: 每周
- `monthly`: 每月
- `yearly`: 每年

**设计说明**:
- 每笔交易关联到用户、账户和分类
- 支持日期和时间的精确记录
- 使用JSON字段存储标签和附件
- 支持周期性交易
- 记录同步时间用于数据同步
- 支持转账功能，通过from_account_id和to_account_id实现

### 7. sync_logs (同步日志表)

记录所有数据同步操作的日志。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 日志ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| sync_type | ENUM | NOT NULL | 同步类型 |
| table_name | VARCHAR(50) | NOT NULL | 同步的表名 |
| record_count | INT | DEFAULT 0 | 同步记录数 |
| status | ENUM | DEFAULT 'success' | 同步状态 |
| error_message | TEXT | NULL | 错误信息 |
| sync_details | JSON | NULL | 同步详情 |
| started_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 开始时间 |
| completed_at | TIMESTAMP | NULL | 完成时间 |

**同步类型枚举值**:
- `local_to_db`: 本地到数据库
- `db_to_local`: 数据库到本地
- `bidirectional`: 双向同步

**同步状态枚举值**:
- `success`: 成功
- `failed`: 失败
- `partial`: 部分成功

**设计说明**:
- 记录每次同步操作的详细信息
- 支持多种同步类型
- 记录同步状态和错误信息
- 使用JSON字段存储详细同步数据

### 8. user_settings (用户设置表)

存储用户的个性化设置。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 设置ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| setting_key | VARCHAR(100) | NOT NULL | 设置键 |
| setting_value | TEXT | NULL | 设置值 |
| setting_type | VARCHAR(20) | DEFAULT 'string' | 设置类型 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设置类型枚举值**:
- `string`: 字符串
- `number`: 数字
- `boolean`: 布尔值
- `json`: JSON对象

**设计说明**:
- 支持键值对存储用户设置
- 每个用户可以有多个设置项
- 同一用户的同一设置键唯一
- 支持多种数据类型

### 9. defaults (默认值设置表)

存储用户的默认值设置，用于快速填充交易表单。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 默认值ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| ledger_id | INT | FOREIGN KEY, NULL | 账套ID |
| expense_category_id | INT | FOREIGN KEY, NULL | 默认支出分类ID |
| income_category_id | INT | FOREIGN KEY, NULL | 默认收入分类ID |
| member_id | INT | FOREIGN KEY, NULL | 默认成员ID |
| merchant_id | INT | FOREIGN KEY, NULL | 默认商家ID |
| project_id | INT | FOREIGN KEY, NULL | 默认项目ID |
| payment_channel_id | INT | FOREIGN KEY, NULL | 默认支付渠道ID |
| account_id | INT | FOREIGN KEY, NULL | 默认账户ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个用户可以设置默认值
- 支持按账套设置不同的默认值
- 默认值会在创建新交易时自动填充
- 包含常用维度的默认值设置

### 10. credit_cards (信用卡表)

存储信用卡账户信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 信用卡ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| account_id | INT | FOREIGN KEY, NOT NULL | 关联账户ID |
| card_number | VARCHAR(50) | NOT NULL | 卡号（脱敏） |
| card_name | VARCHAR(100) | NULL | 卡片名称 |
| credit_limit | DECIMAL(15,2) | NOT NULL | 信用额度 |
| available_credit | DECIMAL(15,2) | NULL | 可用额度 |
| bill_day | INT | NOT NULL | 账单日（1-31） |
| due_day | INT | NOT NULL | 还款日（1-31） |
| bank_name | VARCHAR(100) | NULL | 发卡银行 |
| card_type | VARCHAR(50) | DEFAULT 'general' | 卡片类型 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每张信用卡关联到一个账户
- 支持账单日和还款日设置
- 记录信用额度和可用额度
- 卡号存储脱敏后的信息
- 支持多种卡片类型

### 11. credit_card_bills (信用卡账单表)

存储信用卡账单信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 账单ID |
| credit_card_id | INT | FOREIGN KEY, NOT NULL | 信用卡ID |
| bill_date | DATE | NOT NULL | 账单日期 |
| due_date | DATE | NOT NULL | 还款到期日 |
| bill_amount | DECIMAL(15,2) | NOT NULL | 账单金额 |
| paid_amount | DECIMAL(15,2) | DEFAULT 0.00 | 已还金额 |
| remaining_amount | DECIMAL(15,2) | NULL | 剩余金额 |
| transaction_count | INT | DEFAULT 0 | 交易笔数 |
| status | ENUM | DEFAULT 'unpaid' | 账单状态 |
| paid_at | TIMESTAMP | NULL | 还款时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**账单状态枚举值**:
- `unpaid`: 未还款
- `partial_paid`: 部分还款
- `paid`: 已还清
- `overdue`: 逾期

**设计说明**:
- 每个账单关联到一张信用卡
- 记录账单金额和还款状态
- 支持部分还款和逾期状态
- 记录交易笔数用于统计分析

### 12. loans (贷款表)

存储贷款信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 贷款ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| account_id | INT | FOREIGN KEY, NULL | 还款账户ID |
| name | VARCHAR(100) | NOT NULL | 贷款名称 |
| type | ENUM | NOT NULL | 贷款类型 |
| total_amount | DECIMAL(15,2) | NOT NULL | 贷款总额 |
| remaining_amount | DECIMAL(15,2) | NOT NULL | 剩余本金 |
| interest_rate | DECIMAL(5,2) | NOT NULL | 年利率（%） |
| period_months | INT | NOT NULL | 贷款期限（月） |
| paid_periods | INT | DEFAULT 0 | 已还期数 |
| monthly_payment | DECIMAL(15,2) | NULL | 月供金额 |
| start_date | DATE | NOT NULL | 开始日期 |
| end_date | DATE | NULL | 结束日期 |
| next_payment_date | DATE | NULL | 下次还款日期 |
| status | ENUM | DEFAULT 'active' | 贷款状态 |
| description | TEXT | NULL | 贷款描述 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**贷款类型枚举值**:
- `mortgage`: 房贷
- `car_loan`: 车贷
- `personal_loan`: 个人贷款
- `business_loan`: 商业贷款
- `student_loan`: 助学贷款
- `other`: 其他

**贷款状态枚举值**:
- `active`: 进行中
- `paid_off`: 已还清
- `early_paid`: 提前还款
- `defaulted`: 违约

**设计说明**:
- 支持多种贷款类型
- 记录贷款金额、利率、期限等关键信息
- 追踪还款进度和剩余本金
- 支持等额本息等还款方式

### 13. loan_payments (贷款还款记录表)

存储贷款还款记录。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 还款记录ID |
| loan_id | INT | FOREIGN KEY, NOT NULL | 贷款ID |
| account_id | INT | FOREIGN KEY, NULL | 还款账户ID |
| period_number | INT | NOT NULL | 期数 |
| payment_date | DATE | NOT NULL | 还款日期 |
| amount | DECIMAL(15,2) | NOT NULL | 还款总额 |
| principal | DECIMAL(15,2) | NULL | 本金 |
| interest | DECIMAL(15,2) | NULL | 利息 |
| remaining_principal | DECIMAL(15,2) | NULL | 剩余本金 |
| status | ENUM | DEFAULT 'scheduled' | 还款状态 |
| notes | TEXT | NULL | 备注 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**还款状态枚举值**:
- `scheduled`: 计划中
- `paid`: 已还款
- `missed`: 已逾期
- `partial`: 部分还款

**设计说明**:
- 每笔还款关联到一笔贷款
- 记录本金和利息明细
- 追踪剩余本金
- 支持多种还款状态

### 14. installment_templates (分期模板表)

存储分期模板，用于快速创建分期记录。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 模板ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 模板名称 |
| total_amount | DECIMAL(15,2) | NOT NULL | 分期总额 |
| period_count | INT | NOT NULL | 分期期数 |
| period_amount | DECIMAL(15,2) | NOT NULL | 每期金额 |
| category_id | INT | FOREIGN KEY, NULL | 分类ID |
| account_id | INT | FOREIGN KEY, NULL | 账户ID |
| description | TEXT | NULL | 描述 |
| is_default | TINYINT(1) | DEFAULT 0 | 是否为默认模板 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 支持创建分期模板
- 可设置默认模板快速使用
- 关联到分类和账户
- 记录分期总额、期数、每期金额

### 15. installments (分期记录表)

存储分期记录详情。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 分期ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| template_id | INT | FOREIGN KEY, NULL | 模板ID |
| transaction_id | INT | FOREIGN KEY, NULL | 关联交易ID |
| installment_group_id | VARCHAR(50) | NOT NULL | 分期组ID |
| installment_number | INT | NOT NULL | 分期序号 |
| total_amount | DECIMAL(15,2) | NOT NULL | 分期总额 |
| period_amount | DECIMAL(15,2) | NOT NULL | 每期金额 |
| paid_amount | DECIMAL(15,2) | DEFAULT 0.00 | 已还金额 |
| remaining_amount | DECIMAL(15,2) | NULL | 剩余金额 |
| due_date | DATE | NOT NULL | 还款日期 |
| status | ENUM | DEFAULT 'pending' | 分期状态 |
| paid_at | TIMESTAMP | NULL | 还款时间 |
| description | TEXT | NULL | 描述 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**分期状态枚举值**:
- `pending`: 待还款
- `paid`: 已还款
- `overdue`: 已逾期
- `cancelled`: 已取消

**设计说明**:
- 通过installment_group_id关联同一分期的多期记录
- 关联到交易记录，实现与交易系统的联动
- 记录每期的还款状态
- 支持部分还款和逾期状态

### 16. merchants (商家表)

存储商家信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 商家ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 商家名称 |
| category | VARCHAR(50) | NULL | 商家分类 |
| address | TEXT | NULL | 商家地址 |
| phone | VARCHAR(20) | NULL | 联系电话 |
| website | VARCHAR(255) | NULL | 网站地址 |
| logo | VARCHAR(255) | NULL | 商家logo |
| is_favorite | TINYINT(1) | DEFAULT 0 | 是否收藏 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个商家关联到一个用户
- 支持商家分类管理
- 支持商家联系方式存储
- 支持商家收藏功能

### 17. projects (项目表)

存储项目信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 项目ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 项目名称 |
| description | TEXT | NULL | 项目描述 |
| start_date | DATE | NULL | 开始日期 |
| end_date | DATE | NULL | 结束日期 |
| budget | DECIMAL(15,2) | NULL | 项目预算 |
| actual_amount | DECIMAL(15,2) | DEFAULT 0.00 | 实际金额 |
| status | ENUM | DEFAULT 'active' | 项目状态 |
| color | VARCHAR(20) | NULL | 项目颜色 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**项目状态枚举值**:
- `active`: 进行中
- `completed`: 已完成
- `cancelled`: 已取消
- `planned`: 计划中

**设计说明**:
- 每个项目关联到一个用户
- 支持项目预算和实际金额跟踪
- 支持项目状态管理
- 支持项目颜色标识

### 18. members (成员表)

存储成员信息（用于多成员管理）。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 成员ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 所属用户ID |
| name | VARCHAR(100) | NOT NULL | 成员姓名 |
| relationship | VARCHAR(50) | NULL | 关系 |
| avatar | VARCHAR(255) | NULL | 头像 |
| email | VARCHAR(100) | NULL | 邮箱 |
| phone | VARCHAR(20) | NULL | 电话 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个成员关联到一个用户（主账户）
- 支持成员关系管理
- 支持成员联系方式存储
- 支持成员头像

### 19. investment_accounts (投资账户表)

存储投资账户信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 投资账户ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(100) | NOT NULL | 账户名称 |
| balance | DECIMAL(15,2) | DEFAULT 0.00 | 账户余额 |
| asset_value | DECIMAL(15,2) | DEFAULT 0.00 | 资产价值 |
| profit_loss | DECIMAL(15,2) | DEFAULT 0.00 | 盈亏 |
| description | TEXT | NULL | 账户描述 |
| is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个投资账户关联到一个用户
- 记录账户余额、资产价值和盈亏
- 支持投资账户的激活和禁用

### 20. investment_details (投资明细表)

存储投资明细信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 投资明细ID |
| user_id | INT | FOREIGN KEY, NOT NULL | 用户ID |
| account_id | INT | FOREIGN KEY, NOT NULL | 投资账户ID |
| type | VARCHAR(50) | NOT NULL | 投资类型（基金、股票等） |
| code | VARCHAR(50) | NOT NULL | 投资代码 |
| name | VARCHAR(100) | NOT NULL | 投资名称 |
| shares | DECIMAL(10,4) | NOT NULL | 持有份额 |
| cost_price | DECIMAL(10,4) | NOT NULL | 成本价 |
| current_price | DECIMAL(10,4) | NOT NULL | 当前价 |
| total_cost | DECIMAL(15,2) | NOT NULL | 总成本 |
| current_value | DECIMAL(15,2) | NOT NULL | 当前价值 |
| profit_loss | DECIMAL(15,2) | NOT NULL | 盈亏 |
| last_updated | TIMESTAMP | NULL | 最后更新时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**设计说明**:
- 每个投资明细关联到一个用户和一个投资账户
- 记录投资的类型、代码、名称、份额、成本价和当前价
- 计算并记录总成本、当前价值和盈亏
- 记录最后更新时间用于追踪净值更新

### 21. transaction_merchants (交易商家关联表)

关联交易和商家。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关联ID |
| transaction_id | INT | FOREIGN KEY, NOT NULL | 交易ID |
| merchant_id | INT | FOREIGN KEY, NOT NULL | 商家ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 22. transaction_projects (交易项目关联表)

关联交易和项目。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关联ID |
| transaction_id | INT | FOREIGN KEY, NOT NULL | 交易ID |
| project_id | INT | FOREIGN KEY, NOT NULL | 项目ID |
| amount | DECIMAL(15,2) | NOT NULL | 项目分配金额 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 23. transaction_members (交易成员关联表)

关联交易和成员。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关联ID |
| transaction_id | INT | FOREIGN KEY, NOT NULL | 交易ID |
| member_id | INT | FOREIGN KEY, NOT NULL | 成员ID |
| amount | DECIMAL(15,2) | NOT NULL | 成员分配金额 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

---

## 索引设计

### users表索引
```sql
INDEX idx_email (email)              -- 邮箱索引，用于登录查询
INDEX idx_created_at (created_at)    -- 创建时间索引，用于用户统计
```

### accounts表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户账户
INDEX idx_account_type (account_type) -- 账户类型索引，用于按类型筛选
```

### categories表索引
```sql
INDEX idx_user_id (user_id)         -- 用户ID索引，用于查询用户分类
INDEX idx_type (type)                -- 类型索引，用于按类型筛选
INDEX idx_parent_id (parent_id)      -- 父分类ID索引，用于查询子分类
```

### transactions表索引
```sql
INDEX idx_user_id (user_id)         -- 用户ID索引，用于查询用户交易
INDEX idx_account_id (account_id)    -- 账户ID索引，用于查询账户交易
INDEX idx_category_id (category_id)  -- 分类ID索引，用于按分类统计
INDEX idx_type (type)                -- 类型索引，用于按类型筛选
INDEX idx_transaction_date (transaction_date) -- 交易日期索引，用于日期范围查询
INDEX idx_created_at (created_at)    -- 创建时间索引，用于同步查询
```

### sync_logs表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户同步日志
INDEX idx_sync_type (sync_type)      -- 同步类型索引，用于按类型筛选
INDEX idx_status (status)            -- 状态索引，用于按状态筛选
INDEX idx_started_at (started_at)    -- 开始时间索引，用于时间范围查询
```

### user_settings表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户设置
INDEX idx_setting_key (setting_key)  -- 设置键索引，用于按键名查询
UNIQUE KEY unique_user_setting (user_id, setting_key) -- 用户设置唯一约束
```

### credit_cards表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户信用卡
INDEX idx_account_id (account_id)     -- 账户ID索引，用于关联查询
INDEX idx_bill_day (bill_day)        -- 账单日索引，用于账单日查询
INDEX idx_due_day (due_day)          -- 还款日索引，用于还款提醒
```

### credit_card_bills表索引
```sql
INDEX idx_credit_card_id (credit_card_id) -- 信用卡ID索引，用于查询信用卡账单
INDEX idx_bill_date (bill_date)         -- 账单日期索引，用于日期范围查询
INDEX idx_due_date (due_date)           -- 还款到期日索引，用于还款提醒
INDEX idx_status (status)               -- 账单状态索引，用于按状态筛选
```

### loans表索引
```sql
INDEX idx_user_id (user_id)              -- 用户ID索引，用于查询用户贷款
INDEX idx_account_id (account_id)         -- 账户ID索引，用于关联查询
INDEX idx_type (type)                    -- 贷款类型索引，用于按类型筛选
INDEX idx_status (status)                  -- 贷款状态索引，用于按状态筛选
INDEX idx_next_payment_date (next_payment_date) -- 下次还款日期索引，用于还款提醒
```

### loan_payments表索引
```sql
INDEX idx_loan_id (loan_id)              -- 贷款ID索引，用于查询贷款还款记录
INDEX idx_account_id (account_id)         -- 账户ID索引，用于关联查询
INDEX idx_payment_date (payment_date)     -- 还款日期索引，用于日期范围查询
INDEX idx_period_number (period_number)     -- 期数索引，用于按期数查询
INDEX idx_status (status)                  -- 还款状态索引，用于按状态筛选
```

### installment_templates表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户分期模板
INDEX idx_category_id (category_id)    -- 分类ID索引，用于关联查询
INDEX idx_account_id (account_id)      -- 账户ID索引，用于关联查询
```

### installments表索引
```sql
INDEX idx_user_id (user_id)                   -- 用户ID索引，用于查询用户分期记录
INDEX idx_template_id (template_id)             -- 模板ID索引，用于关联查询
INDEX idx_transaction_id (transaction_id)         -- 交易ID索引，用于关联查询
INDEX idx_installment_group_id (installment_group_id) -- 分期组ID索引，用于查询同一分期的记录
INDEX idx_due_date (due_date)                   -- 还款日期索引，用于还款提醒
INDEX idx_status (status)                         -- 分期状态索引，用于按状态筛选
```

### merchants表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引
INDEX idx_category (category)        -- 商家分类索引
INDEX idx_is_favorite (is_favorite)  -- 收藏状态索引
```

### projects表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引
INDEX idx_status (status)            -- 项目状态索引
INDEX idx_start_date (start_date)    -- 开始日期索引
INDEX idx_end_date (end_date)        -- 结束日期索引
```

### members表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引
INDEX idx_relationship (relationship) -- 关系索引
```

### investment_accounts表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户投资账户
INDEX idx_is_active (is_active)      -- 激活状态索引，用于筛选激活账户
```

### investment_details表索引
```sql
INDEX idx_user_id (user_id)          -- 用户ID索引，用于查询用户投资明细
INDEX idx_account_id (account_id)     -- 投资账户ID索引，用于关联查询
INDEX idx_code (code)                -- 投资代码索引，用于快速查找
INDEX idx_type (type)                -- 投资类型索引，用于按类型筛选
```

### transaction_merchants表索引
```sql
INDEX idx_transaction_id (transaction_id) -- 交易ID索引
INDEX idx_merchant_id (merchant_id)     -- 商家ID索引
```

### transaction_projects表索引
```sql
INDEX idx_transaction_id (transaction_id) -- 交易ID索引
INDEX idx_project_id (project_id)       -- 项目ID索引
```

### transaction_members表索引
```sql
INDEX idx_transaction_id (transaction_id) -- 交易ID索引
INDEX idx_member_id (member_id)         -- 成员ID索引
```

---

## 视图设计

### 1. v_account_balance (账户余额视图)

提供账户的实时余额信息，包括总收入、总支出和当前余额。

```sql
CREATE OR REPLACE VIEW v_account_balance AS
SELECT 
    a.id,
    a.user_id,
    a.name,
    a.account_type,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
    a.balance + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as current_balance,
    a.is_active,
    a.created_at,
    a.updated_at
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY a.id, a.user_id, a.name, a.account_type, a.balance, a.is_active, a.created_at, a.updated_at;
```

**用途**:
- 实时查询账户余额
- 统计账户收支情况
- 生成财务报表

### 2. v_user_statistics (用户统计视图)

提供用户的整体统计信息。

```sql
CREATE OR REPLACE VIEW v_user_statistics AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(DISTINCT a.id) as account_count,
    COUNT(DISTINCT t.id) as transaction_count,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as balance,
    MIN(t.transaction_date) as first_transaction_date,
    MAX(t.transaction_date) as last_transaction_date
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY u.id, u.name;
```

**用途**:
- 用户整体财务状况统计
- 用户活跃度分析
- 生成用户报告

### 3. v_investment_account_summary (投资账户汇总视图)

提供投资账户的汇总信息，包括总资产价值、总盈亏等。

```sql
CREATE OR REPLACE VIEW v_investment_account_summary AS
SELECT 
    ia.id,
    ia.user_id,
    ia.name,
    ia.balance,
    ia.asset_value,
    ia.profit_loss,
    COUNT(id) as investment_count,
    ia.is_active,
    ia.created_at,
    ia.updated_at
FROM investment_accounts ia
LEFT JOIN investment_details id ON ia.id = id.account_id
GROUP BY ia.id, ia.user_id, ia.name, ia.balance, ia.asset_value, ia.profit_loss, ia.is_active, ia.created_at, ia.updated_at;
```

**用途**:
- 实时查询投资账户汇总信息
- 统计投资账户的资产价值和盈亏
- 生成投资报表

---

## 触发器设计

### 1. trg_update_account_balance_after_transaction

在插入交易记录后自动更新账户余额。

```sql
CREATE TRIGGER trg_update_account_balance_after_transaction
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    IF NEW.type = 'income' THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSE
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
END
```

**功能**: 
- 收入交易增加账户余额
- 支出交易减少账户余额

### 2. trg_update_account_balance_after_transaction_update

在更新交易记录后自动调整账户余额。

```sql
CREATE TRIGGER trg_update_account_balance_after_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    -- 恢复原始交易对余额的影响
    IF OLD.type = 'income' THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSE
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
    
    -- 应用新交易对余额的影响
    IF NEW.type = 'income' THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSE
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
END
```

**功能**:
- 先撤销原交易对余额的影响
- 再应用新交易对余额的影响

### 3. trg_update_account_balance_after_transaction_delete

在删除交易记录后自动恢复账户余额。

```sql
CREATE TRIGGER trg_update_account_balance_after_transaction_delete
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    IF OLD.type = 'income' THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSE
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
END
```

**功能**:
- 删除收入交易减少账户余额
- 删除支出交易增加账户余额

### 4. trg_update_investment_account_asset_value

在更新投资明细后自动更新投资账户的资产价值和盈亏。

```sql
CREATE TRIGGER trg_update_investment_account_asset_value
AFTER INSERT, UPDATE, DELETE ON investment_details
FOR EACH ROW
BEGIN
    -- 计算并更新投资账户的资产价值和盈亏
    UPDATE investment_accounts ia
    SET 
        asset_value = (SELECT COALESCE(SUM(current_value), 0) FROM investment_details WHERE account_id = ia.id),
        profit_loss = (SELECT COALESCE(SUM(profit_loss), 0) FROM investment_details WHERE account_id = ia.id)
    WHERE ia.id = NEW.account_id OR ia.id = OLD.account_id;
END
```

**功能**:
- 自动计算投资账户的资产价值和盈亏
- 确保投资账户信息与投资明细保持一致

---

## 存储过程设计

### 1. sp_sync_local_to_db

将本地数据同步到数据库。

```sql
CREATE PROCEDURE sp_sync_local_to_db(
    IN p_user_id INT,
    IN p_table_name VARCHAR(50),
    IN p_data JSON,
    OUT p_result INT
)
```

**参数**:
- `p_user_id`: 用户ID
- `p_table_name`: 表名
- `p_data`: JSON格式的数据
- `p_result`: 返回同步的记录数

**功能**:
- 解析JSON数据
- 根据表名执行相应的插入/更新操作
- 记录同步日志
- 返回同步的记录数

### 2. sp_sync_db_to_local

从数据库同步数据到本地。

```sql
CREATE PROCEDURE sp_sync_db_to_local(
    IN p_user_id INT,
    IN p_table_name VARCHAR(50),
    IN p_last_sync_time TIMESTAMP,
    OUT p_result JSON
)
```

**参数**:
- `p_user_id`: 用户ID
- `p_table_name`: 表名
- `p_last_sync_time`: 上次同步时间
- `p_result`: 返回JSON格式的数据

**功能**:
- 查询指定表的数据
- 支持增量同步（基于last_sync_time）
- 返回JSON格式的数据
- 记录同步日志

### 3. sp_bidirectional_sync

执行双向同步。

```sql
CREATE PROCEDURE sp_bidirectional_sync(
    IN p_user_id INT,
    IN p_local_accounts JSON,
    IN p_local_transactions JSON,
    IN p_local_categories JSON,
    IN p_local_credit_cards JSON,
    IN p_local_credit_card_bills JSON,
    IN p_local_loans JSON,
    IN p_local_loan_payments JSON,
    IN p_local_installment_templates JSON,
    IN p_local_installments JSON,
    IN p_local_investment_accounts JSON,
    IN p_local_investment_details JSON,
    OUT p_result JSON
)
```

**参数**:
- `p_user_id`: 用户ID
- `p_local_accounts`: 本地账户数据
- `p_local_transactions`: 本地交易数据
- `p_local_categories`: 本地分类数据
- `p_local_credit_cards`: 本地信用卡数据
- `p_local_credit_card_bills`: 本地信用卡账单数据
- `p_local_loans`: 本地贷款数据
- `p_local_loan_payments`: 本地贷款还款记录数据
- `p_local_installment_templates`: 本地分期模板数据
- `p_local_installments`: 本地分期记录数据
- `p_local_investment_accounts`: 本地投资账户数据
- `p_local_investment_details`: 本地投资明细数据
- `p_result`: 返回同步结果

**功能**:
- 先将本地数据同步到数据库
- 再将数据库数据同步到本地
- 返回详细的同步结果
- 记录同步日志
- 支持所有业务表的双向同步

---

## 数据同步机制

### 同步架构

```
┌─────────────────┐         ┌─────────────────┐
│   LocalStorage  │◄────────┤  Sync Service  │
│   (浏览器端)    │         │  (同步服务)     │
└─────────────────┘         └────────┬────────┘
                                    │
                                    ▼
                            ┌─────────────────┐
                            │   API Service   │
                            │  (API服务)      │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   MySQL DB      │
                            │  (数据库)       │
                            └─────────────────┘
```

### 同步流程

#### 1. 自动同步
- **触发条件**: 网络状态从离线变为在线
- **同步方式**: 增量同步
- **同步内容**: 所有表的数据
- **冲突解决**: 自动选择最新修改时间的数据

#### 2. 手动同步
- **触发方式**: 用户点击同步按钮
- **同步方式**: 全量同步或增量同步
- **同步内容**: 可选择特定表
- **冲突解决**: 提示用户选择解决方案

#### 3. 数据变更同步
- **触发条件**: 用户修改数据
- **同步方式**: 实时同步
- **同步内容**: 变更的数据
- **冲突解决**: 本地数据优先

### 冲突解决策略

#### 1. 时间戳比较
```javascript
if (local.updated_at > server.updated_at) {
    // 使用本地数据
} else if (server.updated_at > local.updated_at) {
    // 使用服务器数据
} else {
    // 同时修改，需要用户选择
}
```

#### 2. 冲突类型
- **local_newer**: 本地数据更新
- **server_newer**: 服务器数据更新
- **simultaneous**: 同时修改

#### 3. 解决方案
- **使用本地数据**: 覆盖服务器数据
- **使用服务器数据**: 覆盖本地数据
- **合并数据**: 智能合并冲突字段

### 同步状态管理

#### 状态定义
- `idle`: 空闲状态
- `syncing`: 同步中
- `success`: 同步成功
- `error`: 同步失败

#### 状态监控
```javascript
const syncStatus = {
    isOnline: true,           // 是否在线
    isSyncing: false,         // 是否正在同步
    lastSyncTime: '2026-03-28T10:00:00Z',  // 最后同步时间
    syncStatus: 'success',    // 同步状态
    hasErrors: false,         // 是否有错误
    errors: []                // 错误列表
}
```

### 离线支持

#### 离线操作
- 所有数据保存在LocalStorage
- 正常记录交易、账户等信息
- 标记未同步的数据

#### 在线同步
- 自动检测网络状态
- 连接后自动触发同步
- 同步未同步的数据
- 解决可能的冲突

---

## 数据完整性约束

### 外键约束
```sql
-- accounts表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (ledger_id) REFERENCES ledgers(id) ON DELETE SET NULL

-- categories表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL

-- transactions表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (ledger_id) REFERENCES ledgers(id) ON DELETE SET NULL
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE SET NULL
FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
FOREIGN KEY (payment_channel_id) REFERENCES payment_channels(id) ON DELETE SET NULL

-- sync_logs表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- user_settings表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- defaults表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (ledger_id) REFERENCES ledgers(id) ON DELETE SET NULL
FOREIGN KEY (expense_category_id) REFERENCES categories(id) ON DELETE SET NULL
FOREIGN KEY (income_category_id) REFERENCES categories(id) ON DELETE SET NULL
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
FOREIGN KEY (payment_channel_id) REFERENCES payment_channels(id) ON DELETE SET NULL
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL

-- payment_channels表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- ledgers表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- credit_cards表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE

-- credit_card_bills表
FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE CASCADE

-- loans表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL

-- loan_payments表
FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE

-- installment_templates表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL

-- installments表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (template_id) REFERENCES installment_templates(id) ON DELETE SET NULL
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL

-- merchants表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- projects表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- members表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- investment_accounts表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- investment_details表
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (account_id) REFERENCES investment_accounts(id) ON DELETE CASCADE

-- transaction_merchants表
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE

-- transaction_projects表
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE

-- transaction_members表
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
```

### 唯一性约束
```sql
-- users表
UNIQUE KEY unique_email (email)

-- payment_channels表
UNIQUE KEY unique_user_channel (user_id, name)

-- accounts表
UNIQUE KEY unique_user_account (user_id, name)

-- categories表
UNIQUE KEY unique_user_category (user_id, name, type, parent_id)

-- credit_cards表
UNIQUE KEY unique_user_card (user_id, card_number)

-- investment_accounts表
UNIQUE KEY unique_user_investment_account (user_id, name)

-- investment_details表
UNIQUE KEY unique_account_investment (account_id, code)
```

---

## 性能优化建议

1. **索引优化**
   - 为经常查询的字段创建索引
   - 避免在索引字段上使用函数
   - 定期重建索引以保持性能

2. **查询优化**
   - 使用预处理语句
   - 避免使用SELECT *
   - 合理使用JOIN语句
   - 限制结果集大小

3. **存储优化**
   - 定期清理无用数据
   - 合理设置表的存储引擎
   - 分区表以提高查询性能

4. **缓存优化**
   - 使用Redis等缓存技术
   - 缓存热点数据
   - 合理设置缓存过期时间

5. **硬件优化**
   - 增加服务器内存
   - 使用SSD存储
   - 合理配置数据库服务器

6. **应用层优化**
   - 减少数据库连接次数
   - 使用连接池
   - 异步处理耗时操作

7. **监控与调优**
   - 监控数据库性能
   - 分析慢查询日志
   - 定期进行性能调优

---

## 总结

本数据库设计文档详细描述了MyMoney888系统的数据库结构，包括表结构、索引设计、视图设计、触发器设计、存储过程设计、数据同步机制、数据完整性约束和性能优化建议。

该设计支持用户管理、账套管理、账户管理、分类管理、交易记录、信用卡管理、贷款管理、分期管理、商家管理、项目管理、成员管理和投资管理等核心功能，为系统提供了稳定、高效、可扩展的数据存储基础。