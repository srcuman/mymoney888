FROM node:25.8.0-alpine

WORKDIR /app

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制所有文件
COPY . .

# 安装所有依赖
RUN npm install --legacy-peer-deps --no-optional

# 构建前端
RUN npm run build

# 暴露3000端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动应用
CMD ["npm", "start"]
