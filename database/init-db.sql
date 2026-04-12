-- =============================================================================
-- MyMoney888 数据库初始化脚本
-- 版本: 3.9.0 (数据为核心，标签化存储架构)
-- 创建时间: 2026-04-12
-- 
-- =============================================================================
-- 架构理念：★★★ 数据为核心，标签化存储，无损迭代 ★★★
-- =============================================================================
--
-- 【核心原则】
-- 1. transactions（交易）是唯一事实来源
-- 2. 所有其他数据都是对交易的"标签"
-- 3. 衍生数据（余额、已用额度等）由交易实时计算，不存储
-- 4. 未来新增功能只需给交易打新标签，无需迁移数据
--
-- 【衍生数据计算规则】
-- - account.balance = SUM(income) - SUM(expense) + SUM(transfers)
-- - credit_card.used_credit = SUM(expense) - SUM(repayment)
-- - loan.remaining_amount = total_amount - SUM(payments)
-- - investment_account.total_value = 从 net_value_history 最新记录获取
--
-- =============================================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS mymoney888 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mymoney888;

-- ============================================
-- 基础数据表（不包含衍生值）
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '用户姓名',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '用户邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 账户表（不含 balance，余额由交易计算得出）
CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    ledger_id VARCHAR(50) DEFAULT 'default' COMMENT '账套ID',
    name VARCHAR(100) NOT NULL COMMENT '账户名称',
    account_type VARCHAR(50) DEFAULT 'general' COMMENT '账户类型: general, cash, bank, alipay, wechat, credit_card, investment',
    currency VARCHAR(10) DEFAULT 'CNY' COMMENT '币种',
    initial_balance DECIMAL(15, 2) DEFAULT 0.00 COMMENT '初始余额（仅用于记录，不参与计算）',
    description TEXT COMMENT '账户描述',
    icon VARCHAR(50) COMMENT '图标',
    color VARCHAR(20) COMMENT '颜色',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_account_type (account_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户表（余额由交易计算）';

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    type ENUM('expense', 'income') NOT NULL COMMENT '分类类型: expense-支出, income-收入',
    icon VARCHAR(50) COMMENT '分类图标',
    color VARCHAR(20) COMMENT '分类颜色',
    parent_id INT DEFAULT NULL COMMENT '父分类ID',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    is_default TINYINT(1) DEFAULT 0 COMMENT '是否为默认分类',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ============================================
-- 核心数据表（交易是唯一事实来源）
-- ============================================

-- 交易记录表（核心事实数据）
-- 注意：所有衍生数据（余额、已用额度等）都通过交易记录计算得出
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    ledger_id VARCHAR(50) DEFAULT 'default' COMMENT '账套ID',
    
    -- 账户引用
    account_id INT NOT NULL COMMENT '账户ID（出账账户/主账户）',
    to_account_id INT COMMENT '目标账户ID（转账时使用）',
    
    -- 分类引用
    category_id INT COMMENT '分类ID',
    
    -- 维度标签（依附于交易，不独立存储）
    member VARCHAR(100) COMMENT '成员（谁付/谁收）',
    merchant VARCHAR(100) COMMENT '商户（哪里消费）',
    tags JSON COMMENT '标签数组',
    payment_channel VARCHAR(50) COMMENT '支付渠道: cash, alipay, wechat, bank_card, credit_card',
    project VARCHAR(100) COMMENT '项目',
    
    -- 交易类型
    type ENUM('expense', 'income', 'transfer') NOT NULL COMMENT '交易类型',
    
    -- 金额（事实数据）
    amount DECIMAL(15, 2) NOT NULL COMMENT '交易金额',
    
    -- 交易信息
    description TEXT COMMENT '交易描述',
    notes TEXT COMMENT '备注',
    transaction_date DATE NOT NULL COMMENT '交易日期',
    transaction_time TIME COMMENT '交易时间',
    
    -- 信用卡特有字段
    is_credit_card_expense TINYINT(1) DEFAULT 0 COMMENT '是否为信用卡消费',
    credit_card_id VARCHAR(50) COMMENT '信用卡ID（信用卡消费时使用）',
    billing_month VARCHAR(7) COMMENT '账单月份（YYYY-MM）',
    is_repayment TINYINT(1) DEFAULT 0 COMMENT '是否为还款',
    
    -- 贷款特有字段
    loan_id VARCHAR(50) COMMENT '贷款ID（还款时使用）',
    
    -- 投资特有字段
    investment_account_id VARCHAR(50) COMMENT '投资账户ID',
    
    -- 周期性交易
    is_recurring TINYINT(1) DEFAULT 0 COMMENT '是否为周期性交易',
    recurring_pattern VARCHAR(50) COMMENT '周期模式: daily, weekly, monthly, yearly',
    recurring_end_date DATE COMMENT '周期结束日期',
    
    -- 附件
    attachments JSON COMMENT '附件信息',
    
    -- 状态
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed' COMMENT '交易状态',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    synced_at TIMESTAMP NULL COMMENT '同步时间',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_account_id (account_id),
    INDEX idx_to_account_id (to_account_id),
    INDEX idx_category_id (category_id),
    INDEX idx_type (type),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_member (member),
    INDEX idx_merchant (merchant),
    INDEX idx_credit_card_id (credit_card_id),
    INDEX idx_loan_id (loan_id),
    INDEX idx_investment_account_id (investment_account_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表（核心事实数据）';

-- ============================================
-- 独立模块数据表（标签化存储）
-- ============================================

-- 信用卡表（定义，不含可用额度）
CREATE TABLE IF NOT EXISTS credit_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    ledger_id VARCHAR(50) DEFAULT 'default' COMMENT '账套ID',
    name VARCHAR(100) NOT NULL COMMENT '卡片名称',
    card_number VARCHAR(50) COMMENT '卡号（脱敏）',
    linked_account_id INT COMMENT '关联账户ID',
    credit_limit DECIMAL(15, 2) NOT NULL COMMENT '信用额度',
    bill_day INT NOT NULL COMMENT '账单日（1-31）',
    due_day INT NOT NULL COMMENT '还款日（1-31）',
    bank_name VARCHAR(100) COMMENT '发卡银行',
    card_type VARCHAR(50) DEFAULT 'general' COMMENT '卡片类型',
    currency VARCHAR(10) DEFAULT 'CNY' COMMENT '币种',
    color VARCHAR(20) COMMENT '颜色',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_bill_day (bill_day),
    INDEX idx_due_day (due_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='信用卡表（额度由交易计算）';

-- 信用卡账单表（记录账单，不含已还金额）
CREATE TABLE IF NOT EXISTS credit_card_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    credit_card_id VARCHAR(50) NOT NULL COMMENT '信用卡ID',
    bill_date DATE NOT NULL COMMENT '账单日期',
    billing_period VARCHAR(7) NOT NULL COMMENT '账单周期（YYYY-MM）',
    due_date DATE NOT NULL COMMENT '还款到期日',
    statement_amount DECIMAL(15, 2) NOT NULL COMMENT '账单金额',
    transaction_count INT DEFAULT 0 COMMENT '交易笔数',
    status ENUM('unpaid', 'partial_paid', 'paid', 'overdue') DEFAULT 'unpaid' COMMENT '账单状态',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_credit_card_id (credit_card_id),
    INDEX idx_billing_period (billing_period),
    INDEX idx_bill_date (bill_date),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='信用卡账单表';

-- 贷款表（定义，不含剩余金额和已还期数）
CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    ledger_id VARCHAR(50) DEFAULT 'default' COMMENT '账套ID',
    name VARCHAR(100) NOT NULL COMMENT '贷款名称',
    type ENUM('mortgage', 'car_loan', 'personal_loan', 'business_loan', 'student_loan', 'other') NOT NULL COMMENT '贷款类型',
    total_amount DECIMAL(15, 2) NOT NULL COMMENT '贷款总额',
    interest_rate DECIMAL(6, 4) NOT NULL COMMENT '年利率',
    period_months INT NOT NULL COMMENT '贷款期限（月）',
    monthly_payment DECIMAL(15, 2) COMMENT '月供金额',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    repayment_account_id INT COMMENT '还款账户ID',
    status ENUM('active', 'paid_off', 'early_paid', 'defaulted') DEFAULT 'active' COMMENT '贷款状态',
    color VARCHAR(20) COMMENT '颜色',
    description TEXT COMMENT '贷款描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (repayment_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='贷款表（剩余金额由还款记录计算）';

-- 贷款还款记录表（事实数据）
CREATE TABLE IF NOT EXISTS loan_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    loan_id VARCHAR(50) NOT NULL COMMENT '贷款ID',
    period_number INT NOT NULL COMMENT '期数',
    payment_date DATE NOT NULL COMMENT '还款日期',
    amount DECIMAL(15, 2) NOT NULL COMMENT '还款总额',
    principal DECIMAL(15, 2) COMMENT '本金',
    interest DECIMAL(15, 2) COMMENT '利息',
    account_id INT COMMENT '还款账户ID',
    status ENUM('scheduled', 'paid', 'missed', 'partial') DEFAULT 'scheduled' COMMENT '还款状态',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_loan_id (loan_id),
    INDEX idx_account_id (account_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_period_number (period_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='贷款还款记录表';

-- 分期模板表
CREATE TABLE IF NOT EXISTS installment_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '模板名称',
    total_amount DECIMAL(15, 2) NOT NULL COMMENT '分期总额',
    period_count INT NOT NULL COMMENT '分期期数',
    period_amount DECIMAL(15, 2) NOT NULL COMMENT '每期金额',
    category_id INT COMMENT '分类ID',
    account_id INT COMMENT '账户ID',
    description TEXT COMMENT '描述',
    is_default TINYINT(1) DEFAULT 0 COMMENT '是否为默认模板',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_account_id (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分期模板表';

-- 分期记录表
CREATE TABLE IF NOT EXISTS installments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    template_id INT COMMENT '模板ID',
    transaction_id VARCHAR(50) COMMENT '关联交易ID',
    installment_group_id VARCHAR(50) NOT NULL COMMENT '分期组ID',
    installment_number INT NOT NULL COMMENT '分期序号',
    total_amount DECIMAL(15, 2) NOT NULL COMMENT '分期总额',
    period_amount DECIMAL(15, 2) NOT NULL COMMENT '每期金额',
    due_date DATE NOT NULL COMMENT '还款日期',
    status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending' COMMENT '分期状态',
    paid_at TIMESTAMP NULL COMMENT '还款时间',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES installment_templates(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_template_id (template_id),
    INDEX idx_installment_group_id (installment_group_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分期记录表';

-- ============================================
-- 投资管理表（净值由记录计算）
-- ============================================

-- 投资账户表（定义，不含总资产和盈亏）
CREATE TABLE IF NOT EXISTS investment_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    ledger_id VARCHAR(50) DEFAULT 'default' COMMENT '账套ID',
    name VARCHAR(100) NOT NULL COMMENT '投资账户名称',
    type ENUM('fund', 'stock', 'bond', 'futures', 'forex', 'crypto', 'other') DEFAULT 'other' COMMENT '账户类型',
    currency VARCHAR(10) DEFAULT 'CNY' COMMENT '币种',
    linked_account_id INT COMMENT '关联账户ID（资金转入转出）',
    description TEXT COMMENT '账户描述',
    color VARCHAR(20) COMMENT '颜色',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投资账户表（净值由净值历史计算）';

-- 投资明细表（持有品种）
CREATE TABLE IF NOT EXISTS investment_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    account_id VARCHAR(50) NOT NULL COMMENT '投资账户ID',
    type ENUM('fund', 'stock', 'bond', 'futures', 'forex', 'crypto', 'other') NOT NULL COMMENT '投资品种类型',
    code VARCHAR(20) NOT NULL COMMENT '投资品种代码',
    name VARCHAR(100) NOT NULL COMMENT '投资品种名称',
    shares DECIMAL(15, 4) DEFAULT 0.0000 COMMENT '持有份额',
    cost_price DECIMAL(15, 4) DEFAULT 0.00 COMMENT '成本价',
    cost_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '成本金额',
    current_price DECIMAL(15, 4) DEFAULT 0.00 COMMENT '当前价格',
    update_date DATE COMMENT '价格更新日期',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投资明细表';

-- 净值历史记录表（事实数据）
CREATE TABLE IF NOT EXISTS net_value_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    account_id VARCHAR(50) NOT NULL COMMENT '投资账户ID',
    code VARCHAR(20) COMMENT '投资品种代码（可选，用于记录单个品种净值）',
    name VARCHAR(100) COMMENT '投资品种名称',
    date DATE NOT NULL COMMENT '净值日期',
    total_value DECIMAL(15, 2) DEFAULT 0.00 COMMENT '资产总值',
    daily_change DECIMAL(15, 2) DEFAULT 0.00 COMMENT '日涨跌额',
    daily_return DECIMAL(8, 4) DEFAULT 0.00 COMMENT '日收益率',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='净值历史记录表';

-- 投资损益记录表（周期性汇总）
CREATE TABLE IF NOT EXISTS investment_profit_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    account_id VARCHAR(50) NOT NULL COMMENT '投资账户ID',
    cycle ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL COMMENT '结算周期',
    period VARCHAR(20) NOT NULL COMMENT '周期标识（如 2026-01, 2026-Q1）',
    start_date DATE COMMENT '期初日期',
    end_date DATE COMMENT '期末日期',
    start_value DECIMAL(15, 2) DEFAULT 0.00 COMMENT '期初价值',
    end_value DECIMAL(15, 2) DEFAULT 0.00 COMMENT '期末价值',
    profit_loss DECIMAL(15, 2) DEFAULT 0.00 COMMENT '损益金额',
    return_rate DECIMAL(8, 4) DEFAULT 0.00 COMMENT '收益率',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_cycle_period (cycle, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投资损益记录表';

-- ============================================
-- 维度表（交易标签的预定义集合）
-- ============================================

-- 维度配置表（包含成员、商家、标签、支付渠道等）
CREATE TABLE IF NOT EXISTS dimensions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    ledger_id VARCHAR(50) DEFAULT 'default' COMMENT '账套ID',
    type ENUM('members', 'merchants', 'tags', 'payment_channels') NOT NULL COMMENT '维度类型',
    name VARCHAR(100) NOT NULL COMMENT '维度名称',
    icon VARCHAR(50) COMMENT '图标',
    color VARCHAR(20) COMMENT '颜色',
    extra_data JSON COMMENT '额外数据',
    usage_count INT DEFAULT 0 COMMENT '使用次数（从交易中统计）',
    is_favorite TINYINT(1) DEFAULT 0 COMMENT '是否收藏',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_type (type),
    INDEX idx_usage_count (usage_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='维度配置表';

-- ============================================
-- 系统表
-- ============================================

-- 账套表
CREATE TABLE IF NOT EXISTS ledgers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '账套名称',
    description TEXT COMMENT '账套描述',
    icon VARCHAR(50) COMMENT '图标',
    color VARCHAR(20) COMMENT '颜色',
    is_default TINYINT(1) DEFAULT 0 COMMENT '是否默认账套',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账套表';

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    setting_key VARCHAR(100) NOT NULL COMMENT '设置键',
    setting_value TEXT COMMENT '设置值',
    setting_type VARCHAR(20) DEFAULT 'string' COMMENT '设置类型: string, number, boolean, json',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, setting_key),
    INDEX idx_user_id (user_id),
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- 用户默认值表
CREATE TABLE IF NOT EXISTS user_defaults (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    ledger_id VARCHAR(50) DEFAULT 'default' COMMENT '账套ID',
    expense_category VARCHAR(100) COMMENT '默认支出分类',
    income_category VARCHAR(100) COMMENT '默认收入分类',
    member VARCHAR(100) COMMENT '默认成员',
    merchant VARCHAR(100) COMMENT '默认商家',
    tag VARCHAR(100) COMMENT '默认标签',
    payment_channel VARCHAR(100) COMMENT '默认支付渠道',
    account_id INT COMMENT '默认账户',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_defaults (user_id, ledger_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户默认值表';

-- 同步日志表
CREATE TABLE IF NOT EXISTS sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    ledger_id VARCHAR(50) DEFAULT 'default' COMMENT '账套ID',
    sync_type ENUM('local_to_db', 'db_to_local', 'bidirectional') NOT NULL COMMENT '同步类型',
    table_name VARCHAR(50) NOT NULL COMMENT '同步的表名',
    record_count INT DEFAULT 0 COMMENT '同步记录数',
    status ENUM('success', 'failed', 'partial') DEFAULT 'success' COMMENT '同步状态',
    error_message TEXT COMMENT '错误信息',
    sync_details JSON COMMENT '同步详情',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='同步日志表';

-- ============================================
-- 视图定义（用于查询和计算）
-- ============================================

-- 视图：账户余额计算（由交易实时计算）
CREATE OR REPLACE VIEW v_account_balance AS
SELECT 
    a.id,
    a.user_id,
    a.ledger_id,
    a.name,
    a.account_type,
    a.currency,
    a.initial_balance,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' AND t.to_account_id = a.id THEN t.amount ELSE 0 END), 0) as total_transfer_in,
    COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.account_id = a.id THEN t.amount ELSE 0 END), 0) as total_transfer_out,
    a.initial_balance + 
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN t.type = 'income' AND t.to_account_id = a.id THEN t.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.account_id = a.id THEN t.amount ELSE 0 END), 0) as current_balance,
    a.is_active,
    a.created_at,
    a.updated_at
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id AND t.status = 'completed'
GROUP BY a.id, a.user_id, a.ledger_id, a.name, a.account_type, a.currency, a.initial_balance, a.is_active, a.created_at, a.updated_at;

-- 视图：信用卡已用额度计算（由交易实时计算）
CREATE OR REPLACE VIEW v_credit_card_balance AS
SELECT 
    cc.id,
    cc.user_id,
    cc.name,
    cc.credit_limit,
    cc.bill_day,
    cc.due_day,
    COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.credit_card_id = cc.id THEN t.amount ELSE 0 END), 0) as total_spent,
    COALESCE(SUM(CASE WHEN t.type = 'income' AND t.is_repayment = 1 AND t.credit_card_id = cc.id THEN t.amount ELSE 0 END), 0) as total_repaid,
    cc.credit_limit - COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.credit_card_id = cc.id THEN t.amount ELSE 0 END), 0) + 
    COALESCE(SUM(CASE WHEN t.type = 'income' AND t.is_repayment = 1 AND t.credit_card_id = cc.id THEN t.amount ELSE 0 END), 0) as available_credit,
    cc.is_active,
    cc.created_at,
    cc.updated_at
FROM credit_cards cc
LEFT JOIN transactions t ON t.credit_card_id = cc.id AND t.status = 'completed'
GROUP BY cc.id, cc.user_id, cc.name, cc.credit_limit, cc.bill_day, cc.due_day, cc.is_active, cc.created_at, cc.updated_at;

-- 视图：贷款还款进度计算（由还款记录实时计算）
CREATE OR REPLACE VIEW v_loan_progress AS
SELECT 
    l.id,
    l.user_id,
    l.name,
    l.type,
    l.total_amount,
    l.interest_rate,
    l.period_months,
    l.monthly_payment,
    l.start_date,
    l.end_date,
    l.status,
    COUNT(lp.id) as payment_count,
    COALESCE(SUM(CASE WHEN lp.status = 'paid' THEN lp.amount ELSE 0 END), 0) as total_paid,
    COALESCE(SUM(CASE WHEN lp.status = 'paid' THEN lp.principal ELSE 0 END), 0) as total_principal_paid,
    COALESCE(SUM(CASE WHEN lp.status = 'paid' THEN lp.interest ELSE 0 END), 0) as total_interest_paid,
    l.total_amount - COALESCE(SUM(CASE WHEN lp.status = 'paid' THEN lp.principal ELSE 0 END), 0) as remaining_principal,
    COUNT(CASE WHEN lp.status = 'paid' THEN 1 END) as paid_periods,
    l.period_months - COUNT(CASE WHEN lp.status = 'paid' THEN 1 END) as remaining_periods,
    l.created_at,
    l.updated_at
FROM loans l
LEFT JOIN loan_payments lp ON l.id = lp.loan_id
GROUP BY l.id, l.user_id, l.name, l.type, l.total_amount, l.interest_rate, l.period_months, l.monthly_payment, l.start_date, l.end_date, l.status, l.created_at, l.updated_at;

-- 视图：用户收支统计
CREATE OR REPLACE VIEW v_user_statistics AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    l.id as ledger_id,
    l.name as ledger_name,
    COUNT(DISTINCT a.id) as account_count,
    COUNT(DISTINCT t.id) as transaction_count,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as net_balance,
    MIN(t.transaction_date) as first_transaction_date,
    MAX(t.transaction_date) as last_transaction_date
FROM users u
LEFT JOIN ledgers l ON u.id = l.user_id
LEFT JOIN accounts a ON u.id = a.user_id
LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'completed'
GROUP BY u.id, u.name, l.id, l.name;

-- ============================================
-- 初始化默认数据
-- ============================================

-- 插入默认分类
INSERT INTO categories (user_id, name, type, icon, color, is_default, sort_order) VALUES
-- 默认支出分类
(0, '餐饮', 'expense', '🍜', '#FF6B6B', 1, 1),
(0, '交通', 'expense', '🚗', '#4ECDC4', 1, 2),
(0, '购物', 'expense', '🛒', '#45B7D1', 1, 3),
(0, '居住', 'expense', '🏠', '#96CEB4', 1, 4),
(0, '医疗', 'expense', '💊', '#DDA0DD', 1, 5),
(0, '教育', 'expense', '📚', '#98D8C8', 1, 6),
(0, '娱乐', 'expense', '🎮', '#F7DC6F', 1, 7),
(0, '通讯', 'expense', '📱', '#BB8FCE', 1, 8),
-- 默认收入分类
(0, '工资', 'income', '💰', '#2ECC71', 1, 100),
(0, '奖金', 'income', '🎁', '#3498DB', 1, 101),
(0, '投资', 'income', '📈', '#1ABC9C', 1, 102),
(0, '其他', 'income', '💵', '#95A5A6', 1, 199);

-- ============================================
-- 存储过程：更新维度使用次数
-- ============================================

DELIMITER //
DROP PROCEDURE IF EXISTS sp_update_dimension_usage//
CREATE PROCEDURE sp_update_dimension_usage(IN p_user_id INT)
BEGIN
    -- 更新成员使用次数
    UPDATE dimensions d
    SET usage_count = (
        SELECT COUNT(*) FROM transactions t 
        WHERE t.user_id = p_user_id AND t.member = d.name
    )
    WHERE d.user_id = p_user_id AND d.type = 'members';
    
    -- 更新商户使用次数
    UPDATE dimensions d
    SET usage_count = (
        SELECT COUNT(*) FROM transactions t 
        WHERE t.user_id = p_user_id AND t.merchant = d.name
    )
    WHERE d.user_id = p_user_id AND d.type = 'merchants';
    
    -- 更新标签使用次数
    UPDATE dimensions d
    SET usage_count = (
        SELECT COUNT(*) FROM transactions t, JSON_TABLE(t.tags, '$' COLUMNS (tag_name VARCHAR(100) PATH '$')) j
        WHERE t.user_id = p_user_id AND j.tag_name = d.name
    )
    WHERE d.user_id = p_user_id AND d.type = 'tags';
END//
DELIMITER ;

-- ============================================
-- 说明
-- ============================================
-- 
-- 本数据库设计遵循"数据为核心，标签化存储"原则：
-- 
-- 1. transactions 是唯一的事实来源
-- 2. 其他表都是对交易的定义或标签
-- 3. 所有衍生数据（余额、已用额度等）由交易实时计算
-- 
-- 未来新增功能只需：
-- 1. 给 transactions 添加新字段（作为标签）
-- 2. 创建对应的定义表（如需要）
-- 3. 无需修改现有数据结构
--
