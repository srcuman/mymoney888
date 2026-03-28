# 部署指南

本文档介绍如何部署 MyMoney888 个人记账系统。

## 部署方式

本系统支持两种部署方式：

1. **使用内置MySQL数据库**（推荐用于开发和测试）
2. **使用外部MySQL数据库**（推荐用于生产环境）

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- MySQL 8.0+（如果使用外部数据库）

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
DB_HOST=mysql                    # 数据库主机（使用外部数据库时修改）
DB_PORT=3306                     # 数据库端口
DB_USER=root                     # 数据库用户
DB_PASSWORD=mymoney888           # 数据库密码
DB_NAME=mymoney888              # 数据库名称

# 应用配置
NODE_ENV=production              # 运行环境
VITE_API_URL=http://localhost:3000/api  # API地址
APP_PORT=8888                   # 应用端口

# MySQL服务配置（仅在使用内置MySQL时需要）
MYSQL_ROOT_PASSWORD=mymoney888   # MySQL root密码
MYSQL_DATABASE=mymoney888        # MySQL数据库名
MYSQL_USER=mymoney              # MySQL用户
MYSQL_PASSWORD=mymoney888       # MySQL密码
MYSQL_PORT=3306                 # MySQL端口映射
```

### 3. 选择部署方式

#### 方式一：使用内置MySQL数据库

这是最简单的部署方式，适合开发和测试环境。

```bash
# 启动服务（包含内置MySQL）
docker-compose --profile internal up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 方式二：使用外部MySQL数据库

这是推荐的部署方式，适合生产环境。

1. **准备外部MySQL数据库**

确保你的MySQL服务器已创建数据库：

```sql
CREATE DATABASE mymoney888 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **修改环境变量**

编辑 `.env` 文件，修改数据库配置：

```env
DB_HOST=your-mysql-host          # 你的MySQL主机地址
DB_PORT=3306                      # 你的MySQL端口
DB_USER=your-mysql-user          # 你的MySQL用户名
DB_PASSWORD=your-mysql-password  # 你的MySQL密码
DB_NAME=mymoney888               # 数据库名称
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
# 启动服务（不包含MySQL）
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

- **使用内置MySQL**：数据库会在首次启动时自动初始化
- **使用外部MySQL**：需要手动运行初始化脚本

### 手动初始化

如果自动初始化失败，可以手动执行SQL脚本：

```bash
mysql -h your-host -u your-user -p your-database < database/init-db.sql
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
- sync_logs（同步日志表）
- user_settings（用户设置表）

## 常见问题

### 1. 数据库连接失败

检查 `.env` 文件中的数据库配置是否正确：

```bash
# 测试数据库连接
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD
```

### 2. 端口冲突

如果端口8888被占用，修改 `.env` 文件中的 `APP_PORT`：

```env
APP_PORT=8889
```

### 3. 数据库未初始化

检查数据库是否包含所有必要的表：

```bash
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES"
```

如果表不存在，重新运行初始化脚本。

### 4. 权限问题

确保MySQL用户有足够的权限：

```sql
GRANT ALL PRIVILEGES ON mymoney888.* TO 'your-user'@'%';
FLUSH PRIVILEGES;
```

## 生产环境建议

1. **使用外部MySQL数据库**，不要使用内置MySQL
2. **修改默认密码**，不要使用示例密码
3. **配置HTTPS**，使用反向代理（如Nginx）
4. **定期备份数据库**
5. **监控日志**，及时发现和解决问题
6. **限制资源使用**，根据实际情况调整Docker资源限制

## 数据备份

### 备份数据库

```bash
docker exec mymoney888-mysql mysqldump -u root -p mymoney888 > backup.sql
```

### 恢复数据库

```bash
docker exec -i mymoney888-mysql mysql -u root -p mymoney888 < backup.sql
```

## 升级指南

1. 停止服务：`docker-compose down`
2. 拉取最新代码：`git pull`
3. 重新构建：`docker-compose build`
4. 启动服务：`docker-compose up -d`

## 技术支持

如有问题，请提交Issue：https://github.com/srcuman/mymoney888/issues
