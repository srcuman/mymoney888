# 使用阿里云容器镜像加速的 Node.js
# registry.docker-cn.com 是 Docker Hub 国内镜像
FROM registry.docker-cn.com/library/node:25.8.0-alpine

# 安装bash
RUN apk add --no-cache bash

# 设置工作目录
WORKDIR /app

# 设置npm镜像源为淘宝
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有文件
COPY . .

# 设置脚本执行权限
RUN chmod +x /app/scripts/start-app.sh /app/scripts/upgrade.sh /app/scripts/upgrade-command.sh

# 暴露8888端口
EXPOSE 8888

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8888', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动服务器
CMD ["/bin/sh", "/app/scripts/start-app.sh"]
