# 构建和推送Docker镜像

本项目使用GitHub Container Registry (ghcr.io) 托管Docker镜像。

## 前提条件

1. GitHub Personal Access Token (PAT) with `write:packages` and `read:packages` scopes
2. Docker已安装并运行
3. 已登录到GitHub Container Registry

## 登录到GitHub Container Registry

```bash
# 方式1: 使用用户名和PAT
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 方式2: 直接输入
docker login ghcr.io
# 输入用户名: YOUR_USERNAME
# 输入密码: YOUR_GITHUB_TOKEN
```

## 构建和推送镜像

### 1. 构建后端镜像

```bash
cd server
docker build -t ghcr.io/srcuman/mymoney888-backend:latest .
docker push ghcr.io/srcuman/mymoney888-backend:latest
```

### 2. 构建前端镜像

```bash
cd ..
docker build -t ghcr.io/srcuman/mymoney888-frontend:latest .
docker push ghcr.io/srcuman/mymoney888-frontend:latest
```

### 3. 一键构建和推送

```bash
# 后端
cd server && docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/srcuman/mymoney888-backend:latest --push .

# 前端
cd .. && docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/srcuman/mymoney888-frontend:latest --push .
```

## 使用镜像

直接使用docker-compose启动：

```bash
docker-compose up -d

# 或使用国内镜像版本
docker-compose -f docker-compose.cn.yml up -d
```

## 注意事项

1. 镜像名称必须使用 `ghcr.io/USERNAME/REPO-NAME:TAG` 格式
2. 首次推送时需要在GitHub上创建公开的package
3. 更新代码后记得重新构建并推送镜像
4. 可以使用不同的标签管理版本，如 `:v2.0.1`、`:latest` 等

## 自动化构建（GitHub Actions）

可以使用GitHub Actions自动构建和推送镜像，需要在 `.github/workflows/docker.yml` 中配置CI/CD流程。
