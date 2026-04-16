#!/bin/sh

# 应用启动脚本
# 使用 Node.js 检查数据库，不依赖 psql 命令

echo "========================================="
echo "MyMoney888 启动脚本 (PostgreSQL)"
echo "========================================="

# ========== 强制写入正确配置 ==========
# 创建新的 .env 文件，使用当前环境变量的值覆盖任何旧配置
cat > /app/.env << 'ENVEOF'
# 数据库配置（自动生成，禁止手动修改）
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
NODE_ENV=production
ENVEOF

echo "✓ 已写入新的配置文件"
echo "   当前配置: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
# =====================================

# 检查是否配置了数据库
if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
    echo "检测到数据库配置: $DB_USER@$DB_HOST:${DB_PORT:-5432}/$DB_NAME"
    
    echo "使用 Node.js 检查数据库连接..."
    node -e "
const { Client } = require('pg');
const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

client.connect()
    .then(() => {
        console.log('✓ 数据库连接成功');
        return client.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=\\'public\\'');
    })
    .then(res => {
        const count = parseInt(res.rows[0].count);
        console.log('当前表数量:', count);
        if (count === 0) {
            console.log('检测到数据库为空，跳过初始化（请手动执行 init-db.sql）');
        } else {
            console.log('✓ 数据库已包含表结构');
        }
        client.end();
        process.exit(0);
    })
    .catch(err => {
        console.error('✗ 数据库连接失败:', err.message);
        console.log('提示: 请确保数据库已创建且配置正确');
        process.exit(0); // 不阻止应用启动
    });
"
else
    echo "未检测到数据库配置，跳过检查..."
fi

echo ""
echo "========================================="
echo "启动应用服务"
echo "========================================="
exec npm start
