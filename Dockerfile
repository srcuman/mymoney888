# 使用Node.js 25.8.0-alpine版本
FROM node:25.8.0-alpine

# 先切换Alpine镜像源为阿里云（解决TLS错误）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    sed -i 's/http:\/\//https:\/\//g' /etc/apk/repositories

# 安装bash、git和构建前端所需的依赖
RUN apk add --no-cache bash git

# 设置工作目录
WORKDIR /app

# 设置npm镜像源（使用多个备选源）
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ && \
    npm config set sass_binary_site=https://npmmirror.com/mirrors/node-sass/ && \
    npm config set puppeteer_download_host=https://npmmirror.com/mirrors/ && \
    npm config set timeout=120000

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，用于构建前端）
# 添加 --prefer-offline 优先使用缓存
RUN npm install --prefer-offline || npm install

# 复制前端构建所需的文件
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY index.html ./
COPY src ./src

# 构建前端（添加更多错误输出）
RUN echo "=== 开始构建前端 ===" && \
    npm run build 2>&1 || (echo "=== 构建失败，查看依赖 ===" && npm ls && echo "=== 查看 node_modules ===" && ls -la node_modules/ | head -20 && exit 1)

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
