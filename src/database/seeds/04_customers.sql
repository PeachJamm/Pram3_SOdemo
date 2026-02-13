-- =====================================================
-- Seed Data: Customers (2 Customers with different tiers)
-- =====================================================

INSERT INTO customers (id, customer_code, name, email, phone, address, tier, customer_type, price_list_id, credit_limit, order_history_count, is_active) VALUES
-- 客户1: 标准客户（使用标准价格表）
('cust-001', 'C-001', '北京科技有限公司', 'contact@bjtech.com', '010-12345678', 
 '北京市朝阳区建国路88号SOHO现代城', 
 'STANDARD', 'STANDARD', 'pl-001', 50000.00, 2, TRUE),

-- 客户2: VIP客户（使用VIP价格表，享受更高折扣）
('cust-002', 'C-002', '上海创新集团', 'procurement@sh-innovation.com', '021-87654321', 
 '上海市浦东新区陆家嘴环路1000号恒生银行大厦', 
 'VIP', 'VIP', 'pl-003', 500000.00, 25, TRUE);

-- 可选：更多测试客户
INSERT INTO customers (id, customer_code, name, email, phone, address, tier, customer_type, price_list_id, credit_limit, order_history_count, is_active) VALUES
-- 客户3: 金牌客户（使用金牌价格表）
('cust-003', 'C-003', '杭州电子商务公司', 'buy@hzecommerce.com', '0571-11223344', 
 '杭州市西湖区文三路90号', 
 'GOLD', 'GOLD', 'pl-002', 150000.00, 8, TRUE),

-- 客户4: 企业客户
('cust-004', 'C-004', '深圳智能制造有限公司', 'supply@sz-mfg.com', '0755-55667788', 
 '深圳市南山区科技园南区', 
 'ENTERPRISE', 'ENTERPRISE', 'pl-002', 300000.00, 12, TRUE);
