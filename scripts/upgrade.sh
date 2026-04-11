#!/bin/sh

# 应用升级脚本
# 用于在Docker容器中升级MyMoney888应用

echo "========================================="
echo "MyMoney888 升级脚本"
echo "========================================="

# 全局变量
UPGRADE_SUCCESS=false
ERROR_MESSAGE=""

# 检查当前版本
current_version=$(cat package.json | grep version | cut -d '"' -f 4)
echo "当前版本: $current_version"

# 检查是否有新版本
check_for_updates() {
    echo "检查是否有新版本..."
    
    # 尝试从Gitee仓库获取最新版本信息
    # 注意：这里需要根据实际情况修改仓库地址
    repo_url="https://gitee.com/srcuman/mymoney888/raw/test/package.json"
    
    echo "从仓库获取最新版本信息: $repo_url"
    
    # 下载最新的package.json文件
    latest_package=$(curl -s $repo_url)
    
    if [ $? -ne 0 ]; then
        echo "✗ 无法连接到仓库，检查网络连接"
        return 1
    fi
    
    # 提取最新版本号
    latest_version=$(echo $latest_package | grep version | cut -d '"' -f 4)
    
    if [ -z "$latest_version" ]; then
        echo "✗ 无法获取最新版本信息"
        return 1
    fi
    
    echo "最新版本: $latest_version"
    
    # 比较版本号
    if [ "$current_version" = "$latest_version" ]; then
        echo "✓ 当前已是最新版本"
        return 0
    else
        echo "发现新版本: $latest_version"
        return 2
    fi
}

# 执行升级
perform_upgrade() {
    echo "开始升级..."
    
    # 备份当前代码
    echo "备份当前代码..."
    backup_dir="/app/backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p $backup_dir
    cp -r /app/* $backup_dir/
    echo "✓ 代码备份完成: $backup_dir"
    
    # 拉取最新代码
    echo "拉取最新代码..."
    git pull origin test
    
    if [ $? -ne 0 ]; then
        echo "✗ 拉取代码失败，回滚到备份"
        cp -r $backup_dir/* /app/
        return 1
    fi
    
    # 更新依赖
    echo "更新依赖..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "✗ 依赖更新失败，回滚到备份"
        cp -r $backup_dir/* /app/
        return 1
    fi
    
    # 构建项目
    echo "构建项目..."
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "✗ 项目构建失败，回滚到备份"
        cp -r $backup_dir/* /app/
        return 1
    fi
    
    echo "✓ 升级成功！"
    return 0
}

# 主流程
check_for_updates
update_status=$?

if [ $update_status -eq 0 ]; then
    echo "无需升级，当前已是最新版本"
    exit 0
elif [ $update_status -eq 1 ]; then
    echo "无法检查更新，请稍后重试"
    exit 1
else
    # 确认升级
    echo "是否要升级到新版本？(y/n)"
    read -t 10 -n 1 answer || answer="n"
    
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        perform_upgrade
        if [ $? -eq 0 ]; then
            echo "========================================="
            echo "升级完成！请重启容器以应用更新"
            echo "命令: docker restart <容器名>"
            echo "========================================="
        else
            echo "========================================="
            echo "升级失败，请检查错误信息"
            echo "========================================="
        fi
    else
        echo "取消升级"
        exit 0
    fi
fi
