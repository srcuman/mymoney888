-- =============================================================================
-- MyMoney888 预置账套数据初始化脚本
-- 版本: 3.9.0
-- 
-- 功能: 首次使用或新账套时，初始化基础数据
-- 原则: 数据为核心，已有数据不覆盖，无损迭代
-- 
-- 使用场景:
-- 1. 全新安装，首次使用
-- 2. 创建新账套
-- 3. 用户手动请求重置默认数据
-- 
-- 保护机制:
-- - 仅当数据为空时才插入（INSERT IGNORE）
-- - 支持账套隔离（ledger_id）
-- - 用户数据永远不会被覆盖
-- 
-- 维度数据说明:
-- - 使用统一的 dimensions 表存储所有维度数据
-- - type 字段区分: members(成员), merchants(商家), tags(标签), payment_channels(支付渠道)
-- =============================================================================

USE mymoney888;

-- ============================================
-- 步骤1: 预置账户数据
-- ============================================
-- 参考随手记、挖财等设计，提供常见账户类型

INSERT IGNORE INTO accounts (id, user_id, ledger_id, name, account_type, currency, initial_balance, description, icon, color, sort_order, is_active) VALUES
-- 现金类
(1001, 1, 'default', '我的钱包', 'cash', 'CNY', 0.00, '现金账户', 'wallet', '#4CAF50', 10, 1),

-- 银行卡类
(1002, 1, 'default', '中国工商银行储蓄卡', 'bank', 'CNY', 0.00, '工资卡', 'bank', '#2196F3', 20, 1),
(1003, 1, 'default', '中国建设银行储蓄卡', 'bank', 'CNY', 0.00, '日常消费卡', 'bank', '#3F51B5', 21, 1),
(1004, 1, 'default', '中国农业银行储蓄卡', 'bank', 'CNY', 0.00, '备用储蓄', 'bank', '#009688', 22, 1),

-- 支付宝类
(1005, 1, 'default', '支付宝', 'alipay', 'CNY', 0.00, '支付宝余额', 'alipay', '#1890FF', 30, 1),
(1006, 1, 'default', '余额宝', 'alipay', 'CNY', 0.00, '支付宝理财产品', 'alipay', '#52C41A', 31, 1),

-- 微信类
(1007, 1, 'default', '微信支付', 'wechat', 'CNY', 0.00, '微信零钱', 'wechat', '#07C160', 40, 1),
(1008, 1, 'default', '微信理财通', 'wechat', 'CNY', 0.00, '微信理财', 'wechat', '#576B95', 41, 1),

-- 信用卡类（会与credit_cards表关联）
(1009, 1, 'default', '招商银行信用卡', 'credit_card', 'CNY', 0.00, '主用信用卡', 'credit-card', '#FF6B6B', 50, 1),
(1010, 1, 'default', '中国工商银行信用卡', 'credit_card', 'CNY', 0.00, '备用信用卡', 'credit-card', '#845EF7', 51, 1),

-- 投资账户类
(1011, 1, 'default', '天天基金账户', 'investment', 'CNY', 0.00, '基金投资账户', 'trending-up', '#FAAD14', 60, 1),
(1012, 1, 'default', '证券账户', 'investment', 'CNY', 0.00, '股票投资账户', 'trending-up', '#F5222D', 61, 1),

-- 其他类
(1013, 1, 'default', '京东金融', 'other', 'CNY', 0.00, '京东小金库', 'shopping', '#FA8C16', 70, 1),
(1014, 1, 'default', '美团钱包', 'other', 'CNY', 0.00, '美团支付', 'food', '#EB2F96', 71, 1);

-- ============================================
-- 步骤2: 预置支出分类（一级+二级）
-- ============================================
-- 参考随手记分类体系，设计完善的支出分类

INSERT IGNORE INTO categories (id, user_id, ledger_id, name, type, icon, color, parent_id, sort_order, is_default) VALUES

-- ========== 支出分类 ==========

