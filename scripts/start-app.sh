#!/bin/sh

# 应用启动脚本
# 在启动应用前初始化数据库

echo "========================================="
echo "MyMoney888 启动脚本"
echo "========================================="

# 全局变量
DB_INIT_SUCCESS=false
DB_ERROR_MESSAGE=""

# 检查是否需要初始化数据库
if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
    echo "检测到数据库配置，开始初始化数据库..."
    echo "连接信息: $DB_USER@$DB_HOST:${DB_PORT:-3306}"
    
    # 等待数据库就绪
    echo "等待数据库就绪..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        echo "尝试连接数据库 ($((attempt + 1))/$max_attempts)..."
        
        # 捕获mysql命令的详细错误信息
        ERROR_OUTPUT=$(mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" 2>&1)
        MYSQL_EXIT_CODE=$?
        
        if [ $MYSQL_EXIT_CODE -eq 0 ]; then
            echo "✓ 数据库已就绪！"
            break
        else
            echo "✗ 连接失败 (退出码: $MYSQL_EXIT_CODE)"
            echo "错误信息: $ERROR_OUTPUT"
            
            # 分析常见错误
            if echo "$ERROR_OUTPUT" | grep -q "Access denied"; then
                DB_ERROR_MESSAGE="用户名或密码错误"
            elif echo "$ERROR_OUTPUT" | grep -q "Unknown database"; then
                DB_ERROR_MESSAGE="数据库不存在"
            elif echo "$ERROR_OUTPUT" | grep -q "Can't connect to MySQL server"; then
                DB_ERROR_MESSAGE="无法连接到MySQL服务器"
            elif echo "$ERROR_OUTPUT" | grep -q "Connection refused"; then
                DB_ERROR_MESSAGE="连接被拒绝"
            elif echo "$ERROR_OUTPUT" | grep -q "timeout"; then
                DB_ERROR_MESSAGE="连接超时"
            elif echo "$ERROR_OUTPUT" | grep -q "Network is unreachable"; then
                DB_ERROR_MESSAGE="网络不可达"
            else
                DB_ERROR_MESSAGE="未知错误: $ERROR_OUTPUT"
            fi
            
            echo "可能原因: $DB_ERROR_MESSAGE"
        fi
        
        attempt=$((attempt + 1))
        
        # 如果不是最后几次重试，增加等待时间
        if [ $attempt -ge 5 ] && [ $attempt -lt $max_attempts ]; then
            sleep 3
        else
            sleep 2
        fi
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo "========================================="
        echo "错误: 无法连接到数据库"
        echo "========================================="
        echo "连接信息: $DB_USER@$DB_HOST:${DB_PORT:-3306}"
        echo "错误原因: $DB_ERROR_MESSAGE"
        echo "错误详情: $ERROR_OUTPUT"
        echo "========================================="
        echo "请检查以下项目："
        echo "1. 数据库服务是否正在运行"
        echo "2. 网络连接是否正常"
        echo "3. 防火墙是否允许端口访问"
        echo "4. 数据库用户权限是否正确"
        echo "5. 数据库配置是否正确"
        echo "========================================="
        echo "跳过数据库初始化，应用将继续启动..."
    else
        echo "========================================="
        echo "数据库连接成功，开始初始化..."
        echo "========================================="
        
        # 检查数据库是否存在
        echo "检查数据库是否存在..."
        DB_EXISTS=$(mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME'" 2>&1 | grep "$DB_NAME" || true)
        
        if [ -z "$DB_EXISTS" ]; then
            echo "数据库 $DB_NAME 不存在，正在创建..."
            
            # 捕获创建数据库的错误
            CREATE_DB_ERROR=$(mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci" 2>&1)
            
            if [ $? -eq 0 ]; then
                echo "✓ 数据库创建成功！"
            else
                echo "✗ 数据库创建失败"
                echo "错误信息: $CREATE_DB_ERROR"
                echo "可能原因: 用户没有创建数据库的权限"
            fi
        else
            echo "✓ 数据库 $DB_NAME 已存在"
        fi
        
        # 检查是否需要初始化表结构
        echo "检查表结构..."
        TABLE_COUNT=$(mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES" 2>&1 | wc -l)
        echo "当前表数量: $TABLE_COUNT"
        
        # 检查关键表是否存在
        REQUIRED_TABLES="users accounts categories transactions credit_cards credit_card_bills loans loan_payments installment_templates installments merchants projects members transaction_merchants transaction_projects transaction_members sync_logs user_settings"
        
        echo "检查必需表..."
        TABLES_EXIST=$(mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES" 2>&1 | grep -E "users|accounts|categories|transactions|credit_cards|credit_card_bills|loans|loan_payments|installment_templates|installments|merchants|projects|members|transaction_merchants|transaction_projects|transaction_members|sync_logs|user_settings" | wc -l)
        echo "找到必需表数量: $TABLES_EXIST/18"
        
        if [ "$TABLE_COUNT" -le 1 ] || [ "$TABLES_EXIST" -lt 18 ]; then
            if [ "$TABLES_EXIST" -lt 18 ]; then
                echo "检测到表结构不完整，开始重建数据库结构..."
            else
                echo "数据库为空，开始初始化表结构..."
            fi
            
            # 检查SQL文件
            if [ -f "/app/database/init-db.sql" ]; then
                echo "执行初始化SQL脚本..."
                
                # 捕获SQL执行的错误
                SQL_ERROR=$(mysql -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "/app/database/init-db.sql" 2>&1)
                SQL_EXIT_CODE=$?
                
                if [ $SQL_EXIT_CODE -eq 0 ]; then
                    echo "✓ 数据库初始化成功！"
                    DB_INIT_SUCCESS=true
                else
                    echo "✗ 数据库初始化失败"
                    echo "错误信息: $SQL_ERROR"
                    echo "退出码: $SQL_EXIT_CODE"
                    echo "可能原因: SQL语法错误、权限不足、表结构冲突"
                fi
            else
                echo "✗ 警告: 初始化SQL文件不存在"
                echo "文件路径: /app/database/init-db.sql"
            fi
        else
            echo "✓ 数据库已包含所有必需的表结构"
            DB_INIT_SUCCESS=true
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
BUILD_ERROR=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✓ 项目构建成功"
else
    echo "✗ 项目构建失败"
    echo "错误信息: $BUILD_ERROR"
    echo "退出码: $BUILD_EXIT_CODE"
fi

echo "启动预览服务器..."
exec npm run preview
