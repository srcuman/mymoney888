# 统计模块

## 模块概述

统计模块提供多维度的收支分析、趋势图表和财务报告，是记账数据的可视化展示层。

## 核心理念

> **统计是数据的"解读"，不是数据的"存储"。所有统计数据都实时从交易记录聚合计算，不额外存储。**

## 数据架构

### 层级结构

```
┌─────────────────────────────────────────────────────────────┐
│  数据来源: transactions (唯一事实)                           │
│  - 支出、收入、转账记录                                      │
│  - 按日期、账户、分类、成员、商家等维度                      │
└─────────────────────────────────────────────────────────────┘
                           ↓ 聚合计算
┌─────────────────────────────────────────────────────────────┐
│  统计维度                                                   │
│  - 时间维度: 日/周/月/年/自定义区间                         │
│  - 账户维度: 单账户/账户类型/全部账户                       │
│  - 分类维度: 一级分类/二级分类/全部分类                      │
│  - 成员维度: 按成员统计                                      │
│  - 商家维度: 按商家统计                                      │
│  - 标签维度: 按标签筛选                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓ 可视化
┌─────────────────────────────────────────────────────────────┐
│  图表类型                                                   │
│  - 趋势图: 收支趋势、余额变化                                │
│  - 饼图: 支出占比、收入来源                                  │
│  - 条形图: 对比分析                                         │
│  - 排行榜: Top消费、Top商家                                  │
└─────────────────────────────────────────────────────────────┘
```

## 核心统计指标

### 1. 收支统计

```javascript
// 基础收支统计
const stats = {
    totalIncome: 0,          // 总收入
    totalExpense: 0,         // 总支出
    netSavings: 0,           // 净储蓄 = 收入 - 支出
    savingsRate: 0,          // 储蓄率 = 净储蓄 / 收入 × 100%
    
    // 收入分析
    incomeByCategory: {},    // 按分类收入
    incomeByMember: {},      // 按成员收入
    
    // 支出分析
    expenseByCategory: {},  // 按分类支出
    expenseByMerchant: {},  // 按商家支出
    expenseByMember: {},     // 按成员支出
}

// 计算公式
totalIncome = Σ(transactions WHERE type = 'income')
totalExpense = Σ(transactions WHERE type = 'expense')
netSavings = totalIncome - totalExpense
savingsRate = (netSavings / totalIncome) * 100
```

### 2. 账户统计

```javascript
// 账户余额统计
const accountStats = {}

// 遍历所有账户
accounts.forEach(account => {
    const transactions = getTransactionsByAccount(account.id)
    
    accountStats[account.id] = {
        name: account.name,
        type: account.category,
        
        // 从交易计算余额
        balance: account.initialBalance + 
                 Σ(transactions WHERE type = 'income') - 
                 Σ(transactions WHERE type = 'expense') -
                 Σ(transactions WHERE type = 'transfer' AND accountId = account.id),
        
        // 收支统计
        totalIncome: Σ(transactions WHERE type = 'income'),
        totalExpense: Σ(transactions WHERE type = 'expense'),
        
        // 转账统计
        transferIn: Σ(transactions WHERE type = 'transfer' AND toAccountId = account.id),
        transferOut: Σ(transactions WHERE type = 'transfer' AND accountId = account.id),
        
        // 时间区间统计
        periodIncome: Σ(transactions WHERE type = 'income' AND date BETWEEN start AND end),
        periodExpense: Σ(transactions WHERE type = 'expense' AND date BETWEEN start AND end)
    }
})
```

### 3. 趋势统计

```javascript
// 日/周/月趋势数据
const trendData = []

// 按天聚合
groupBy(transactions, 'date').forEach((dayTransactions, date) => {
    trendData.push({
        date: date,
        income: Σ(dayTransactions WHERE type = 'income'),
        expense: Σ(dayTransactions WHERE type = 'expense'),
        net: Σ(dayTransactions WHERE type = 'income') - 
             Σ(dayTransactions WHERE type = 'expense')
    })
})

// 计算移动平均
trendData.forEach((item, index) => {
    if (index >= 7) {
        const last7Days = trendData.slice(index - 6, index + 1)
        item.expenseMA7 = Σ(last7Days.map(d => d.expense)) / 7
    }
})
```

### 4. 预算统计

```javascript
// 预算执行情况
const budgetStats = budgets.map(budget => {
    const spent = Σ(transactions WHERE 
        categoryId = budget.categoryId AND
        type = 'expense' AND
        date BETWEEN budget.startDate AND budget.endDate
    )
    
    return {
        budgetId: budget.id,
        categoryName: budget.categoryName,
        budgetAmount: budget.amount,
        spent: spent,
        remaining: budget.amount - spent,
        progress: (spent / budget.amount) * 100,
        status: spent > budget.amount ? 'over' : 'normal'
    }
})
```

## 数据触发逻辑

### 场景1: 月度收支报告

**用户操作**: 查看某月统计报告

**数据流程**:

