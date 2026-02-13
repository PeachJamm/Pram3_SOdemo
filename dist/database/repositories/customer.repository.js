"use strict";
// =====================================================
// Customer Repository
// 客户数据访问层
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
const base_repository_1 = require("./base.repository");
class CustomerRepository extends base_repository_1.BaseRepository {
    constructor(options) {
        super(options, 'customers');
    }
    // 获取客户列表（用于下拉选择）
    async findAllForSelect() {
        return this.db.query(`SELECT id, customer_code, name, tier 
       FROM customers 
       WHERE is_active = 1 
       ORDER BY name`);
    }
    // 搜索客户
    async searchCustomers(keyword) {
        return this.db.query(`SELECT * FROM customers 
       WHERE is_active = 1 
       AND (name LIKE ? OR customer_code LIKE ? OR email LIKE ?)
       LIMIT 20`, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]);
    }
    // 根据ID获取客户完整信息（含价格表）
    async findByIdWithPriceList(id) {
        return this.db.queryOne(`SELECT c.*, pl.price_list_code, pl.name as price_list_name
       FROM customers c
       LEFT JOIN price_lists pl ON c.price_list_id = pl.id
       WHERE c.id = ? AND c.is_active = 1`, [id]);
    }
    // 根据客户代码查询
    async findByCode(customerCode) {
        return this.db.queryOne(`SELECT * FROM customers WHERE customer_code = ? AND is_active = 1`, [customerCode]);
    }
    // 获取客户等级分布
    async getTierDistribution() {
        return this.db.query(`SELECT tier, COUNT(*) as count 
       FROM customers 
       WHERE is_active = 1 
       GROUP BY tier`);
    }
}
exports.CustomerRepository = CustomerRepository;
//# sourceMappingURL=customer.repository.js.map