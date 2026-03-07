# MyMoney888 - 个人记账软件

一个功能强大的个人记账软件，支持多维度分类、账套管理、数据导入导出、信用卡管理、贷款管理等功能。

## 功能特点

### 核心功能
- ✅ 交易记账（收入、支出、转账）
- ✅ 账户管理（支持多种账户类型）
- ✅ 多维度分类（多级分类结构）
- ✅ **账套切换**（一个账号下多个独立账套）
- ✅ **数据管理**（导入导出独立模块）
- ✅ 数据导入（支付宝、微信、CSV）
- ✅ 数据导出（CSV格式）
- ✅ 统计分析（饼图、同比环比分析）
- ✅ 年度回顾
- ✅ 金额计算器
- ✅ 管理员功能（仅限账号管理）
- ✅ **日志记录**（运行日志记录和查看）

### 信用卡管理（v1.7.0新增）
- ✅ 信用卡账户管理
- ✅ 账单日、还款日设置
- ✅ 信用额度管理
- ✅ 本月账单统计
- ✅ 近期还款提醒
- ✅ **分期记账**：支持分期模板、分期名称、多期数选择
- ✅ **账单详情**：按账期查看交易明细
- ✅ **消费分析**：
  - 月份分析（消费金额、交易笔数）
  - 账期分析（账单金额、还款日期、还款状态）
  - 分类分析（消费占比可视化）

### 贷款管理（v1.7.0新增）
- ✅ 多类型贷款支持（房贷、车贷、个人贷款、商业贷款、助学贷款、其他）
- ✅ 贷款信息管理（金额、利率、期限、还款日）
- ✅ 等额本息还款计算
- ✅ 还款进度追踪（可视化进度条）
- ✅ 还款记录管理
- ✅ **智能还款提醒**：
  - 3天内到期：红色警告
  - 7天内到期：黄色提醒
  - 其他：蓝色提示
- ✅ 贷款统计分析（总额、已还、剩余本金、剩余期数）

### 技术特点（v2.0.0更新）
- 🚀 基于Vue 3 + Tailwind CSS
- 🌐 **Express + MySQL后端架构**（数据持久化存储）
- 📦 Docker容器化部署（包含前端、后端、数据库）
- 🔒 **MySQL数据库存储**（数据更安全、支持多用户）
- 📱 响应式设计
- 📝 运行日志记录（便于问题诊断）
- 🔐 JWT身份认证
- 🗄️ RESTful API设计

## 快速开始

### 方法一：Docker部署（推荐）

```bash
# 克隆仓库
git clone https://github.com/srcuman/mymoney888.git
cd mymoney888

# 启动所有服务（MySQL + 后端API + 前端）
docker-compose up -d

# 访问 http://localhost:8888
```

服务说明：
- **MySQL数据库**：端口 3306
- **后端API**：端口 3000
- **前端界面**：端口 8888

### 方法二：本地开发

```bash
# 安装依赖
npm install

# 启动MySQL数据库（需要提前安装MySQL）
# 或使用Docker：docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=mymoney888-root -e MYSQL_DATABASE=mymoney888 -e MYSQL_USER=mymoney888 -e MYSQL_PASSWORD=mymoney888 mysql:8.0

# 配置环境变量
cp .env.example .env
cp server/.env.example server/.env

# 启动后端服务
cd server
npm install
npm start &

# 启动前端开发服务器
cd ..
npm run dev

# 访问 http://localhost:5173
```

## 账户信息

- **默认管理员账户**：
  - 用户名：`admin`
  - 密码：`admin123`
  
- **注册新用户**：
  - 普通用户：直接填写用户名和密码即可注册
  - 管理员用户：注册时填写管理员注册码 `admin123`

