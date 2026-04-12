# 数据存储架构设计

## 版本：v3.6.2

## 目录

1. [架构概述](#架构概述)
2. [数据存储层次](#数据存储层次)
3. [数据流向](#数据流向)
4. [账套隔离机制](#账套隔离机制)
5. [同步策略](#同步策略)
6. [表名映射](#表名映射)
7. [初始化流程](#初始化流程)
8. [使用示例](#使用示例)

---

## 架构概述

本应用采用**三层数据存储架构**：

```
┌─────────────────────────────────────────────────────────────────────┐
│                        浏览器端 (Browser)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              UnifiedDataStore (统一数据源)                    │   │
│  │                                                               │   │
│  │   ┌─────────┐ ┌─────────────┐ ┌─────────┐ ┌────────────┐   │   │
│  │   │accounts │ │transactions │ │credit...│ │   loans    │   │   │
│  │   └─────────┘ └─────────────┘ └─────────┘ └────────────┘   │   │
│  │                                                               │   │
│  │   所有数据通过 DataStore 统一访问和管理                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    localStorage (缓存)                        │   │
│  │                                                               │   │
│  │   accounts_default, transactions_default, ...                 │   │
│  │   (按账套隔离，同步状态，时间戳等)                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ 推送变化
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          服务器端 (Server)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────┐                 │
│  │       MySQL          │◄───│   定时/变更备份     │                 │
│  │    (主数据源)         │    │                     │                 │
│  │                       │    │                     │                 │
│  │  按 user_id 分用户    │    │                     │                 │
│  │  按表名分数据         │    │                     │                 │
│  └─────────────────────┘    └─────────────────────┘                 │
│                                     │                               │
│                                     ▼                               │
│                            ┌─────────────────────┐                  │
│                            │    JSON 文件备份     │                  │
│                            │    (Docker Volume)   │                  │
│                            │                     │                  │
│                            │  /data/*.json       │                  │
│                            └─────────────────────┘                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 数据存储层次

### 第一层：内存 (DataStore)

- **位置**：JavaScript 内存（Vue refs）
- **访问速度**：最快
- **用途**：组件实时访问
- **特点**：
  - 响应式数据
  - 同一份数据被多个组件引用
  - 应用关闭后丢失

### 第二层：浏览器缓存 (localStorage)

- **位置**：浏览器 localStorage
- **访问速度**：快
- **用途**：持久化缓存（按账套隔离）
- **键命名规则**：
  ```
  {数据表名}_{账套ID}
  例如：
  - accounts_default
  - transactions_user123
  - creditCards_ledger1
  ```

### 第三层：服务器数据库 (MySQL)

- **位置**：Docker 容器内的 MySQL
- **访问速度**：较慢（网络请求）
- **用途**：多设备同步、长期存储
- **隔离方式**：按 `user_id` 分用户
- **表命名**：snake_case（如 `credit_cards`）

### 第四层：文件备份 (JSON)

- **位置**：Docker Volume (`/data/*.json`)
- **访问速度**：最慢
- **用途**：灾难恢复、Docker 重启后数据保留
- **备份策略**：
  - 定时备份（默认30分钟）
  - 数据变更后备份（可配置）

---

## 数据流向

### 用户操作时的数据流

```
用户操作（添加/编辑/删除）
        │
        ▼
┌───────────────────────┐
│    DataStore.set()     │
│    (更新内存数据)        │
└───────────────────────┘
        │
        ├──────────────────┐
        ▼                  ▼
┌───────────────┐  ┌───────────────┐
│ localStorage   │  │   事件通知    │
│ (同步保存)     │  │ (通知组件刷新) │
└───────────────┘  └───────────────┘
        │
        ▼ (异步，不阻塞UI)
┌───────────────────────┐
│   MySQL (API 同步)     │
│   (PUT /api/sync)     │
└───────────────────────┘
        │
        ▼ (如果开启了变更备份)
┌───────────────────────┐
│   JSON 文件备份        │
│   (/data/xxx.json)    │
└───────────────────────┘
```

### 初始化时的数据流

```
应用启动
    │
    ▼
┌───────────────────────┐
│   检查用户登录状态      │
└───────────────────────┘
    │
    ├─── 已登录 ──────────────────────────────┐
    │                                        ▼
    │                              ┌───────────────────────┐
    │                              │   从 MySQL 拉取数据    │
    │                              │   (GET /api/sync)     │
    │                              └───────────────────────┘
    │                                        │
    │                                        ▼
    │                              ┌───────────────────────┐
    │                              │  更新 localStorage    │
    │                              │  更新内存 DataStore    │
    │                              └───────────────────────┘
    │
    └─── 未登录 / 离线 ────────────────────────┐
                                             │
                                             ▼
                                   ┌───────────────────────┐
                                   │  从 localStorage      │
                                   │  加载数据到 DataStore  │
                                   └───────────────────────┘
```

---

## 账套隔离机制

### 问题背景

一个用户可能有多个账套（如：个人账套、家庭账套、公司账套），需要数据隔离。

### 解决方案

#### localStorage 层（按账套隔离）

```
localStorage:
  accounts_default      ← 默认账套的账户
  accounts_ledger1      ← 账套1的账户
  accounts_ledger2      ← 账套2的账户
  transactions_default
  transactions_ledger1
  transactions_ledger2
  ...
```

#### MySQL 层（按用户隔离）

MySQL 不按账套隔离，因为：
1. 用户数据量通常不大
2. 简化查询逻辑
3. 支持跨账套查询（如统计）

```sql
-- MySQL 表结构
SELECT * FROM transactions WHERE user_id = 'user123';
-- 返回该用户所有账套的交易
```

#### DataStore 层（按账套隔离）

```javascript
// 切换账套时
switchLedger(ledgerId) {
  this.currentLedgerId = ledgerId
  // 自动加载对应账套的数据
  this.loadData()
}
```

---

## 同步策略

### 单向同步（推荐）

采用**单向同步**而非双向同步，原因：

1. **避免冲突**：双向同步在离线场景下会产生冲突
2. **简化逻辑**：不需要冲突检测和解决
3. **离线优先**：localStorage 作为主数据源
4. **最终一致**：MySQL 作为备份，通过初始化流程同步

### 同步规则

| 场景 | 行为 |
|------|------|
| 应用启动（已登录） | MySQL → localStorage（覆盖） |
| 应用启动（未登录） | localStorage → 内存 |
| 用户操作 | localStorage → MySQL（异步） |
| 离线操作 | localStorage → 内存（待上线后同步） |
| 服务器数据变更 | 通过重新初始化同步 |

### 冲突解决

**当前策略**：不处理冲突

- 如果 MySQL 有数据，初始化时会被 localStorage 覆盖
- 这是合理的，因为：
  - 用户在本地操作的数据应该是"最新"的
  - MySQL 只是备份和同步节点

**未来可扩展**：增加"最后一次写入胜出"策略

---

## 表名映射

前端使用 camelCase，后端 MySQL 使用 snake_case。

| 前端 (localStorage) | 后端 (MySQL) |
|---------------------|--------------|
| `accounts` | `accounts` |
| `transactions` | `transactions` |
| `categories` | `categories` |
| `creditCards` | `credit_cards` |
| `creditCardBills` | `credit_card_bills` |
| `loans` | `loans` |
| `repaymentPlans` | `repayment_plans` |
| `investmentAccounts` | `investment_accounts` |
| `investmentDetails` | `investment_details` |
| `netValueHistory` | `net_value_history` |
| `dimensions` | `dimensions` |
| `ledgers` | `ledgers` |
| `members` | `members` |
| `merchants` | `merchants` |
| `tags` | `tags` |
| `paymentChannels` | `payment_channels` |

---

## 初始化流程

### 首次使用（新用户）

```
1. 用户注册/登录
2. DataStore 初始化
3. 检测 MySQL 无数据
4. 使用默认数据初始化 localStorage
5. 首次同步到 MySQL
```

### 常规启动（已有数据）

```
1. 用户登录
2. DataStore 初始化
3. 从 localStorage 加载数据到内存（快速）
4. 异步从 MySQL 拉取最新数据
5. 如果 MySQL 数据更新，用 MySQL 数据覆盖
```

### 离线启动

```
1. 检测离线状态
2. 从 localStorage 加载数据到内存
3. 标记同步状态为"待同步"
4. 监听网络恢复
5. 网络恢复后执行同步
```

---

## 使用示例

### 在 Vue 组件中使用

```vue
<template>
  <div>
    <div v-for="account in accounts" :key="account.id">
      {{ account.name }}: ¥{{ account.balance }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import unifiedDataStore from '@/services/unified-data-store.js'

// 直接从 DataStore 获取响应式数据
const accounts = computed(() => unifiedDataStore.get('accounts').value)

// 监听数据变更
onMounted(() => {
  window.addEventListener('accountsUpdated', () => {
    // 强制刷新（如果需要）
    // 通常不需要，因为是响应式的
  })
})
</script>
```

### 添加数据

```javascript
// 添加账户
await unifiedDataStore.add('accounts', {
  name: '我的银行卡',
  balance: 10000,
  type: 'bank'
})

// 添加交易
await unifiedDataStore.add('transactions', {
  type: 'expense',
  amount: 100,
  category: '餐饮-午餐',
  account: 'acc_123',
  description: '午餐消费'
})
```

### 更新数据

```javascript
await unifiedDataStore.update('accounts', 'acc_123', {
  name: '我的新银行卡',
  balance: 15000
})
```

### 删除数据

```javascript
await unifiedDataStore.remove('accounts', 'acc_123')
```

### 手动同步

```javascript
// 强制同步到服务器
await unifiedDataStore.syncToServer()

// 获取同步状态
const status = unifiedDataStore.getSyncStatus()
console.log(status.status)     // 'idle' | 'syncing' | 'error'
console.log(status.lastSyncTime) // 上次同步时间
```

---

## 注意事项

### 1. 不要直接操作 localStorage

❌ **错误**
```javascript
localStorage.setItem('accounts', JSON.stringify(data))
```

✅ **正确**
```javascript
await unifiedDataStore.set('accounts', data)
```

### 2. 不要直接修改数组

❌ **错误**
```javascript
const accounts = unifiedDataStore.get('accounts')
accounts.value.push(newAccount)  // 绕过 DataStore
```

✅ **正确**
```javascript
await unifiedDataStore.add('accounts', newAccount)
```

### 3. ID 类型一致性

所有 ID 使用字符串类型，避免类型比较问题。

❌ **错误**
```javascript
if (account.id === 123)  // 严格相等可能失败
```

✅ **正确**
```javascript
if (String(account.id) === String(123))  // 统一为字符串比较
```

---

## API 端点

### 服务器端

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sync` | POST | 同步数据到 MySQL |
| `/api/sync?userId=&table=` | GET | 从 MySQL 获取数据 |
| `/api/sync/all` | GET | 获取用户所有数据 |
| `/api/backup` | POST | 手动备份到 JSON |
| `/api/restore/:table` | POST | 从 JSON 恢复 |
| `/api/health` | GET | 健康检查 |

---

## 故障排除

### 数据不一致

1. 清除浏览器缓存（localStorage）
2. 重新登录
3. 系统会从 MySQL 重新拉取数据

### 同步失败

1. 检查网络连接
2. 检查服务器是否运行
3. 查看浏览器控制台错误
4. 手动触发同步

### Docker 数据丢失

```bash
# 使用 docker-compose 时，数据卷默认持久化
# 如果需要完全重置：
docker-compose down -v  # 删除卷
docker-compose up -d    # 重新创建
```