-- 餐饮 (一级)
(2001, 1, 'default', '餐饮', 'expense', 'restaurant', '#FF6B6B', NULL, 10, 1),
-- 餐饮 (二级)
(200101, 1, 'default', '早午晚餐', 'expense', 'coffee', '#FF8787', 2001, 1, 1),
(200102, 1, 'default', '外卖', 'expense', 'delivery', '#FFA94D', 2001, 2, 1),
(200103, 1, 'default', '下午茶', 'expense', 'cake', '#FFD43B', 2001, 3, 1),
(200104, 1, 'default', '夜宵', 'expense', 'moon', '#69DB7C', 2001, 4, 1),
(200105, 1, 'default', '零食', 'expense', 'cookie', '#A9E34B', 2001, 5, 1),
(200106, 1, 'default', '水果', 'expense', 'apple', '#FF922B', 2001, 6, 1),
(200107, 1, 'default', '烟酒', 'expense', 'wine', '#845EF7', 2001, 7, 1),

-- 购物 (一级)
(2002, 1, 'default', '购物', 'expense', 'shopping-bag', '#9C27B0', NULL, 20, 1),
-- 购物 (二级)
(200201, 1, 'default', '服装鞋包', 'expense', 'shirt', '#CE93D8', 2002, 1, 1),
(200202, 1, 'default', '日用百货', 'expense', 'home', '#F48FB1', 2002, 2, 1),
(200203, 1, 'default', '数码电器', 'expense', 'smartphone', '#7C4DFF', 2002, 3, 1),
(200204, 1, 'default', '美妆护肤', 'expense', 'sparkles', '#E91E63', 2002, 4, 1),
(200205, 1, 'default', '母婴用品', 'expense', 'baby', '#FF5722', 2002, 5, 1),
(200206, 1, 'default', '图书文具', 'expense', 'book', '#795548', 2002, 6, 1),
(200207, 1, 'default', '宠物用品', 'expense', 'paw', '#8D6E63', 2002, 7, 1),

-- 居住 (一级)
(2003, 1, 'default', '居住', 'expense', 'home', '#4CAF50', NULL, 30, 1),
-- 居住 (二级)
(200301, 1, 'default', '房租', 'expense', 'key', '#81C784', 2003, 1, 1),
(200302, 1, 'default', '房贷', 'expense', 'house', '#A5D6A7', 2003, 2, 1),
(200303, 1, 'default', '水电气', 'expense', 'zap', '#FFF176', 2003, 3, 1),
(200304, 1, 'default', '物业费', 'expense', 'building', '#FFE082', 2003, 4, 1),
(200305, 1, 'default', '通讯费', 'expense', 'phone', '#64B5F6', 2003, 5, 1),
(200306, 1, 'default', '网费', 'expense', 'wifi', '#90CAF9', 2003, 6, 1),
(200307, 1, 'default', '装修家居', 'expense', 'hammer', '#BCAAA4', 2003, 7, 1),

-- 交通 (一级)
(2004, 1, 'default', '交通', 'expense', 'car', '#2196F3', NULL, 40, 1),
-- 交通 (二级)
(200401, 1, 'default', '私家车费用', 'expense', 'car', '#64B5F6', 2004, 1, 1),
(200402, 1, 'default', '油费', 'expense', 'fuel', '#FFB74D', 2004, 2, 1),
(200403, 1, 'default', '停车费', 'expense', 'parking', '#FFD54F', 2004, 3, 1),
(200404, 1, 'default', '公共交通', 'expense', 'bus', '#81D4FA', 2004, 4, 1),
(200405, 1, 'default', '打车', 'expense', 'taxi', '#4FC3F7', 2004, 5, 1),
(200406, 1, 'default', '火车票', 'expense', 'train', '#26A69A', 2004, 6, 1),
(200407, 1, 'default', '飞机票', 'expense', 'plane', '#42A5F5', 2004, 7, 1),
(200408, 1, 'default', '地铁', 'expense', 'subway', '#5C6BC0', 2004, 8, 1),

-- 医疗 (一级)
(2005, 1, 'default', '医疗', 'expense', 'pill', '#F44336', NULL, 50, 1),
-- 医疗 (二级)
(200501, 1, 'default', '药品', 'expense', 'pill', '#EF9A9A', 2005, 1, 1),
(200502, 1, 'default', '门诊', 'expense', 'stethoscope', '#E57373', 2005, 2, 1),
(200503, 1, 'default', '住院', 'expense', 'bed', '#EF5350', 2005, 3, 1),
(200504, 1, 'default', '体检', 'expense', 'clipboard', '#E53935', 2005, 4, 1),
(200505, 1, 'default', '保健', 'expense', 'heart', '#C62828', 2005, 5, 1),
(200506, 1, 'default', '保险', 'expense', 'shield', '#D32F2F', 2005, 6, 1),

