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
        fi
        
        attempt=$((attempt + 1))
        echo "尝试连接数据库 ($attempt/$max_attempts)..."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo "警告: 无法连接到数据库，跳过初始化..."
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
        
        if [ "$TABLE_COUNT" -le 1 ]; then
            echo "数据库为空，开始初始化表结构..."
            
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
            echo "数据库已包含表结构，跳过初始化"
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
