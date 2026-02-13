// =====================================================
// Customer Service
// 客户业务逻辑层 - 支持自动加载价格表
// =====================================================

import { CustomerRepository, Customer, CustomerWithPriceList } from '../repositories/customer.repository';
import { DatabaseConnection } from '../connection';

export interface CustomerSelectOption {
  id: string;
  customer_code: string;
  name: string;
  tier: string;
  displayText: string;
}

export interface CustomerFullInfo extends CustomerWithPriceList {
  price_list_info?: {
    id: string;
    code: string;
    name: string;
  };
}

export class CustomerService {
  private repository: CustomerRepository;

  constructor(db: DatabaseConnection) {
    this.repository = new CustomerRepository({ db });
  }

  // 获取客户选择列表（用于前端下拉框）
  async getCustomerSelectList(): Promise<CustomerSelectOption[]> {
    const customers = await this.repository.findAllForSelect();
    return customers.map(c => ({
      ...c,
      displayText: `${c.name} (${c.customer_code}) - ${c.tier}`,
    }));
  }

  // 搜索客户
  async searchCustomers(keyword: string): Promise<CustomerSelectOption[]> {
    if (!keyword || keyword.length < 2) {
      return [];
    }
    const customers = await this.repository.searchCustomers(keyword);
    return customers.map(c => ({
      id: c.id,
      customer_code: c.customer_code,
      name: c.name,
      tier: c.tier,
      displayText: `${c.name} (${c.customer_code}) - ${c.tier}`,
    }));
  }

  // 获取客户完整信息（自动加载价格表）
  async getCustomerFullInfo(customerId: string): Promise<CustomerFullInfo | null> {
    const customer = await this.repository.findByIdWithPriceList(customerId);
    if (!customer) return null;

    return {
      ...customer,
      price_list_info: {
        id: customer.price_list_id,
        code: customer.price_list_code,
        name: customer.price_list_name,
      },
    };
  }

  // 快速获取客户信息（用于订单创建）
  async getCustomerForOrder(customerId: string): Promise<{
    customer: Customer;
    priceListId: string;
    priceListCode: string;
  } | null> {
    const customer = await this.repository.findByIdWithPriceList(customerId);
    if (!customer) return null;

    return {
      customer,
      priceListId: customer.price_list_id,
      priceListCode: customer.price_list_code,
    };
  }

  // 获取客户等级分布统计
  async getCustomerStats(): Promise<{ tier: string; count: number; percentage: number }[]> {
    const distribution = await this.repository.getTierDistribution();
    const total = distribution.reduce((sum, d) => sum + d.count, 0);
    
    return distribution.map(d => ({
      ...d,
      percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
    }));
  }
}