-- 教育 (一级)
(2006, 1, 'default', '教育', 'expense', 'graduation-cap', '#FF9800', NULL, 60, 1),
-- 教育 (二级)
(200601, 1, 'default', '学费', 'expense', 'book-open', '#FFB74D', 2006, 1, 1),
(200602, 1, 'default', '培训', 'expense', 'pen-tool', '#FFA726', 2006, 2, 1),
(200603, 1, 'default', '教材', 'expense', 'book', '#FF9800', 2006, 3, 1),
(200604, 1, 'default', '兴趣班', 'expense', 'palette', '#FB8C00', 2006, 4, 1),
(200605, 1, 'default', '文具', 'expense', 'pencil', '#F57C00', 2006, 5, 1),

-- 娱乐 (一级)
(2007, 1, 'default', '娱乐', 'expense', 'gamepad-2', '#9C27B0', NULL, 70, 1),
-- 娱乐 (二级)
(200701, 1, 'default', '电影', 'expense', 'film', '#BA68C8', 2007, 1, 1),
(200702, 1, 'default', '演唱会', 'expense', 'music', '#AB47BC', 2007, 2, 1),
(200703, 1, 'default', '游戏', 'expense', 'gamepad', '#9575CD', 2007, 3, 1),
(200704, 1, 'default', '运动健身', 'expense', 'dumbbell', '#7E57C2', 2007, 4, 1),
(200705, 1, 'default', '旅游', 'expense', 'map', '#673AB7', 2007, 5, 1),
(200706, 1, 'default', '宠物娱乐', 'expense', 'dog', '#5E35B1', 2007, 6, 1),
(200707, 1, 'default', 'ktv', 'expense', 'mic', '#512DA8', 2007, 7, 1),
(200708, 1, 'default', '酒吧', 'expense', 'beer', '#4527A0', 2007, 8, 1),

-- 人情 (一级)
(2008, 1, 'default', '人情', 'expense', 'gift', '#E91E63', NULL, 80, 1),
-- 人情 (二级)
(200801, 1, 'default', '红包', 'expense', 'gift', '#F48FB1', 2008, 1, 1),
(200802, 1, 'default', '礼物', 'expense', 'present', '#F06292', 2008, 2, 1),
(200803, 1, 'default', '请客吃饭', 'expense', 'users', '#EC407A', 2008, 3, 1),
(200804, 1, 'default', '慈善捐款', 'expense', 'heart', '#D81B60', 2008, 4, 1),

-- 金融 (一级)
(2009, 1, 'default', '金融', 'expense', 'landmark', '#607D8B', NULL, 90, 1),
-- 金融 (二级)
(200901, 1, 'default', '信用卡还款', 'expense', 'credit-card', '#90A4AE', 2009, 1, 1),
(200902, 1, 'default', '贷款还款', 'expense', 'bank', '#78909C', 2009, 2, 1),
(200903, 1, 'default', '投资支出', 'expense', 'trending-up', '#607D8B', 2009, 3, 1),
(200904, 1, 'default', '手续费', 'expense', 'percent', '#546E7A', 2009, 4, 1),

-- 其他 (一级)
(2010, 1, 'default', '其他', 'expense', 'more-horizontal', '#9E9E9E', NULL, 100, 1),
-- 其他 (二级)
(201001, 1, 'default', '意外损失', 'expense', 'alert-triangle', '#BDBDBD', 2010, 1, 1),
(201002, 1, 'default', '专项支出', 'expense', 'folder', '#E0E0E0', 2010, 2, 1),
(201003, 1, 'default', '退款', 'expense', 'rotate-ccw', '#F5F5F5', 2010, 3, 1),

-- ========== 收入分类 ==========

-- 工资 (一级)
(3001, 1, 'default', '工资', 'income', 'briefcase', '#4CAF50', NULL, 110, 1),
-- 工资 (二级)
(300101, 1, 'default', '基本工资', 'income', 'dollar-sign', '#81C784', 3001, 1, 1),
(300102, 1, 'default', '奖金', 'income', 'trophy', '#A5D6A7', 3001, 2, 1),
(300103, 1, 'default', '补贴', 'income', 'plus-circle', '#C8E6C9', 3001, 3, 1),
(300104, 1, 'default', '加班费', 'income', 'clock', '#69F0AE', 3001, 4, 1),

