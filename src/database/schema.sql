-- =====================================================
-- PRAM3 ERP Core - Database Schema (SQLite Compatible)
-- =====================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    permissions TEXT, -- JSON string
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 产品表
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit_of_measure VARCHAR(20) DEFAULT 'EA',
    cost_price DECIMAL(15, 2),
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 价格表
CREATE TABLE IF NOT EXISTS price_lists (
    id VARCHAR(36) PRIMARY KEY,
    price_list_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'CNY',
    is_active INTEGER DEFAULT 1,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 价格表明细
CREATE TABLE IF NOT EXISTS price_list_items (
    id VARCHAR(36) PRIMARY KEY,
    price_list_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    minimum_quantity INTEGER DEFAULT 1,
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(price_list_id, product_id)
);

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    tier VARCHAR(20) DEFAULT 'STANDARD',
    customer_type VARCHAR(20) DEFAULT 'STANDARD',
    price_list_id VARCHAR(36),
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    order_history_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id)
);

-- 销售订单表
CREATE TABLE IF NOT EXISTS sales_orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(36) NOT NULL,
    price_list_id VARCHAR(36),
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    grand_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_by VARCHAR(36) NOT NULL,
    process_instance_key VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 销售订单明细表
CREATE TABLE IF NOT EXISTS sales_order_items (
    id VARCHAR(36) PRIMARY KEY,
    sales_order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    original_unit_price DECIMAL(15, 2),
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    line_total DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 审批历史表
CREATE TABLE IF NOT EXISTS approval_history (
    id VARCHAR(36) PRIMARY KEY,
    sales_order_id VARCHAR(36) NOT NULL,
    task_id VARCHAR(100),
    approver_id VARCHAR(36) NOT NULL,
    approval_level VARCHAR(50),
    action VARCHAR(20) NOT NULL,
    comment TEXT,
    variables TEXT, -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product ON price_list_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
