@echo off
REM 登录并推送镜像到GitHub Container Registry

echo ========================================
echo MyMoney888 - 推送镜像到GitHub Container Registry
echo ========================================
echo.

REM 检查是否已登录
docker info | findstr ghcr.io >nul
if %errorlevel% neq 0 (
    echo [!] 未登录到GitHub Container Registry
    echo.
    echo 请按以下步骤操作:
    echo 1. 访问 https://github.com/settings/tokens
    echo 2. 创建新的Personal Access Token,勾选:
    echo    - write:packages
    echo    - read:packages
    echo 3. 复制生成的token
    echo 4. 运行以下命令登录:
    echo    docker login ghcr.io
    echo    用户名: 你的GitHub用户名
    echo    密码: 刚才生成的token
    echo.
    pause
    exit /b 1
)

echo [1/4] 构建后端镜像...
cd server
docker build -t ghcr.io/srcuman/mymoney888-backend:latest .
if %errorlevel% neq 0 (
    echo [X] 后端镜像构建失败
    pause
    exit /b 1
)
echo [✓] 后端镜像构建成功

echo [2/4] 推送后端镜像...
docker push ghcr.io/srcuman/mymoney888-backend:latest
if %errorlevel% neq 0 (
    echo [X] 后端镜像推送失败
    pause
    exit /b 1
)
echo [✓] 后端镜像推送成功

echo [3/4] 构建前端镜像...
cd ..
docker build -t ghcr.io/srcuman/mymoney888-frontend:latest .
if %errorlevel% neq 0 (
    echo [X] 前端镜像构建失败
    pause
    exit /b 1
)
echo [✓] 前端镜像构建成功

echo [4/4] 推送前端镜像...
docker push ghcr.io/srcuman/mymoney888-frontend:latest
if %errorlevel% neq 0 (
    echo [X] 前端镜像推送失败
    pause
    exit /b 1
)
echo [✓] 前端镜像推送成功

echo.
echo ========================================
echo 所有镜像已成功推送到GitHub Container Registry!
echo ========================================
echo.
echo 现在可以使用以下命令启动服务:
echo   docker-compose up -d
echo.
echo 或使用国内镜像版本:
echo   docker-compose -f docker-compose.cn.yml up -d
echo.
pause
