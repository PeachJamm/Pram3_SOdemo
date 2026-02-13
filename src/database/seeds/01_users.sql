-- =====================================================
-- Seed Data: Users
-- 2 Users: 1 Normal, 1 with Override permission
-- =====================================================

INSERT INTO users (id, username, email, password_hash, full_name, role, permissions, is_active) VALUES
-- 普通用户（销售人员）
('user-001', 'sales01', 'sales01@pram3.com', '$2a$10$YourHashedPassword', '张三', 'SALES', 
 '[]', TRUE),

-- 管理员用户（有Override权限）
('user-002', 'admin01', 'admin01@pram3.com', '$2a$10$YourHashedPassword', '管理员', 'ADMIN', 
 '["ORDER_OVERRIDE", "PROCESS_CANCEL", "PRICE_MODIFY", "APPROVAL_BYPASS"]', TRUE);

-- 可选：更多测试用户
INSERT INTO users (id, username, email, password_hash, full_name, role, permissions, is_active) VALUES
-- 销售经理
('user-003', 'salesmgr01', 'salesmgr01@pram3.com', '$2a$10$YourHashedPassword', '李四', 'SALES_MANAGER', 
 '["APPROVE_LEVEL_1"]', TRUE),

-- 财务人员
('user-004', 'finance01', 'finance01@pram3.com', '$2a$10$YourHashedPassword', '王五', 'FINANCE', 
 '["APPROVE_LEVEL_2", "PRICE_VIEW"]', TRUE),

-- 总监
('user-005', 'director01', 'director01@pram3.com', '$2a$10$YourHashedPassword', '赵六', 'DIRECTOR', 
 '["APPROVE_LEVEL_3", "STRATEGIC_ACCOUNT"]', TRUE);
