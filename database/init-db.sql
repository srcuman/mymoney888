-- =============================================================================
-- MyMoney888 数据库初始化脚本 (PostgreSQL)
-- 版本: 3.9.0
-- 数据库: PostgreSQL 12+
-- 创建时间: 2026-04-13
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
-- 【MySQL → PostgreSQL 迁移说明】
-- - INT AUTO_INCREMENT → SERIAL
-- - TINYINT(1) → BOOLEAN
-- - VARCHAR → VARCHAR 或 TEXT
-- - ENGINE=InnoDB → 无（PostgreSQL 默认使用堆表）
-- - COMMENT → COMMENT（在 CREATE TABLE 后用 COMMENT ON）
--
-- 【衍生数据计算规则】
-- - account.balance = SUM(income) - SUM(expense) + SUM(transfers)
-- - credit_card.used_credit = SUM(expense) - SUM(repayment)
-- - loan.remaining_amount = total_amount - SUM(payments)
-- - investment_account.total_value = 从 net_value_history 最新记录获取
--
-- =============================================================================

-- 创建数据库（需手动执行: CREATE DATABASE mymoney888;）

-- ============================================
-- 扩展（推荐安装）
-- ============================================

-- 启用 UUID 生成函数（可选）
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 基础数据表（不包含衍生值）
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.is_active IS '是否激活';
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 账户表（不含 balance，余额由交易计算得出）
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ledger_id VARCHAR(50) DEFAULT 'default',
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'general',
    currency VARCHAR(10) DEFAULT 'CNY',
    initial_balance DECIMAL(15, 2) DEFAULT 0.00,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE accounts IS '账户表（余额由交易计算）';
