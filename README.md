# MyMoney888 - 个人记账软件

一个功能强大的个人记账软件，支持多维度分类、账套管理、数据导入导出等功能。

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

```bash
# 克隆仓库
git clone https://github.com/yourusername/mymoney888.git
cd mymoney888

# 启动服务
docker-compose up -d

# 访问 http://localhost:8888
```

### 方法二：直接运行

```bash
# 克隆仓库
git clone https://github.com/yourusername/mymoney888.git
cd mymoney888

# 安装依赖
npm install

# 启动服务器
node dist/server.mjs

# 访问 http://localhost:8888
```

## 账户信息

- **首次注册**：需要输入管理员注册码 `admin123` 来注册为管理员
- **普通用户注册**：在已有管理员后，可直接注册为普通用户
- **管理员功能**：管理员可以管理所有用户账户，包括重置密码

## 项目结构

```
mymoney888/
├── dist/              # 生产构建文件
│   ├── app.js         # 主应用代码
│   ├── index.html     # 主页面
│   └── server.mjs     # 服务器脚本
├── src/               # 源代码（开发用）
├── Dockerfile         # Docker构建文件
├── docker-compose.yml # Docker Compose配置
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

当有新版本时，系统会自动检测并提示升级。点击升级按钮即可完成更新。

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

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

---

**MyMoney888** - 让记账更简单，让生活更美好！