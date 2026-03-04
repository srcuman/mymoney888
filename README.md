# MyMoney888 - 个人记账软件

一个功能强大的个人记账软件，支持多维度分类、账套管理、数据导入导出等功能。

## 版本信息

**当前版本：v1.1.0**

### v1.1.0 更新内容
- ✅ **增强在线更新功能**：支持自动下载和应用更新
- ✅ **显示更新说明**：升级时显示详细的更新内容
- ✅ **发布日期显示**：显示新版本的发布日期
- ✅ **下载进度提示**：显示下载状态和进度
- ✅ **一键应用更新**：下载完成后一键应用更新
- ✅ **Docker部署优化**：添加镜像源配置，解决镜像拉取问题

### v1.0.0 初始功能
- ✅ 交易记账（收入、支出、转账）
- ✅ 账户管理（支持多种账户类型）
- ✅ 多维度分类（多级分类结构）
- ✅ 账套管理（多账套隔离）
- ✅ 数据导入（支付宝、微信、CSV）
- ✅ 数据导出（CSV格式）
- ✅ 统计分析（饼图、同比环比分析）
- ✅ 年度回顾
- ✅ 金额计算器
- ✅ 管理员功能

## 功能特点

### 核心功能
- ✅ 交易记账（收入、支出、转账）
- ✅ 账户管理（支持多种账户类型）
- ✅ 多维度分类（多级分类结构）
- ✅ 账套管理（多账套隔离）
- ✅ 数据导入（支付宝、微信、CSV）
- ✅ 数据导出（CSV格式）
- ✅ 统计分析（饼图、同比环比分析）
- ✅ 年度回顾
- ✅ 金额计算器
- ✅ 管理员功能

### 技术特点
- 🚀 基于Vue 3 + Tailwind CSS
- 📦 Docker容器化部署
- 🔒 本地数据存储（LocalStorage）
- 📱 响应式设计
- 🌐 支持在线升级

## 快速开始

### 方法一：Docker部署（推荐）

#### 从GitHub仓库构建（最简单）
```bash
# 创建docker-compose.yml文件
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mymoney888:
    # 从GitHub仓库构建
    build:
      context: https://github.com/srcuman/mymoney888.git
      dockerfile: Dockerfile
    image: mymoney888:latest
    container_name: mymoney888
    ports:
      - "8888:8888"
    restart: always
    environment:
      - NODE_ENV=production
      - NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8888', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
EOF

# 启动服务
docker-compose up -d

# 访问 http://localhost:8888
```

#### 克隆仓库后部署
```bash
# 克隆仓库
git clone https://github.com/srcuman/mymoney888.git
cd mymoney888

# 启动服务
docker-compose up -d

# 访问 http://localhost:8888
```

### 方法二：直接运行

```bash
# 克隆仓库
git clone https://github.com/srcuman/mymoney888.git
cd mymoney888

# 安装依赖
npm install

# 启动服务器
node dist/server.cjs

# 访问 http://localhost:8888
```

## 账户信息

- **测试账号**：test / test
- **管理员账号**：admin / admin（注册时需要管理员码：admin123）

## 项目结构

```
mymoney888/
├── dist/              # 生产构建文件
│   ├── app.js         # 主应用代码
│   ├── index.html     # 主页面
│   └── server.cjs     # 服务器脚本
├── src/               # 源代码（开发用）
├── Dockerfile         # Docker构建文件
├── docker-compose.yml # Docker Compose配置
├── .dockerignore      # Docker忽略文件
├── package.json       # 项目配置
└── README.md          # 项目说明
```

## 功能使用指南

### 1. 记账功能
- 在首页点击记账按钮
- 选择交易类型（收入/支出/转账）
- 输入金额（支持计算器功能）
- 选择分类、账户等信息
- 点击保存

### 2. 账套管理
- 在导航栏选择账套
- 点击「+」按钮创建新账套
- 切换账套会自动保存数据

### 3. 数据导入
- 支持支付宝账单导入
- 支持微信账单导入
- 支持通用CSV导入

### 4. 统计分析
- 支持多种快捷查询条件
- 支持同比、环比分析
- 支持饼图展示

### 5. 年度回顾
- 查看年度财务总结
- 智能洞察和建议

## 在线升级

当有新版本时，系统会自动检测并提示升级。

### 升级流程：
1. 系统自动检测新版本
2. 显示更新提示模态框，包含：
   - 当前版本和最新版本
   - 发布日期
   - 详细的更新说明
3. 点击"立即升级"下载更新
4. 下载完成后点击"应用更新"
5. 系统自动刷新并应用新版本

## 故障排除

### Docker镜像拉取失败

如果遇到镜像拉取失败（如 `401 Authorization Required`），可以尝试以下方法：

#### 方法1：配置Docker镜像源
```bash
# 编辑Docker配置文件
sudo vim /etc/docker/daemon.json

# 添加以下内容
{
  "registry-mirrors": [
    "https://docker.mirrors.sjtug.sjtu.edu.cn",
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}

# 重启Docker服务
sudo systemctl restart docker
```

#### 方法2：修改Dockerfile使用镜像源
```dockerfile
# 使用国内镜像源
FROM docker.mirrors.sjtug.sjtu.edu.cn/library/node:18-alpine
# 或
FROM registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine
```

#### 方法3：使用docker-compose的build args
```yaml
services:
  mymoney888:
    build:
      context: https://github.com/srcuman/mymoney888.git
      dockerfile: Dockerfile
      args:
        - NODE_IMAGE=docker.mirrors.sjtug.sjtu.edu.cn/library/node:18-alpine
```

### 端口被占用

如果8888端口被占用，可以修改docker-compose.yml中的端口映射：
```yaml
ports:
  - "8889:8888"  # 将主机的8889端口映射到容器的8888端口
```

### 内存不足

如果遇到内存不足问题，可以调整docker-compose.yml中的资源限制：
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
    reservations:
      cpus: '0.25'
      memory: 128M
```

## 技术栈

- **前端**：Vue 3, Tailwind CSS, Chart.js
- **后端**：Node.js（轻量级HTTP服务器）
- **存储**：LocalStorage（本地数据持久化）
- **部署**：Docker, Docker Compose

## 开发指南

### 开发环境搭建

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 项目配置

- **端口**：8888
- **数据存储**：LocalStorage（按账套隔离）
- **默认账套**：default

## 注意事项

1. 数据存储在浏览器本地，建议定期导出备份
2. 支持主流浏览器：Chrome、Firefox、Safari、Edge
3. 推荐使用Docker部署以获得最佳体验
4. 如遇到镜像拉取问题，请参考故障排除部分

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 版本历史

- **v1.1.0** (2026-03-04) - 增强在线更新功能，优化Docker部署
- **v1.0.0** (2026-03-03) - 初始版本发布

---

**MyMoney888** - 让记账更简单，让生活更美好！
