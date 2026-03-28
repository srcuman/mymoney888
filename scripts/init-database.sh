#!/bin/bash

# 数据库初始化脚本
# 用于在部署时自动配置数据库结构

set -e

echo "========================================="
echo "数据库初始化脚本"
echo "========================================="

# 从环境变量获取数据库配置
DB_HOST=${DB_HOST:-mysql}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-mymoney888}
DB_NAME=${DB_NAME:-mymoney888}

# 初始化SQL文件路径
INIT_SQL_FILE="/app/database/init-db.sql"

echo "数据库配置:"
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo "  用户: $DB_USER"
echo "  数据库: $DB_NAME"
echo ""

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
            
            # 显示创建的表
            echo ""
            echo "已创建的表:"
            mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES"
        else
            echo "错误: 数据库初始化失败！"
            exit 1
        fi
    else
        echo "警告: 初始化SQL文件不存在: $INIT_SQL_FILE"
        echo "跳过数据库初始化..."
    fi
else
    echo "数据库已包含 $((TABLE_COUNT - 1)) 个表，跳过初始化"
fi

# 验证关键表是否存在
echo ""
echo "验证关键表..."
REQUIRED_TABLES=("users" "accounts" "categories" "transactions" "credit_cards" "credit_card_bills" "loans" "loan_payments" "installment_templates" "installments" "merchants" "projects" "members" "transaction_merchants" "transaction_projects" "transaction_members" "sync_logs" "user_settings")

ALL_TABLES_EXIST=true
for table in "${REQUIRED_TABLES[@]}"; do
    TABLE_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE '$table'" | grep "$table" || true)
    if [ -n "$TABLE_EXISTS" ]; then
        echo "  ✓ $table"
    else
        echo "  ✗ $table (不存在)"
        ALL_TABLES_EXIST=false
    fi
done

if [ "$ALL_TABLES_EXIST" = true ]; then
    echo ""
    echo "所有关键表验证通过！"
else
    echo ""
    echo "警告: 部分关键表不存在，请检查数据库初始化！"
fi

echo ""
echo "========================================="
echo "数据库初始化完成"
echo "========================================="
