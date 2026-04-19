# 预置账套数据指南

## 概述

发发 提供开箱即用的预置数据，包括账户、分类、成员、商家、标签、支付渠道等基础数据。

## 核心理念

> **预置数据是为了降低使用门槛，但永远不覆盖用户已有数据。**

### 设计原则

1. **无损迭代**: 已有数据不会被预置数据覆盖
2. **渐进式**: 预置数据只在数据为空时插入
3. **用户优先**: 用户创建的数据优先于预置数据
4. **可扩展**: 用户可自由修改、添加、删除任何数据

## 数据内容

### 1. 账户数据 (accounts)

| 类型 | 名称 | 说明 |
|------|------|------|
| 现金 | 我的钱包 | 现金账户 |
| 银行卡 | 工商银行、建设银行、农业银行储蓄卡 | 工资卡、日常消费卡、备用储蓄 |
| 电子支付 | 支付宝、余额宝、微信支付、理财通 | 主流电子支付 |
| 信用卡 | 招商银行信用卡、工商银行信用卡 | 主用/备用信用卡 |
| 投资 | 天天基金账户、证券账户 | 基金/股票投资 |
| 其他 | 京东金融、美团钱包 | 其他平台账户 |

### 2. 支出分类 (categories)

参考随手记、挖财等成熟记账软件设计：

| 一级分类 | 二级分类 |
|----------|----------|
| 餐饮 | 早午晚餐、外卖、下午茶、夜宵、零食、水果、烟酒 |
| 购物 | 服装鞋包、日用百货、数码电器、美妆护肤、母婴用品、图书文具、宠物用品 |
| 居住 | 房租、房贷、水电气、物业费、通讯费、网费、装修家居 |
| 交通 | 私家车费用、油费、停车费、公共交通、打车、火车票、飞机票、地铁 |
| 医疗 | 药品、门诊、住院、体检、保健、保险 |
| 教育 | 学费、培训、教材、兴趣班、文具 |
| 娱乐 | 电影、演唱会、游戏、运动健身、旅游、宠物娱乐、ktv、酒吧 |
| 人情 | 红包、礼物、请客吃饭、慈善捐款 |
| 金融 | 信用卡还款、贷款还款、投资支出、手续费 |
| 其他 | 意外损失、专项支出、退款 |

### 3. 收入分类 (categories)

| 一级分类 | 二级分类 |
|----------|----------|
| 工资 | 基本工资、奖金、补贴、加班费 |
| 经营 | 销售收入、服务收入、佣金 |
| 投资 | 基金收益、股票收益、债券收益、利息、分红 |
| 其他收入 | 退款、礼金、兼职、租金、中奖、意外收入 |

### 4. 成员 (dimensions, type='members')

| 成员名称 | 关系 |
|----------|------|
| 自己 | self |
| 配偶 | spouse |
| 父亲 | father |
| 母亲 | mother |
| 孩子 | child |
| 其他家人 | other |
| 朋友 | friend |
| 同事 | colleague |

### 5. 商家 (dimensions, type='merchants')

| 分类 | 商家 |
|------|------|
| 餐饮 | 麦当劳、肯德基、星巴克、美团外卖、饿了么 |
| 购物 | 淘宝、京东、拼多多、天猫、唯品会 |
| 超市 | 沃尔玛、永辉超市、盒马鲜生 |
| 便利店 | 711便利店、全家便利店 |
| 出行 | 滴滴出行、高德地图、哈啰出行 |
| 通讯 | 中国移动、中国联通、中国电信 |
| 娱乐 | 爱奇艺、腾讯视频、优酷、网易云音乐、QQ音乐 |

### 6. 标签 (dimensions, type='tags')

| 分类 | 标签 |
|------|------|
| 优先级 | 必要、可选、冲动消费 |
| 优惠 | 团购、优惠、免息 |
| 时间 | 工作日、周末、节假日、生日 |
| 场景 | 在家、外出、出差、旅行 |
| 情绪 | 犒劳自己、省钱 |

### 7. 支付渠道 (dimensions, type='payment_channels')

| 渠道名称 | 说明 |
|----------|------|
| 现金 | 现金支付 |
| 支付宝 | 支付宝支付 |
| 微信支付 | 微信支付 |
| 银行卡 | 银行卡支付 |
| 云闪付 | 云闪付 |
| Apple Pay | Apple Pay |
| 其他 | 其他方式 |

## 初始化脚本

### 文件位置

```
database/
├── init-db.sql            # 数据库表结构
└── init-default-data.sql   # 预置数据初始化
```

### 使用方式

#### 方式1: 全新安装

```bash
# 1. 执行数据库初始化
psql -U postgres -d mymoney888 -f database/init-db.sql

# 2. 执行预置数据初始化
psql -U postgres -d mymoney888 -f database/init-default-data.sql
```

