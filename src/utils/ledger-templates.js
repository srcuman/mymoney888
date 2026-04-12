// 账套模板数据 - 参考随手记、挖财等成熟记账软件设计
// 包含完整的收支分类、成员、商家、标签、支付渠道等基础数据

export const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

// 支出分类模板（参考随手记、挖财）
export const defaultExpenseCategories = [
  {
    id: generateId(),
    name: '餐饮',
    type: 'expense',
    icon: '🍜',
    children: [
      { id: generateId(), name: '早餐', type: 'expense' },
      { id: generateId(), name: '午餐', type: 'expense' },
      { id: generateId(), name: '晚餐', type: 'expense' },
      { id: generateId(), name: '外卖', type: 'expense' },
      { id: generateId(), name: '夜宵', type: 'expense' },
      { id: generateId(), name: '零食', type: 'expense' },
      { id: generateId(), name: '水果', type: 'expense' },
      { id: generateId(), name: '饮料', type: 'expense' },
      { id: generateId(), name: '下午茶', type: 'expense' },
      { id: generateId(), name: '聚餐', type: 'expense' },
      { id: generateId(), name: '其他餐饮', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '交通出行',
    type: 'expense',
    icon: '🚗',
    children: [
      { id: generateId(), name: '公交', type: 'expense' },
      { id: generateId(), name: '地铁', type: 'expense' },
      { id: generateId(), name: '打车', type: 'expense' },
      { id: generateId(), name: '顺风车', type: 'expense' },
      { id: generateId(), name: '加油', type: 'expense' },
      { id: generateId(), name: '停车', type: 'expense' },
      { id: generateId(), name: '路桥费', type: 'expense' },
      { id: generateId(), name: '保养', type: 'expense' },
      { id: generateId(), name: '维修', type: 'expense' },
      { id: generateId(), name: '保险', type: 'expense' },
      { id: generateId(), name: '罚款', type: 'expense' },
      { id: generateId(), name: '其他交通', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '购物',
    type: 'expense',
    icon: '🛒',
    children: [
      { id: generateId(), name: '服装鞋帽', type: 'expense' },
      { id: generateId(), name: '电子产品', type: 'expense' },
      { id: generateId(), name: '家居用品', type: 'expense' },
      { id: generateId(), name: '床上用品', type: 'expense' },
      { id: generateId(), name: '厨具', type: 'expense' },
      { id: generateId(), name: '美妆护肤', type: 'expense' },
      { id: generateId(), name: '日用品', type: 'expense' },
      { id: generateId(), name: '母婴用品', type: 'expense' },
      { id: generateId(), name: '宠物用品', type: 'expense' },
      { id: generateId(), name: '图书文具', type: 'expense' },
      { id: generateId(), name: '礼品', type: 'expense' },
      { id: generateId(), name: '其他购物', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '日用服务',
    type: 'expense',
    icon: '🧹',
    children: [
      { id: generateId(), name: '家政服务', type: 'expense' },
      { id: generateId(), name: '洗衣服务', type: 'expense' },
      { id: generateId(), name: '理发', type: 'expense' },
      { id: generateId(), name: '美容美发', type: 'expense' },
      { id: generateId(), name: '美甲', type: 'expense' },
      { id: generateId(), name: '按摩推拿', type: 'expense' },
      { id: generateId(), name: '其他服务', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '娱乐',
    type: 'expense',
    icon: '🎮',
    children: [
      { id: generateId(), name: '电影', type: 'expense' },
      { id: generateId(), name: '演唱会', type: 'expense' },
      { id: generateId(), name: '话剧演出', type: 'expense' },
      { id: generateId(), name: '游戏', type: 'expense' },
      { id: generateId(), name: '游乐场', type: 'expense' },
      { id: generateId(), name: '密室逃脱', type: 'expense' },
      { id: generateId(), name: 'KTV', type: 'expense' },
      { id: generateId(), name: '棋牌', type: 'expense' },
      { id: generateId(), name: '网吧', type: 'expense' },
      { id: generateId(), name: '其他娱乐', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '运动健身',
    type: 'expense',
    icon: '💪',
    children: [
      { id: generateId(), name: '健身房', type: 'expense' },
      { id: generateId(), name: '瑜伽', type: 'expense' },
      { id: generateId(), name: '游泳', type: 'expense' },
      { id: generateId(), name: '羽毛球', type: 'expense' },
      { id: generateId(), name: '篮球', type: 'expense' },
      { id: generateId(), name: '足球', type: 'expense' },
      { id: generateId(), name: '网球', type: 'expense' },
      { id: generateId(), name: '跑步', type: 'expense' },
      { id: generateId(), name: '骑行', type: 'expense' },
      { id: generateId(), name: '运动装备', type: 'expense' },
      { id: generateId(), name: '其他运动', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '医疗健康',
    type: 'expense',
    icon: '🏥',
    children: [
      { id: generateId(), name: '药品', type: 'expense' },
      { id: generateId(), name: '门诊', type: 'expense' },
      { id: generateId(), name: '住院', type: 'expense' },
      { id: generateId(), name: '检查', type: 'expense' },
      { id: generateId(), name: '治疗', type: 'expense' },
      { id: generateId(), name: '牙科', type: 'expense' },
      { id: generateId(), name: '眼科', type: 'expense' },
      { id: generateId(), name: '中医', type: 'expense' },
      { id: generateId(), name: '体检', type: 'expense' },
      { id: generateId(), name: '保健品', type: 'expense' },
      { id: generateId(), name: '其他医疗', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '教育',
    type: 'expense',
    icon: '📚',
    children: [
      { id: generateId(), name: '学费', type: 'expense' },
      { id: generateId(), name: '教材', type: 'expense' },
      { id: generateId(), name: '培训', type: 'expense' },
      { id: generateId(), name: '辅导班', type: 'expense' },
      { id: generateId(), name: '兴趣班', type: 'expense' },
      { id: generateId(), name: '在线课程', type: 'expense' },
      { id: generateId(), name: '考试', type: 'expense' },
      { id: generateId(), name: '教育器材', type: 'expense' },
      { id: generateId(), name: '其他教育', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '住房',
    type: 'expense',
    icon: '🏠',
    children: [
      { id: generateId(), name: '房租', type: 'expense' },
      { id: generateId(), name: '房贷', type: 'expense' },
      { id: generateId(), name: '水费', type: 'expense' },
      { id: generateId(), name: '电费', type: 'expense' },
      { id: generateId(), name: '燃气费', type: 'expense' },
      { id: generateId(), name: '物业费', type: 'expense' },
      { id: generateId(), name: '暖气费', type: 'expense' },
      { id: generateId(), name: '宽带费', type: 'expense' },
      { id: generateId(), name: '有线电视', type: 'expense' },
      { id: generateId(), name: '装修', type: 'expense' },
      { id: generateId(), name: '家具', type: 'expense' },
      { id: generateId(), name: '其他住房', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '通讯',
    type: 'expense',
    icon: '📱',
    children: [
      { id: generateId(), name: '手机话费', type: 'expense' },
      { id: generateId(), name: '套餐流量', type: 'expense' },
      { id: generateId(), name: '宽带', type: 'expense' },
      { id: generateId(), name: '其他通讯', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '人情社交',
    type: 'expense',
    icon: '🎁',
    children: [
      { id: generateId(), name: '红包', type: 'expense' },
      { id: generateId(), name: '送礼', type: 'expense' },
      { id: generateId(), name: '婚礼礼金', type: 'expense' },
      { id: generateId(), name: '满月酒', type: 'expense' },
      { id: generateId(), name: '寿宴', type: 'expense' },
      { id: generateId(), name: '丧葬', type: 'expense' },
      { id: generateId(), name: '资助', type: 'expense' },
      { id: generateId(), name: '其他社交', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '旅游',
    type: 'expense',
    icon: '✈️',
    children: [
      { id: generateId(), name: '机票', type: 'expense' },
      { id: generateId(), name: '火车票', type: 'expense' },
      { id: generateId(), name: '酒店', type: 'expense' },
      { id: generateId(), name: '门票', type: 'expense' },
      { id: generateId(), name: '跟团游', type: 'expense' },
      { id: generateId(), name: '签证', type: 'expense' },
      { id: generateId(), name: '旅游购物', type: 'expense' },
      { id: generateId(), name: '其他旅游', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '宠物',
    type: 'expense',
    icon: '🐶',
    children: [
      { id: generateId(), name: '宠物食品', type: 'expense' },
      { id: generateId(), name: '宠物医疗', type: 'expense' },
      { id: generateId(), name: '宠物美容', type: 'expense' },
      { id: generateId(), name: '宠物用品', type: 'expense' },
      { id: generateId(), name: '宠物寄养', type: 'expense' },
      { id: generateId(), name: '其他宠物', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '保险',
    type: 'expense',
    icon: '🛡️',
    children: [
      { id: generateId(), name: '医疗险', type: 'expense' },
      { id: generateId(), name: '意外险', type: 'expense' },
      { id: generateId(), name: '车险', type: 'expense' },
      { id: generateId(), name: '寿险', type: 'expense' },
      { id: generateId(), name: '养老险', type: 'expense' },
      { id: generateId(), name: '家财险', type: 'expense' },
      { id: generateId(), name: '其他保险', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '投资理财',
    type: 'expense',
    icon: '📈',
    children: [
      { id: generateId(), name: '股票', type: 'expense' },
      { id: generateId(), name: '基金', type: 'expense' },
      { id: generateId(), name: '债券', type: 'expense' },
      { id: generateId(), name: '黄金', type: 'expense' },
      { id: generateId(), name: '银行理财', type: 'expense' },
      { id: generateId(), name: '其他投资', type: 'expense' }
    ]
  },
  {
    id: generateId(),
    name: '其他',
    type: 'expense',
    icon: '📝',
    children: [
      { id: generateId(), name: '捐赠', type: 'expense' },
      { id: generateId(), name: '退款', type: 'expense' },
      { id: generateId(), name: '其他杂项', type: 'expense' }
    ]
  }
]

// 收入分类模板
export const defaultIncomeCategories = [
  {
    id: generateId(),
    name: '工资收入',
    type: 'income',
    icon: '💰',
    children: [
      { id: generateId(), name: '基本工资', type: 'income' },
      { id: generateId(), name: '岗位工资', type: 'income' },
      { id: generateId(), name: '绩效奖金', type: 'income' },
      { id: generateId(), name: '年终奖', type: 'income' },
      { id: generateId(), name: '加班费', type: 'income' },
      { id: generateId(), name: '补贴津贴', type: 'income' },
      { id: generateId(), name: '高温费', type: 'income' },
      { id: generateId(), name: '差旅补助', type: 'income' },
      { id: generateId(), name: '其他工资', type: 'income' }
    ]
  },
  {
    id: generateId(),
    name: '奖金外快',
    type: 'income',
    icon: '🎉',
    children: [
      { id: generateId(), name: '项目奖金', type: 'income' },
      { id: generateId(), name: '销售提成', type: 'income' },
      { id: generateId(), name: '全勤奖', type: 'income' },
      { id: generateId(), name: '节假福利', type: 'income' },
      { id: generateId(), name: '其他奖金', type: 'income' }
    ]
  },
  {
    id: generateId(),
    name: '投资收入',
    type: 'income',
    icon: '📈',
    children: [
      { id: generateId(), name: '股票收益', type: 'income' },
      { id: generateId(), name: '基金分红', type: 'income' },
      { id: generateId(), name: '债券利息', type: 'income' },
      { id: generateId(), name: '理财收益', type: 'income' },
      { id: generateId(), name: '股息红利', type: 'income' },
      { id: generateId(), name: '租金收入', type: 'income' },
      { id: generateId(), name: '利息收入', type: 'income' },
      { id: generateId(), name: '其他投资', type: 'income' }
    ]
  },
  {
    id: generateId(),
    name: '副业收入',
    type: 'income',
    icon: '💼',
    children: [
      { id: generateId(), name: '兼职', type: 'income' },
      { id: generateId(), name: '自由职业', type: 'income' },
      { id: generateId(), name: '外包项目', type: 'income' },
      { id: generateId(), name: '咨询服务', type: 'income' },
      { id: generateId(), name: '知识付费', type: 'income' },
      { id: generateId(), name: '直播带货', type: 'income' },
      { id: generateId(), name: '内容创作', type: 'income' },
      { id: generateId(), name: '其他副业', type: 'income' }
    ]
  },
  {
    id: generateId(),
    name: '经营收入',
    type: 'income',
    icon: '🏪',
    children: [
      { id: generateId(), name: '商品销售', type: 'income' },
      { id: generateId(), name: '服务收入', type: 'income' },
      { id: generateId(), name: '代理收入', type: 'income' },
      { id: generateId(), name: '其他经营', type: 'income' }
    ]
  },
  {
    id: generateId(),
    name: '礼金收入',
    type: 'income',
    icon: '🎁',
    children: [
      { id: generateId(), name: '红包', type: 'income' },
      { id: generateId(), name: '礼金', type: 'income' },
      { id: generateId(), name: '压岁钱', type: 'income' },
      { id: generateId(), name: '其他礼金', type: 'income' }
    ]
  },
  {
    id: generateId(),
    name: '退款回收',
    type: 'income',
    icon: '💵',
    children: [
      { id: generateId(), name: '退款', type: 'income' },
      { id: generateId(), name: '报销', type: 'income' },
      { id: generateId(), name: '赔偿', type: 'income' },
      { id: generateId(), name: '其他回收', type: 'income' }
    ]
  },
  {
    id: generateId(),
    name: '其他收入',
    type: 'income',
    icon: '📝',
    children: [
      { id: generateId(), name: '彩票中奖', type: 'income' },
      { id: generateId(), name: '遗产继承', type: 'income' },
      { id: generateId(), name: '政府补贴', type: 'income' },
      { id: generateId(), name: '其他杂项', type: 'income' }
    ]
  }
]

// 支付渠道模板
export const defaultPaymentChannels = [
  { id: generateId(), name: '支付宝' },
  { id: generateId(), name: '微信支付' },
  { id: generateId(), name: '云闪付' },
  { id: generateId(), name: '现金' },
  { id: generateId(), name: '银行卡' },
  { id: generateId(), name: '信用卡' },
  { id: generateId(), name: '花呗' },
  { id: generateId(), name: '京东白条' },
  { id: generateId(), name: '其他' }
]

// 成员模板
export const defaultMembers = [
  { id: generateId(), name: '自己' },
  { id: generateId(), name: '配偶' },
  { id: generateId(), name: '父亲' },
  { id: generateId(), name: '母亲' },
  { id: generateId(), name: '孩子' },
  { id: generateId(), name: '家庭共用' }
]

// 标签模板
export const defaultTags = [
  { id: generateId(), name: '日常' },
  { id: generateId(), name: '紧急' },
  { id: generateId(), name: '计划内' },
  { id: generateId(), name: '计划外' },
  { id: generateId(), name: '必要' },
  { id: generateId(), name: '非必要' },
  { id: generateId(), name: '可延迟' },
  { id: generateId(), name: '重要' }
]

// 商家模板
export const defaultMerchants = [
  { id: generateId(), name: '星巴克' },
  { id: generateId(), name: '麦当劳' },
  { id: generateId(), name: '肯德基' },
  { id: generateId(), name: '海底捞' },
  { id: generateId(), name: '美团外卖' },
  { id: generateId(), name: '饿了么' },
  { id: generateId(), name: '永辉超市' },
  { id: generateId(), name: '沃尔玛' },
  { id: generateId(), name: '家乐福' },
  { id: generateId(), name: '天猫超市' },
  { id: generateId(), name: '淘宝' },
  { id: generateId(), name: '京东' },
  { id: generateId(), name: '拼多多' },
  { id: generateId(), name: '唯品会' },
  { id: generateId(), name: '滴滴出行' },
  { id: generateId(), name: '高德地图' },
  { id: generateId(), name: '中石化' },
  { id: generateId(), name: '中石油' },
  { id: generateId(), name: '电影院' },
  { id: generateId(), name: '爱奇艺' },
  { id: generateId(), name: '腾讯视频' },
  { id: generateId(), name: '优酷' },
  { id: generateId(), name: '健身房' },
  { id: generateId(), name: '医院' },
  { id: generateId(), name: '药店' },
  { id: generateId(), name: '学校' },
  { id: generateId(), name: '物业公司' },
  { id: generateId(), name: '自来水公司' },
  { id: generateId(), name: '电力公司' },
  { id: generateId(), name: '燃气公司' },
  { id: generateId(), name: '移动营业厅' },
  { id: generateId(), name: '联通营业厅' },
  { id: generateId(), name: '电信营业厅' }
]

// 账套模板定义
export const ledgerTemplates = [
  {
    id: 'blank',
    name: '空白账套',
    description: '从零开始创建，不包含任何预置数据',
    icon: '📄',
    type: 'blank'
  },
  {
    id: 'personal',
    name: '个人记账',
    description: '适合个人的通用账套，包含常用的收支分类和基础数据',
    icon: '👤',
    type: 'personal',
    data: {
      expenseCategories: defaultExpenseCategories,
      incomeCategories: defaultIncomeCategories,
      paymentChannels: defaultPaymentChannels,
      members: defaultMembers,
      tags: defaultTags,
      merchants: defaultMerchants
    }
  },
  {
    id: 'family',
    name: '家庭记账',
    description: '适合家庭共同使用，支持多成员管理，可追踪家庭成员支出',
    icon: '👨‍👩‍👧',
    type: 'family',
    data: {
      expenseCategories: defaultExpenseCategories,
      incomeCategories: defaultIncomeCategories,
      paymentChannels: defaultPaymentChannels,
      members: [
        { id: generateId(), name: '爸爸' },
        { id: generateId(), name: '妈妈' },
        { id: generateId(), name: '孩子' },
        { id: generateId(), name: '家庭共用' }
      ],
      tags: defaultTags,
      merchants: defaultMerchants
    }
  },
  {
    id: 'business',
    name: '生意记账',
    description: '适合小微企业或个体工商户，支持经营收支和成本核算',
    icon: '🏪',
    type: 'business',
    data: {
      expenseCategories: [
        ...defaultExpenseCategories,
        {
          id: generateId(),
          name: '经营成本',
          type: 'expense',
          icon: '💼',
          children: [
            { id: generateId(), name: '进货成本', type: 'expense' },
            { id: generateId(), name: '物流成本', type: 'expense' },
            { id: generateId(), name: '包装材料', type: 'expense' },
            { id: generateId(), name: '损耗', type: 'expense' },
            { id: generateId(), name: '其他成本', type: 'expense' }
          ]
        },
        {
          id: generateId(),
          name: '经营费用',
          type: 'expense',
          icon: '📋',
          children: [
            { id: generateId(), name: '房租', type: 'expense' },
            { id: generateId(), name: '水电费', type: 'expense' },
            { id: generateId(), name: '工资', type: 'expense' },
            { id: generateId(), name: '社保', type: 'expense' },
            { id: generateId(), name: '税费', type: 'expense' },
            { id: generateId(), name: '营销推广', type: 'expense' },
            { id: generateId(), name: '办公用品', type: 'expense' },
            { id: generateId(), name: '其他费用', type: 'expense' }
          ]
        }
      ],
      incomeCategories: [
        ...defaultIncomeCategories,
        {
          id: generateId(),
          name: '销售收入',
          type: 'income',
          icon: '💰',
          children: [
            { id: generateId(), name: '零售', type: 'income' },
            { id: generateId(), name: '批发', type: 'income' },
            { id: generateId(), name: '线上销售', type: 'income' },
            { id: generateId(), name: '其他销售', type: 'income' }
          ]
        },
        {
          id: generateId(),
          name: '其他经营',
          type: 'income',
          icon: '📦',
          children: [
            { id: generateId(), name: '加盟费', type: 'income' },
            { id: generateId(), name: '代理费', type: 'income' },
            { id: generateId(), name: '其他收入', type: 'income' }
          ]
        }
      ],
      paymentChannels: defaultPaymentChannels,
      members: defaultMembers,
      tags: [...defaultTags, { id: generateId(), name: '经营' }],
      merchants: defaultMerchants
    }
  },
  {
    id: 'student',
    name: '学生记账',
    description: '适合学生群体，简洁实用，侧重日常开销记录',
    icon: '🎓',
    type: 'student',
    data: {
      expenseCategories: [
        {
          id: generateId(),
          name: '餐饮',
          type: 'expense',
          icon: '🍜',
          children: [
            { id: generateId(), name: '食堂', type: 'expense' },
            { id: generateId(), name: '外卖', type: 'expense' },
            { id: generateId(), name: '聚餐', type: 'expense' },
            { id: generateId(), name: '零食', type: 'expense' },
            { id: generateId(), name: '饮料', type: 'expense' }
          ]
        },
        {
          id: generateId(),
          name: '学习',
          type: 'expense',
          icon: '📚',
          children: [
            { id: generateId(), name: '教材', type: 'expense' },
            { id: generateId(), name: '文具', type: 'expense' },
            { id: generateId(), name: '打印复印', type: 'expense' },
            { id: generateId(), name: '培训', type: 'expense' },
            { id: generateId(), name: '考试报名', type: 'expense' }
          ]
        },
        {
          id: generateId(),
          name: '生活',
          type: 'expense',
          icon: '🛒',
          children: [
            { id: generateId(), name: '日用品', type: 'expense' },
            { id: generateId(), name: '衣物', type: 'expense' },
            { id: generateId(), name: '护肤品', type: 'expense' },
            { id: generateId(), name: '理发', type: 'expense' },
            { id: generateId(), name: '快递', type: 'expense' }
          ]
        },
        {
          id: generateId(),
          name: '交通通讯',
          type: 'expense',
          icon: '📱',
          children: [
            { id: generateId(), name: '公交地铁', type: 'expense' },
            { id: generateId(), name: '打车', type: 'expense' },
            { id: generateId(), name: '话费和流量', type: 'expense' },
            { id: generateId(), name: '宽带', type: 'expense' }
          ]
        },
        {
          id: generateId(),
          name: '娱乐',
          type: 'expense',
          icon: '🎮',
          children: [
            { id: generateId(), name: '游戏', type: 'expense' },
            { id: generateId(), name: '视频会员', type: 'expense' },
            { id: generateId(), name: '电影', type: 'expense' },
            { id: generateId(), name: '聚餐', type: 'expense' },
            { id: generateId(), name: '旅游', type: 'expense' }
          ]
        },
        {
          id: generateId(),
          name: '其他',
          type: 'expense',
          icon: '📝',
          children: [
            { id: generateId(), name: '人情', type: 'expense' },
            { id: generateId(), name: '医疗', type: 'expense' },
            { id: generateId(), name: '其他', type: 'expense' }
          ]
        }
      ],
      incomeCategories: [
        {
          id: generateId(),
          name: '生活费',
          type: 'income',
          icon: '💰',
          children: [
            { id: generateId(), name: '家里给的生活费', type: 'income' },
            { id: generateId(), name: '奖学金', type: 'income' },
            { id: generateId(), name: '助学金', type: 'income' }
          ]
        },
        {
          id: generateId(),
          name: '兼职',
          type: 'income',
          icon: '💼',
          children: [
            { id: generateId(), name: '家教', type: 'income' },
            { id: generateId(), name: '实习', type: 'income' },
            { id: generateId(), name: '勤工俭学', type: 'income' },
            { id: generateId(), name: '其他兼职', type: 'income' }
          ]
        },
        {
          id: generateId(),
          name: '其他',
          type: 'income',
          icon: '📝',
          children: [
            { id: generateId(), name: '红包', type: 'income' },
            { id: generateId(), name: '其他', type: 'income' }
          ]
        }
      ],
      paymentChannels: [
        { id: generateId(), name: '微信支付' },
        { id: generateId(), name: '支付宝' },
        { id: generateId(), name: '校园卡' },
        { id: generateId(), name: '现金' },
        { id: generateId(), name: '银行卡' }
      ],
      members: [
        { id: generateId(), name: '自己' }
      ],
      tags: [
        { id: generateId(), name: '日常' },
        { id: generateId(), name: '必要' },
        { id: generateId(), name: '冲动消费' }
      ],
      merchants: [
        { id: generateId(), name: '食堂' },
        { id: generateId(), name: '学校超市' },
        { id: generateId(), name: '美团' },
        { id: generateId(), name: '饿了么' },
        { id: generateId(), name: '淘宝' },
        { id: generateId(), name: '京东' }
      ]
    }
  }
]

// 创建账套并应用模板
export const createLedgerFromTemplate = (templateId, name, description = '') => {
  const template = ledgerTemplates.find(t => t.id === templateId)
  if (!template) {
    throw new Error('模板不存在')
  }

  const ledgerId = generateId()
  const ledger = {
    id: ledgerId,
    name: name || template.name,
    description: description || template.description,
    createdAt: new Date().toLocaleString(),
    type: template.type,
    templateId: template.id
  }

  // 如果不是空白模板，保存维度数据
  if (template.type !== 'blank' && template.data) {
    const dimensions = {
      expenseCategories: template.data.expenseCategories || [],
      incomeCategories: template.data.incomeCategories || [],
      paymentChannels: template.data.paymentChannels || [],
      members: template.data.members || [],
      tags: template.data.tags || [],
      merchants: template.data.merchants || []
    }
    
    // 为每个账套存储独立的维度数据，使用账套ID作为后缀
    localStorage.setItem(`dimensions_${ledgerId}`, JSON.stringify(dimensions))
  }

  return ledger
}

// 获取账套的维度数据
export const getLedgerDimensions = (ledgerId) => {
  const dimensionsData = localStorage.getItem(`dimensions_${ledgerId}`)
  if (dimensionsData) {
    return JSON.parse(dimensionsData)
  }
  // 如果没有账套特定的维度数据，返回默认模板数据
  const template = ledgerTemplates.find(t => t.type !== 'blank')
  if (template && template.data) {
    return {
      expenseCategories: template.data.expenseCategories || [],
      incomeCategories: template.data.incomeCategories || [],
      paymentChannels: template.data.paymentChannels || [],
      members: template.data.members || [],
      tags: template.data.tags || [],
      merchants: template.data.merchants || []
    }
  }
  return null
}