- **管理员功能**：管理员可以查看所有用户日志，管理用户权限

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
│   ├── init-db.sql        # 数据库初始化脚本
│   ├── Dockerfile         # 后端Docker配置
│   └── package.json       # 后端依赖
├── dist/                  # 前端构建输出
├── Dockerfile             # 前端Docker配置
├── docker-compose.yml     # 多服务编排配置
└── README.md              # 项目说明
```

## 数据库结构

- **users** - 用户表
- **books** - 账套表
- **accounts** - 账户表
- **categories** - 分类表
- **merchants** - 商家表
- **transactions** - 交易表
- **credit_cards** - 信用卡表
- **loans** - 贷款表
- **payment_records** - 还款记录表
- **projects** - 项目表
- **members** - 成员表
- **logs** - 日志表

## 功能使用指南

### 1. 用户注册与登录
- 首次使用可使用默认管理员账户登录（admin/admin123）
- 或自行注册新账户
- 注册为管理员需填写注册码 `admin123`

### 2. 记账功能
- 在首页点击记账按钮
- 选择交易类型（收入/支出/转账）
- 输入金额
- 选择分类、账户等信息
- 交易时间默认为当前时间
- 点击保存

### 3. 信用卡分期记账
- 记账时选择信用卡账户
- 勾选"使用分期"
- 可选择已保存的分期模板或手动设置
- 输入分期名称（如商品名称）
- 保存后可选择"保存为模板"供下次使用

### 4. 信用卡管理
- 点击顶部导航"信用卡"进入管理页面
- 点击"添加信用卡"添加新卡
- 设置账单日、还款日、信用额度等信息
- 点击"查看账单"查看具体账期明细
- 点击"分析"查看消费分析报表

### 5. 贷款管理
- 点击顶部导航"贷款"进入管理页面
- 点击"添加贷款"记录贷款信息
- 设置贷款类型、金额、利率、期限等
- 点击"记录还款"记录每期还款
- 查看"近期还款提醒"了解即将到期的还款

### 6. 账套切换
- 点击导航栏右侧的账套名称
- 在下拉菜单中选择要切换的账套
- 或点击「新建账套」创建新账套
- 切换账套后页面会自动刷新加载新账套数据
- 各账套数据完全隔离，互不干扰

### 7. 数据管理
- 点击顶部导航「数据管理」进入数据管理页面
- **导出数据**：将所有交易记录导出为CSV格式
- **导入数据**：支持多种格式导入
  - JSON格式（完整数据备份）
  - 支付宝账单（CSV）
  - 微信账单（CSV）
  - 通用CSV格式（可下载样板）

## 版本历史

### v2.0.0 (2026-03-07)
- 🚀 **重大升级**：从LocalStorage迁移至MySQL数据库
- ✨ 新增Express后端API服务
- ✨ 新增JWT身份认证机制
- ✨ 新增RESTful API设计
- 🔒 数据持久化存储，支持多用户
- 📦 Docker Compose多服务编排（前端+后端+MySQL）
- 🎨 前端API调用封装
- 🐛 修复数据丢失问题（之前使用LocalStorage可能丢失）

### v1.9.0 (2026-03-07)
- ✨ 优化分期交易显示逻辑（交易明细显示总额，信用卡账单显示每期）
- ✨ 新增分期唯一标识（自动生成分期组ID）
- ✨ 新增分期详情查看功能（点击分期ID查看完整明细）
- 🎨 优化信用卡账单界面（添加分期ID列）
- 🐛 修复分期详情模态框重复问题

### v1.8.0 (2025-03-07)
- ✨ 新增账套切换功能（一个账号下多个独立账套）
- ✨ 新增数据管理独立模块（导入导出功能）
- 🔒 限制管理员仅限账号管理功能
- 🎨 优化导航栏布局（添加账套切换下拉菜单）

### v1.7.1 (2025-03-07)
- 🐛 修复记账功能中的分期交易记录问题
- ✨ 实现信用卡与账户系统的联动（还款记录为交易）
- ✨ 实现贷款与交易系统的联动（还款记录为交易）
- ✨ 恢复CSV样板下载功能
- 🎨 优化信用卡还款提醒（显示天数和快捷还款按钮）
- 🎨 优化贷款还款记录（自动创建交易记录）

### v1.7.0 (2025-03-07)
- ✨ 新增贷款管理功能
- ✨ 新增信用卡分期模板功能
- ✨ 新增信用卡消费分析（月份、账期、分类）
- ✨ 新增运行日志记录功能
- 🎨 优化交易时间录入（合并日期时间选择器）
- 🎨 优化信用卡管理界面

### v1.6.0
- ✨ 新增信用卡管理功能
- ✨ 新增分期记账功能
- ✨ 新增年度回顾功能
- ✨ 新增金额计算器
- ✨ 新增管理员功能
- ✨ 新增在线升级功能

## 技术栈

### 前端
- **框架**：Vue 3.5.13 (Composition API)
- **UI**：Tailwind CSS 3.4
- **路由**：Vue Router 4.4
- **状态管理**：Pinia 2.2
- **图表**：Chart.js 4.4
- **构建工具**：Vite 5.4

### 后端
- **框架**：Express 4.19
- **数据库**：MySQL 8.0
- **ORM**：mysql2 (原生SQL)
- **认证**：JWT (jsonwebtoken)
- **加密**：bcryptjs
- **环境变量**：dotenv

### 部署
- **容器化**：Docker + Docker Compose
- **反向代理**：无需要（端口映射）

## 开发指南

### 开发环境搭建

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install

# 启动后端服务
npm start

# 启动前端开发服务器（另一个终端）
cd ..
npm run dev
```

### 项目配置

**前端配置** (.env)：
```
VITE_API_URL=http://localhost:3000/api
```

**后端配置** (server/.env)：
```
PORT=3000
JWT_SECRET=mymoney888-secret-key
DB_HOST=localhost
DB_USER=mymoney888
DB_PASSWORD=mymoney888
DB_NAME=mymoney888
```

## API文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 账套接口
- `GET /api/books` - 获取账套列表
- `POST /api/books` - 创建账套

### 账户接口
- `GET /api/books/:bookId/accounts` - 获取账户列表
- `POST /api/books/:bookId/accounts` - 创建账户
- `PUT /api/books/:bookId/accounts/:accountId` - 更新账户
- `DELETE /api/books/:bookId/accounts/:accountId` - 删除账户

### 交易接口
- `GET /api/books/:bookId/transactions` - 获取交易列表
- `POST /api/books/:bookId/transactions` - 创建交易
- `PUT /api/books/:bookId/transactions/:transactionId` - 更新交易
- `DELETE /api/books/:bookId/transactions/:transactionId` - 删除交易

更多API接口请参考源码。

## 注意事项

1. **数据安全**：v2.0.0版本使用MySQL数据库，建议定期备份数据库
2. **首次部署**：首次运行docker-compose会自动初始化数据库并创建默认管理员账户
3. **生产环境**：部署到生产环境前请修改JWT_SECRET和数据库密码
4. **浏览器兼容**：支持主流浏览器：Chrome、Firefox、Safari、Edge
5. **账套隔离**：信用卡和贷款数据按账套隔离存储

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

---

**MyMoney888** - 让记账更简单，让生活更美好！