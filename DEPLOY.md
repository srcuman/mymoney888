# 部署指南

本文档介绍如何部署 发发 个人记账系统。

## 部署方式

本系统支持两种部署方式：

1. **使用内置PostgreSQL数据库**（推荐用于开发和测试）
2. **使用外部PostgreSQL数据库**（推荐用于生产环境）

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- PostgreSQL 12+（如果使用外部数据库）

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/srcuman/mymoney888.git
cd mymoney888
```

### 2. 配置环境变量

复制环境变量模板文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，根据需要配置以下变量：

```env
# 数据库配置
DB_HOST=postgres                 # 数据库主机（使用外部数据库时修改）
DB_PORT=5432                    # 数据库端口
DB_USER=postgres                # 数据库用户
DB_PASSWORD=mymoney888          # 数据库密码
DB_NAME=mymoney888             # 数据库名称

# 应用配置
NODE_ENV=production              # 运行环境
VITE_API_URL=http://localhost:3000/api  # API地址
APP_PORT=8888                   # 应用端口

# PostgreSQL服务配置（仅在使用内置PostgreSQL时需要）
DB_EXTERNAL_PORT=5432           # PostgreSQL端口映射
```

### 3. 选择部署方式

#### 方式一：使用内置PostgreSQL数据库

这是最简单的部署方式，适合开发和测试环境。

```bash
# 启动服务（包含内置PostgreSQL）
docker-compose --profile internal up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 方式二：使用外部PostgreSQL数据库

这是推荐的部署方式，适合生产环境。

1. **准备外部PostgreSQL数据库**

确保你的PostgreSQL服务器已创建数据库：

```sql
CREATE DATABASE mymoney888;
```

2. **修改环境变量**

编辑 `.env` 文件，修改数据库配置：

```env
DB_HOST=your-postgres-host        # 你的PostgreSQL主机地址
DB_PORT=5432                      # 你的PostgreSQL端口
DB_USER=postgres                   # 你的PostgreSQL用户名
DB_PASSWORD=your-password          # 你的PostgreSQL密码
DB_NAME=mymoney888                # 数据库名称
```

3. **初始化数据库**

运行数据库初始化脚本：

**Linux/Mac:**
```bash
chmod +x scripts/init-database.sh
./scripts/init-database.sh
```

**Windows:**
```powershell
.\scripts\init-database.ps1
```

4. **启动应用**

```bash
# 启动服务（不包含PostgreSQL）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 4. 访问应用

打开浏览器访问：`http://localhost:8888`

## 国内用户加速

如果你在中国大陆，可以使用国内镜像源加速部署：

```bash
docker-compose -f docker-compose.cn.yml --profile internal up -d
```

## 数据库初始化说明

### 自动初始化

- **使用内置PostgreSQL**：数据库会在首次启动时自动初始化
- **使用外部PostgreSQL**：需要手动运行初始化脚本

### 手动初始化

如果自动初始化失败，可以手动执行SQL脚本：

```bash
psql -h your-host -U your-user -d your-database -f database/init-db.sql
```

### 验证初始化

运行初始化脚本后，会自动验证以下关键表是否存在：

- users（用户表）
- accounts（账户表）
- categories（分类表）
- transactions（交易记录表）
- credit_cards（信用卡表）
- credit_card_bills（信用卡账单表）
- loans（贷款表）
- loan_payments（贷款还款记录表）
- installment_templates（分期模板表）
- installments（分期记录表）
- investment_holdings（投资持仓表）
- nav_history（净值历史表）
- investment_transfers（投资转账表）
- sync_logs（同步日志表）
- user_settings（用户设置表）

## 常见问题

### 1. 数据库连接失败

检查 `.env` 文件中的数据库配置是否正确：

```bash
# 测试数据库连接
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
```

### 2. 端口冲突

如果端口8888被占用，修改 `.env` 文件中的 `APP_PORT`：

```env
APP_PORT=8889
```

### 3. 数据库未初始化

检查数据库是否包含所有必要的表：

```bash
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\\dt"
```

如果表不存在，重新运行初始化脚本。

### 4. 权限问题

确保PostgreSQL用户有足够的权限：

```sql
GRANT ALL PRIVILEGES ON DATABASE mymoney888 TO postgres;
```

## 生产环境建议

1. **使用外部PostgreSQL数据库**，不要使用内置PostgreSQL
2. **修改默认密码**，不要使用示例密码
3. **配置HTTPS**，使用反向代理（如Nginx）
4. **定期备份数据库**
5. **监控日志**，及时发现和解决问题
6. **限制资源使用**，根据实际情况调整Docker资源限制

## 数据备份

### 备份数据库

```bash
docker exec mymoney888-postgres pg_dump -U postgres mymoney888 > backup.sql
```

### 恢复数据库

```bash
docker exec -i mymoney888-postgres psql -U postgres mymoney888 < backup.sql
```

## 升级指南

1. 停止服务：`docker-compose down`
2. 拉取最新代码：`git pull`
3. 重新构建：`docker-compose build`
4. 启动服务：`docker-compose up -d`

## 技术支持

如有问题，请提交Issue：https://github.com/srcuman/mymoney888/issues
