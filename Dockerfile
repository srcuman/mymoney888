FROM node:25.8.0-alpine AS builder

WORKDIR /app

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json
COPY package.json ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm install --legacy-peer-deps --no-optional

# 复制所有文件
COPY . .

# 构建前端
RUN npm run build

# 生产阶段
FROM node:25.8.0-alpine

WORKDIR /app

# 安装serve静态文件服务器
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g serve

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 暴露8888端口
EXPOSE 8888

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8888', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动静态文件服务器
CMD ["serve", "-s", "dist", "-l", "8888"]