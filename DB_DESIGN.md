# 数据库设计文档

## 版本信息
- 版本：3.5.9
- 日期：2026-04-12
- 描述：更新数据库设计以匹配最新代码，支持投资管理和统一版本配置

## 重要更新 (v3.5.9)
- 移除触发器（TRIGGER）- 需在应用层实现账户余额更新
- 移除存储过程（PROCEDURE）- 需在应用层实现数据同步
- 移除事件调度器（EVENT）- 需在应用层实现定时任务
- 所有功能现在只需普通数据库用户权限即可运行

## 数据库结构概览

### 表结构

#### 1. users
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 用户ID |
| username | VARCHAR(50) | UNIQUE | 用户名 |
| password | VARCHAR(100) | NOT NULL | 密码 |
| role | VARCHAR(20) | NOT NULL | 角色(admin/user) |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 2. ledgers
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 账套ID |
| name | VARCHAR(100) | NOT NULL | 账套名称 |
| description | TEXT | | 账套描述 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 3. accounts
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 账户ID |
| ledgerId | VARCHAR(36) | NOT NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 账户名称 |
| type | VARCHAR(50) | NOT NULL | 账户类型 |
| balance | DECIMAL(15,2) | NOT NULL | 账户余额 |
| description | TEXT | | 账户描述 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 4. transactions
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 交易ID |
| ledgerId | VARCHAR(36) | NOT NULL | 账套ID |
| type | VARCHAR(20) | NOT NULL | 交易类型(expense/income/transfer) |
| amount | DECIMAL(15,2) | NOT NULL | 交易金额 |
| date | DATE | NOT NULL | 交易日期 |
| description | TEXT | | 交易描述 |
| accountId | VARCHAR(36) | NOT NULL | 账户ID |
| category | VARCHAR(100) | | 分类 |
| memberId | VARCHAR(36) | | 成员ID |
| merchantId | VARCHAR(36) | | 商家ID |
| tagIds | TEXT | | 标签ID（逗号分隔） |
| paymentChannel | VARCHAR(100) | | 支付渠道 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 5. categories
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 分类ID |
| ledgerId | VARCHAR(36) | NOT NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 分类名称 |
| type | VARCHAR(20) | NOT NULL | 分类类型(income/expense) |
| parentId | VARCHAR(36) | | 父分类ID |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 6. members
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 成员ID |
| ledgerId | VARCHAR(36) | NOT NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 成员名称 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 7. merchants
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 商家ID |
| ledgerId | VARCHAR(36) | NOT NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 商家名称 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 8. tags
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 标签ID |
| ledgerId | VARCHAR(36) | NOT NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 标签名称 |
| color | VARCHAR(20) | | 标签颜色 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 9. payment_channels
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 支付渠道ID |
| ledgerId | VARCHAR(36) | NOT NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 支付渠道名称 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 10. credit_cards
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 信用卡ID |
| ledgerId | VARCHAR(36) | NOT NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 信用卡名称 |
| bank | VARCHAR(100) | NOT NULL | 银行名称 |
| cardNumber | VARCHAR(50) | NOT NULL | 卡号 |
| creditLimit | DECIMAL(15,2) | NOT NULL | 信用额度 |
| currentBalance | DECIMAL(15,2) | NOT NULL | 当前余额 |
| billDay | INT | NOT NULL | 账单日 |
| repaymentDay | INT | NOT NULL | 还款日 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 11. loans
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 贷款ID |
| ledgerId | VARCHAR(36) | NOT NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 贷款名称 |
| type | VARCHAR(50) | NOT NULL | 贷款类型 |
| totalAmount | DECIMAL(15,2) | NOT NULL | 总金额 |
| remainingAmount | DECIMAL(15,2) | NOT NULL | 剩余金额 |
| interestRate | DECIMAL(5,2) | NOT NULL | 利率 |
| startDate | DATE | NOT NULL | 开始日期 |
| endDate | DATE | NOT NULL | 结束日期 |
| monthlyPayment | DECIMAL(15,2) | NOT NULL | 月供 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 12. investment_accounts
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 投资账户ID |
| ledgerId | VARCHAR(36) | NOT NULL | 账套ID |
| name | VARCHAR(100) | NOT NULL | 账户名称 |
| type | VARCHAR(50) | NOT NULL | 账户类型 |
| totalAsset | DECIMAL(15,2) | NOT NULL | 总资产 |
| profitLoss | DECIMAL(15,2) | NOT NULL | 盈亏 |
| description | TEXT | | 账户描述 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### 13. investment_details
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | VARCHAR(36) | PRIMARY KEY | 投资明细ID |
| accountId | VARCHAR(36) | NOT NULL | 投资账户ID |
| accountName | VARCHAR(100) | NOT NULL | 账户名称 |
| type | VARCHAR(50) | NOT NULL | 投资类型 |
| code | VARCHAR(50) | NOT NULL | 投资代码 |
| name | VARCHAR(100) | NOT NULL | 投资名称 |
| shares | DECIMAL(10,4) | NOT NULL | 持有份额 |
| costPrice | DECIMAL(10,4) | NOT NULL | 成本价 |
| currentPrice | DECIMAL(10,4) | NOT NULL | 当前价格 |
| updateDate | DATE | NOT NULL | 价格更新日期 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

### 索引设计

