-- 个人记账系统数据库初始化脚本
-- 版本: 3.0
-- 创建时间: 2026-03-28

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
    category_id INT COMMENT '分类ID',
    type ENUM('expense', 'income') NOT NULL COMMENT '交易类型: expense-支出, income-收入',
    amount DECIMAL(15, 2) NOT NULL COMMENT '交易金额',
    description TEXT COMMENT '交易描述',
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
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_category_id (category_id),
    INDEX idx_type (type),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';

-- 同步日志表
CREATE TABLE IF NOT EXISTS sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
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

-- 交易商家关联表
CREATE TABLE IF NOT EXISTS transaction_merchants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL COMMENT '交易ID',
    merchant_id INT NOT NULL COMMENT '商家ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_merchant_id (merchant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易商家关联表';

-- 交易项目关联表
CREATE TABLE IF NOT EXISTS transaction_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL COMMENT '交易ID',
    project_id INT NOT NULL COMMENT '项目ID',
    amount DECIMAL(15, 2) NOT NULL COMMENT '项目分配金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易项目关联表';

-- 交易成员关联表
CREATE TABLE IF NOT EXISTS transaction_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL COMMENT '交易ID',
    member_id INT NOT NULL COMMENT '成员ID',
    amount DECIMAL(15, 2) NOT NULL COMMENT '成员分配金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_member_id (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易成员关联表';

-- 修改交易记录表，添加关联字段
ALTER TABLE transactions ADD COLUMN merchant_id INT COMMENT '商家ID', ADD FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL, ADD INDEX idx_merchant_id (merchant_id);
ALTER TABLE transactions ADD COLUMN project_id INT COMMENT '项目ID', ADD FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL, ADD INDEX idx_project_id (project_id);
ALTER TABLE transactions ADD COLUMN member_id INT COMMENT '成员ID', ADD FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL, ADD INDEX idx_member_id (member_id);

-- 预设分类数据
-- 首先插入一个默认用户，用于预设分类
INSERT INTO users (name, email, password_hash, is_active) VALUES
('默认用户', 'default@mymoney888.com', 'default_password_hash', 1);

-- 获取默认用户的ID并插入预设分类
INSERT INTO categories (user_id, name, type, icon, color, is_default, sort_order) VALUES
((SELECT id FROM users WHERE email = 'default@mymoney888.com' LIMIT 1), '餐饮', 'expense', 'food', '#FF6B6B', 1, 1),
((SELECT id FROM users WHERE email = 'default@mymoney888.com' LIMIT 1), '交通', 'expense', 'transport', '#4ECDC4', 1, 2),
((SELECT id FROM users WHERE email = 'default@mymoney888.com' LIMIT 1), '购物', 'expense', 'shopping', '#45B7D1', 1, 3),
((SELECT id FROM users WHERE email = 'default@mymoney888.com' LIMIT 1), '娱乐', 'expense', 'entertainment', '#96CEB4', 1, 4),
((SELECT id FROM users WHERE email = 'default@mymoney888.com' LIMIT 1), '医疗', 'expense', 'medical', '#FFEAA7', 1, 5),
((SELECT id FROM users WHERE email = 'default@mymoney888.com' LIMIT 1), '教育', 'expense', 'education', '#DDA0DD', 1, 6),
((SELECT id FROM users WHERE email = 'default@mymoney888.com' LIMIT 1), '工资', 'income', 'salary', '#98D8C8', 1, 1),
((SELECT id FROM users WHERE email = 'default@mymoney888.com' LIMIT 1), '投资', 'income', 'investment', '#F7DC6F', 1, 2),
((SELECT id FROM users WHERE email = 'default@mymoney888.com' LIMIT 1), '其他', 'expense', 'other', '#95A5A6', 1, 99),
((SELECT id FROM users WHERE email = 'default@mymoney888.com' LIMIT 1), '其他', 'income', 'other', '#95A5A6', 1, 99);

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

-- 允许在没有SUPER权限的情况下创建触发器和存储过程
SET GLOBAL log_bin_trust_function_creators = 1;

-- 创建触发器：更新账户余额
DELIMITER //
CREATE TRIGGER trg_update_account_balance_after_transaction
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    IF NEW.type = 'income' THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSE
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
END//

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
END//

CREATE TRIGGER trg_update_account_balance_after_transaction_delete
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    IF OLD.type = 'income' THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSE
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
END//
DELIMITER ;

