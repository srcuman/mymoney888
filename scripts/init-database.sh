#!/bin/bash

# 数据库初始化和升级脚本
# 用于在部署时自动配置数据库结构，支持增量升级

set -e

echo "========================================="
echo "数据库初始化/升级脚本"
echo "========================================="

# 从环境变量获取数据库配置
DB_HOST=${DB_HOST:-mysql}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-mymoney888}
DB_NAME=${DB_NAME:-mymoney888}

# SQL文件路径
INIT_SQL_FILE="/app/database/init-db.sql"
UPGRADE_SQL_FILE="/app/database/add-net-value-fields.sql"

echo "数据库配置:"
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo "  用户: $DB_USER"
echo "  数据库: $DB_NAME"
echo ""

# 执行MySQL命令的辅助函数
mysql_cmd() {
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "$1"
}

# 检查表是否存在
table_exists() {
    local table=$1
    local result=$(mysql_cmd "SHOW TABLES LIKE '$table'" | grep "$table" || true)
    [ -n "$result" ]
}

# 检查字段是否存在
column_exists() {
    local table=$1
    local column=$2
    local result=$(mysql_cmd "SHOW COLUMNS FROM $table LIKE '$column'" | grep "$column" || true)
    [ -n "$result" ]
}

# 等待数据库就绪
echo "等待数据库就绪..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" &> /dev/null; then
        echo "数据库已就绪！"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "尝试连接数据库 ($attempt/$max_attempts)..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "错误: 无法连接到数据库！"
    exit 1
fi

# 检查数据库是否存在
echo "检查数据库是否存在..."
DB_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME'" | grep "$DB_NAME" || true)

if [ -z "$DB_EXISTS" ]; then
    echo "数据库 $DB_NAME 不存在，正在创建..."
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    echo "数据库创建成功！"
else
    echo "数据库 $DB_NAME 已存在"
fi

# 检查是否需要初始化表结构
echo "检查表结构..."
TABLE_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES" | wc -l)

if [ "$TABLE_COUNT" -le 1 ]; then
    echo "数据库为空，开始初始化表结构..."
    
    if [ -f "$INIT_SQL_FILE" ]; then
        echo "执行初始化SQL脚本: $INIT_SQL_FILE"
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$INIT_SQL_FILE"
        
        if [ $? -eq 0 ]; then
            echo "数据库初始化成功！"
        else
            echo "错误: 数据库初始化失败！"
            exit 1
        fi
    else
        echo "警告: 初始化SQL文件不存在: $INIT_SQL_FILE"
    fi
else
    echo "数据库已包含 $((TABLE_COUNT - 1)) 个表，执行增量升级..."
fi

# ========== 增量升级：检查并添加缺失的表和字段 ==========
echo ""
echo "========== 增量升级检查 =========="

# 投资账户表
if ! table_exists "investment_accounts"; then
    echo "创建表: investment_accounts"
    mysql_cmd "
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投资账户表';"
    echo "  ✓ investment_accounts 创建成功"
else
    echo "  ✓ investment_accounts 已存在"
fi

# 投资明细表
if ! table_exists "investment_details"; then
    echo "创建表: investment_details"
    mysql_cmd "
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投资明细表';"
    echo "  ✓ investment_details 创建成功"
else
    echo "  ✓ investment_details 已存在"
fi

# ========== 字段检查：投资明细表 ==========
# 检查并添加缺失的字段
DETAIL_COLUMNS=(
    "update_date:DATE:AFTER current_price:更新时间"
    "net_value_date:DATE:AFTER update_date:净值更新日期"
)

for col_def in "${DETAIL_COLUMNS[@]}"; do
    IFS=':' read -r col_name col_type after_col comment <<< "$col_def"
    if ! column_exists "investment_details" "$col_name"; then
        echo "添加字段: investment_details.$col_name"
        mysql_cmd "ALTER TABLE investment_details ADD COLUMN $col_name $col_type COMMENT '$comment' AFTER $after_col;" 2>/dev/null || \
        mysql_cmd "ALTER TABLE investment_details ADD COLUMN $col_name $col_type COMMENT '$comment';" 
        echo "  ✓ $col_name 字段添加成功"
    else
        echo "  ✓ investment_details.$col_name 已存在"
    fi
