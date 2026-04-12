# 年度回顾模块

## 模块概述

年度回顾模块提供全年的财务总结报告，包括年度收支汇总、资产变化、投资收益分析等。

## 核心理念

> **年度回顾是对一年数据的全面解读，帮助用户了解自己的财务健康状况、收支习惯和财富积累情况。**

## 数据架构

### 层级结构

```
┌─────────────────────────────────────────────────────────────┐
│  数据来源: transactions (全年记录)                           │
│  - 365/366 天的所有交易                                      │
│  - 跨账户、跨分类的完整数据                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓ 年度聚合
┌─────────────────────────────────────────────────────────────┐
│  年度报告数据                                                │
│  - 年度收支汇总                                             │
│  - 月度趋势分解                                             │
│  - 资产变化追踪                                             │
│  - 投资表现分析                                             │
│  - 目标达成情况                                             │
└─────────────────────────────────────────────────────────────┘
```

## 核心报告指标

### 1. 年度收支总览

```javascript
const annualReport = {
    year: 2026,
    
    // 收支汇总
    summary: {
        totalIncome: 0,
        totalExpense: 0,
        netSavings: 0,
        savingsRate: 0,
        
        // 与去年对比
        incomeChangeYoY: 0,
        expenseChangeYoY: 0,
        savingsChangeYoY: 0
    },
    
    // 月度明细
    monthlyBreakdown: [],
    
    // 分类统计
    categoryStats: {
        income: {},
        expense: {}
    },
    
    // 资产变化
    assetChanges: {}
}
```

### 2. 月度趋势分解

```javascript
// 月度趋势数据
const monthlyTrend = []

for (let month = 1; month <= 12; month++) {
    const monthTransactions = getTransactionsByMonth(year, month)
    
    monthlyTrend.push({
        month: `${year}-${String(month).padStart(2, '0')}`,
        monthName: getMonthName(month),
        
        // 收支数据
        income: Σ(monthTransactions WHERE type = 'income'),
        expense: Σ(monthTransactions WHERE type = 'expense'),
        net: income - expense,
        
        // 收支天数
        activeDays: COUNT(DISTINCT date),
        avgDailyExpense: expense / activeDays,
        
        // 最高单日
        maxDailyExpense: MAX(dailyTotals),
        maxExpenseDate: getDateOfMaxExpense,
        
        // 分类TOP3
        topCategories: getTopCategories(monthTransactions, 3)
    })
}
```

## 数据触发逻辑

### 场景1: 生成年度报告

**用户操作**: 查看某年年度报告

**数据流程**:

```javascript
// 1. 接收年份参数
const params = {
    year: 2026,
    compareYear: 2025  // 对比年份
}

// 2. 获取全年数据
const yearTransactions = await getTransactions({
    startDate: `${params.year}-01-01`,
    endDate: `${params.year}-12-31`
})

const prevYearTransactions = await getTransactions({
    startDate: `${params.compareYear}-01-01`,
    endDate: `${params.compareYear}-12-31`
})

// 3. 计算年度收支
const annualStats = {
    totalIncome: Σ(yearTransactions WHERE type = 'income'),
    totalExpense: Σ(yearTransactions WHERE type = 'expense'),
    netSavings: this.totalIncome - this.totalExpense,
    savingsRate: (this.netSavings / this.totalIncome) * 100
}

// 4. 月度分析
annualStats.monthlyTrend = calculateMonthlyTrend(yearTransactions)

// 5. 年度对比
annualStats.yearOverYear = {
    incomeChange: ((annualStats.totalIncome - prevYear.totalIncome) / prevYear.totalIncome) * 100,
    expenseChange: ((annualStats.totalExpense - prevYear.totalExpense) / prevYear.totalExpense) * 100,
    savingsChange: ((annualStats.netSavings - prevYear.netSavings) / prevYear.netSavings) * 100
}
```

### 场景2: 收支习惯分析

**用户操作**: 了解年度消费习惯

**数据流程**:

