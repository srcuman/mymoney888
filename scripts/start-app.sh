#!/bin/sh

# 应用启动脚本
# 在启动应用前初始化 PostgreSQL 数据库

echo "========================================="
echo "MyMoney888 启动脚本 (PostgreSQL)"
echo "========================================="

# 全局变量
DB_INIT_SUCCESS=false
DB_ERROR_MESSAGE=""

# 检查是否需要初始化数据库
if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
    echo "检测到数据库配置，开始初始化数据库..."
    echo "连接信息: $DB_USER@$DB_HOST:${DB_PORT:-5432}"
    
    # 等待数据库就绪
    echo "等待数据库就绪..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        echo "尝试连接数据库 ($((attempt + 1))/$max_attempts)..."
        
        # 捕获 psql 命令的详细错误信息
        ERROR_OUTPUT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d postgres -c "SELECT 1" 2>&1)
        PSQL_EXIT_CODE=$?
        
        if [ $PSQL_EXIT_CODE -eq 0 ]; then
            echo "✓ 数据库已就绪！"
            break
        else
            echo "✗ 连接失败 (退出码: $PSQL_EXIT_CODE)"
            echo "错误信息: $ERROR_OUTPUT"
            
            # 分析常见错误
            if echo "$ERROR_OUTPUT" | grep -q "password authentication failed"; then
                DB_ERROR_MESSAGE="用户名或密码错误"
            elif echo "$ERROR_OUTPUT" | grep -q "does not exist"; then
                DB_ERROR_MESSAGE="数据库不存在"
            elif echo "$ERROR_OUTPUT" | grep -q "could not connect to server"; then
                DB_ERROR_MESSAGE="无法连接到 PostgreSQL 服务器"
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
        echo "警告: 无法连接到数据库"
        echo "========================================="
        echo "连接信息: $DB_USER@$DB_HOST:${DB_PORT:-5432}"
        echo "错误原因: $DB_ERROR_MESSAGE"
        echo "========================================="
        echo "请检查以下项目："
        echo "1. PostgreSQL 服务是否正在运行"
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
        DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>&1)
        
        if [ -z "$DB_EXISTS" ]; then
            echo "数据库 $DB_NAME 不存在，正在创建..."
            
            # 捕获创建数据库的错误
            CREATE_DB_ERROR=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME" 2>&1)
            
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
        TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>&1)
        echo "当前表数量: $TABLE_COUNT"
        
        # 检查关键表是否存在
        REQUIRED_TABLES="users accounts categories transactions"
        
        echo "检查必需表..."
        TABLES_EXIST=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users', 'accounts', 'categories', 'transactions')" 2>&1)
        echo "找到必需表数量: $TABLES_EXIST"
        
        if [ -z "$TABLE_COUNT" ] || [ "$TABLE_COUNT" -eq 0 ] || [ -z "$TABLES_EXIST" ] || [ "$TABLES_EXIST" -eq 0 ]; then
            echo "检测到表结构不完整，开始初始化..."
            
            # 检查SQL文件
            if [ -f "/app/database/init-db.sql" ]; then
                echo "执行初始化SQL脚本..."
                
                # 捕获SQL执行的错误
                SQL_ERROR=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -f "/app/database/init-db.sql" 2>&1)
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

# 打印环境变量（调试用，不打印密码）
echo "环境变量配置:"
echo "  NODE_ENV: $NODE_ENV"
echo "  DB_HOST: $DB_HOST"
echo "  DB_PORT: ${DB_PORT:-5432}"
echo "  DB_USER: $DB_USER"
echo "  DB_NAME: $DB_NAME"
echo "  DB_PASSWORD: ***"

echo ""
echo "启动应用服务器..."
exec npm start