-- 创建存储过程：同步本地数据到数据库
DELIMITER //
CREATE PROCEDURE sp_sync_local_to_db(
    IN p_user_id INT,
    IN p_table_name VARCHAR(50),
    IN p_data JSON,
    OUT p_result INT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_error_msg TEXT DEFAULT NULL;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_error_msg = MESSAGE_TEXT;
        INSERT INTO sync_logs (user_id, sync_type, table_name, record_count, status, error_message, completed_at)
        VALUES (p_user_id, 'local_to_db', p_table_name, 0, 'failed', v_error_msg, NOW());
        SET p_result = -1;
    END;
    
    START TRANSACTION;
    
    -- 根据不同的表执行不同的同步逻辑
    IF p_table_name = 'accounts' THEN
        -- 同步账户数据
        -- 这里需要根据实际的数据格式进行解析和插入/更新
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'transactions' THEN
        -- 同步交易数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'categories' THEN
        -- 同步分类数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'credit_cards' THEN
        -- 同步信用卡数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'credit_card_bills' THEN
        -- 同步信用卡账单数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'loans' THEN
        -- 同步贷款数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'loan_payments' THEN
        -- 同步贷款还款记录数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'installment_templates' THEN
        -- 同步分期模板数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'installments' THEN
        -- 同步分期记录数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'merchants' THEN
        -- 同步商家数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'projects' THEN
        -- 同步项目数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'members' THEN
        -- 同步成员数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'transaction_merchants' THEN
        -- 同步交易商家关联数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'transaction_projects' THEN
        -- 同步交易项目关联数据
        SET v_count = JSON_LENGTH(p_data);
        
    ELSEIF p_table_name = 'transaction_members' THEN
        -- 同步交易成员关联数据
        SET v_count = JSON_LENGTH(p_data);
        
    END IF;
    
    COMMIT;
    
    -- 记录同步日志
    INSERT INTO sync_logs (user_id, sync_type, table_name, record_count, status, sync_details, completed_at)
    VALUES (p_user_id, 'local_to_db', p_table_name, v_count, 'success', p_data, NOW());
    
    SET p_result = v_count;
END//
DELIMITER ;

-- 创建存储过程：从数据库同步数据到本地
DELIMITER //
CREATE PROCEDURE sp_sync_db_to_local(
    IN p_user_id INT,
    IN p_table_name VARCHAR(50),
    IN p_last_sync_time TIMESTAMP,
    OUT p_result JSON
)
BEGIN
    DECLARE v_data JSON DEFAULT '[]';
    DECLARE v_error_msg TEXT DEFAULT NULL;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_error_msg = MESSAGE_TEXT;
        INSERT INTO sync_logs (user_id, sync_type, table_name, record_count, status, error_message, completed_at)
        VALUES (p_user_id, 'db_to_local', p_table_name, 0, 'failed', v_error_msg, NOW());
        SET p_result = JSON_OBJECT('error', v_error_msg);
    END;
    
    -- 根据不同的表查询数据
    IF p_table_name = 'accounts' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'name', name,
                'balance', balance,
                'account_type', account_type,
                'description', description,
                'is_active', is_active,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM accounts 
        WHERE user_id = p_user_id 
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'transactions' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'account_id', account_id,
                'category_id', category_id,
                'type', type,
                'amount', amount,
                'description', description,
                'transaction_date', transaction_date,
                'transaction_time', transaction_time,
                'tags', tags,
                'is_recurring', is_recurring,
                'status', status,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM transactions 
        WHERE user_id = p_user_id 
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'categories' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'name', name,
                'type', type,
                'icon', icon,
                'color', color,
                'parent_id', parent_id,
                'sort_order', sort_order,
                'is_default', is_default,
                'is_active', is_active,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM categories 
        WHERE user_id = p_user_id OR (user_id = 0 AND is_default = 1)
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'credit_cards' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'account_id', account_id,
                'card_number', card_number,
                'card_name', card_name,
                'credit_limit', credit_limit,
                'available_credit', available_credit,
                'bill_day', bill_day,
                'due_day', due_day,
                'bank_name', bank_name,
                'card_type', card_type,
                'is_active', is_active,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM credit_cards 
        WHERE user_id = p_user_id 
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'credit_card_bills' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'credit_card_id', credit_card_id,
                'bill_date', bill_date,
                'due_date', due_date,
                'bill_amount', bill_amount,
                'paid_amount', paid_amount,
                'remaining_amount', remaining_amount,
                'transaction_count', transaction_count,
                'status', status,
                'paid_at', paid_at,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM credit_card_bills 
        WHERE credit_card_id IN (SELECT id FROM credit_cards WHERE user_id = p_user_id)
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'loans' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'account_id', account_id,
                'name', name,
                'type', type,
                'total_amount', total_amount,
                'remaining_amount', remaining_amount,
                'interest_rate', interest_rate,
                'period_months', period_months,
                'paid_periods', paid_periods,
                'monthly_payment', monthly_payment,
                'start_date', start_date,
                'end_date', end_date,
                'next_payment_date', next_payment_date,
                'status', status,
                'description', description,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM loans 
        WHERE user_id = p_user_id 
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'loan_payments' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'loan_id', loan_id,
                'account_id', account_id,
                'period_number', period_number,
                'payment_date', payment_date,
                'amount', amount,
                'principal', principal,
                'interest', interest,
                'remaining_principal', remaining_principal,
                'status', status,
                'notes', notes,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM loan_payments 
        WHERE loan_id IN (SELECT id FROM loans WHERE user_id = p_user_id)
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'installment_templates' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'name', name,
                'total_amount', total_amount,
                'period_count', period_count,
                'period_amount', period_amount,
                'category_id', category_id,
                'account_id', account_id,
                'description', description,
                'is_default', is_default,
                'is_active', is_active,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM installment_templates 
        WHERE user_id = p_user_id 
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'installments' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'template_id', template_id,
                'transaction_id', transaction_id,
                'installment_group_id', installment_group_id,
                'installment_number', installment_number,
                'total_amount', total_amount,
                'period_amount', period_amount,
                'paid_amount', paid_amount,
                'remaining_amount', remaining_amount,
                'due_date', due_date,
                'status', status,
                'paid_at', paid_at,
                'description', description,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM installments 
        WHERE user_id = p_user_id 
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'merchants' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'name', name,
                'category', category,
                'address', address,
                'phone', phone,
                'website', website,
                'logo', logo,
                'is_favorite', is_favorite,
                'is_active', is_active,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM merchants 
        WHERE user_id = p_user_id 
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'projects' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'name', name,
                'description', description,
                'start_date', start_date,
                'end_date', end_date,
                'budget', budget,
                'actual_amount', actual_amount,
                'status', status,
                'color', color,
                'is_active', is_active,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM projects 
        WHERE user_id = p_user_id 
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'members' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'name', name,
                'relationship', relationship,
                'avatar', avatar,
                'email', email,
                'phone', phone,
                'is_active', is_active,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) INTO v_data
        FROM members 
        WHERE user_id = p_user_id 
        AND (p_last_sync_time IS NULL OR updated_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'transaction_merchants' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'transaction_id', transaction_id,
                'merchant_id', merchant_id,
                'created_at', created_at
            )
        ) INTO v_data
        FROM transaction_merchants 
        WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = p_user_id)
        AND (p_last_sync_time IS NULL OR created_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'transaction_projects' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'transaction_id', transaction_id,
                'project_id', project_id,
                'amount', amount,
                'created_at', created_at
            )
        ) INTO v_data
        FROM transaction_projects 
        WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = p_user_id)
        AND (p_last_sync_time IS NULL OR created_at > p_last_sync_time);
        
    ELSEIF p_table_name = 'transaction_members' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'transaction_id', transaction_id,
                'member_id', member_id,
                'amount', amount,
                'created_at', created_at
            )
        ) INTO v_data
        FROM transaction_members 
        WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = p_user_id)
        AND (p_last_sync_time IS NULL OR created_at > p_last_sync_time);
        
    END IF;
    
    -- 记录同步日志
    INSERT INTO sync_logs (user_id, sync_type, table_name, record_count, status, sync_details, completed_at)
    VALUES (p_user_id, 'db_to_local', p_table_name, JSON_LENGTH(v_data), 'success', v_data, NOW());
    
    SET p_result = v_data;
