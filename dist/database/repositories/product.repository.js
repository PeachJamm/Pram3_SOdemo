"use strict";
// =====================================================
// Product Repository
// 产品数据访问层
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = void 0;
const base_repository_1 = require("./base.repository");
class ProductRepository extends base_repository_1.BaseRepository {
    constructor(options) {
        super(options, 'products');
    }
    // 获取产品列表（用于下拉选择）
    async findAllForSelect() {
        return this.db.query(`SELECT id, product_code, name, category 
       FROM products 
       WHERE is_active = 1 
       ORDER BY category, name`);
    }
    // 搜索产品
    async searchProducts(keyword) {
        return this.db.query(`SELECT * FROM products 
       WHERE is_active = 1 
       AND (name LIKE ? OR product_code LIKE ? OR category LIKE ?)
       LIMIT 20`, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]);
    }
    // 根据价格表获取产品列表（含价格）
    async findByPriceList(priceListId) {
        return this.db.query(`SELECT p.*, pli.unit_price, pli.price_list_id, pl.price_list_code
       FROM products p
       JOIN price_list_items pli ON p.id = pli.product_id
       JOIN price_lists pl ON pli.price_list_id = pl.id
       WHERE pli.price_list_id = ? AND p.is_active = 1
       ORDER BY p.category, p.name`, [priceListId]);
    }
    // 获取产品在指定价格表中的价格
    async getProductPrice(productId, priceListId) {
        const result = await this.db.queryOne(`SELECT unit_price FROM price_list_items 
       WHERE product_id = ? AND price_list_id = ?`, [productId, priceListId]);
        return result?.unit_price || null;
    }
    // 获取产品类别列表
    async getCategories() {
        const results = await this.db.query(`SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category`);
        return results.map(r => r.category);
    }
    // 根据产品代码查询
    async findByCode(productCode) {
        return this.db.queryOne(`SELECT * FROM products WHERE product_code = ? AND is_active = 1`, [productCode]);
    }
}
exports.ProductRepository = ProductRepository;
//# sourceMappingURL=product.repository.js.map