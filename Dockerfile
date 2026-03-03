# 使用Node.js 22作为基础镜像
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制所有文件
COPY . .

# 暴露8888端口
EXPOSE 8888

# 启动服务器
CMD ["node", "dist/server.cjs"]
