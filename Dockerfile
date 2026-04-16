# 使用Node.js 25.8.0-alpine版本
FROM node:25.8.0-alpine

# 先切换Alpine镜像源为阿里云（解决TLS错误）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    sed -i 's/http:\/\//https:\/\//g' /etc/apk/repositories

# 安装bash、git
RUN apk add --no-cache bash git

# 设置工作目录
WORKDIR /app

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json和package-lock.json
COPY package*.json ./

# 复制所有源代码
COPY . .

# 删除可能存在的 .env 文件
RUN rm -f /app/.env

# 安装所有依赖（包括 devDependencies）
RUN echo "开始安装依赖..."
RUN npm install --verbose --no-fund --no-audit

# 构建前端
RUN echo "开始构建前端..."
RUN npm run build --verbose

# 设置脚本执行权限
RUN chmod +x /app/scripts/start-app.sh /app/scripts/upgrade.sh /app/scripts/upgrade-command.sh

# 暴露8888端口
EXPOSE 8888

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8888', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动服务器
CMD ["/bin/sh", "/app/scripts/start-app.sh"]
