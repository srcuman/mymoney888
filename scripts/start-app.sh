#!/bin/sh

# 应用启动脚本
# 在启动应用前初始化数据库

set -e

echo "========================================="
echo "MyMoney888 启动脚本"
echo "========================================="

# 检查是否需要初始化数据库
if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
    echo "检测到数据库配置，开始初始化数据库..."
    
    # 等待数据库就绪
    echo "等待数据库就绪..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" &> /dev/null; then
            echo "数据库已就绪！"
            break
        else
            echo "连接失败，尝试连接数据库 ($attempt/$max_attempts)..."
            echo "连接信息: $DB_USER@$DB_HOST:${DB_PORT:-3306}"
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo "错误: 无法连接到数据库 $DB_USER@$DB_HOST:${DB_PORT:-3306}"
        echo "请检查数据库配置和网络连接"
        echo "跳过数据库初始化，应用将继续启动..."
    else
        # 检查数据库是否存在
        DB_EXISTS=$(mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME'" | grep "$DB_NAME" || true)
        
        if [ -z "$DB_EXISTS" ]; then
            echo "数据库 $DB_NAME 不存在，正在创建..."
            mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            echo "数据库创建成功！"
        fi
        
        # 检查是否需要初始化表结构
        TABLE_COUNT=$(mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES" | wc -l)
        
        # 检查关键表是否存在（使用简单的字符串检查）
        REQUIRED_TABLES="users accounts categories transactions credit_cards credit_card_bills loans loan_payments installment_templates installments merchants projects members transaction_merchants transaction_projects transaction_members sync_logs user_settings"
        
        # 检查是否有任何必需的表不存在
        TABLES_EXIST=$(mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES" | grep -E "users|accounts|categories|transactions|credit_cards|credit_card_bills|loans|loan_payments|installment_templates|installments|merchants|projects|members|transaction_merchants|transaction_projects|transaction_members|sync_logs|user_settings" | wc -l)
        
        if [ "$TABLE_COUNT" -le 1 ] || [ "$TABLES_EXIST" -lt 18 ]; then
            if [ "$TABLES_EXIST" -lt 18 ]; then
                echo "检测到表结构不完整，开始重建数据库结构..."
            else
                echo "数据库为空，开始初始化表结构..."
            fi
            
            if [ -f "/app/database/init-db.sql" ]; then
                echo "执行初始化SQL脚本..."
                mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "/app/database/init-db.sql"
                
                if [ $? -eq 0 ]; then
                    echo "数据库初始化成功！"
                else
                    echo "警告: 数据库初始化失败，但应用将继续启动..."
                fi
            else
                echo "警告: 初始化SQL文件不存在，跳过数据库初始化..."
            fi
        else
            echo "数据库已包含所有必需的表结构，跳过初始化"
        fi
    fi
else
    echo "未检测到数据库配置，跳过数据库初始化..."
fi

echo ""
echo "========================================="
echo "启动应用服务"
echo "========================================="

# 启动应用
echo "构建项目..."
npm run build
echo "启动预览服务器..."
exec npm run preview
