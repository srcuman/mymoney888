FROM node:25.8.0-alpine

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./

RUN npm install --production

COPY server/index.js ./server/index.js

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "server/index.js"]