```javascript
// 1. 接收查询参数
const params = {
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    accountIds: ['all'],        // 或指定账户
    includeTransfer: false      // 是否包含转账
}

// 2. 获取交易数据
const transactions = await coreDataStore.getTransactions(params)

// 3. 聚合计算
const report = {
    period: `${params.startDate} ~ ${params.endDate}`,
    totalIncome: calculateTotalIncome(transactions),
    totalExpense: calculateTotalExpense(transactions),
    netSavings: calculateNetSavings(transactions),
    topExpenseCategories: getTopCategories(transactions, 5),
    topExpenseMerchants: getTopMerchants(transactions, 5),
    dailyTrend: getDailyTrend(transactions),
    monthOverMonth: compareWithLastMonth(transactions)
}

// 4. 图表数据
report.charts = {
    expensePie: buildPieChartData(report.topExpenseCategories),
    incomeExpenseBar: buildBarChartData(report.dailyTrend),
    balanceLine: buildBalanceLineData(transactions)
}
```

### 场景2: 账户净资产变化

**用户操作**: 查看净资产趋势

**数据流程**:

```javascript
// 1. 计算每个账户的历史余额
const balanceHistory = []

// 按日期排序的交易
const sortedTransactions = sortBy(transactions, 'date')

// 初始化余额
let runningBalance = {}
accounts.forEach(acc => {
    runningBalance[acc.id] = acc.initialBalance || 0
})

// 逐日计算
groupBy(sortedTransactions, 'date').forEach((dayTransactions, date) => {
    dayTransactions.forEach(t => {
        if (t.type === 'income') {
            runningBalance[t.accountId] += t.amount
        } else if (t.type === 'expense') {
            runningBalance[t.accountId] -= t.amount
        } else if (t.type === 'transfer') {
            runningBalance[t.accountId] -= t.amount
            runningBalance[t.toAccountId] += t.amount
        }
    })
    
    balanceHistory.push({
        date: date,
        totalNetAsset: Object.values(runningBalance).reduce((a, b) => a + b, 0)
    })
})
```

### 场景3: 分类占比分析

**用户操作**: 查看支出分类占比

**数据流程**:

```javascript
// 1. 筛选支出交易
const expenseTransactions = transactions.filter(t => t.type === 'expense')

// 2. 按一级分类聚合
const categoryTotals = {}
expenseTransactions.forEach(t => {
    const topCategory = getTopCategory(t.categoryId)  // 获取一级分类
    categoryTotals[topCategory] = (categoryTotals[topCategory] || 0) + t.amount
})

// 3. 计算百分比
const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0)
const categoryPercentages = Object.entries(categoryTotals).map(([name, amount]) => ({
    name: name,
    amount: amount,
    percentage: (amount / totalExpense) * 100
}))

// 4. 排序（降序）
categoryPercentages.sort((a, b) => b.amount - a.amount)
```

### 场景4: 成员消费对比

**用户操作**: 查看家庭成员消费对比

**数据流程**:

```javascript
// 1. 筛选成员不为空的支出交易
const memberExpenses = transactions.filter(t => 
    t.type === 'expense' && t.member
)

// 2. 按成员聚合
const memberTotals = {}
memberExpenses.forEach(t => {
    memberTotals[t.member] = (memberTotals[t.member] || 0) + t.amount
})

// 3. 计算人均
const memberCount = Object.keys(memberTotals).length
const averagePerPerson = totalExpense / memberCount

// 4. 构建对比数据
const memberComparison = Object.entries(memberTotals).map(([name, amount]) => ({
    name: name,
    amount: amount,
    percentage: (amount / totalExpense) * 100,
    vsAverage: amount - averagePerPerson
}))
```

## 关键计算公式

| 指标 | 计算公式 | 说明 |
|------|----------|------|
| 储蓄率 | `(收入-支出)/收入×100%` | 衡量理财能力 |
| 人均消费 | `总支出/成员数` | 家庭均摊 |
| 同比变化 | `(本期-上期)/上期×100%` | 增长率 |
| 环比变化 | `(本期-上期)/上期×100%` | 连续周期变化 |
| 预测支出 | `近3月均值` | 简单预测 |

## 界面功能

### 1. 概览仪表盘

- 本月收支摘要
- 储蓄率
- 与上月对比
- 预算执行进度

### 2. 收支趋势

- 日/周/月线图
- 收支对比
- 余额变化

### 3. 分类分析

- 支出分类饼图
- 收入来源分析
- 分类趋势对比

### 4. 账户分析

- 各账户余额
- 收支排名
- 转账流向

### 5. 排行榜

- Top 消费
- Top 商家
- Top 成员

## 性能优化

```javascript
// 缓存策略
const cache = {
    dailyStats: new LRUCache(30),   // 日统计缓存30天
    monthlyStats: new LRUCache(24), // 月统计缓存24个月
    categoryStats: new LRUCache(100) // 分类统计缓存
}

// 增量计算
function updateStats(transaction) {
    // 只更新受影响的统计
    const date = transaction.date
    const category = transaction.categoryId
    
    dailyStats[date].recalculate()
    categoryStats[category].increment(transaction)
    accountStats[transaction.accountId].increment(transaction)
}
```

## 依赖关系

```
统计模块
├── 依赖: transactions (核心数据)
├── 依赖: accounts (账户信息)
├── 依赖: categories (分类名称)
├── 依赖: members/merchants (维度标签)
└── 无数据写入，纯计算展示
```

## 注意事项

1. **数据量**: 大数据量时需考虑分页和预聚合
2. **实时性**: 统计数据应实时从交易计算，确保一致性
3. **时区**: 注意日期边界的时区处理
4. **精度**: 金额计算使用高精度，避免浮点误差

## 相关文件

- `src/modules/statistics/StatisticsView.vue` - 统计界面
- `src/services/core-data-store.js` - 数据存储层
- `src/services/statistics-service.js` - 统计计算服务（如有）
