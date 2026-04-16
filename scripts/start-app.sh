#!/bin/sh

# 应用启动脚本
# 使用 Node.js 检查数据库，不依赖 psql 命令

echo "========================================="
echo "MyMoney888 启动脚本 (PostgreSQL)"
echo "========================================="

# ========== 强制清理残留配置 ==========
# 删除可能存在的 .env 文件，防止旧配置污染
rm -f /app/.env 2>/dev/null
rm -f /app/.env.local 2>/dev/null
rm -f /app/.env.production 2>/dev/null
echo "✓ 已清理残留配置文件"
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
