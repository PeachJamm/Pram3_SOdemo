-- =====================================================
-- Seed Data: Users
-- 基于权限体系设计：VIEW / EDIT / APPROVE
-- =====================================================

-- 1. VIEW权限用户（只能查看，如客服）
INSERT INTO users (id, username, email, password_hash, full_name, role, permissions, is_active) VALUES
('user-006', 'cs01', 'cs01@pram3.com', '$2a$10$YourHashedPassword', '客服小张', 'CUSTOMER_SERVICE', 
 '["SO_VIEW"]', TRUE);

-- 2. EDIT权限用户（Sales Rep，创建和编辑SO）
INSERT INTO users (id, username, email, password_hash, full_name, role, permissions, is_active) VALUES
('user-001', 'sales01', 'sales01@pram3.com', '$2a$10$YourHashedPassword', '张三', 'SALES_REP', 
 '["SO_CREATE", "SO_EDIT", "SO_SUBMIT"]', TRUE),

('user-007', 'sales02', 'sales02@pram3.com', '$2a$10$YourHashedPassword', '销售小李', 'SALES_REP', 
 '["SO_CREATE", "SO_EDIT", "SO_SUBMIT"]', TRUE);

-- 3. APPROVE权限用户（由DMN动态分配，但数据库中预定义他们的审批权限）
-- 3.1 销售经理 - 小额审批
INSERT INTO users (id, username, email, password_hash, full_name, role, permissions, is_active) VALUES
('user-003', 'salesmgr01', 'salesmgr01@pram3.com', '$2a$10$YourHashedPassword', '李四', 'SALES_MANAGER', 
 '["SO_VIEW", "SO_APPROVE_LEVEL_1", "SO_ROLLBACK"]', TRUE);

-- 3.2 财务 - 中额审批
INSERT INTO users (id, username, email, password_hash, full_name, role, permissions, is_active) VALUES
('user-004', 'finance01', 'finance01@pram3.com', '$2a$10$YourHashedPassword', '王五', 'FINANCE', 
 '["SO_VIEW", "SO_APPROVE_LEVEL_2", "SO_ROLLBACK", "PRICE_VIEW"]', TRUE);

-- 3.3 总监 - 大额审批
INSERT INTO users (id, username, email, password_hash, full_name, role, permissions, is_active) VALUES
('user-005', 'director01', 'director01@pram3.com', '$2a$10$YourHashedPassword', '赵六', 'DIRECTOR', 
 '["SO_VIEW", "SO_APPROVE_LEVEL_3", "SO_ROLLBACK", "SO_OVERRIDE", "STRATEGIC_ACCOUNT"]', TRUE);

-- 4. ADMIN权限（全能）
INSERT INTO users (id, username, email, password_hash, full_name, role, permissions, is_active) VALUES
('user-002', 'admin01', 'admin01@pram3.com', '$2a$10$YourHashedPassword', '管理员', 'ADMIN', 
 '["SO_VIEW", "SO_CREATE", "SO_EDIT", "SO_APPROVE_ALL", "SO_OVERRIDE", "SO_CANCEL", "SO_DELETE", "PROCESS_CANCEL"]', TRUE);
