# Docker部署与升级指南

本文档介绍如何部署和升级 发发 个人记账系统。

## 1. 环境准备

- Docker 19.03+ 版本
- Docker Compose (推荐)
- 网络连接（用于拉取镜像和更新代码）

## 2. 基本部署

### 使用Docker Compose部署

1. 在项目根目录创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  mymoney888:
    build: .
    container_name: mymoney888
    ports:
      - "8888:8888"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

2. 启动容器：

```bash
docker-compose up -d
```

3. 访问应用：

   打开浏览器，访问 `http://localhost:8888`

### 手动部署

1. 构建镜像：

```bash
docker build -t mymoney888 .
```

2. 运行容器：

```bash
docker run -d \
  --name mymoney888 \
  -p 8888:8888 \
  -v ./data:/app/data \
  -e NODE_ENV=production \
  mymoney888
```

## 3. 升级方法

### 方法一：使用升级命令（推荐）

1. 进入容器执行升级命令：

```bash
docker exec -it mymoney888 /app/scripts/upgrade-command.sh
```

2. 按照提示完成升级过程

3. 升级完成后重启容器：

```bash
docker restart mymoney888
```

### 方法二：重新构建镜像

1. 停止并删除旧容器：

```bash
docker stop mymoney888
docker rm mymoney888
```

2. 重新构建镜像：

```bash
docker build -t mymoney888 .
```

3. 运行新容器：

```bash
docker run -d \
  --name mymoney888 \
  -p 8888:8888 \
  -v ./data:/app/data \
  -e NODE_ENV=production \
  mymoney888
```

### 方法三：使用Docker Compose升级

1. 停止并删除旧容器：

```bash
docker-compose down
```

2. 重新构建并启动：

```bash
docker-compose up -d --build
```

## 4. 升级流程说明

1. **检查更新**：脚本会检查当前版本与Gitee仓库中的最新版本
2. **确认升级**：用户需要确认是否进行升级
3. **备份代码**：在升级前会自动备份当前代码，以便在升级失败时回滚
4. **拉取代码**：从Gitee仓库拉取最新代码
5. **更新依赖**：执行 `npm install` 更新依赖
6. **构建项目**：执行 `npm run build` 构建项目
7. **重启容器**：升级完成后需要重启容器以应用更新

## 5. 升级注意事项

1. **数据备份**：升级前请确保已备份重要数据
2. **网络连接**：升级过程需要网络连接以拉取最新代码
3. **依赖问题**：如果遇到依赖安装失败，请检查网络连接或npm镜像配置
4. **构建失败**：如果构建失败，脚本会自动回滚到升级前的状态
5. **版本兼容性**：确保升级不会破坏现有数据结构

## 6. 常见问题及解决方案

### 问题1：无法连接到Gitee仓库

**解决方案**：
- 检查网络连接
- 检查容器的网络配置
- 尝试使用国内镜像源

### 问题2：依赖安装失败

**解决方案**：
- 检查网络连接
- 修改npm镜像源（在Dockerfile中取消注释相关配置）
- 尝试使用 `npm install --force` 强制安装

### 问题3：构建失败

**解决方案**：
- 检查代码是否有语法错误
- 检查依赖是否正确安装
- 查看构建日志了解具体错误信息

### 问题4：升级后应用无法启动

**解决方案**：
- 检查容器日志：`docker logs mymoney888`
- 回滚到备份版本：使用备份目录中的代码重新构建
- 检查端口是否被占用

## 7. 自动升级配置

### 使用cron定时检查更新

1. 进入容器：

```bash
docker exec -it mymoney888 /bin/sh
```

2. 安装cron：

```bash
apk add --no-cache cron
```

3. 创建定时任务文件：

```bash
cat > /etc/crontabs/root << EOF
# 每天凌晨2点检查更新
0 2 * * * /app/scripts/upgrade-command.sh >> /app/logs/upgrade.log 2>&1
EOF
```

4. 启动cron服务：

```bash
crond
```

5. 退出容器：

```bash
exit
```

## 8. 版本管理

- **当前版本**：查看 `package.json` 文件中的 version 字段
- **历史版本**：查看Git提交记录
- **版本回滚**：使用Git checkout命令回滚到指定版本

## 9. 联系方式

如果在升级过程中遇到问题，请联系：
- 项目地址：https://gitee.com/srcuman/mymoney888
- 提交Issue：https://gitee.com/srcuman/mymoney888/issues
