FROM node:25.8.0-alpine AS builder

WORKDIR /app

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json
COPY package.json ./

# 查看package.json内容
RUN cat package.json

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm install --legacy-peer-deps --no-optional --verbose

# 复制所有文件
COPY . .

# 查看目录结构
RUN ls -la

# 构建前端
RUN npm run build --verbose

# 生产阶段
FROM node:25.8.0-alpine

WORKDIR /app

# 复制package.json
COPY package.json ./

# 安装生产依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --prod --legacy-peer-deps --no-optional

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 复制后端代码
COPY server/ ./server/

# 暴露3000端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动应用
CMD ["npm", "start"]
