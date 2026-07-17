-- =====================================================
-- 云智购 通知表迁移脚本
-- 迁移时间：2026-07-12
-- =====================================================

-- 1. 创建 notifications 表
CREATE TABLE IF NOT EXISTS 
otifications (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '通知ID',
    user_id INT NOT NULL COMMENT '接收用户ID',
    	itle VARCHAR(255) NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    	ype VARCHAR(20) DEFAULT 'system' COMMENT '类型: order/system/security/promotion',
    is_read TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '软删除标志',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME DEFAULT NULL COMMENT '删除时间',

    -- 索引
    INDEX ix_notif_user_created (user_id, created_at),
    INDEX ix_notif_user_unread (user_id, is_read),
    INDEX ix_notif_type (	ype),
    INDEX ix_notif_is_read (is_read),

    -- 外键
    CONSTRAINT k_notif_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内通知表';

-- 2. 插入种子数据（管理员通知）
INSERT INTO 
otifications (user_id, 	itle, content, 	ype, is_read) VALUES
(1, '欢迎使用云智购', '恭喜您成为云智购管理员，祝工作顺利！', 'system', 0),
(1, '系统升级通知', '云智购平台将于本周日凌晨2:00-4:00进行系统升级', 'system', 0),
(1, '新订单提醒', '您有一笔新订单待处理，订单号：YZZG20260712001', 'order', 1),
(1, '安全提醒', '检测到您的账号在异地登录，如非本人操作请及时修改密码', 'security', 0);

-- =====================================================
-- 面试话术：
-- 为什么用软删除？
-- - 数据需要保留用于审计和追溯，硬删除会丢失历史记录
-- - 符合电商业务规范，订单、通知等重要数据不能真正删除
--
-- 为什么用 CASCADE 删除？
-- - 用户注销时，其所有通知应该一并清理，不需要单独处理
-- - 由数据库自动维护数据一致性，减少应用层逻辑
--
-- 为什么 notification 要单独一张表而不是放在 user 表？
-- - 一对多关系，一个用户可以有多条通知
-- - 通知需要独立的状态管理（已读/未读）
-- - 方便后续扩展（推送、站内信、邮件通知等）
-- =====================================================