```javascript
// 1. 工作日 vs 周末分析
const weekdayExpense = Σ(yearTransactions.filter(t => 
    t.type === 'expense' && isWeekday(t.date)
))
const weekendExpense = Σ(yearTransactions.filter(t => 
    t.type === 'expense' && isWeekend(t.date)
))

// 2. 消费时段分析（早餐/午餐/晚餐/夜宵）
const mealExpense = {
    breakfast: Σ(yearTransactions.filter(t => isBreakfastTime(t.time))),
    lunch: Σ(yearTransactions.filter(t => isLunchTime(t.time))),
    dinner: Σ(yearTransactions.filter(t => isDinnerTime(t.time))),
    lateNight: Σ(yearTransactions.filter(t => isLateNightTime(t.time)))
}

// 3. Top消费分析
const topExpenses = yearTransactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

// 4. 商家偏好
const merchantFrequency = groupBy(yearTransactions, 'merchant')
const mostVisitedMerchant = Object.entries(merchantFrequency)
    .sort((a, b) => b[1].length - a[1].length)[0]
```

### 场景3: 资产年度变化

**用户操作**: 查看净资产增长

**数据流程**:

```javascript
// 1. 月末资产快照
const monthlyAssets = []

for (let month = 1; month <= 12; month++) {
    const monthEndDate = getLastDayOfMonth(year, month)
    const monthTransactions = getTransactionsUpTo(monthEndDate)
    
    // 计算各账户余额
    let totalAssets = 0
    accounts.forEach(account => {
        const balance = calculateAccountBalance(account, monthTransactions)
        totalAssets += balance
    })
    
    monthlyAssets.push({
        month: `${year}-${String(month).padStart(2, '0')}`,
        totalAssets: totalAssets,
        assetsBreakdown: {
            cash: calculateByType('cash'),
            bank: calculateByType('bank'),
            investment: calculateByType('investment')
        }
    })
}

// 2. 年度净资产增长
const startAssets = monthlyAssets[0].totalAssets
const endAssets = monthlyAssets[11].totalAssets
const yearGrowth = endAssets - startAssets
const yearGrowthRate = (yearGrowth / startAssets) * 100
```

### 场景4: 投资年度报告

**用户操作**: 查看年度投资收益

**数据流程**:

```javascript
// 1. 年度投资汇总
const investmentSummary = {
    totalInvested: Σ(yearTransactions.filter(t => 
        t.type = 'expense' && t.category = '投资'
    )),
    totalReturned: Σ(yearTransactions.filter(t => 
        t.type = 'income' && (t.category = '投资收益' || t.isDividend)
    )),
    netInvestment: totalInvested - totalReturned,
    investmentReturnRate: (totalReturned / totalInvested) * 100
}

// 2. 各投资账户年度表现
const accountPerformance = investmentAccounts.map(account => {
    const yearlyNetValues = getNetValueHistory(account.id, year)
    
    return {
        name: account.name,
        startValue: yearlyNetValues[0]?.total_value || 0,
        endValue: yearlyNetValues[12]?.total_value || 0,
        maxValue: MAX(yearlyNetValues),
        minValue: MIN(yearlyNetValues),
        annualReturn: ((endValue - startValue) / startValue) * 100
    }
})
```

## 关键统计指标

| 指标 | 计算方式 | 说明 |
|------|----------|------|
| 年度储蓄率 | `(收入-支出)/收入×100%` | 财务健康度 |
| 月均支出 | `年度支出/12` | 月均消费水平 |
| 最高消费月 | `MAX(月支出)` | 支出峰值 |
| 净资产增长率 | `(年末-年初)/年初×100%` | 财富积累速度 |
| 投资收益 | `收益/本金×100%` | 投资表现 |

## 界面功能

### 1. 年度概览

- 年度收支柱状图
- 储蓄率仪表盘
- 同比变化对比

### 2. 月度趋势

- 12个月趋势折线图
- 月度收支明细表
- 环比变化

### 3. 分类报告

- 支出分类饼图
- 收入来源分析
- Top消费排行

### 4. 资产报告

- 净资产增长曲线
- 资产分布饼图
- 账户变化明细

### 5. 特别洞察

- 消费习惯分析
- 节省建议
- 目标达成情况

## 依赖关系

```
年度回顾模块
├── 依赖: transactions (全年数据)
├── 依赖: accounts (账户信息)
├── 依赖: categories (分类信息)
├── 依赖: investment_accounts (投资数据)
├── 依赖: net_value_history (净值历史)
└── 无数据写入，纯报告生成
```

## 注意事项

1. **数据完整性**: 年度回顾需要全年完整数据，建议定期备份
2. **跨年处理**: 年末/年初的交易需注意归属年份
3. **历史对比**: 需保留多年数据用于对比分析
4. **性能考虑**: 年度数据量大，查询需优化

## 相关文件

- `src/modules/annual-review/AnnualReviewView.vue` - 年度回顾界面
- `src/services/core-data-store.js` - 数据存储层
