-- MyMoney888 数据库初始化脚本
-- 版本: 2.0.0

CREATE DATABASE IF NOT EXISTS mymoney888 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mymoney888;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 账套表
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 账户表
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT '现金/银行卡/信用卡/支付宝/微信/其他',
  balance DECIMAL(15,2) DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  INDEX idx_book_id (book_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT 'income/expense',
  parent_id INT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_book_id (book_id),
  INDEX idx_type (type),
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商家表
CREATE TABLE IF NOT EXISTS merchants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  category_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_book_id (book_id),
  UNIQUE KEY uk_book_merchant (book_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 交易表
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  user_id INT NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT 'income/expense/transfer',
  amount DECIMAL(15,2) NOT NULL,
  account_id INT NOT NULL COMMENT '收入/支出账户',
  to_account_id INT NULL COMMENT '转账目标账户',
  category_id INT NULL,
  merchant_id INT NULL,
  date DATE NOT NULL,
  remark TEXT,
  is_installment BOOLEAN DEFAULT FALSE COMMENT '是否为分期',
  installment_id INT NULL COMMENT '分期ID',
  installment_period INT NULL COMMENT '分期期数',
  installment_total_periods INT NULL COMMENT '分期总期数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
  INDEX idx_book_id (book_id),
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_date (date),
  INDEX idx_account_id (account_id),
  INDEX idx_category_id (category_id),
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_installment_id (installment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 分期模板表
CREATE TABLE IF NOT EXISTS installment_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  total_periods INT NOT NULL,
  period_amount DECIMAL(15,2) NOT NULL,
  account_id INT NOT NULL,
  category_id INT NULL,
  start_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_book_id (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 信用卡表
CREATE TABLE IF NOT EXISTS credit_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT UNIQUE NOT NULL,
  card_number VARCHAR(50) NOT NULL,
  credit_limit DECIMAL(15,2) NOT NULL,
  bill_day INT NOT NULL COMMENT '账单日',
  due_day INT NOT NULL COMMENT '还款日',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_bill_day (bill_day),
  INDEX idx_due_day (due_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 贷款表
CREATE TABLE IF NOT EXISTS loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL COMMENT '房贷/车贷/个人贷款/其他',
  total_amount DECIMAL(15,2) NOT NULL,
  remaining_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL COMMENT '利率',
  period_months INT NOT NULL COMMENT '期数（月）',
  paid_periods INT DEFAULT 0 COMMENT '已还期数',
  monthly_payment DECIMAL(15,2) NOT NULL COMMENT '月供金额',
  start_date DATE NOT NULL COMMENT '开始日期',
  account_id INT NULL COMMENT '还款账户',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  INDEX idx_book_id (book_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 还款记录表
CREATE TABLE IF NOT EXISTS payment_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loan_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  period_number INT NOT NULL COMMENT '还款期数',
  principal DECIMAL(15,2) NOT NULL COMMENT '本金',
  interest DECIMAL(15,2) NOT NULL COMMENT '利息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  INDEX idx_loan_id (loan_id),
  INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  budget DECIMAL(15,2) NOT NULL,
  spent DECIMAL(15,2) DEFAULT 0.00,
  start_date DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  INDEX idx_book_id (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 成员表
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  relationship VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  UNIQUE KEY uk_book_member (book_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 日志表
CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  level VARCHAR(20) NOT NULL COMMENT 'info/warn/error',
  message TEXT NOT NULL,
  context JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_level (level),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员账户（密码: admin123）
INSERT INTO users (username, password_hash, email, is_admin) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@mymoney888.com', TRUE)
ON DUPLICATE KEY UPDATE username=username;