COMMENT ON COLUMN accounts.account_type IS '账户类型: general, cash, bank, alipay, wechat, credit_card, investment';
COMMENT ON COLUMN accounts.initial_balance IS '初始余额（仅用于记录，不参与计算）';
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_ledger_id ON accounts(ledger_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ledger_id VARCHAR(50) DEFAULT 'default',
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
    icon VARCHAR(50),
    color VARCHAR(20),
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

COMMENT ON TABLE categories IS '分类表';
COMMENT ON COLUMN categories.type IS '分类类型: expense-支出, income-收入';
COMMENT ON COLUMN categories.is_default IS '是否为默认分类';
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- ============================================
-- 核心数据表（交易是唯一事实来源）
-- ============================================

-- 交易记录表（核心事实数据）
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ledger_id VARCHAR(50) DEFAULT 'default',
    
    -- 账户引用
    account_id INTEGER NOT NULL,
    to_account_id INTEGER,
    
    -- 分类引用
    category_id INTEGER,
    
    -- 维度标签（依附于交易，不独立存储）
    member VARCHAR(100),
    merchant VARCHAR(100),
    tags JSONB,
    payment_channel VARCHAR(50),
    project VARCHAR(100),
    
    -- 交易类型
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    
    -- 金额（事实数据）
    amount DECIMAL(15, 2) NOT NULL,
    
    -- 交易信息
    description TEXT,
    notes TEXT,
    transaction_date DATE NOT NULL,
    transaction_time TIME,
    
    -- 信用卡特有字段
    is_credit_card_expense BOOLEAN DEFAULT FALSE,
    credit_card_id VARCHAR(50),
    billing_month VARCHAR(7),
    is_repayment BOOLEAN DEFAULT FALSE,
    
    -- 贷款特有字段
    loan_id VARCHAR(50),
    
    -- 投资特有字段
    investment_account_id VARCHAR(50),
    
    -- 周期性交易
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern VARCHAR(50),
    recurring_end_date DATE,
    
    -- 附件
    attachments JSONB,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

COMMENT ON TABLE transactions IS '交易记录表（核心事实数据）';
COMMENT ON COLUMN transactions.tags IS '标签数组';
COMMENT ON COLUMN transactions.is_credit_card_expense IS '是否为信用卡消费';
COMMENT ON COLUMN transactions.is_repayment IS '是否为还款';
COMMENT ON COLUMN transactions.is_recurring IS '是否为周期性交易';
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ledger_id ON transactions(ledger_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account_id ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card_id ON transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_loan_id ON transactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_investment_id ON transactions(investment_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
-- JSONB 索引用于 tags 数组查询
CREATE INDEX IF NOT EXISTS idx_transactions_tags ON transactions USING GIN(tags);

-- ============================================
-- 独立模块数据表（标签化存储）
-- ============================================

-- 信用卡表（定义，不含可用额度）
CREATE TABLE IF NOT EXISTS credit_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ledger_id VARCHAR(50) DEFAULT 'default',
    name VARCHAR(100) NOT NULL,
    card_number VARCHAR(50),
    linked_account_id INTEGER,
    credit_limit DECIMAL(15, 2) NOT NULL,
    bill_day INTEGER NOT NULL CHECK (bill_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    bank_name VARCHAR(100),
    card_type VARCHAR(50) DEFAULT 'general',
    currency VARCHAR(10) DEFAULT 'CNY',
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

COMMENT ON TABLE credit_cards IS '信用卡表（额度由交易计算）';
COMMENT ON COLUMN credit_cards.bill_day IS '账单日（1-31）';
COMMENT ON COLUMN credit_cards.due_day IS '还款日（1-31）';
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_ledger_id ON credit_cards(ledger_id);

-- 信用卡账单表
CREATE TABLE IF NOT EXISTS credit_card_bills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    credit_card_id VARCHAR(50) NOT NULL,
    bill_date DATE NOT NULL,
    billing_period VARCHAR(7) NOT NULL,
    due_date DATE NOT NULL,
    statement_amount DECIMAL(15, 2) NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial_paid', 'paid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE credit_card_bills IS '信用卡账单表';
CREATE INDEX IF NOT EXISTS idx_cc_bills_user_id ON credit_card_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_cc_bills_card_id ON credit_card_bills(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_cc_bills_period ON credit_card_bills(billing_period);
CREATE INDEX IF NOT EXISTS idx_cc_bills_due_date ON credit_card_bills(due_date);

-- 贷款表（定义，不含剩余金额）
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ledger_id VARCHAR(50) DEFAULT 'default',
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(10, 6) NOT NULL,
    period_months INTEGER NOT NULL,
    monthly_payment DECIMAL(15, 2),
    start_date DATE NOT NULL,
    end_date DATE,
    repayment_account_id INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'early_paid', 'defaulted')),
    color VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (repayment_account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

COMMENT ON TABLE loans IS '贷款表（剩余金额由还款记录计算）';
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_ledger_id ON loans(ledger_id);
CREATE INDEX IF NOT EXISTS idx_loans_type ON loans(type);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

-- 贷款还款记录表
CREATE TABLE IF NOT EXISTS loan_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    loan_id VARCHAR(50) NOT NULL,
    period_number INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    principal DECIMAL(15, 2),
    interest DECIMAL(15, 2),
    account_id INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'paid', 'missed', 'partial')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

COMMENT ON TABLE loan_payments IS '贷款还款记录表';
CREATE INDEX IF NOT EXISTS idx_loan_payments_user_id ON loan_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON loan_payments(payment_date);

-- 分期模板表
CREATE TABLE IF NOT EXISTS installment_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    period_count INTEGER NOT NULL,
    period_amount DECIMAL(15, 2) NOT NULL,
    category_id INTEGER,
    account_id INTEGER,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

COMMENT ON TABLE installment_templates IS '分期模板表';
CREATE INDEX IF NOT EXISTS idx_installment_templates_user_id ON installment_templates(user_id);

-- 分期记录表
CREATE TABLE IF NOT EXISTS installments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    template_id INTEGER,
    transaction_id VARCHAR(50),
    installment_group_id VARCHAR(50) NOT NULL,
    installment_number INTEGER NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    period_amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES installment_templates(id) ON DELETE SET NULL
);

COMMENT ON TABLE installments IS '分期记录表';
CREATE INDEX IF NOT EXISTS idx_installments_user_id ON installments(user_id);
CREATE INDEX IF NOT EXISTS idx_installments_group_id ON installments(installment_group_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);

-- ============================================
-- 投资管理表（净值由记录计算）
-- ============================================

-- 投资账户表
CREATE TABLE IF NOT EXISTS investment_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ledger_id VARCHAR(50) DEFAULT 'default',
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'other',
    currency VARCHAR(10) DEFAULT 'CNY',
    linked_account_id INTEGER,
    nav_update_frequency VARCHAR(20) DEFAULT 'monthly',
    description TEXT,
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

COMMENT ON TABLE investment_accounts IS '投资账户表';
COMMENT ON COLUMN investment_accounts.type IS '账户类型: fund, stock, bond, futures, forex, crypto, other';
COMMENT ON COLUMN investment_accounts.nav_update_frequency IS '净值更新频率: monthly, quarterly, half_yearly, yearly';
CREATE INDEX IF NOT EXISTS idx_investment_accounts_user_id ON investment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_accounts_type ON investment_accounts(type);

-- 投资明细表
CREATE TABLE IF NOT EXISTS investment_holdings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    investment_type VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    shares DECIMAL(15, 4) DEFAULT 0,
    cost_price DECIMAL(15, 4) DEFAULT 0,
    cost_basis DECIMAL(15, 2) DEFAULT 0,
    current_price DECIMAL(15, 4) DEFAULT 0,
    current_period_nav_tx_id INTEGER,
    last_nav_update DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE investment_holdings IS '投资明细表';
COMMENT ON COLUMN investment_holdings.cost_basis IS '成本总额';
COMMENT ON COLUMN investment_holdings.current_period_nav_tx_id IS '当前期间波动交易ID';
CREATE INDEX IF NOT EXISTS idx_investment_holdings_user_id ON investment_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_account_id ON investment_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_code ON investment_holdings(code);

-- 净值历史表
CREATE TABLE IF NOT EXISTS nav_history (
    id SERIAL PRIMARY KEY,
    holding_id INTEGER NOT NULL,
    record_date DATE NOT NULL,
    nav DECIMAL(15, 4) NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    is_period_end BOOLEAN DEFAULT FALSE,
    nav_tx_id INTEGER,
    daily_change DECIMAL(15, 2),
    daily_return DECIMAL(10, 6),
    notes TEXT,
    UNIQUE(holding_id, record_date)
);

COMMENT ON TABLE nav_history IS '净值历史表';
COMMENT ON COLUMN nav_history.is_period_end IS '是否期间末日';
COMMENT ON COLUMN nav_history.nav_tx_id IS '期间波动交易ID';
CREATE INDEX IF NOT EXISTS idx_nav_history_holding_id ON nav_history(holding_id);
CREATE INDEX IF NOT EXISTS idx_nav_history_date ON nav_history(record_date);

-- 投资内部转账表（记录现金到持仓的内部转账）
CREATE TABLE IF NOT EXISTS investment_transfers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    holding_id INTEGER NOT NULL,
    transfer_type VARCHAR(20) NOT NULL CHECK (transfer_type IN ('buy', 'sell', 'dividend_reinvest', 'split')),
    shares DECIMAL(15, 4) NOT NULL,
    price DECIMAL(15, 4) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(15, 2) DEFAULT 0,
    fee_account_id INTEGER,
    transfer_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE investment_transfers IS '投资内部转账表';
COMMENT ON COLUMN investment_transfers.transfer_type IS '转账类型: buy买入, sell卖出, dividend_reinvest分红再投, split拆分';
CREATE INDEX IF NOT EXISTS idx_investment_transfers_holding_id ON investment_transfers(holding_id);
CREATE INDEX IF NOT EXISTS idx_investment_transfers_date ON investment_transfers(transfer_date);

-- 投资损益记录表
CREATE TABLE IF NOT EXISTS investment_profit_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    account_id VARCHAR(50) NOT NULL,
    cycle VARCHAR(20) NOT NULL,
    period VARCHAR(20) NOT NULL,
    start_date DATE,
    end_date DATE,
    start_value DECIMAL(15, 2) DEFAULT 0,
    end_value DECIMAL(15, 2) DEFAULT 0,
    profit_loss DECIMAL(15, 2) DEFAULT 0,
    return_rate DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE investment_profit_records IS '投资损益记录表';
CREATE INDEX IF NOT EXISTS idx_profit_records_user_id ON investment_profit_records(user_id);
CREATE INDEX IF NOT EXISTS idx_profit_records_account_id ON investment_profit_records(account_id);
CREATE INDEX IF NOT EXISTS idx_profit_records_cycle_period ON investment_profit_records(cycle, period);

-- ============================================
-- 维度表（交易标签的预定义集合）
-- ============================================

-- 维度配置表
CREATE TABLE IF NOT EXISTS dimensions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ledger_id VARCHAR(50) DEFAULT 'default',
    type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    extra_data JSONB,
    usage_count INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE dimensions IS '维度配置表';
COMMENT ON COLUMN dimensions.type IS '维度类型: members, merchants, tags, payment_channels';
CREATE INDEX IF NOT EXISTS idx_dimensions_user_id ON dimensions(user_id);
CREATE INDEX IF NOT EXISTS idx_dimensions_ledger_id ON dimensions(ledger_id);
CREATE INDEX IF NOT EXISTS idx_dimensions_type ON dimensions(type);
CREATE INDEX IF NOT EXISTS idx_dimensions_usage ON dimensions(usage_count);
CREATE INDEX IF NOT EXISTS idx_dimensions_extra_data ON dimensions USING GIN(extra_data);

-- ============================================
-- 系统表
-- ============================================

-- 账套表
CREATE TABLE IF NOT EXISTS ledgers (
    id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE ledgers IS '账套表';
COMMENT ON COLUMN ledgers.is_default IS '是否默认账套';
CREATE INDEX IF NOT EXISTS idx_ledgers_user_id ON ledgers(user_id);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, setting_key)
);

COMMENT ON TABLE user_settings IS '用户设置表';
COMMENT ON COLUMN user_settings.setting_type IS '设置类型: string, number, boolean, json';
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- 用户默认值表
CREATE TABLE IF NOT EXISTS user_defaults (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ledger_id VARCHAR(50) DEFAULT 'default',
    expense_category VARCHAR(100),
    income_category VARCHAR(100),
    member VARCHAR(100),
    merchant VARCHAR(100),
    tag VARCHAR(100),
    payment_channel VARCHAR(100),
    account_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    UNIQUE(user_id, ledger_id)
);

COMMENT ON TABLE user_defaults IS '用户默认值表';
CREATE INDEX IF NOT EXISTS idx_user_defaults_user_id ON user_defaults(user_id);

-- 同步日志表
CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ledger_id VARCHAR(50) DEFAULT 'default',
    sync_type VARCHAR(20) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    sync_details JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE sync_logs IS '同步日志表';
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at);

