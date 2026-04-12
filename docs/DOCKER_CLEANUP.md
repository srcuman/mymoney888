# Docker 数据清理指南

## 问题描述

当用户尝试清空 `/data` 文件夹和 MySQL 数据库后重新构建 Docker 容器时，仍有之前测试数据残留。

## 原因分析

这是 **Docker Volumes 的设计特性**：

1. **Docker Volumes 持久化数据**
   - `docker-compose.yml` 中定义的数据卷 (`mysql_data`, `app_data`) 会持久化存储数据
   - 即使删除容器和镜像，Volumes 中的数据仍然保留

2. **数据存储位置**
   - MySQL 数据: Docker 管理的匿名/命名卷（位于 Docker 数据目录）
   - 应用数据: `app_data` 命名卷（挂载到容器内的 `/data`）

## 解决方案

### 方案一：完全重置（推荐用于测试环境）

```bash
# 1. 停止并删除所有容器
docker-compose down

# 2. 删除所有数据卷（重要！这是清理数据的关键步骤）
docker-compose down -v

# 3. 删除镜像（可选）
docker rmi mymoney888:latest

# 4. 重新构建并启动
docker-compose up --build -d
```

**参数说明：**
- `-v` 或 `--volumes`: 删除与容器关联的命名卷

### 方案二：选择性清理

只清理 MySQL 数据（保留应用配置）:
```bash
docker-compose down
docker volume rm mymoney888_mysql_data
docker-compose up -d
```

只清理应用数据:
```bash
docker-compose down
docker volume rm mymoney888_app_data
docker-compose up -d
```

### 方案三：清理所有未使用的 Docker 资源

```bash
# 删除所有停止的容器、未使用的网络、悬空镜像
docker system prune -a

# 删除所有未使用的卷
docker volume prune
```

### 方案四：查看当前 Docker 卷状态

```bash
# 列出所有卷
docker volume ls

# 查看特定卷的详细信息
docker volume inspect mymoney888_mysql_data
docker volume inspect mymoney888_app_data
```

## 验证清理结果

清理后，可以通过以下方式验证：

1. **检查卷是否已删除**
   ```bash
   docker volume ls | grep mymoney888
   ```

2. **查看容器日志确认启动状态**
   ```bash
   docker-compose logs -f
   ```

3. **访问应用确认数据已清空**
   - 访问 http://localhost:8888
   - 检查是否需要重新初始化数据

## Docker Compose 命令参考

| 命令 | 说明 |
|------|------|
| `docker-compose up -d` | 后台启动服务 |
| `docker-compose down` | 停止并删除容器（保留卷） |
| `docker-compose down -v` | 停止并删除容器和卷 |
| `docker-compose restart` | 重启服务 |
| `docker-compose logs -f` | 查看日志 |
| `docker-compose build --no-cache` | 不使用缓存重新构建 |

## Windows 用户注意事项

在 Windows 上使用 Docker Desktop 时：

1. **使用 PowerShell 或 CMD 执行命令**
   ```powershell
   docker-compose down -v
   ```

2. **如果卷删除失败，可能需要**
   - 停止 Docker Desktop
   - 重启 Docker Desktop
   - 再次尝试删除卷

3. **查看 Docker Desktop 数据位置**
   - Docker Desktop -> Settings -> Resources -> Advanced
   - 可以看到 Docker 数据的存储位置

## 常见问题

### Q: 为什么 `docker-compose down` 没有删除数据？

**A:** 默认情况下，`docker-compose down` 只删除容器和网络，不会删除卷。这是设计上的选择，防止意外数据丢失。

### Q: 如何确认数据已完全清理？

**A:** 执行以下命令确认卷已删除：
```bash
docker volume ls | grep mymoney888
# 应该返回空结果
```

### Q: 可以在不删除卷的情况下重置数据吗？

**A:** 可以通过进入 MySQL 容器手动清空数据：

```bash
# 进入 MySQL 容器
docker exec -it mymoney888-mysql mysql -u root -p

# 在 MySQL 中执行
USE mymoney888;
DELETE FROM transactions;
DELETE FROM accounts;
-- 其他表...
FLUSH TABLES;
```

## 生产环境建议

对于生产环境，**不要轻易删除 volumes**！建议：

1. 定期备份数据
2. 使用数据库迁移脚本修改数据
3. 在测试环境中验证后再部署
