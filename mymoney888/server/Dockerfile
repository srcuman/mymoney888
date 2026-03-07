FROM node:25.8.0-alpine

WORKDIR /app

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json
COPY package*.json ./

# 安装后端依赖
RUN npm install --production

# 复制后端代码
COPY server/index.js ./server/index.js

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动后端服务
CMD ["node", "server/index.js"]
