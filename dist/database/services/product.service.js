"use strict";
// =====================================================
// Product Service
// 产品业务逻辑层 - 支持按价格表加载
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const product_repository_1 = require("../repositories/product.repository");
class ProductService {
    constructor(db) {
        this.repository = new product_repository_1.ProductRepository({ db });
    }
    // 获取产品选择列表（基础信息）
    async getProductSelectList() {
        const products = await this.repository.findAllForSelect();
        return products.map(p => ({
            ...p,
            displayText: `${p.name} (${p.product_code}) - ${p.category}`,
        }));
    }
    // 搜索产品
    async searchProducts(keyword) {
        if (!keyword || keyword.length < 2) {
            return [];
        }
        const products = await this.repository.searchProducts(keyword);
        return products.map(p => ({
            id: p.id,
            product_code: p.product_code,
            name: p.name,
            category: p.category,
            displayText: `${p.name} (${p.product_code}) - ${p.category}`,
        }));
    }
    // 获取指定价格表的产品列表（含价格）- 关键功能
    async getProductsByPriceList(priceListId) {
        const products = await this.repository.findByPriceList(priceListId);
        return products.map(p => ({
            id: p.id,
            product_code: p.product_code,
            name: p.name,
            category: p.category,
            unit_price: p.unit_price,
            displayText: `${p.name} (${p.product_code}) - ¥${p.unit_price}`,
        }));
    }
    // 获取产品详细信息（含指定价格表价格）
    async getProductWithPrice(productId, priceListId) {
        const product = await this.repository.findById(productId);
        if (!product)
            return null;
        const unitPrice = await this.repository.getProductPrice(productId, priceListId);
        return {
            ...product,
            unit_price: unitPrice || 0,
            price_list_id: priceListId,
            price_list_code: '', // 需要额外查询
        };
    }
    // 计算订单行金额
    calculateLineTotal(unitPrice, quantity, discountPercent = 0) {
        const subtotal = unitPrice * quantity;
        const discount = subtotal * (discountPercent / 100);
        return Math.round((subtotal - discount) * 100) / 100;
    }
    // 获取产品类别
    async getCategories() {
        return this.repository.getCategories();
    }
    // 按类别获取产品
    async getProductsByCategory(category) {
        return this.repository.findByField('category', category);
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map