-- 经营 (一级)
(3002, 1, 'default', '经营', 'income', 'store', '#2196F3', NULL, 120, 1),
-- 经营 (二级)
(300201, 1, 'default', '销售收入', 'income', 'shopping-cart', '#64B5F6', 3002, 1, 1),
(300202, 1, 'default', '服务收入', 'income', 'tool', '#42A5F5', 3002, 2, 1),
(300203, 1, 'default', '佣金', 'income', 'percent', '#2196F3', 3002, 3, 1),

-- 投资 (一级)
(3003, 1, 'default', '投资', 'income', 'trending-up', '#FF9800', NULL, 130, 1),
-- 投资 (二级)
(300301, 1, 'default', '基金收益', 'income', 'trending-up', '#FFB74D', 3003, 1, 1),
(300302, 1, 'default', '股票收益', 'income', 'bar-chart', '#FFA726', 3003, 2, 1),
(300303, 1, 'default', '债券收益', 'income', 'file-text', '#FF9800', 3003, 3, 1),
(300304, 1, 'default', '利息', 'income', 'percent', '#FB8C00', 3003, 4, 1),
(300305, 1, 'default', '分红', 'income', 'gift', '#F57C00', 3003, 5, 1),

-- 其他收入 (一级)
(3004, 1, 'default', '其他收入', 'income', 'plus-circle', '#9C27B0', NULL, 140, 1),
-- 其他收入 (二级)
(300401, 1, 'default', '退款', 'income', 'rotate-ccw', '#CE93D8', 3004, 1, 1),
(300402, 1, 'default', '礼金', 'income', 'gift', '#BA68C8', 3004, 2, 1),
(300403, 1, 'default', '兼职', 'income', 'coffee', '#AB47BC', 3004, 3, 1),
(300404, 1, 'default', '租金', 'income', 'home', '#9C27B0', 3004, 4, 1),
(300405, 1, 'default', '中奖', 'income', 'star', '#8E24AA', 3004, 5, 1),
(300406, 1, 'default', '意外收入', 'income', 'alert-circle', '#7B1FA2', 3004, 6, 1);

-- ============================================
-- 步骤3: 预置账套元数据
-- ============================================

INSERT IGNORE INTO ledgers (id, user_id, name, description, icon, color, is_default, sort_order, is_active) VALUES
('default', 1, '我的账本', '默认记账账本', 'book', '#4CAF50', 1, 1, 1);

-- ============================================
-- 步骤4: 预置维度数据（使用统一的dimensions表）
-- ============================================
-- type: members(成员), merchants(商家), tags(标签), payment_channels(支付渠道)

-- 成员维度
INSERT IGNORE INTO dimensions (id, user_id, ledger_id, type, name, icon, color, extra_data, sort_order, is_active) VALUES
(4001, 1, 'default', 'members', '自己', 'user', '#4CAF50', '{"relationship":"self"}', 1, 1),
(4002, 1, 'default', 'members', '配偶', 'heart', '#E91E63', '{"relationship":"spouse"}', 2, 1),
(4003, 1, 'default', 'members', '父亲', 'user', '#2196F3', '{"relationship":"father"}', 3, 1),
(4004, 1, 'default', 'members', '母亲', 'user', '#FF9800', '{"relationship":"mother"}', 4, 1),
(4005, 1, 'default', 'members', '孩子', 'baby', '#9C27B0', '{"relationship":"child"}', 5, 1),
(4006, 1, 'default', 'members', '其他家人', 'users', '#607D8B', '{"relationship":"other"}', 6, 1),
(4007, 1, 'default', 'members', '朋友', 'smile', '#00BCD4', '{"relationship":"friend"}', 7, 1),
(4008, 1, 'default', 'members', '同事', 'briefcase', '#795548', '{"relationship":"colleague"}', 8, 1);

-- 商家维度
INSERT IGNORE INTO dimensions (id, user_id, ledger_id, type, name, icon, color, extra_data, sort_order, is_active) VALUES
-- 餐饮类
(5001, 1, 'default', 'merchants', '麦当劳', 'coffee', '#FFC107', '{"category":"餐饮"}', 1, 1),
(5002, 1, 'default', 'merchants', '肯德基', 'coffee', '#FF5722', '{"category":"餐饮"}', 2, 1),
(5003, 1, 'default', 'merchants', '星巴克', 'coffee', '#4CAF50', '{"category":"餐饮"}', 3, 1),
(5004, 1, 'default', 'merchants', '美团外卖', 'delivery', '#FF6B00', '{"category":"餐饮"}', 4, 1),
(5005, 1, 'default', 'merchants', '饿了么', 'delivery', '#007AFF', '{"category":"餐饮"}', 5, 1),