-- ============================================
-- 视图定义（用于查询和计算）
-- ============================================

-- 视图：账户余额计算
CREATE OR REPLACE VIEW v_account_balance AS
SELECT 
    a.id,
    a.user_id,
    a.ledger_id,
    a.name,
    a.account_type,
    a.currency,
    a.initial_balance,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::DECIMAL(15,2) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::DECIMAL(15,2) as total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' AND t.to_account_id = a.id THEN t.amount ELSE 0 END), 0)::DECIMAL(15,2) as total_transfer_in,
    COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.account_id = a.id THEN t.amount ELSE 0 END), 0)::DECIMAL(15,2) as total_transfer_out,
    (a.initial_balance + 
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN t.type = 'income' AND t.to_account_id = a.id THEN t.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.account_id = a.id THEN t.amount ELSE 0 END), 0))::DECIMAL(15,2) as current_balance,
    a.is_active,
    a.created_at,
    a.updated_at
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id AND t.status = 'completed'
GROUP BY a.id, a.user_id, a.ledger_id, a.name, a.account_type, a.currency, a.initial_balance, a.is_active, a.created_at, a.updated_at;

-- 视图：信用卡已用额度
CREATE OR REPLACE VIEW v_credit_card_balance AS
SELECT 
    cc.id,
    cc.user_id,
    cc.name,
    cc.credit_limit,
    cc.bill_day,
    cc.due_day,
    COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.credit_card_id = CAST(cc.id AS VARCHAR) THEN t.amount ELSE 0 END), 0)::DECIMAL(15,2) as total_spent,
    COALESCE(SUM(CASE WHEN t.type = 'income' AND t.is_repayment = TRUE AND t.credit_card_id = CAST(cc.id AS VARCHAR) THEN t.amount ELSE 0 END), 0)::DECIMAL(15,2) as total_repaid,
    (cc.credit_limit - 
    COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.credit_card_id = CAST(cc.id AS VARCHAR) THEN t.amount ELSE 0 END), 0) + 
    COALESCE(SUM(CASE WHEN t.type = 'income' AND t.is_repayment = TRUE AND t.credit_card_id = CAST(cc.id AS VARCHAR) THEN t.amount ELSE 0 END), 0))::DECIMAL(15,2) as available_credit,
    cc.is_active,
    cc.created_at,
    cc.updated_at
