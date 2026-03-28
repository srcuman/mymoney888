# 数据库初始化脚本 (Windows PowerShell)
# 用于在部署时自动配置数据库结构

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "数据库初始化脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 从环境变量获取数据库配置
$DB_HOST = $env:DB_HOST
if (-not $DB_HOST) { $DB_HOST = "mysql" }

$DB_PORT = $env:DB_PORT
if (-not $DB_PORT) { $DB_PORT = "3306" }

$DB_USER = $env:DB_USER
if (-not $DB_USER) { $DB_USER = "root" }

$DB_PASSWORD = $env:DB_PASSWORD
if (-not $DB_PASSWORD) { $DB_PASSWORD = "mymoney888" }

$DB_NAME = $env:DB_NAME
if (-not $DB_NAME) { $DB_NAME = "mymoney888" }

# 初始化SQL文件路径
$INIT_SQL_FILE = "database\init-db.sql"

Write-Host "数据库配置:" -ForegroundColor Yellow
Write-Host "  主机: $DB_HOST"
Write-Host "  端口: $DB_PORT"
Write-Host "  用户: $DB_USER"
Write-Host "  数据库: $DB_NAME"
Write-Host ""

# 等待数据库就绪
Write-Host "等待数据库就绪..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $result = & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD -e "SELECT 1" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "数据库已就绪！" -ForegroundColor Green
            break
        }
    } catch {
        # 忽略错误，继续尝试
    }
    
    $attempt++
    Write-Host "尝试连接数据库 ($attempt/$maxAttempts)..."
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "错误: 无法连接到数据库！" -ForegroundColor Red
    exit 1
}

# 检查数据库是否存在
Write-Host "检查数据库是否存在..." -ForegroundColor Yellow
$DB_EXISTS = & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD -e "SHOW DATABASES LIKE '$DB_NAME'" 2>&1 | Select-String $DB_NAME

if (-not $DB_EXISTS) {
    Write-Host "数据库 $DB_NAME 不存在，正在创建..." -ForegroundColor Yellow
    & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "数据库创建成功！" -ForegroundColor Green
    } else {
        Write-Host "错误: 数据库创建失败！" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "数据库 $DB_NAME 已存在" -ForegroundColor Green
}

# 检查是否需要初始化表结构
Write-Host "检查表结构..." -ForegroundColor Yellow
$TABLE_COUNT = & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES" 2>&1 | Measure-Object -Line | Select-Object -ExpandProperty Lines

if ($TABLE_COUNT -le 1) {
    Write-Host "数据库为空，开始初始化表结构..." -ForegroundColor Yellow
    
    if (Test-Path $INIT_SQL_FILE) {
        Write-Host "执行初始化SQL脚本: $INIT_SQL_FILE" -ForegroundColor Yellow
        & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME < $INIT_SQL_FILE 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "数据库初始化成功！" -ForegroundColor Green
            
            # 显示创建的表
            Write-Host ""
            Write-Host "已创建的表:" -ForegroundColor Cyan
            & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES"
        } else {
            Write-Host "错误: 数据库初始化失败！" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "警告: 初始化SQL文件不存在: $INIT_SQL_FILE" -ForegroundColor Yellow
        Write-Host "跳过数据库初始化..."
    }
} else {
    Write-Host "数据库已包含 $($TABLE_COUNT - 1) 个表，跳过初始化" -ForegroundColor Green
}

# 验证关键表是否存在
Write-Host ""
Write-Host "验证关键表..." -ForegroundColor Yellow
$REQUIRED_TABLES = @("users", "accounts", "categories", "transactions", "credit_cards", "credit_card_bills", "loans", "loan_payments", "installment_templates", "installments", "merchants", "projects", "members", "transaction_merchants", "transaction_projects", "transaction_members", "sync_logs", "user_settings")

$ALL_TABLES_EXIST = $true
foreach ($table in $REQUIRED_TABLES) {
    $TABLE_EXISTS = & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES LIKE '$table'" 2>&1 | Select-String $table
    if ($TABLE_EXISTS) {
        Write-Host "  ✓ $table" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $table (不存在)" -ForegroundColor Red
        $ALL_TABLES_EXIST = $false
    }
}

if ($ALL_TABLES_EXIST) {
    Write-Host ""
    Write-Host "所有关键表验证通过！" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "警告: 部分关键表不存在，请检查数据库初始化！" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "数据库初始化完成" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
