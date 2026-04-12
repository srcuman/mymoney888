# 数据库初始化和升级脚本 (Windows PowerShell)
# 用于在部署时自动配置数据库结构，支持增量升级

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "数据库初始化/升级脚本" -ForegroundColor Cyan
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

# SQL文件路径
$INIT_SQL_FILE = "database\init-db.sql"
$UPGRADE_SQL_FILE = "database\add-net-value-fields.sql"

Write-Host "数据库配置:" -ForegroundColor Yellow
Write-Host "  主机: $DB_HOST"
Write-Host "  端口: $DB_PORT"
Write-Host "  用户: $DB_USER"
Write-Host "  数据库: $DB_NAME"
Write-Host ""

# 执行MySQL命令的辅助函数
function Invoke-MySql {
    param([string]$Query)
    & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME -e $Query 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
}

function Test-TableExists {
    param([string]$Table)
    $result = & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES LIKE '$Table'" 2>&1 | Select-String $Table
    return ($null -ne $result)
}

function Test-ColumnExists {
    param([string]$Table, [string]$Column)
    $result = & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW COLUMNS FROM $Table LIKE '$Column'" 2>&1 | Select-String $Column
    return ($null -ne $result)
}

function Get-MySqlResult {
    param([string]$Query)
    return & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME -e $Query 2>&1
}

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
        } else {
            Write-Host "错误: 数据库初始化失败！" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "警告: 初始化SQL文件不存在: $INIT_SQL_FILE" -ForegroundColor Yellow
    }
} else {
    Write-Host "数据库已包含 $($TABLE_COUNT - 1) 个表，执行增量升级..." -ForegroundColor Cyan
}

# ========== 增量升级：检查并添加缺失的表和字段 ==========
Write-Host ""
Write-Host "========== 增量升级检查 ==========" -ForegroundColor Cyan

# 投资账户表
if (-not (Test-TableExists "investment_accounts")) {
    Write-Host "创建表: investment_accounts" -ForegroundColor Yellow
    Invoke-MySql @"
    CREATE TABLE IF NOT EXISTS investment_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL COMMENT '用户ID',
        name VARCHAR(100) NOT NULL COMMENT '投资账户名称',
        type ENUM('fund', 'stock', 'bond', 'other') DEFAULT 'other' COMMENT '账户类型',
        description TEXT COMMENT '账户描述',
        total_asset DECIMAL(15, 2) DEFAULT 0.00 COMMENT '总资产',
        profit_loss DECIMAL(15, 2) DEFAULT 0.00 COMMENT '盈亏',
        is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"@
    Write-Host "  ✓ investment_accounts 创建成功" -ForegroundColor Green
} else {
    Write-Host "  ✓ investment_accounts 已存在" -ForegroundColor Green
}

