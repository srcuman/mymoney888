-- 个人记账系统数据库初始化脚本
-- 版本: 3.8.0
-- 创建时间: 2026-04-12
-- 说明: 此版本不依赖数据库全局权限，仅需普通数据库用户权限即可运行
--       触发器、存储过程、事件等功能已移除，需在应用层实现
--       配合 DataStore + MySQL 双份存储架构

-- 创建数据库
CREATE DATABASE IF NOT EXISTS mymoney888 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mymoney888;

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

-- 账户表
CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '账户名称',
    balance DECIMAL(15, 2) DEFAULT 0.00 COMMENT '账户余额',
    account_type VARCHAR(50) DEFAULT 'general' COMMENT '账户类型: general, cash, bank, alipay, wechat, credit_card',
    description TEXT COMMENT '账户描述',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_account_type (account_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户表';

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

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    account_id INT NOT NULL COMMENT '账户ID',
    to_account_id INT COMMENT '目标账户ID（转账时使用）',
    category_id INT COMMENT '分类ID',
    merchant_id INT COMMENT '商家ID（存储名称，不做外键约束）',
    project_id INT COMMENT '项目ID（存储名称，不做外键约束）',
    member_id INT COMMENT '成员ID（存储名称，不做外键约束）',
    type ENUM('expense', 'income', 'transfer') NOT NULL COMMENT '交易类型: expense-支出, income-收入, transfer-转账',
    amount DECIMAL(15, 2) NOT NULL COMMENT '交易金额',
    description TEXT COMMENT '交易描述',
    notes TEXT COMMENT '备注',
    transaction_date DATE NOT NULL COMMENT '交易日期',
    transaction_time TIME COMMENT '交易时间',
    tags JSON COMMENT '交易标签',
    attachments JSON COMMENT '附件信息',
    is_recurring TINYINT(1) DEFAULT 0 COMMENT '是否为周期性交易',
    recurring_pattern VARCHAR(50) COMMENT '周期模式: daily, weekly, monthly, yearly',
    recurring_end_date DATE COMMENT '周期结束日期',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed' COMMENT '交易状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    synced_at TIMESTAMP NULL COMMENT '同步时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_to_account_id (to_account_id),
    INDEX idx_category_id (category_id),
    INDEX idx_type (type),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';

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

-- 信用卡表
CREATE TABLE IF NOT EXISTS credit_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    account_id INT NOT NULL COMMENT '关联账户ID',
    card_number VARCHAR(50) NOT NULL COMMENT '卡号（脱敏）',
    card_name VARCHAR(100) COMMENT '卡片名称',
    credit_limit DECIMAL(15, 2) NOT NULL COMMENT '信用额度',
    available_credit DECIMAL(15, 2) COMMENT '可用额度',
    bill_day INT NOT NULL COMMENT '账单日（1-31）',
    due_day INT NOT NULL COMMENT '还款日（1-31）',
    bank_name VARCHAR(100) COMMENT '发卡银行',
    card_type VARCHAR(50) DEFAULT 'general' COMMENT '卡片类型',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_bill_day (bill_day),
    INDEX idx_due_day (due_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='信用卡表';

-- 信用卡账单表
CREATE TABLE IF NOT EXISTS credit_card_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    credit_card_id INT NOT NULL COMMENT '信用卡ID',
    bill_date DATE NOT NULL COMMENT '账单日期',
    due_date DATE NOT NULL COMMENT '还款到期日',
    bill_amount DECIMAL(15, 2) NOT NULL COMMENT '账单金额',
    paid_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '已还金额',
    remaining_amount DECIMAL(15, 2) COMMENT '剩余金额',
    transaction_count INT DEFAULT 0 COMMENT '交易笔数',
    status ENUM('unpaid', 'partial_paid', 'paid', 'overdue') DEFAULT 'unpaid' COMMENT '账单状态',
    paid_at TIMESTAMP NULL COMMENT '还款时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE CASCADE,
    INDEX idx_credit_card_id (credit_card_id),
    INDEX idx_bill_date (bill_date),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='信用卡账单表';

-- 贷款表
CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    account_id INT COMMENT '还款账户ID',
    name VARCHAR(100) NOT NULL COMMENT '贷款名称',
    type ENUM('mortgage', 'car_loan', 'personal_loan', 'business_loan', 'student_loan', 'other') NOT NULL COMMENT '贷款类型',
    total_amount DECIMAL(15, 2) NOT NULL COMMENT '贷款总额',
    remaining_amount DECIMAL(15, 2) NOT NULL COMMENT '剩余本金',
    interest_rate DECIMAL(5, 2) NOT NULL COMMENT '年利率（%）',
    period_months INT NOT NULL COMMENT '贷款期限（月）',
    paid_periods INT DEFAULT 0 COMMENT '已还期数',
    monthly_payment DECIMAL(15, 2) COMMENT '月供金额',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    next_payment_date DATE COMMENT '下次还款日期',
    status ENUM('active', 'paid_off', 'early_paid', 'defaulted') DEFAULT 'active' COMMENT '贷款状态',
    description TEXT COMMENT '贷款描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_next_payment_date (next_payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='贷款表';

-- 贷款还款记录表
CREATE TABLE IF NOT EXISTS loan_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL COMMENT '贷款ID',
    account_id INT COMMENT '还款账户ID',
    period_number INT NOT NULL COMMENT '期数',
    payment_date DATE NOT NULL COMMENT '还款日期',
    amount DECIMAL(15, 2) NOT NULL COMMENT '还款总额',
    principal DECIMAL(15, 2) COMMENT '本金',
    interest DECIMAL(15, 2) COMMENT '利息',
    remaining_principal DECIMAL(15, 2) COMMENT '剩余本金',
    status ENUM('scheduled', 'paid', 'missed', 'partial') DEFAULT 'scheduled' COMMENT '还款状态',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
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
    transaction_id INT COMMENT '关联交易ID',
    installment_group_id VARCHAR(50) NOT NULL COMMENT '分期组ID',
    installment_number INT NOT NULL COMMENT '分期序号',
    total_amount DECIMAL(15, 2) NOT NULL COMMENT '分期总额',
    period_amount DECIMAL(15, 2) NOT NULL COMMENT '每期金额',
    paid_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '已还金额',
    remaining_amount DECIMAL(15, 2) COMMENT '剩余金额',
    due_date DATE NOT NULL COMMENT '还款日期',
    status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending' COMMENT '分期状态',
    paid_at TIMESTAMP NULL COMMENT '还款时间',
    description TEXT COMMENT '描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES installment_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_template_id (template_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_installment_group_id (installment_group_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分期记录表';

-- 商家表
CREATE TABLE IF NOT EXISTS merchants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '商家名称',
    category VARCHAR(50) COMMENT '商家分类',
    address TEXT COMMENT '商家地址',
    phone VARCHAR(20) COMMENT '联系电话',
    website VARCHAR(255) COMMENT '网站地址',
    logo VARCHAR(255) COMMENT '商家logo',
    is_favorite TINYINT(1) DEFAULT 0 COMMENT '是否收藏',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_is_favorite (is_favorite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商家表';

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '项目名称',
    description TEXT COMMENT '项目描述',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    budget DECIMAL(15, 2) COMMENT '项目预算',
    actual_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '实际金额',
    status ENUM('active', 'completed', 'cancelled', 'planned') DEFAULT 'active' COMMENT '项目状态',
    color VARCHAR(20) COMMENT '项目颜色',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- 成员表
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '所属用户ID',
    name VARCHAR(100) NOT NULL COMMENT '成员姓名',
    relationship VARCHAR(50) COMMENT '关系',
    avatar VARCHAR(255) COMMENT '头像',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '电话',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_relationship (relationship)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成员表';

-- 投资账户表
CREATE TABLE IF NOT EXISTS investment_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '投资账户名称',
    type ENUM('fund', 'stock', 'bond', 'other') DEFAULT 'other' COMMENT '账户类型',
    description TEXT COMMENT '账户描述',
    total_asset DECIMAL(15, 2) DEFAULT 0.00 COMMENT '总资产',
    profit_loss DECIMAL(15, 2) DEFAULT 0.00 COMMENT '盈亏',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投资账户表';

-- 投资明细表
CREATE TABLE IF NOT EXISTS investment_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    account_id INT NOT NULL COMMENT '投资账户ID',
    type ENUM('fund', 'stock', 'bond', 'other') NOT NULL COMMENT '投资品种类型',
    code VARCHAR(20) NOT NULL COMMENT '投资品种代码',
    name VARCHAR(100) NOT NULL COMMENT '投资品种名称',
    shares DECIMAL(15, 4) DEFAULT 0.0000 COMMENT '持有份额',
    cost_price DECIMAL(15, 4) DEFAULT 0.00 COMMENT '成本价',
    current_price DECIMAL(15, 4) DEFAULT 0.00 COMMENT '当前价格',
    update_date DATE COMMENT '更新时间',
    net_value_date DATE COMMENT '净值更新日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES investment_accounts(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投资明细表';

-- 净值历史记录表
CREATE TABLE IF NOT EXISTS net_value_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    account_id VARCHAR(50) COMMENT '投资账户ID',
    code VARCHAR(20) COMMENT '投资品种代码',
    name VARCHAR(100) COMMENT '投资品种名称',
    value DECIMAL(15, 2) COMMENT '资产总值',
    date DATE NOT NULL COMMENT '净值日期',
    profit DECIMAL(15, 2) DEFAULT 0.00 COMMENT '盈亏金额',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date),
    INDEX idx_account_id (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='净值历史记录表';

-- 投资损益记录表
CREATE TABLE IF NOT EXISTS investment_profit_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    account_id VARCHAR(50) NOT NULL COMMENT '投资账户ID',
    transaction_id VARCHAR(50) COMMENT '关联交易ID',
    cycle ENUM('monthly', 'quarterly', 'yearly') NOT NULL COMMENT '结算周期',
    period VARCHAR(20) NOT NULL COMMENT '周期标识（如 2026-01, 2026-Q1）',
    start_value DECIMAL(15, 2) DEFAULT 0.00 COMMENT '期初价值',
    end_value DECIMAL(15, 2) DEFAULT 0.00 COMMENT '期末价值',
    profit DECIMAL(15, 2) DEFAULT 0.00 COMMENT '损益金额',
    date DATE COMMENT '记录日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_cycle_period (cycle, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投资损益记录表';

-- 维度配置表（包含成员、商家、标签、支付渠道等）
CREATE TABLE IF NOT EXISTS dimensions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    type ENUM('members', 'merchants', 'tags', 'payment_channels') NOT NULL COMMENT '维度类型',
    name VARCHAR(100) NOT NULL COMMENT '维度名称',
    extra_data JSON COMMENT '额外数据',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='维度配置表';

-- 账套表
CREATE TABLE IF NOT EXISTS ledgers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '账套名称',
    description TEXT COMMENT '账套描述',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账套表';

-- 用户设置默认值表
CREATE TABLE IF NOT EXISTS user_defaults (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    expense_category VARCHAR(100) COMMENT '默认支出分类',
    income_category VARCHAR(100) COMMENT '默认收入分类',
    member VARCHAR(100) COMMENT '默认成员',
    merchant VARCHAR(100) COMMENT '默认商家',
    tag VARCHAR(100) COMMENT '默认标签',
    payment_channel VARCHAR(100) COMMENT '默认支付渠道',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_defaults (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置默认值表';

-- ============================================
-- 视图定义（视图不需要特殊权限）
-- ============================================

-- 创建视图：用户账户余额汇总
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

-- 创建视图：用户收支统计
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

-- 创建视图：月度收支统计
CREATE OR REPLACE VIEW v_monthly_statistics AS
SELECT 
    user_id,
    DATE_FORMAT(transaction_date, '%Y-%m') as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
    COUNT(*) as transaction_count
FROM transactions
WHERE status = 'completed'
GROUP BY user_id, DATE_FORMAT(transaction_date, '%Y-%m');

-- ============================================
-- 预设数据（默认用户和分类）
-- ============================================

-- 插入默认用户
INSERT INTO users (name, email, password_hash, is_active) VALUES
('默认用户', 'default@mymoney888.com', 'default_password_hash', 1)
ON DUPLICATE KEY UPDATE name = name;

-- 插入预设支出分类（参考随手记、挖财等软件）
INSERT INTO categories (user_id, name, type, icon, color, is_default, sort_order) VALUES
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '餐饮', 'expense', 'restaurant', '#FF6B6B', 1, 1),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '交通出行', 'expense', 'car', '#4ECDC4', 1, 2),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '购物', 'expense', 'shopping', '#45B7D1', 1, 3),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '日用服务', 'expense', 'service', '#96CEB4', 1, 4),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '娱乐', 'expense', 'entertainment', '#FFEAA7', 1, 5),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '运动健身', 'expense', 'fitness', '#DDA0DD', 1, 6),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '医疗健康', 'expense', 'medical', '#98D8C8', 1, 7),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '教育', 'expense', 'education', '#F7DC6F', 1, 8),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '住房', 'expense', 'home', '#BB8FCE', 1, 9),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '通讯', 'expense', 'phone', '#85C1E9', 1, 10),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '人情社交', 'expense', 'social', '#F8B500', 1, 11),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '旅游', 'expense', 'travel', '#00CED1', 1, 12),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '宠物', 'expense', 'pet', '#FFB6C1', 1, 13),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '保险', 'expense', 'insurance', '#B8B8B8', 1, 14),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '投资理财', 'expense', 'investment', '#D4A574', 1, 15),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '其他', 'expense', 'other', '#95A5A6', 1, 99);

