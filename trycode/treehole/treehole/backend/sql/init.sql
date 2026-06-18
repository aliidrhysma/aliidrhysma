-- 树洞系统数据库初始化脚本
-- 版本: 1.0.0
-- 日期: 2024

-- 创建数据库
CREATE DATABASE IF NOT EXISTS treehole DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE treehole;

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` VARCHAR(32) NOT NULL UNIQUE COMMENT '用户唯一ID',
  `nickname` VARCHAR(50) NOT NULL COMMENT '昵称',
  `password` VARCHAR(200) DEFAULT NULL COMMENT '密码(加密)',
  `avatar_url` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '注册IP',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1正常 2冻结 3封禁',
  `freeze_count` INT NOT NULL DEFAULT 0 COMMENT '累计冻结次数',
  `freeze_until` DATETIME DEFAULT NULL COMMENT '冻结截止时间',
  `report_count` INT NOT NULL DEFAULT 0 COMMENT '累计被举报次数',
  `current_coord_id` VARCHAR(20) DEFAULT NULL COMMENT '当前坐标ID',
  `register_time` DATETIME NOT NULL COMMENT '注册时间',
  `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_register_time` (`register_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 坐标表
-- ============================================
CREATE TABLE IF NOT EXISTS `coordinates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `coord_id` VARCHAR(20) NOT NULL UNIQUE COMMENT '坐标ID',
  `user_id` VARCHAR(32) DEFAULT NULL COMMENT '当前占用用户ID',
  `heat_score` INT NOT NULL DEFAULT 0 COMMENT '热度评分',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0空闲 1占用',
  `occupied_at` DATETIME DEFAULT NULL COMMENT '占用时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_coord_id` (`coord_id`),
  KEY `idx_status` (`status`),
  KEY `idx_heat` (`heat_score` DESC),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='坐标表';