# 投资明细表
if (-not (Test-TableExists "investment_details")) {
    Write-Host "创建表: investment_details" -ForegroundColor Yellow
    Invoke-MySql @"
    CREATE TABLE IF NOT EXISTS investment_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL COMMENT '用户ID',
        account_id INT NOT NULL COMMENT '投资账户ID',
        type ENUM('fund', 'stock', 'bond', 'other') NOT NULL COMMENT '投资品种类型',
        code VARCHAR(20) NOT NULL COMMENT '投资品种代码',
        name VARCHAR(100) NOT NULL COMMENT '投资品种名称',
        shares DECIMAL(15, 4) DEFAULT 0.0000 COMMENT '持有份额',
        cost_price DECIMAL(15, 4) DEFAULT 0.00 COMMENT '成本价',
        current_price DECIMAL(15, 4) DEFAULT 0.00 COMMENT '当前价格',
        update_date DATE COMMENT '净值更新日期',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES investment_accounts(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_account_id (account_id),
        INDEX idx_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"@
    Write-Host "  ✓ investment_details 创建成功" -ForegroundColor Green
} else {
    Write-Host "  ✓ investment_details 已存在" -ForegroundColor Green
}

# 投资明细表 - 检查并添加 net_value_date 字段
if ((Test-TableExists "investment_details") -and (-not (Test-ColumnExists "investment_details" "net_value_date"))) {
    Write-Host "添加字段: investment_details.net_value_date" -ForegroundColor Yellow
    Invoke-MySql "ALTER TABLE investment_details ADD COLUMN net_value_date DATE COMMENT '净值更新日期' AFTER update_date;"
    Write-Host "  ✓ net_value_date 字段添加成功" -ForegroundColor Green
}

# 净值历史记录表
if (-not (Test-TableExists "net_value_history")) {
    Write-Host "创建表: net_value_history" -ForegroundColor Yellow
    Invoke-MySql @"
    CREATE TABLE IF NOT EXISTS net_value_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL COMMENT '用户ID',
        code VARCHAR(20) NOT NULL COMMENT '投资品种代码',
        name VARCHAR(100) NOT NULL COMMENT '投资品种名称',
        date DATE NOT NULL COMMENT '净值日期',
        price DECIMAL(15, 4) NOT NULL COMMENT '净值/价格',
        update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, date),
        INDEX idx_code_date (code, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"@
    Write-Host "  ✓ net_value_history 创建成功" -ForegroundColor Green
} else {
    Write-Host "  ✓ net_value_history 已存在" -ForegroundColor Green
}

# 其他可能缺失的表
$otherTables = @(
    @{Name="dimensions"; Sql="CREATE TABLE IF NOT EXISTS dimensions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, type ENUM('members','merchants','tags','payment_channels') NOT NULL, name VARCHAR(100) NOT NULL, extra_data JSON, is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_user_id (user_id), INDEX idx_type (type)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"},
    @{Name="ledgers"; Sql="CREATE TABLE IF NOT EXISTS ledgers (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(100) NOT NULL, type VARCHAR(20) DEFAULT 'default', is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_user_id (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"},
    @{Name="members"; Sql="CREATE TABLE IF NOT EXISTS members (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(100) NOT NULL, relationship VARCHAR(50), extra_data JSON, is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_user_id (user_id), INDEX idx_relationship (relationship)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"}
)

foreach ($tableInfo in $otherTables) {
    if (-not (Test-TableExists $tableInfo.Name)) {
        Write-Host "创建表: $($tableInfo.Name)" -ForegroundColor Yellow
        Invoke-MySql $tableInfo.Sql
        Write-Host "  ✓ $($tableInfo.Name) 创建成功" -ForegroundColor Green
    } else {
        Write-Host "  ✓ $($tableInfo.Name) 已存在" -ForegroundColor Green
    }
}

# 执行额外的升级SQL文件（如果存在）
if (Test-Path $UPGRADE_SQL_FILE) {
    Write-Host ""
    Write-Host "执行额外升级脚本: $UPGRADE_SQL_FILE" -ForegroundColor Yellow
    & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME < $UPGRADE_SQL_FILE 2>&1 | Out-Null
    Write-Host "  升级SQL执行完成" -ForegroundColor Green
}

# 验证所有关键表
Write-Host ""
Write-Host "========== 验证关键表 ==========" -ForegroundColor Cyan
$REQUIRED_TABLES = @("users", "accounts", "categories", "transactions", "credit_cards", "credit_card_bills", "loans", "loan_payments", "installment_templates", "installments", "merchants", "projects", "members", "dimensions", "ledgers", "sync_logs", "user_settings", "investment_accounts", "investment_details", "net_value_history")

$ALL_TABLES_EXIST = $true
foreach ($table in $REQUIRED_TABLES) {
    if (Test-TableExists $table) {
        Write-Host "  ✓ $table" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $table (不存在)" -ForegroundColor Red
        $ALL_TABLES_EXIST = $false
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "数据库初始化/升级完成" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
