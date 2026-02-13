// =====================================================
// Seed Data Only Script
// 仅插入 seed 数据（表已创建）
// =====================================================

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseConnection } from './connection';

async function seedDatabase(): Promise<void> {
  const db = new DatabaseConnection({
    type: 'sqlite',
    sqlite: { filename: './pram3.db' },
  });

  try {
    console.log('[DB Seed] Connecting to database...');
    await db.connect();

    // 插入Seed数据
    console.log('[DB Seed] Inserting seed data...');
    
    // 1. 插入用户
    console.log('[DB Seed] Inserting users...');
    await db.execute(`
      INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, role, permissions, is_active) VALUES
      ('user-001', 'sales01', 'sales01@pram3.com', '$2a$10$demo', '张三', 'SALES', '[]', 1),
      ('user-002', 'admin01', 'admin01@pram3.com', '$2a$10$demo', '管理员', 'ADMIN', '["ORDER_OVERRIDE", "PROCESS_CANCEL", "PRICE_MODIFY", "APPROVAL_BYPASS"]', 1),
      ('user-003', 'salesmgr01', 'salesmgr01@pram3.com', '$2a$10$demo', '李四', 'SALES_MANAGER', '["APPROVE_LEVEL_1"]', 1),
      ('user-004', 'finance01', 'finance01@pram3.com', '$2a$10$demo', '王五', 'FINANCE', '["APPROVE_LEVEL_2", "PRICE_VIEW"]', 1),
      ('user-005', 'director01', 'director01@pram3.com', '$2a$10$demo', '赵六', 'DIRECTOR', '["APPROVE_LEVEL_3", "STRATEGIC_ACCOUNT"]', 1)
    `);

    // 2. 插入产品
    console.log('[DB Seed] Inserting products...');
    await db.execute(`
      INSERT OR IGNORE INTO products (id, product_code, name, description, category, unit_of_measure, cost_price, is_active) VALUES
      ('prod-001', 'P-001', '人体工学办公椅', '高品质人体工学设计办公椅，可调节高度和靠背', '办公家具', 'EA', 500.00, 1),
      ('prod-002', 'P-002', '电动升降办公桌', '智能电动升降办公桌，支持坐站交替办公', '办公家具', 'EA', 2500.00, 1),
      ('prod-003', 'P-003', '企业级服务器', '高性能企业级服务器，适用于大数据处理', 'IT设备', 'EA', 8000.00, 1),
      ('prod-004', 'P-004', 'ERP系统许可证', '企业资源计划系统年度许可证', '软件服务', 'EA', 5000.00, 1),
      ('prod-005', 'P-005', '企业定制解决方案', '根据客户需求定制的企业数字化解决方案', '服务', 'EA', 50000.00, 1)
    `);

    // 3. 插入价格表
    console.log('[DB Seed] Inserting price lists...');
    await db.execute(`
      INSERT OR IGNORE INTO price_lists (id, price_list_code, name, description, currency, is_active, effective_from, effective_to) VALUES
      ('pl-001', 'STANDARD', '标准价格表', '标准客户默认价格', 'CNY', 1, '2024-01-01', '2024-12-31'),
      ('pl-002', 'GOLD', '金牌客户价格表', '金牌客户专享优惠价格', 'CNY', 1, '2024-01-01', '2024-12-31'),
      ('pl-003', 'VIP', 'VIP客户价格表', 'VIP客户专享价格，含最高优惠', 'CNY', 1, '2024-01-01', '2024-12-31')
    `);

    // 4. 插入价格表明细
    console.log('[DB Seed] Inserting price list items...');
    await db.execute(`
      INSERT OR IGNORE INTO price_list_items (id, price_list_id, product_id, unit_price, minimum_quantity) VALUES
      -- 标准价格表
      ('pli-001', 'pl-001', 'prod-001', 800.00, 1),
      ('pli-002', 'pl-001', 'prod-002', 3500.00, 1),
      ('pli-003', 'pl-001', 'prod-003', 12000.00, 1),
      ('pli-004', 'pl-001', 'prod-004', 6000.00, 1),
      ('pli-005', 'pl-001', 'prod-005', 60000.00, 1),
      -- 金牌价格表（约5%折扣）
      ('pli-006', 'pl-002', 'prod-001', 760.00, 1),
      ('pli-007', 'pl-002', 'prod-002', 3325.00, 1),
      ('pli-008', 'pl-002', 'prod-003', 11400.00, 1),
      ('pli-009', 'pl-002', 'prod-004', 5700.00, 1),
      ('pli-010', 'pl-002', 'prod-005', 57000.00, 1),
      -- VIP价格表（约10%折扣）
      ('pli-011', 'pl-003', 'prod-001', 720.00, 1),
      ('pli-012', 'pl-003', 'prod-002', 3150.00, 1),
      ('pli-013', 'pl-003', 'prod-003', 10800.00, 1),
      ('pli-014', 'pl-003', 'prod-004', 5400.00, 1),
      ('pli-015', 'pl-003', 'prod-005', 54000.00, 1)
    `);

    // 5. 插入客户
    console.log('[DB Seed] Inserting customers...');
    await db.execute(`
      INSERT OR IGNORE INTO customers (id, customer_code, name, email, phone, address, tier, customer_type, price_list_id, credit_limit, order_history_count, is_active) VALUES
      ('cust-001', 'C-001', '北京科技有限公司', 'contact@bjtech.com', '010-12345678', '北京市朝阳区建国路88号', 'STANDARD', 'STANDARD', 'pl-001', 50000.00, 2, 1),
      ('cust-002', 'C-002', '上海创新集团', 'procurement@sh-innovation.com', '021-87654321', '上海市浦东新区陆家嘴环路1000号', 'VIP', 'VIP', 'pl-003', 500000.00, 25, 1),
      ('cust-003', 'C-003', '杭州电子商务公司', 'buy@hzecommerce.com', '0571-11223344', '杭州市西湖区文三路90号', 'GOLD', 'GOLD', 'pl-002', 150000.00, 8, 1),
      ('cust-004', 'C-004', '深圳智能制造有限公司', 'supply@sz-mfg.com', '0755-55667788', '深圳市南山区科技园南区', 'ENTERPRISE', 'ENTERPRISE', 'pl-002', 300000.00, 12, 1)
    `);

    console.log('[DB Seed] Seed data inserted successfully!');
    
    // 验证数据
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    const productCount = await db.query('SELECT COUNT(*) as count FROM products');
    const customerCount = await db.query('SELECT COUNT(*) as count FROM customers');
    
    console.log('[DB Seed] Verification:');
    console.log(`  - Users: ${userCount[0].count}`);
    console.log(`  - Products: ${productCount[0].count}`);
    console.log(`  - Customers: ${customerCount[0].count}`);
    
  } catch (error) {
    console.error('[DB Seed] Failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

seedDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