done

# 净值历史记录表
if ! table_exists "net_value_history"; then
    echo "创建表: net_value_history"
    mysql_cmd "
    CREATE TABLE IF NOT EXISTS net_value_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL COMMENT '用户ID',
        code VARCHAR(20) NOT NULL COMMENT '投资品种代码',
        name VARCHAR(100) NOT NULL COMMENT '投资品种名称',
        date DATE NOT NULL COMMENT '净值日期',
        price DECIMAL(15, 4) NOT NULL COMMENT '净值/价格',
        update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, date),
        INDEX idx_code_date (code, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='净值历史记录表';"
    echo "  ✓ net_value_history 创建成功"
else
    echo "  ✓ net_value_history 已存在"
fi

# ========== 字段检查：净值历史表 ==========
if table_exists "net_value_history"; then
    NVH_COLUMNS=(
        "update_time:TIMESTAMP:更新时间"
    )
    for col_def in "${NVH_COLUMNS[@]}"; do
        IFS=':' read -r col_name col_type comment <<< "$col_def"
        if ! column_exists "net_value_history" "$col_name"; then
            echo "添加字段: net_value_history.$col_name"
            mysql_cmd "ALTER TABLE net_value_history ADD COLUMN $col_name $col_type DEFAULT CURRENT_TIMESTAMP COMMENT '$comment';" 2>/dev/null || true
            echo "  ✓ $col_name 字段添加成功"
        else
            echo "  ✓ net_value_history.$col_name 已存在"
        fi
    done
fi

# 其他可能缺失的表（检查并创建）
OTHER_TABLES=(
    "dimensions:CREATE TABLE IF NOT EXISTS dimensions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, type ENUM('members','merchants','tags','payment_channels') NOT NULL, name VARCHAR(100) NOT NULL, extra_data JSON, is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_user_id (user_id), INDEX idx_type (type)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    "ledgers:CREATE TABLE IF NOT EXISTS ledgers (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(100) NOT NULL, type VARCHAR(20) DEFAULT 'default', is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_user_id (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    "members:CREATE TABLE IF NOT EXISTS members (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(100) NOT NULL, relationship VARCHAR(50), extra_data JSON, is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_user_id (user_id), INDEX idx_relationship (relationship)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
)

for table_def in "${OTHER_TABLES[@]}"; do
    IFS=':' read -r table_name create_sql <<< "$table_def"
    if ! table_exists "$table_name"; then
        echo "创建表: $table_name"
        mysql_cmd "$create_sql"
        echo "  ✓ $table_name 创建成功"
    else
        echo "  ✓ $table_name 已存在"
    fi
done

# 执行额外的升级SQL文件（如果存在）
if [ -f "$UPGRADE_SQL_FILE" ]; then
    echo ""
    echo "执行额外升级脚本: $UPGRADE_SQL_FILE"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$UPGRADE_SQL_FILE" || true
    echo "  升级SQL执行完成"
fi

# 验证所有关键表
echo ""
echo "========== 验证关键表 =========="
REQUIRED_TABLES=("users" "accounts" "categories" "transactions" "credit_cards" "credit_card_bills" "loans" "loan_payments" "installment_templates" "installments" "merchants" "projects" "members" "dimensions" "ledgers" "sync_logs" "user_settings" "investment_accounts" "investment_details" "net_value_history")

ALL_TABLES_EXIST=true
for table in "${REQUIRED_TABLES[@]}"; do
    if table_exists "$table"; then
        echo "  ✓ $table"
    else
        echo "  ✗ $table (不存在)"
        ALL_TABLES_EXIST=false
    fi
done

echo ""
echo "========================================="
echo "数据库初始化/升级完成"
echo "========================================="