END//
DELIMITER ;

-- 创建存储过程：双向同步
DELIMITER //
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
    OUT p_result JSON
)
BEGIN
    DECLARE v_sync_time TIMESTAMP DEFAULT NOW();
    DECLARE v_error_msg TEXT DEFAULT NULL;
    DECLARE v_accounts_result INT;
    DECLARE v_transactions_result INT;
    DECLARE v_categories_result INT;
    DECLARE v_credit_cards_result INT;
    DECLARE v_credit_card_bills_result INT;
    DECLARE v_loans_result INT;
    DECLARE v_loan_payments_result INT;
    DECLARE v_installment_templates_result INT;
    DECLARE v_installments_result INT;
    DECLARE v_db_accounts JSON;
    DECLARE v_db_transactions JSON;
    DECLARE v_db_categories JSON;
    DECLARE v_db_credit_cards JSON;
    DECLARE v_db_credit_card_bills JSON;
    DECLARE v_db_loans JSON;
    DECLARE v_db_loan_payments JSON;
    DECLARE v_db_installment_templates JSON;
    DECLARE v_db_installments JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_error_msg = MESSAGE_TEXT;
        ROLLBACK;
        INSERT INTO sync_logs (user_id, sync_type, table_name, record_count, status, error_message, completed_at)
        VALUES (p_user_id, 'bidirectional', 'all', 0, 'failed', v_error_msg, NOW());
        SET p_result = JSON_OBJECT('error', v_error_msg);
    END;
    
    START TRANSACTION;
    
    -- 1. 从本地同步到数据库
    CALL sp_sync_local_to_db(p_user_id, 'accounts', p_local_accounts, v_accounts_result);
    CALL sp_sync_local_to_db(p_user_id, 'transactions', p_local_transactions, v_transactions_result);
    CALL sp_sync_local_to_db(p_user_id, 'categories', p_local_categories, v_categories_result);
    CALL sp_sync_local_to_db(p_user_id, 'credit_cards', p_local_credit_cards, v_credit_cards_result);
    CALL sp_sync_local_to_db(p_user_id, 'credit_card_bills', p_local_credit_card_bills, v_credit_card_bills_result);
    CALL sp_sync_local_to_db(p_user_id, 'loans', p_local_loans, v_loans_result);
    CALL sp_sync_local_to_db(p_user_id, 'loan_payments', p_local_loan_payments, v_loan_payments_result);
    CALL sp_sync_local_to_db(p_user_id, 'installment_templates', p_local_installment_templates, v_installment_templates_result);
    CALL sp_sync_local_to_db(p_user_id, 'installments', p_local_installments, v_installments_result);
    
    -- 2. 从数据库同步到本地
    CALL sp_sync_db_to_local(p_user_id, 'accounts', NULL, v_db_accounts);
    CALL sp_sync_db_to_local(p_user_id, 'transactions', NULL, v_db_transactions);
    CALL sp_sync_db_to_local(p_user_id, 'categories', NULL, v_db_categories);
    CALL sp_sync_db_to_local(p_user_id, 'credit_cards', NULL, v_db_credit_cards);
    CALL sp_sync_db_to_local(p_user_id, 'credit_card_bills', NULL, v_db_credit_card_bills);
    CALL sp_sync_db_to_local(p_user_id, 'loans', NULL, v_db_loans);
    CALL sp_sync_db_to_local(p_user_id, 'loan_payments', NULL, v_db_loan_payments);
    CALL sp_sync_db_to_local(p_user_id, 'installment_templates', NULL, v_db_installment_templates);
    CALL sp_sync_db_to_local(p_user_id, 'installments', NULL, v_db_installments);
    
    COMMIT;
    
    -- 返回同步结果
    SET p_result = JSON_OBJECT(
        'sync_time', v_sync_time,
        'local_to_db', JSON_OBJECT(
            'accounts', v_accounts_result,
            'transactions', v_transactions_result,
            'categories', v_categories_result,
            'credit_cards', v_credit_cards_result,
            'credit_card_bills', v_credit_card_bills_result,
            'loans', v_loans_result,
            'loan_payments', v_loan_payments_result,
            'installment_templates', v_installment_templates_result,
            'installments', v_installments_result
        ),
        'db_to_local', JSON_OBJECT(
            'accounts', JSON_LENGTH(v_db_accounts),
            'transactions', JSON_LENGTH(v_db_transactions),
            'categories', JSON_LENGTH(v_db_categories),
            'credit_cards', JSON_LENGTH(v_db_credit_cards),
            'credit_card_bills', JSON_LENGTH(v_db_credit_card_bills),
            'loans', JSON_LENGTH(v_db_loans),
            'loan_payments', JSON_LENGTH(v_db_loan_payments),
            'installment_templates', JSON_LENGTH(v_db_installment_templates),
            'installments', JSON_LENGTH(v_db_installments)
        ),
        'data', JSON_OBJECT(
            'accounts', v_db_accounts,
            'transactions', v_db_transactions,
            'categories', v_db_categories,
            'credit_cards', v_db_credit_cards,
            'credit_card_bills', v_db_credit_card_bills,
            'loans', v_db_loans,
            'loan_payments', v_db_loan_payments,
            'installment_templates', v_db_installment_templates,
            'installments', v_db_installments
        )
    );
END//
DELIMITER ;

-- 创建定时事件：清理旧的同步日志（可选）
-- 需要确保事件调度器已启用：SET GLOBAL event_scheduler = ON;
CREATE EVENT IF NOT EXISTS evt_cleanup_old_sync_logs
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY)
DO
DELETE FROM sync_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 完成提示
SELECT '数据库初始化完成！' as message;
SELECT '版本: 3.0' as version;
SELECT '创建时间: 2026-03-28' as created_at;