-- 插入预设收入分类
INSERT INTO categories (user_id, name, type, icon, color, is_default, sort_order) VALUES
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '工资收入', 'income', 'salary', '#27AE60', 1, 1),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '奖金外快', 'income', 'bonus', '#2ECC71', 1, 2),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '投资收入', 'income', 'investment', '#F39C12', 1, 3),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '副业收入', 'income', 'side_job', '#E74C3C', 1, 4),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '经营收入', 'income', 'business', '#9B59B6', 1, 5),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '礼金收入', 'income', 'gift', '#E91E63', 1, 6),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '退款回收', 'income', 'refund', '#00BCD4', 1, 7),
((SELECT id FROM users WHERE email = 'default@mymoney888.com'), '其他收入', 'income', 'other', '#95A5A6', 1, 99);

-- ============================================
-- 权限配置说明
-- ============================================
-- 
-- 此脚本不依赖任何全局权限或特殊权限，只需数据库普通用户权限即可执行。
-- 
-- 建议的数据库用户权限配置：
-- CREATE USER 'mymoney888'@'%' IDENTIFIED BY 'your_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, REFERENCES ON mymoney888.* TO 'mymoney888'@'%';
-- FLUSH PRIVILEGES;
--
-- 如需创建视图，还需添加：
-- GRANT CREATE VIEW ON mymoney888.* TO 'mymoney888'@'%';
--
-- 注意：本脚本移除了以下需要特殊权限的功能：
--   - 触发器（TRIGGER） - 需在应用层实现账户余额更新
--   - 存储过程（PROCEDURE） - 需在应用层实现数据同步
--   - 事件调度器（EVENT） - 需在应用层实现定时任务
--
-- ============================================

-- 完成提示
SELECT '数据库初始化完成！' as message;
SELECT '版本: 3.8.0' as version;
SELECT '说明: 此版本支持 DataStore + MySQL 双份存储架构' as note;