FROM credit_cards cc
LEFT JOIN transactions t ON t.credit_card_id = CAST(cc.id AS VARCHAR) AND t.status = 'completed'
GROUP BY cc.id, cc.user_id, cc.name, cc.credit_limit, cc.bill_day, cc.due_day, cc.is_active, cc.created_at, cc.updated_at;

-- 视图：贷款还款进度
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
    COALESCE(SUM(CASE WHEN lp.status = 'paid' THEN lp.amount ELSE 0 END), 0)::DECIMAL(15,2) as total_paid,
    COALESCE(SUM(CASE WHEN lp.status = 'paid' THEN lp.principal ELSE 0 END), 0)::DECIMAL(15,2) as total_principal_paid,
    COALESCE(SUM(CASE WHEN lp.status = 'paid' THEN lp.interest ELSE 0 END), 0)::DECIMAL(15,2) as total_interest_paid,
    (l.total_amount - COALESCE(SUM(CASE WHEN lp.status = 'paid' THEN lp.principal ELSE 0 END), 0))::DECIMAL(15,2) as remaining_principal,
    COUNT(CASE WHEN lp.status = 'paid' THEN 1 END) as paid_periods,
    l.period_months - COUNT(CASE WHEN lp.status = 'paid' THEN 1 END) as remaining_periods,
    l.created_at,
    l.updated_at
