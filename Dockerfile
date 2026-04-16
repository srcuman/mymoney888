# 使用Node.js 25.8.0-alpine版本
FROM node:25.8.0-alpine

# 先切换Alpine镜像源为阿里云（解决TLS错误）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装bash（用于启动脚本）
RUN apk add --no-cache bash

# 设置工作目录
WORKDIR /app

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装后端依赖（不需要 devDependencies）
RUN npm install --production

# 复制服务器代码
COPY server.js ./
COPY scripts ./scripts

# 复制已构建的前端文件
COPY dist ./dist

# 删除可能存在的 .env 文件（防止旧配置污染）
RUN rm -f /app/.env

# 设置脚本执行权限
RUN chmod +x /app/scripts/start-app.sh /app/scripts/upgrade.sh /app/scripts/upgrade-command.sh

# 暴露8888端口
EXPOSE 8888

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8888', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动服务器
CMD ["/bin/sh", "/app/scripts/start-app.sh"]
