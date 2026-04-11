#!/bin/bash

# 构建Docker镜像并添加版本标签

# 获取版本号
VERSION=$(grep "version" package.json | cut -d '"' -f 4)

# 构建镜像
docker build -t mymoney888:${VERSION} .
docker build -t mymoney888:latest .

# 查看构建结果
docker images | grep mymoney888

echo "Docker镜像构建完成，版本标签: ${VERSION}"
