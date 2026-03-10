# MyMoney888 - 个人记账软件

一个功能强大的个人记账软件，支持多维度分类、账套管理、数据导入导出、信用卡管理、贷款管理等功能。

## 快速开始

### Docker部署（推荐）

```bash
# 克隆仓库
git clone https://github.com/srcuman/mymoney888.git
cd mymoney888

# 启动所有服务（MySQL + 应用）
docker-compose up -d

# 访问 http://localhost:3000
```

**默认管理员账户**：
- 用户名：`admin`
- 密码：`admin123`

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## v2.0.3 新特性

- 🚀 前后端合并为单一应用
- ✨ 简化Docker部署配置
- ✨ 优化GitHub Actions工作流
- 🔒 统一身份认证机制
- 📦 单一Docker镜像部署
- 🎯 清理项目结构，移除冗余文件

## 项目结构

```
mymoney888/
├── src/                    # 前端源代码
│   ├── api/               # API客户端封装
│   ├── views/             # 页面组件
│   ├── router/            # 路由配置
│   └── main.js            # 入口文件
├── server/                # 后端服务
│   ├── index.js           # 主服务器文件
│   └── init-db.sql        # 数据库初始化脚本
├── dist/                  # 前端构建输出
├── Dockerfile             # 统一Docker配置
├── docker-compose.yml     # 服务编排配置
└── README.md              # 项目说明
```

## 技术栈

### 前端
- Vue 3
- Vue Router
- Pinia
- Vite
- Tailwind CSS

### 后端
- Node.js
- Express
- MySQL
- JWT认证

## 部署说明

### 环境变量

在 `docker-compose.yml` 中配置以下环境变量：

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - DB_HOST=host.docker.internal
  - DB_PORT=3306
  - DB_USER=mymoney888
  - DB_PASSWORD=mymoney888
  - DB_NAME=mymoney888
  - JWT_SECRET=your-secret-key
```

### 数据库配置

确保MySQL服务正常运行，并创建了相应的数据库和用户。

## 开发指南

### 添加新功能

1. 前端功能：在 `src/views/` 中创建新组件
2. 后端API：在 `server/index.js` 中添加新路由
3. 数据库：在 `server/init-db.sql` 中添加表结构

### 测试

```bash
# 运行前端测试
npm test

# 运行后端测试
npm run test:server
```

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License

---

**MyMoney888** v2.0.3 - 让记账更简单，让生活更美好！