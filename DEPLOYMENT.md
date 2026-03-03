# 部署指南

## GitHub仓库信息
- **仓库地址**：https://github.com/srcuman/mymoney888
- **版本**：v1.0.0
- **分支**：main, v1.0.0

## 已上传的文件
✅ README.md - 项目说明文档
✅ Dockerfile - Docker构建配置
✅ docker-compose.yml - Docker Compose配置
✅ package.json - 项目依赖配置
✅ .gitignore - Git忽略文件配置
✅ dist/index.html - 主页面
✅ dist/server.cjs - 服务器脚本
⚠️ dist/app.js - 需要手动上传完整版

## 手动上传app.js文件

由于app.js文件较大（约150KB），需要通过GitHub网页界面上传：

### 方法一：通过GitHub网页界面上传（推荐）

1. 访问仓库：https://github.com/srcuman/mymoney888
2. 点击 "Add file" -> "Upload files"
3. 创建文件夹：输入 `dist`
4. 上传文件：选择 `z:\AI\项目\mymoney888\dist\app.js`
5. 在 "Commit changes" 框中输入：`更新完整app.js代码`
6. 点击 "Commit changes" 按钮

### 方法二：使用Git命令行（需要安装Git）

如果您有Git环境，可以使用以下命令：

```bash
# 克隆仓库
git clone https://github.com/srcuman/mymoney888.git
cd mymoney888

# 复制app.js文件
cp "z:\AI\项目\mymoney888\dist\app.js" dist/app.js

# 提交更改
git add dist/app.js
git commit -m "更新完整app.js代码"

# 推送到GitHub
git push origin main

# 创建版本标签
git tag -a v1.0.0 -m "版本 1.0.0 - 初始发布"
git push origin v1.0.0
```

## Docker部署

### 快速启动

```bash
# 克隆仓库
git clone https://github.com/srcuman/mymoney888.git
cd mymoney888

# 启动服务
docker-compose up -d

# 访问应用
# 浏览器打开：http://localhost:8888
```

### 停止服务

```bash
docker-compose down
```

### 查看日志

```bash
docker-compose logs -f
```

## 直接运行（不使用Docker）

```bash
# 进入项目目录
cd mymoney888

# 安装依赖
npm install

# 启动服务器
node dist/server.cjs

# 访问应用
# 浏览器打开：http://localhost:8888
```

## 测试账号

- **测试账号**：test / test
- **管理员账号**：admin / admin（注册时需要管理员码：admin123）

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

## 版本控制

项目已实现版本控制功能，支持：
- 自动检查GitHub上的最新版本
- 发现新版本时提示升级
- 一键跳转到GitHub下载页面

## 注意事项

1. **数据备份**：数据存储在浏览器本地，建议定期导出备份
2. **浏览器兼容**：支持主流浏览器（Chrome、Firefox、Safari、Edge）
3. **端口配置**：默认使用8888端口，可在server.cjs中修改
4. **账套隔离**：不同账套的数据完全隔离，切换账套会自动保存数据

## 故障排除

### 端口被占用
如果8888端口被占用，可以修改 `dist/server.cjs` 中的端口号：
```javascript
server.listen(8888); // 改为其他端口
```

### Docker启动失败
检查Docker服务是否正常运行：
```bash
docker ps
docker-compose ps
```

### 数据丢失
定期使用"导出数据"功能备份CSV文件，避免数据丢失。

## 联系支持

如有问题，请在GitHub仓库提交Issue：
https://github.com/srcuman/mymoney888/issues

---

**MyMoney888 v1.0.0** - 让记账更简单，让生活更美好！
