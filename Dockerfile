# 使用Node.js 25.8.0-alpine版本
FROM node:25.8.0-alpine

# 先切换Alpine镜像源为阿里云（解决TLS错误）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装bash、git和构建前端所需的依赖
RUN apk add --no-cache bash git

# 设置工作目录
WORKDIR /app

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，用于构建前端）
RUN npm install

# 复制前端构建所需的文件
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY index.html ./
COPY src ./src

# 构建前端
RUN npm run build

# 删除可能存在的 .env 文件（防止旧配置污染）
RUN rm -f /app/.env

# 复制其余文件
COPY scripts ./scripts
COPY server.js ./
COPY database ./database
COPY docs ./docs

# 设置脚本执行权限
RUN chmod +x /app/scripts/start-app.sh /app/scripts/upgrade.sh /app/scripts/upgrade-command.sh

# 暴露8888端口
EXPOSE 8888

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8888', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动服务器
CMD ["/bin/sh", "/app/scripts/start-app.sh"]