-- 购物类
(5006, 1, 'default', 'merchants', '淘宝', 'shopping-bag', '#FF5000', '{"category":"购物"}', 10, 1),
(5007, 1, 'default', 'merchants', '京东', 'shopping-cart', '#E1251B', '{"category":"购物"}', 11, 1),
(5008, 1, 'default', 'merchants', '拼多多', 'shopping-bag', '#EB0029', '{"category":"购物"}', 12, 1),
(5009, 1, 'default', 'merchants', '天猫', 'shopping-bag', '#FF0033', '{"category":"购物"}', 13, 1),
(5010, 1, 'default', 'merchants', '唯品会', 'shopping-bag', '#E8004E', '{"category":"购物"}', 14, 1),

-- 超市便利店
(5011, 1, 'default', 'merchants', '沃尔玛', 'shopping-cart', '#0071CE', '{"category":"超市"}', 20, 1),
(5012, 1, 'default', 'merchants', '永辉超市', 'shopping-cart', '#FF6600', '{"category":"超市"}', 21, 1),
(5013, 1, 'default', 'merchants', '盒马鲜生', 'shopping-cart', '#FFD700', '{"category":"超市"}', 22, 1),
(5014, 1, 'default', 'merchants', '711便利店', 'store', '#00A1D9', '{"category":"便利店"}', 30, 1),
(5015, 1, 'default', 'merchants', '全家便利店', 'store', '#00AA4F', '{"category":"便利店"}', 31, 1),

-- 交通类
(5016, 1, 'default', 'merchants', '滴滴出行', 'car', '#333333', '{"category":"出行"}', 40, 1),
(5017, 1, 'default', 'merchants', '高德地图', 'map', '#33B7EE', '{"category":"出行"}', 41, 1),
(5018, 1, 'default', 'merchants', '哈啰出行', 'bicycle', '#00B5E2', '{"category":"出行"}', 42, 1),

-- 充值缴费
(5019, 1, 'default', 'merchants', '中国移动', 'smartphone', '#CC0000', '{"category":"通讯"}', 50, 1),
(5020, 1, 'default', 'merchants', '中国联通', 'smartphone', '#0C61AF', '{"category":"通讯"}', 51, 1),
(5021, 1, 'default', 'merchants', '中国电信', 'smartphone', '#E1251B', '{"category":"通讯"}', 52, 1),

-- 娱乐类
(5022, 1, 'default', 'merchants', '爱奇艺', 'film', '#00BE06', '{"category":"娱乐"}', 60, 1),
(5023, 1, 'default', 'merchants', '腾讯视频', 'film', '#FF5500', '{"category":"娱乐"}', 61, 1),
(5024, 1, 'default', 'merchants', '优酷', 'film', '#00BFFF', '{"category":"娱乐"}', 62, 1),
(5025, 1, 'default', 'merchants', '网易云音乐', 'music', '#C20C0C', '{"category":"娱乐"}', 63, 1),
(5026, 1, 'default', 'merchants', 'QQ音乐', 'music', '#31C27C', '{"category":"娱乐"}', 64, 1);

-- 标签维度
INSERT IGNORE INTO dimensions (id, user_id, ledger_id, type, name, icon, color, extra_data, sort_order, is_active) VALUES
-- 通用标签
(6001, 1, 'default', 'tags', '必要', 'check-circle', '#4CAF50', '{"type":"priority"}', 1, 1),
(6002, 1, 'default', 'tags', '可选', 'circle', '#9E9E9E', '{"type":"priority"}', 2, 1),
(6003, 1, 'default', 'tags', '冲动消费', 'alert-triangle', '#F44336', '{"type":"behavior"}', 3, 1),
(6004, 1, 'default', 'tags', '团购', 'users', '#2196F3', '{"type":"discount"}', 4, 1),
(6005, 1, 'default', 'tags', '优惠', 'tag', '#FF9800', '{"type":"discount"}', 5, 1),
(6006, 1, 'default', 'tags', '免息', 'shield', '#4CAF50', '{"type":"financial"}', 6, 1),

