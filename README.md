# MyMoney888 - 个人记账软件

一个功能强大的个人记账软件，支持多维度分类、账套管理、数据导入导出、信用卡管理、贷款管理等功能。

## 快速开始

### Docker部署（推荐）

```bash
# 克隆仓库
git clone https://github.com/srcuman/mymoney888.git
cd mymoney888

# 启动所有服务（MySQL + 后端API + 前端）
docker-compose up -d

# 访问 http://localhost:8888
```

**默认管理员账户**：
- 用户名：`admin`
- 密码：`admin123`

## v2.0.0 新特性

- 🚀 从LocalStorage迁移至MySQL数据库
- ✨ 新增Express后端API服务
- ✨ 新增JWT身份认证机制
- ✨ 新增RESTful API设计
- 🔒 数据持久化存储，支持多用户
- 📦 Docker Compose多服务编排

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

## 完整文档

详细文档请查看项目根目录下的 README.md 文件。

---

**MyMoney888** v2.0.0 - 让记账更简单，让生活更美好！