#### 方式2: 仅初始化预置数据

```bash
# 如果数据库已存在，只加载预置数据
psql -U postgres -d mymoney888 -f database/init-default-data.sql
```

#### 方式3: 程序自动初始化

在 `server.js` 或启动脚本中添加：

```javascript
// 首次启动时自动初始化预置数据
async function initializeDefaultData() {
  const result = await db.query(`
    INSERT IGNORE INTO accounts (id, ...) VALUES ...
  `)
  return result
}
```

## 保护机制

### 1. INSERT IGNORE

预置脚本使用 `INSERT IGNORE` 语句，确保：

- **如果记录已存在**: 跳过，不报错
- **如果记录不存在**: 插入新记录

```sql
INSERT IGNORE INTO accounts (id, name, ...) VALUES (1001, '我的钱包', ...);
```

### 2. 数据保留策略

| 场景 | 处理方式 |
|------|----------|
| 全新安装 | 初始化数据库 + 加载预置数据 |
| 已有数据 | 仅加载预置数据（已有数据被保留） |
| 重装/迁移 | 导入备份数据 + 预置数据（合并） |
| 用户自建账套 | 加载预置数据到新账套 |

### 3. 账套隔离

所有预置数据都关联到 `ledger_id = 'default'`，支持多账套：

```sql
INSERT IGNORE INTO accounts (id, user_id, ledger_id, name, ...)
VALUES (1001, 1, 'default', '我的钱包', ...);

-- 新账套不会获得预置数据
INSERT IGNORE INTO accounts (id, user_id, ledger_id, name, ...)
VALUES (9001, 1, 'family', '家庭账本', ...);
```

## 自定义预置数据

### 添加新的预置数据

1. 编辑 `database/init-default-data.sql`
2. 使用 `INSERT IGNORE` 添加新数据
3. 分配新的 ID 范围避免冲突：

| 数据类型 | ID 范围 |
|----------|---------|
| 账户 | 1001-1999 |
| 分类 | 2001-2999 (支出), 3001-3999 (收入) |
| 成员 | 4001-4999 |
| 商家 | 5001-5999 |
| 标签 | 6001-6999 |
| 支付渠道 | 7001-7999 |
| 用户数据 | 10000+ |

### 修改预置分类

```sql
-- 修改分类名称（不会影响已有交易）
UPDATE categories SET name = '新名称' WHERE id = 2001;

-- 添加新的二级分类
INSERT IGNORE INTO categories (id, user_id, ledger_id, name, type, parent_id)
VALUES (200108, 1, 'default', '奶茶', 'expense', 2001);
```

### 重置预置数据

如果需要恢复预置数据（清空后重新加载）：

```sql
-- 清空维度数据（谨慎操作）
DELETE FROM dimensions WHERE ledger_id = 'default' AND id < 8000;

-- 重新加载预置数据
SOURCE database/init-default-data.sql;
```

## 迁移场景

### 场景1: 从其他记账软件迁移

1. 导出原软件数据
2. 转换为 发发 格式
3. 导入到 PostgreSQL（使用 `INSERT IGNORE` 保留预置数据）
4. 用户数据 + 预置数据合并完成

### 场景2: 换手机/重装应用

1. 导出 PostgreSQL 数据备份
2. 重新安装应用
3. 导入备份数据
4. 预置数据自动保留（因为使用 `INSERT IGNORE`）

### 场景3: 多设备同步

```
设备A数据 ──┬── 合并 ──→ MySQL数据库
设备B数据 ──┘         ↓
                      导出/导入 ──→ 设备C
```

## 最佳实践

### 1. 不要修改 ID

预置数据的 ID 是精心设计的范围，避免与用户数据冲突。修改 ID 可能导致关联问题。

### 2. 使用 extra_data 扩展字段

如需添加额外属性，使用 `dimensions.extra_data` JSON 字段：

```sql
UPDATE dimensions SET extra_data = '{"category":"餐饮","region":"北京"}'
WHERE id = 5001;
```

### 3. 保持预置数据可识别

在名称中保留品牌特征，便于用户识别：

```
❌ 商家1
✅ 美团外卖
```

### 4. 国际化支持

预置数据支持多语言，通过翻译文件处理：

```javascript
const translations = {
  'zh-CN': {
    '餐饮': '餐饮',
    '餐饮': 'Dining'
  }
}
```

## 相关文档

- [DATA_STORAGE_ARCHITECTURE.md](./DATA_STORAGE_ARCHITECTURE.md) - 数据存储架构
- [MODULE_CREDIT_CARDS.md](./MODULE_CREDIT_CARDS.md) - 信用卡模块
- [MODULE_LOANS.md](./MODULE_LOANS.md) - 贷款模块
- [MODULE_INVESTMENTS.md](./MODULE_INVESTMENTS.md) - 投资模块