| 表名 | 索引名 | 索引字段 | 索引类型 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| users | idx_username | username | UNIQUE | 加速用户名查询 |
| ledgers | idx_ledger_name | name | | 加速账套名称查询 |
| accounts | idx_ledger_account | ledgerId | | 加速账套下账户查询 |
| transactions | idx_ledger_transaction | ledgerId | | 加速账套下交易查询 |
| transactions | idx_transaction_date | date | | 加速日期范围查询 |
| categories | idx_ledger_category | ledgerId | | 加速账套下分类查询 |
| members | idx_ledger_member | ledgerId | | 加速账套下成员查询 |
| merchants | idx_ledger_merchant | ledgerId | | 加速账套下商家查询 |
| tags | idx_ledger_tag | ledgerId | | 加速账套下标签查询 |
| payment_channels | idx_ledger_payment | ledgerId | | 加速账套下支付渠道查询 |
| credit_cards | idx_ledger_credit_card | ledgerId | | 加速账套下信用卡查询 |
| loans | idx_ledger_loan | ledgerId | | 加速账套下贷款查询 |
| investment_accounts | idx_ledger_investment_account | ledgerId | | 加速账套下投资账户查询 |
| investment_details | idx_account_investment_detail | accountId | | 加速投资账户下明细查询 |

### 视图设计

#### 1. transaction_summary
| 字段名 | 数据类型 | 描述 |
| :--- | :--- | :--- |
| ledgerId | VARCHAR(36) | 账套ID |
| month | VARCHAR(7) | 月份(YYYY-MM) |
| income | DECIMAL(15,2) | 收入总额 |
| expense | DECIMAL(15,2) | 支出总额 |
| balance | DECIMAL(15,2) | 收支平衡 |

#### 2. category_summary
| 字段名 | 数据类型 | 描述 |
| :--- | :--- | :--- |
| ledgerId | VARCHAR(36) | 账套ID |
| category | VARCHAR(100) | 分类名称 |
| type | VARCHAR(20) | 分类类型 |
| amount | DECIMAL(15,2) | 金额 |
| percentage | DECIMAL(5,2) | 占比 |

#### 3. investment_summary
| 字段名 | 数据类型 | 描述 |
| :--- | :--- | :--- |
| accountId | VARCHAR(36) | 投资账户ID |
| accountName | VARCHAR(100) | 账户名称 |
| totalAsset | DECIMAL(15,2) | 总资产 |
| totalCost | DECIMAL(15,2) | 总成本 |
| totalProfit | DECIMAL(15,2) | 总收益 |
| totalProfitRate | DECIMAL(5,2) | 总收益率 |

### 触发器设计

#### 1. after_transaction_insert
- 触发时机：在transactions表插入数据后
- 功能：更新对应账户的余额
- 逻辑：根据交易类型更新账户余额

#### 2. after_transaction_update
- 触发时机：在transactions表更新数据后
- 功能：更新对应账户的余额
- 逻辑：先恢复原交易的影响，再应用新交易的影响

#### 3. after_transaction_delete
- 触发时机：在transactions表删除数据后
- 功能：更新对应账户的余额
- 逻辑：恢复被删除交易的影响

#### 4. after_investment_detail_insert
- 触发时机：在investment_details表插入数据后
- 功能：更新对应投资账户的资产和盈亏
- 逻辑：重新计算投资账户的总资产和盈亏

#### 5. after_investment_detail_update
- 触发时机：在investment_details表更新数据后
- 功能：更新对应投资账户的资产和盈亏
- 逻辑：重新计算投资账户的总资产和盈亏

#### 6. after_investment_detail_delete
- 触发时机：在investment_details表删除数据后
- 功能：更新对应投资账户的资产和盈亏
- 逻辑：重新计算投资账户的总资产和盈亏

### 存储过程设计

#### 1. get_transaction_statistics
- 功能：获取交易统计数据
- 参数：ledgerId, startDate, endDate
- 返回：按日期、分类等维度的统计数据

#### 2. get_investment_statistics
- 功能：获取投资统计数据
- 参数：ledgerId
- 返回：投资账户的资产、盈亏等统计数据

#### 3. update_investment_net_values
- 功能：更新投资产品的净值
- 参数：无
- 逻辑：调用外部API获取最新净值，更新investment_details表

### 数据同步机制

- **数据存储**：使用LocalStorage进行客户端数据存储
- **数据备份**：支持导出/导入数据功能
- **数据同步**：定期自动备份数据到LocalStorage

### 数据完整性约束

- **主键约束**：所有表的id字段为主键
- **外键约束**：建立表之间的关联关系
- **非空约束**：确保必要字段不为空
- **唯一约束**：确保用户名等字段唯一
- **数据类型约束**：确保数据类型正确

### 性能优化建议

1. **索引优化**：为常用查询字段添加索引
2. **查询优化**：使用适当的查询方式，避免全表扫描
3. **缓存优化**：对频繁访问的数据进行缓存
4. **数据分页**：对大量数据进行分页处理
5. **批量操作**：使用批量操作减少数据库交互次数

### 安全考虑

1. **数据加密**：对敏感数据进行加密存储
2. **输入验证**：对用户输入进行验证，防止SQL注入等攻击
3. **权限控制**：实现基于角色的权限控制
4. **数据备份**：定期备份数据，防止数据丢失
5. **安全传输**：使用HTTPS等安全传输协议
