"use strict";
// =====================================================
// Order Service
// 订单业务逻辑层 - 集成客户和产品自动加载
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const customer_service_1 = require("./customer.service");
const product_service_1 = require("./product.service");
class OrderService {
    constructor(db) {
        this.db = db;
        this.customerService = new customer_service_1.CustomerService(db);
        this.productService = new product_service_1.ProductService(db);
    }
    // 创建订单草稿 - 自动加载客户信息和产品价格
    async createOrderDraft(customerId, items) {
        // 1. 获取客户信息（自动加载价格表）
        const customerInfo = await this.customerService.getCustomerForOrder(customerId);
        if (!customerInfo) {
            throw new Error('Customer not found');
        }
        const { customer, priceListId, priceListCode } = customerInfo;
        // 2. 获取产品价格并计算
        const orderItems = [];
        let subtotal = 0;
        for (const item of items) {
            const productWithPrice = await this.productService.getProductWithPrice(item.productId, priceListId);
            if (!productWithPrice) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            const lineTotal = this.productService.calculateLineTotal(productWithPrice.unit_price, item.quantity, 0 // 默认无折扣，后续DMN计算
            );
            orderItems.push({
                productId: item.productId,
                productCode: productWithPrice.product_code,
                productName: productWithPrice.name,
                quantity: item.quantity,
                unitPrice: productWithPrice.unit_price,
                originalUnitPrice: productWithPrice.unit_price, // 后续可添加原价对比
                discountPercent: 0,
                lineTotal,
            });
            subtotal += lineTotal;
        }
        // 3. 计算税费和总计
        const taxRate = 0.06; // 6%税率
        const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
        const grandTotal = subtotal + taxAmount;
        return {
            customerId: customer.id,
            customerName: customer.name,
            priceListId,
            priceListCode,
            items: orderItems,
            subtotal: Math.round(subtotal * 100) / 100,
            discountAmount: 0,
            taxAmount,
            grandTotal,
        };
    }
    // 获取订单创建所需的基础数据
    async getOrderCreateData() {
        const [customers, products] = await Promise.all([
            this.customerService.getCustomerSelectList(),
            this.productService.getProductSelectList(),
        ]);
        return {
            customers: customers.map(c => ({
                id: c.id,
                name: c.name,
                code: c.customer_code,
                tier: c.tier,
            })),
            products: products.map(p => ({
                id: p.id,
                name: p.name,
                code: p.product_code,
                category: p.category,
            })),
        };
    }
    // 保存订单到数据库
    async saveOrder(orderData, createdBy) {
        const orderId = `order-${Date.now()}`;
        const orderNumber = `SO-${Date.now()}`;
        // 插入订单主表
        await this.db.execute(`INSERT INTO sales_orders (id, order_number, customer_id, price_list_id, 
        total_amount, tax_amount, grand_total, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            orderId,
            orderNumber,
            orderData.customerId,
            orderData.priceListId,
            orderData.subtotal,
            orderData.taxAmount,
            orderData.grandTotal,
            'DRAFT',
            createdBy,
        ]);
        // 插入订单明细
        for (const item of orderData.items) {
            await this.db.execute(`INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity,
          unit_price, original_unit_price, discount_percent, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                orderId,
                item.productId,
                item.quantity,
                item.unitPrice,
                item.originalUnitPrice,
                item.discountPercent,
                item.lineTotal,
            ]);
        }
        return orderId;
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=order.service.js.map