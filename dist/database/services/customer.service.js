"use strict";
// =====================================================
// Customer Service
// 客户业务逻辑层 - 支持自动加载价格表
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const customer_repository_1 = require("../repositories/customer.repository");
class CustomerService {
    constructor(db) {
        this.repository = new customer_repository_1.CustomerRepository({ db });
    }
    // 获取客户选择列表（用于前端下拉框）
    async getCustomerSelectList() {
        const customers = await this.repository.findAllForSelect();
        return customers.map(c => ({
            ...c,
            displayText: `${c.name} (${c.customer_code}) - ${c.tier}`,
        }));
    }
    // 搜索客户
    async searchCustomers(keyword) {
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
    async getCustomerFullInfo(customerId) {
        const customer = await this.repository.findByIdWithPriceList(customerId);
        if (!customer)
            return null;
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
    async getCustomerForOrder(customerId) {
        const customer = await this.repository.findByIdWithPriceList(customerId);
        if (!customer)
            return null;
        return {
            customer,
            priceListId: customer.price_list_id,
            priceListCode: customer.price_list_code,
        };
    }
    // 获取客户等级分布统计
    async getCustomerStats() {
        const distribution = await this.repository.getTierDistribution();
        const total = distribution.reduce((sum, d) => sum + d.count, 0);
        return distribution.map(d => ({
            ...d,
            percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
        }));
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customer.service.js.map