-- ============================================
-- 留言表
-- ============================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `msg_id` VARCHAR(32) NOT NULL UNIQUE COMMENT '留言唯一ID',
  `sender_id` VARCHAR(32) NOT NULL COMMENT '发送者ID',
  `receiver_id` VARCHAR(32) NOT NULL COMMENT '接收者ID',
  `coord_id` VARCHAR(20) NOT NULL COMMENT '目标坐标ID',
  `content_type` TINYINT NOT NULL COMMENT '类型: 1文本 2图片 3视频',
  `content` TEXT DEFAULT NULL COMMENT '文本内容',
  `media_urls` JSON DEFAULT NULL COMMENT '媒体文件URL列表',
  `is_anonymous` TINYINT NOT NULL DEFAULT 1 COMMENT '是否匿名: 0否 1是',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待审核 1已通过 2已拒绝',
  `reject_reason` VARCHAR(200) DEFAULT NULL COMMENT '拒绝原因',
  `is_read` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读: 0否 1是',
  `read_at` DATETIME DEFAULT NULL COMMENT '阅读时间',
  `expire_at` DATETIME NOT NULL COMMENT '过期时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_msg_id` (`msg_id`),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`),
  KEY `idx_coord` (`coord_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expire` (`expire_at`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='留言表';

-- ============================================
-- 回复表
-- ============================================
CREATE TABLE IF NOT EXISTS `replies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `reply_id` VARCHAR(32) NOT NULL UNIQUE COMMENT '回复唯一ID',
  `msg_id` VARCHAR(32) NOT NULL COMMENT '关联留言ID',
  `sender_id` VARCHAR(32) NOT NULL COMMENT '发送者ID',
  `receiver_id` VARCHAR(32) NOT NULL COMMENT '接收者ID',
  `content_type` TINYINT NOT NULL COMMENT '类型: 1文本 2图片 3视频',
  `content` TEXT DEFAULT NULL COMMENT '文本内容',
  `media_urls` JSON DEFAULT NULL COMMENT '媒体文件URL列表',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待审核 1已通过 2已拒绝',
  `reject_reason` VARCHAR(200) DEFAULT NULL COMMENT '拒绝原因',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reply_id` (`reply_id`),
  KEY `idx_msg_id` (`msg_id`),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回复表';

-- ============================================
-- 举报表
-- ============================================
CREATE TABLE IF NOT EXISTS `reports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `report_id` VARCHAR(32) NOT NULL UNIQUE COMMENT '举报唯一ID',
  `reporter_id` VARCHAR(32) NOT NULL COMMENT '举报者ID',
  `reported_user_id` VARCHAR(32) NOT NULL COMMENT '被举报用户ID',
  `target_type` TINYINT NOT NULL COMMENT '目标类型: 1留言 2回复',
  `target_id` VARCHAR(32) NOT NULL COMMENT '目标ID',
  `reason` VARCHAR(500) NOT NULL COMMENT '举报原因',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待处理 1已处理',
  `handle_result` VARCHAR(200) DEFAULT NULL COMMENT '处理结果',
  `handled_at` DATETIME DEFAULT NULL COMMENT '处理时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_report_id` (`report_id`),
  KEY `idx_reporter` (`reporter_id`),
  KEY `idx_reported_user` (`reported_user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='举报表';

-- ============================================
-- 用户操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS `user_actions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` VARCHAR(32) NOT NULL COMMENT '用户ID',
  `action_type` TINYINT NOT NULL COMMENT '操作类型: 1发送留言 2接收回复',
  `action_date` DATE NOT NULL COMMENT '操作日期',
  `action_count` INT NOT NULL DEFAULT 1 COMMENT '操作次数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_action_date` (`user_id`, `action_type`, `action_date`),
  KEY `idx_action_date` (`action_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户操作日志表';

-- ============================================
-- IP注册记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `ip_registrations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'IP地址',
  `user_id` VARCHAR(32) NOT NULL COMMENT '注册用户ID',
  `register_date` DATE NOT NULL COMMENT '注册日期',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_ip_date` (`ip_address`, `register_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='IP注册记录表';

-- ============================================
-- 登录失败记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `login_failures` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` VARCHAR(32) DEFAULT NULL COMMENT '用户ID',
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'IP地址',
  `fail_count` INT NOT NULL DEFAULT 1 COMMENT '失败次数',
  `locked_until` DATETIME DEFAULT NULL COMMENT '锁定截止时间',
  `last_fail_at` DATETIME DEFAULT NULL COMMENT '最后失败时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_ip_locked` (`ip_address`, `locked_until`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录失败记录表';

-- ============================================
-- 管理员表
-- ============================================
CREATE TABLE IF NOT EXISTS `admins` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `admin_id` VARCHAR(32) NOT NULL UNIQUE COMMENT '管理员ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(200) NOT NULL COMMENT '密码',
  `role` TINYINT NOT NULL DEFAULT 1 COMMENT '角色: 1普通管理员 2超级管理员',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1正常 2禁用',
  `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_id` (`admin_id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- ============================================
-- 敏感词表
-- ============================================
CREATE TABLE IF NOT EXISTS `sensitive_words` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `word` VARCHAR(100) NOT NULL COMMENT '敏感词',
  `level` TINYINT NOT NULL DEFAULT 1 COMMENT '级别: 1警告 2屏蔽 3违规',
  `category` VARCHAR(50) DEFAULT NULL COMMENT '分类',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_word` (`word`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='敏感词表';

-- ============================================
-- 初始化管理员账号
-- ============================================
-- 密码: admin123 (bcrypt 加密后的示例，实际密码请使用 bcrypt.hash() 生成)
-- 示例: const hash = await bcrypt.hash('admin123', 10)
INSERT INTO `admins` (`admin_id`, `username`, `password`, `role`, `status`)
VALUES 
  ('A_000001', 'admin', '$2b$10$rQZ8K.vXQJ8K.vXQJ8K.vXQJ8K.vXQJ8K.vXQJ8K.vXQJ8K.vX', 2, 1),
  ('A_000002', 'operator', '$2b$10$rQZ8K.vXQJ8K.vXQJ8K.vXQJ8K.vXQJ8K.vXQJ8K.vXQJ8K.vX', 1, 1);

-- ============================================
-- 初始化敏感词
-- ============================================
INSERT INTO `sensitive_words` (`word`, `level`, `category`) VALUES
  ('赌博', 2, '违法行为'),
  ('毒品', 3, '违法行为'),
  ('枪支', 3, '违法行为'),
  ('色情', 2, '不良内容'),
  ('暴力', 2, '不良内容'),
  ('恐怖', 3, '违法行为'),
  ('政治', 2, '敏感内容'),
  ('诈骗', 2, '违法行为'),
  ('传销', 3, '违法行为'),
  ('反动', 3, '敏感内容');

-- ============================================
-- 初始化100万个坐标（存储过程）
-- ============================================
DELIMITER //

DROP PROCEDURE IF EXISTS init_coordinates//

CREATE PROCEDURE init_coordinates()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE batch_size INT DEFAULT 1000;
  DECLARE total INT DEFAULT 1000000;
  
  -- 禁用自动提交以提高性能
  SET autocommit = 0;
  
  WHILE i <= total DO
    INSERT INTO `coordinates` (`coord_id`) VALUES (CONCAT('C_', LPAD(i, 7, '0')));
    
    -- 每1000条提交一次
    IF i % batch_size = 0 THEN
      COMMIT;
      -- 显示进度
      SELECT CONCAT('已初始化 ', i, ' / ', total, ' 个坐标') AS progress;
    END IF;
    
    SET i = i + 1;
  END WHILE;
  
  COMMIT;
  SET autocommit = 1;
  SELECT '坐标初始化完成，共100万个坐标' AS result;
END//

DELIMITER ;

-- 执行初始化存储过程（首次部署时执行一次）
-- CALL init_coordinates();

-- ============================================
-- 创建定时任务清理过期留言
-- ============================================
DELIMITER //

DROP EVENT IF EXISTS cleanup_expired_messages//

CREATE EVENT cleanup_expired_messages
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
  DECLARE deleted_count INT DEFAULT 0;
  
  DELETE FROM messages WHERE expire_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    SELECT CONCAT('已清理 ', deleted_count, ' 条过期留言') AS cleanup_result;
  END IF;
END//

DELIMITER ;

-- 启用事件调度器
-- SET GLOBAL event_scheduler = ON;

-- ============================================
-- 视图定义
-- ============================================

-- 用户状态统计视图
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
  COUNT(*) AS total_users,
  SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS normal_users,
  SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS frozen_users,
  SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) AS banned_users,
  SUM(CASE WHEN DATE(register_time) = CURDATE() THEN 1 ELSE 0 END) AS today_registers
FROM users;

-- 留言统计视图
CREATE OR REPLACE VIEW v_message_stats AS
SELECT 
  COUNT(*) AS total_messages,
  SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_messages,
  SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS pending_messages,
  SUM(CASE WHEN is_read = 0 AND status = 1 THEN 1 ELSE 0 END) AS unread_messages
FROM messages;

-- 举报统计视图
CREATE OR REPLACE VIEW v_report_stats AS
SELECT 
  COUNT(*) AS total_reports,
  SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_reports,
  SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS pending_reports,
  SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS handled_reports
FROM reports;

-- 热门坐标视图
CREATE OR REPLACE VIEW v_hot_coordinates AS
SELECT 
  c.coord_id,
  c.heat_score,
  c.occupied_at,
  u.nickname,
  u.user_id
FROM coordinates c
LEFT JOIN users u ON c.user_id = u.user_id
WHERE c.status = 1
ORDER BY c.heat_score DESC
LIMIT 100;

-- ============================================
-- 性能优化索引
-- ============================================
-- 为 frequently queried columns 添加 composite indexes

-- 留言查询优化
CREATE INDEX idx_messages_receiver_created ON messages(receiver_id, created_at DESC);
CREATE INDEX idx_messages_sender_created ON messages(sender_id, created_at DESC);

-- 回复查询优化
CREATE INDEX idx_replies_receiver_created ON replies(receiver_id, created_at DESC);

-- 用户状态与注册时间联合查询
CREATE INDEX idx_users_status_register ON users(status, register_time DESC);

-- ============================================
-- 完成提示
-- ============================================
SELECT '树洞系统数据库初始化完成！' AS message;
