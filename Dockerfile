# 使用Node.js 18 LTS版本（更稳定）
# 如遇到镜像拉取问题，可使用以下替代镜像源：
# FROM docker.mirrors.sjtug.sjtu.edu.cn/library/node:18-alpine
# FROM registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置npm镜像源（加速依赖安装）
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制所有文件
COPY . .

# 暴露8888端口
EXPOSE 8888

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8888', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动服务器
CMD ["node", "dist/server.cjs"]
