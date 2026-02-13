// =====================================================
// Customer Repository
// 客户数据访问层
// =====================================================

import { BaseRepository, RepositoryOptions } from './base.repository';

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tier: 'STANDARD' | 'GOLD' | 'ENTERPRISE' | 'VIP';
  customer_type: string;
  price_list_id: string;
  credit_limit: number;
  order_history_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerWithPriceList extends Customer {
  price_list_code: string;
  price_list_name: string;
}

export class CustomerRepository extends BaseRepository<Customer> {
  constructor(options: RepositoryOptions) {
    super(options, 'customers');
  }

  // 获取客户列表（用于下拉选择）
  async findAllForSelect(): Promise<Pick<Customer, 'id' | 'customer_code' | 'name' | 'tier'>[]> {
    return this.db.query(
      `SELECT id, customer_code, name, tier 
       FROM customers 
       WHERE is_active = 1 
       ORDER BY name`
    );
  }

  // 搜索客户
  async searchCustomers(keyword: string): Promise<Customer[]> {
    return this.db.query(
      `SELECT * FROM customers 
       WHERE is_active = 1 
       AND (name LIKE ? OR customer_code LIKE ? OR email LIKE ?)
       LIMIT 20`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );
  }

  // 根据ID获取客户完整信息（含价格表）
  async findByIdWithPriceList(id: string): Promise<CustomerWithPriceList | null> {
    return this.db.queryOne(
      `SELECT c.*, pl.price_list_code, pl.name as price_list_name
       FROM customers c
       LEFT JOIN price_lists pl ON c.price_list_id = pl.id
       WHERE c.id = ? AND c.is_active = 1`,
      [id]
    );
  }

  // 根据客户代码查询
  async findByCode(customerCode: string): Promise<Customer | null> {
    return this.db.queryOne(
      `SELECT * FROM customers WHERE customer_code = ? AND is_active = 1`,
      [customerCode]
    );
  }

  // 获取客户等级分布
  async getTierDistribution(): Promise<{ tier: string; count: number }[]> {
    return this.db.query(
      `SELECT tier, COUNT(*) as count 
       FROM customers 
       WHERE is_active = 1 
       GROUP BY tier`
    );
  }
}