-- 时间相关
(6007, 1, 'default', 'tags', '工作日', 'briefcase', '#607D8B', '{"type":"time"}', 10, 1),
(6008, 1, 'default', 'tags', '周末', 'calendar', '#9C27B0', '{"type":"time"}', 11, 1),
(6009, 1, 'default', 'tags', '节假日', 'star', '#FF5722', '{"type":"time"}', 12, 1),
(6010, 1, 'default', 'tags', '生日', 'cake', '#E91E63', '{"type":"event"}', 13, 1),

-- 场景相关
(6011, 1, 'default', 'tags', '在家', 'home', '#4CAF50', '{"type":"location"}', 20, 1),
(6012, 1, 'default', 'tags', '外出', 'map-pin', '#2196F3', '{"type":"location"}', 21, 1),
(6013, 1, 'default', 'tags', '出差', 'briefcase', '#FF9800', '{"type":"work"}', 22, 1),
(6014, 1, 'default', 'tags', '旅行', 'plane', '#00BCD4', '{"type":"leisure"}', 23, 1),

-- 情绪相关
(6015, 1, 'default', 'tags', '犒劳自己', 'heart', '#E91E63', '{"type":"emotion"}', 30, 1),
(6016, 1, 'default', 'tags', '省钱', 'piggy-bank', '#4CAF50', '{"type":"behavior"}', 31, 1);

-- 支付渠道维度
INSERT IGNORE INTO dimensions (id, user_id, ledger_id, type, name, icon, color, extra_data, sort_order, is_active) VALUES
(7001, 1, 'default', 'payment_channels', '现金', 'banknote', '#4CAF50', '{"method":"cash"}', 1, 1),
(7002, 1, 'default', 'payment_channels', '支付宝', 'alipay', '#1890FF', '{"method":"digital"}', 2, 1),
(7003, 1, 'default', 'payment_channels', '微信支付', 'wechat', '#07C160', '{"method":"digital"}', 3, 1),
(7004, 1, 'default', 'payment_channels', '银行卡', 'credit-card', '#2196F3', '{"method":"bank"}', 4, 1),
(7005, 1, 'default', 'payment_channels', '云闪付', 'cloud', '#1A73E8', '{"method":"digital"}', 5, 1),
(7006, 1, 'default', 'payment_channels', 'Apple Pay', 'smartphone', '#000000', '{"method":"digital"}', 6, 1),
(7007, 1, 'default', 'payment_channels', '其他', 'more-horizontal', '#9E9E9E', '{"method":"other"}', 99, 1);

-- ============================================
-- 步骤5: 预置用户默认值
-- ============================================

INSERT IGNORE INTO user_defaults (id, user_id, ledger_id, expense_category, income_category, payment_channel, account_id) VALUES
(1, 1, 'default', '餐饮', '工资', '微信支付', 1007);

-- ============================================
-- 步骤6: 输出完成信息
-- ============================================

SELECT '========================================' AS '';
SELECT '  MyMoney888 预置数据初始化完成' AS '';
SELECT '========================================' AS '';
SELECT CONCAT('账户数据: ', COUNT(*), ' 条') AS info FROM accounts WHERE ledger_id = 'default';
SELECT CONCAT('支出分类: ', COUNT(*), ' 条') AS info FROM categories WHERE ledger_id = 'default' AND type = 'expense';
SELECT CONCAT('收入分类: ', COUNT(*), ' 条') AS info FROM categories WHERE ledger_id = 'default' AND type = 'income';
SELECT CONCAT('成员数据: ', COUNT(*), ' 条') AS info FROM dimensions WHERE ledger_id = 'default' AND type = 'members';
SELECT CONCAT('商家数据: ', COUNT(*), ' 条') AS info FROM dimensions WHERE ledger_id = 'default' AND type = 'merchants';
SELECT CONCAT('标签数据: ', COUNT(*), ' 条') AS info FROM dimensions WHERE ledger_id = 'default' AND type = 'tags';
SELECT CONCAT('支付渠道: ', COUNT(*), ' 条') AS info FROM dimensions WHERE ledger_id = 'default' AND type = 'payment_channels';
SELECT '' AS '';
SELECT '提示: 已有数据不会被覆盖，如需重新初始化请先清空数据' AS '';

-- ============================================
-- 查询示例
-- ============================================

-- 查询维度数据的便捷视图
-- SELECT 
--     type,
--     COUNT(*) as count
-- FROM dimensions 
-- WHERE ledger_id = 'default' AND is_active = 1
-- GROUP BY type;
