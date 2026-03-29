# 外部数据库配置指南

## 问题分析

当使用 `docker-compose-nosql.yml` 部署时，容器内部的 `localhost` 指的是容器本身，不是宿主机。因此，如果你在宿主机上运行MySQL服务，直接使用 `localhost` 会导致连接失败。

## 配置方法

### 方法1：使用宿主机IP地址

1. **获取宿主机IP地址**
   - Windows: 运行 `ipconfig` 查看IPv4地址
   - Linux/macOS: 运行 `ifconfig` 或 `ip addr` 查看IP地址

2. **创建 .env 文件**
   ```env
   # 数据库配置
   DB_HOST=192.168.1.100  # 替换为你的宿主机IP地址
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=mymoney888
   DB_NAME=mymoney888
   ```

3. **启动服务**
   ```bash
   docker-compose -f docker-compose-nosql.yml up -d
   ```

### 方法2：使用网络别名（推荐）

1. **修改 docker-compose-nosql.yml**
   ```yaml
   services:
     mymoney888:
       # 其他配置不变
       extra_hosts:
         - "host.docker.internal:host-gateway"
   ```

2. **修改 .env 文件**
   ```env
   DB_HOST=host.docker.internal
   ```

3. **启动服务**
   ```bash
   docker-compose -f docker-compose-nosql.yml up -d
   ```

### 方法3：使用外部数据库服务

如果你的数据库在其他服务器上，直接使用该服务器的IP地址：

```env
DB_HOST=10.0.0.5  # 数据库服务器IP
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=mymoney888
```

## 常见问题排查

### 1. 连接被拒绝
- 检查MySQL服务是否正在运行
- 检查防火墙是否允许3306端口访问
- 检查MySQL是否允许远程连接

### 2. 密码错误
- 确认数据库用户名和密码正确
- 检查MySQL用户是否有远程访问权限

### 3. 数据库不存在
- 确保数据库已经创建，或使用具有创建数据库权限的用户

### 4. 网络问题
- 确保容器能够访问外部网络
- 检查网络连接和DNS配置

## 测试连接

在部署前，可以先测试数据库连接：

```bash
# 测试MySQL连接
mysql -h your-db-host -P 3306 -u root -p

# 测试数据库是否存在
mysql -h your-db-host -P 3306 -u root -p -e "SHOW DATABASES LIKE 'mymoney888'"
```

## 日志查看

如果连接失败，查看容器日志获取详细信息：

```bash
docker logs mymoney888
```

日志会显示详细的连接信息和错误原因。
