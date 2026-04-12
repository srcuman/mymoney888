-- 更新投资明细表：添加净值日期字段
ALTER TABLE investment_details 
ADD COLUMN IF NOT EXISTS net_value_date DATE COMMENT '净值更新日期' AFTER update_date;

-- 创建净值历史记录表
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='净值历史记录表';