FROM loans l
LEFT JOIN loan_payments lp ON l.id::VARCHAR = lp.loan_id
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
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::DECIMAL(15,2) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::DECIMAL(15,2) as total_expense,
    (COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0))::DECIMAL(15,2) as net_balance,
    MIN(t.transaction_date) as first_transaction_date,
    MAX(t.transaction_date) as last_transaction_date
FROM users u
LEFT JOIN ledgers l ON u.id = l.user_id
LEFT JOIN accounts a ON u.id = a.user_id
LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'completed'
GROUP BY u.id, u.name, l.id, l.name;

-- ============================================
-- 函数：更新维度使用次数
-- ============================================

CREATE OR REPLACE FUNCTION update_dimension_usage(p_user_id INTEGER)
RETURNS VOID AS $$
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

    -- 更新标签使用次数（使用 JSONB 操作符）
    UPDATE dimensions d
    SET usage_count = (
        SELECT COUNT(*) FROM transactions t, jsonb_array_elements_text(t.tags) as tag
        WHERE t.user_id = p_user_id AND tag = d.name
    )
    WHERE d.user_id = p_user_id AND d.type = 'tags';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加 updated_at 触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_card_bills_updated_at BEFORE UPDATE ON credit_card_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loan_payments_updated_at BEFORE UPDATE ON loan_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installment_templates_updated_at BEFORE UPDATE ON installment_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON installments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_accounts_updated_at BEFORE UPDATE ON investment_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_holdings_updated_at BEFORE UPDATE ON investment_holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dimensions_updated_at BEFORE UPDATE ON dimensions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ledgers_updated_at BEFORE UPDATE ON ledgers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_defaults_updated_at BEFORE UPDATE ON user_defaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 初始化默认数据
-- ============================================

-- 插入默认用户（user_id = 0 表示系统预设）
INSERT INTO users (id, name, email, password_hash) VALUES
(0, 'System', 'system@mymoney888.com', 'system')
ON CONFLICT DO NOTHING;

-- 插入默认分类（user_id = 0 表示系统预设）
INSERT INTO categories (id, user_id, ledger_id, name, type, icon, color, is_default, sort_order) VALUES
-- 默认支出分类
(1, 0, 'default', '餐饮', 'expense', 'restaurant', '#FF6B6B', TRUE, 1),
(2, 0, 'default', '交通', 'expense', 'car', '#4ECDC4', TRUE, 2),
(3, 0, 'default', '购物', 'expense', 'shopping-bag', '#45B7D1', TRUE, 3),
(4, 0, 'default', '居住', 'expense', 'home', '#96CEB4', TRUE, 4),
(5, 0, 'default', '医疗', 'expense', 'pill', '#DDA0DD', TRUE, 5),
(6, 0, 'default', '教育', 'expense', 'graduation-cap', '#98D8C8', TRUE, 6),
(7, 0, 'default', '娱乐', 'expense', 'gamepad-2', '#F7DC6F', TRUE, 7),
(8, 0, 'default', '通讯', 'expense', 'smartphone', '#BB8FCE', TRUE, 8),
-- 默认收入分类
(101, 0, 'default', '工资', 'income', 'briefcase', '#2ECC71', TRUE, 100),
(102, 0, 'default', '奖金', 'income', 'gift', '#3498DB', TRUE, 101),
(103, 0, 'default', '投资', 'income', 'trending-up', '#1ABC9C', TRUE, 102),
(104, 0, 'default', '其他', 'income', 'plus-circle', '#95A5A6', TRUE, 199)
ON CONFLICT DO NOTHING;

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
-- PostgreSQL 特有功能：
-- 1. SERIAL 替代 AUTO_INCREMENT
-- 2. BOOLEAN 替代 TINYINT(1)
-- 3. JSONB 用于 JSON 数据存储和索引
-- 4. 自动触发器更新 updated_at
-- 5. CHECK 约束替代 ENUM
-- 
-- 未来新增功能只需：
-- 1. 给 transactions 添加新字段（作为标签）
-- 2. 创建对应的定义表（如需要）
-- 3. 无需修改现有数据结构
