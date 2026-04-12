# MyMoney888 v3.6.0 数据架构检查报告

## 版本信息
- **前端版本**: 3.6.0
- **数据库版本**: 3.6.0
- **检查日期**: 2026-04-12

---

## 1. 数据库表结构检查

| 表名 | 前端 localStorage | MySQL 表 | 字段完整性 | 说明 |
|------|-------------------|----------|-----------|------|
| accounts | ✅ | ✅ accounts | ✅ | 账户表 |
| transactions | ✅ | ✅ transactions | ✅ | 交易记录表 |
| categories | ✅ | ✅ categories | ✅ | 分类表 |
| creditCards | ✅ | ✅ credit_cards | ✅ | 信用卡表 |
| creditCardBills | ✅ | ✅ credit_card_bills | ✅ | 信用卡账单表 |
| loans | ✅ | ✅ loans | ✅ | 贷款表 |
| repaymentPlans | ✅ | ✅ loan_payments | ✅ | 贷款还款记录表 |
| investmentAccounts | ✅ | ✅ investment_accounts | ✅ | 投资账户表 |
| investmentDetails | ✅ | ✅ investment_details | ✅ | 投资明细表 |
| netValueHistory | ✅ | ✅ net_value_history | ✅ | 净值历史表 |
| merchants | ✅ | ✅ merchants | ✅ | 商家表 |
| members | ✅ | ✅ members | ✅ | 成员表 |
| tags | ✅ | ✅ dimensions | ✅ | 标签维度表 |
| ledgers | ✅ | ✅ ledgers | ✅ | 账套表 |
| user | ✅ | ✅ users | ✅ | 用户表 |

---

## 2. 字段映射关系

### 前端 -> MySQL

| 前端字段 | MySQL 字段 | 数据类型 | 映射说明 |
|----------|-----------|---------|---------|
| id | id | INT/VARCHAR | 主键 |
| name | name | VARCHAR(100) | 名称 |
| balance | balance | DECIMAL(15,2) | 余额 |
| category | account_type | VARCHAR(50) | 账户类型 |
| amount | amount | DECIMAL(15,2) | 金额 |
| type | type | ENUM/VARCHAR | 类型 |
| date | transaction_date | DATE | 日期 |
| cardName | card_name | VARCHAR(100) | 卡片名称 |
| totalCredit | credit_limit | DECIMAL(15,2) | 信用额度 |
| availableCredit | available_credit | DECIMAL(15,2) | 可用额度 |
| remainingAmount | remaining_amount | DECIMAL(15,2) | 剩余金额 |
| totalAsset | total_asset | DECIMAL(15,2) | 总资产 |
| shares | shares | DECIMAL(15,4) | 份额 |
| currentPrice | current_price | DECIMAL(15,4) | 当前价格 |
| costPrice | cost_price | DECIMAL(15,4) | 成本价 |

---

## 3. 数据同步检查

### 前端 -> MySQL (Push)

| 功能 | 状态 | 说明 |
|------|------|------|
| 交易录入 | ✅ | syncService.syncOnDataChange('transactions') |
| 账户变更 | ✅ | syncService.syncOnDataChange('accounts') |
| 信用卡操作 | ✅ | syncService.syncOnDataChange('creditCards') |
| 账单操作 | ✅ | syncService.syncOnDataChange('creditCardBills') |
| 贷款操作 | ✅ | syncService.syncOnDataChange('loans') |
| 投资操作 | ✅ | syncService.syncOnDataChange('investmentAccounts') |
| DataStore 同步 | ✅ | dataStore._syncToServer() |

### MySQL -> 前端 (Pull)

| 功能 | 状态 | 说明 |
|------|------|------|
| 启动时加载 | ✅ | 从 localStorage 加载，优先使用本地数据 |
| 手动同步 | ✅ | 可调用 dataStore.syncAll() |
| 增量同步 | ✅ | 基于 lastSyncTime |

---

## 4. 数据计算关系 (v3.6.0)

### 账户余额计算

```
普通账户余额 = 初始余额 + 收入 - 支出
信用卡已用额度 = Σ(消费金额) - Σ(还款金额)
信用卡可用额度 = 总额度 - 已用额度
贷款未还金额 = 贷款总额 - 已还金额
投资账户余额 = Σ(份额 × 当前价格)
```

### 数据流向

```
用户操作 → localStorage → DataStore → MySQL
                ↓
         事件通知 → 各组件更新显示
```

---

## 5. API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| /api/health | GET | 健康检查 |
| /api/version | GET | 版本信息 |
| /api/db/test | GET | 数据库连接测试 |
| /api/sync | POST | 同步数据到数据库 |
| /api/sync | GET | 从数据库获取数据 |
| /api/sync/all | GET | 获取用户所有数据 |
| /api/sync/tables | GET | 获取支持的表列表 |
| /api/accounts/balance | GET | 获取账户余额 |

---

## 6. 部署检查清单

### 环境变量配置

```bash
# .env 文件
PORT=8888                    # 服务器端口
DB_HOST=localhost           # 数据库主机
DB_PORT=3306               # 数据库端口
DB_USER=mymoney888         # 数据库用户
DB_PASSWORD=xxx             # 数据库密码
DB_NAME=mymoney888          # 数据库名
VITE_API_URL=/api           # 前端 API 地址
```

### 数据库初始化

```bash
# 1. 创建数据库用户
CREATE USER 'mymoney888'@'%' IDENTIFIED BY 'your_password';

# 2. 授予权限
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, REFERENCES ON mymoney888.* TO 'mymoney888'@'%';

# 3. 初始化数据库
mysql -u mymoney888 -p mymoney888 < database/init-db.sql
```

### Docker 部署

```bash
# 构建镜像
npm run build-docker

# 运行容器
docker run -d -p 8888:8888 \
  -e DB_HOST=mysql-host \
  -e DB_USER=mymoney888 \
  -e DB_PASSWORD=xxx \
  mymoney888:latest
```

---

## 7. 已知问题和限制

| 问题 | 状态 | 说明 |
|------|------|------|
| 离线模式 | ✅ 正常 | 离线时数据保存在 localStorage |
| 冲突处理 | ⚠️ 需优化 | 当前使用本地优先策略 |
| 触发器移除 | ✅ 已处理 | 余额计算移至前端 DataStore |
| 外键约束 | ⚠️ 部分移除 | 部分表使用软删除 |

---

## 8. 后续优化建议

1. **冲突解决UI**: 添加用户界面让用户选择冲突解决策略
2. **实时同步**: 使用 WebSocket 实现实时数据同步
3. **数据压缩**: 对大量数据进行压缩传输
4. **缓存策略**: 添加 Redis 缓存层提高性能
5. **备份机制**: 添加数据导出/导入功能

---

## 检查结论

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 前端代码完整性 | ✅ 通过 | 所有模块已更新到 v3.6.0 |
| 数据库脚本完整性 | ✅ 通过 | init-db.sql 已更新 |
| API 服务完整性 | ✅ 通过 | server.js 已实现完整 API |
| 数据同步机制 | ✅ 通过 | DataStore + syncService 双保险 |
| 字段映射正确性 | ✅ 通过 | 已建立映射关系表 |
| 部署文档完整性 | ✅ 通过 | 已创建 .env.example |

**总体状态**: ✅ **生产就绪**
