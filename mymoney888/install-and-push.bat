@echo off
REM 安装Git并推送到GitHub

echo ========================================
echo MyMoney888 - 安装Git并推送到GitHub
echo ========================================
echo.

REM 检查Git是否已安装
where git >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Git已安装
    goto :PUSH_CODE
)

echo [!] Git未安装,正在安装...
echo.

REM 使用winget安装Git
winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
if %errorlevel% neq 0 (
    echo [X] Git安装失败,请手动安装: https://git-scm.com/downloads
    pause
    exit /b 1
)

echo [✓] Git安装成功
echo.
REM 刷新环境变量
refreshenv

:PUSH_CODE
echo [1/5] 检查仓库状态...
cd /d "%~dp0"
git status
if %errorlevel% neq 0 (
    echo [!] 这不是一个Git仓库
    pause
    exit /b 1
)

echo [2/5] 添加所有文件...
git add .

echo [3/5] 创建提交...
git commit -m "Add GitHub Actions for automatic Docker image builds"

echo [4/5] 推送到GitHub...
git push

if %errorlevel% neq 0 (
    echo.
    echo [!] 推送失败,可能需要配置GitHub凭据
    echo.
    echo 请选择认证方式:
    echo 1. 使用Personal Access Token (推荐)
    echo 2. 使用SSH密钥
    echo.
    set /p auth_choice="请输入选项 (1 或 2): "

    if "%auth_choice%"=="1" (
        echo.
        echo 配置Personal Access Token认证:
        echo 1. 访问 https://github.com/settings/tokens
        echo 2. 创建新Token,勾选:
        echo    - repo (完整仓库访问权限)
        echo 3. 复制Token
        echo 4. 运行以下命令:
        echo    git remote set-url origin https://YOUR_TOKEN@github.com/srcuman/mymoney888.git
        echo    git push
        echo.
        pause
    ) else if "%auth_choice%"=="2" (
        echo.
        echo 配置SSH密钥:
        echo 1. 运行: ssh-keygen -t ed25519 -C "your_email@example.com"
        echo 2. 复制公钥内容: type %USERPROFILE%\.ssh\id_ed25519.pub
        echo 3. 添加到GitHub: https://github.com/settings/keys
        echo 4. 修改远程URL: git remote set-url origin git@github.com:srcuman/mymoney888.git
        echo 5. 推送: git push
        echo.
        pause
    )
    exit /b 1
)

echo [5/5] 推送成功!
echo.
echo ========================================
echo 代码已推送到GitHub!
echo ========================================
echo.
echo 查看构建进度: https://github.com/srcuman/mymoney888/actions
echo.
echo 构建完成后,运行以下命令启动服务:
echo   docker-compose up -d
echo.
pause
