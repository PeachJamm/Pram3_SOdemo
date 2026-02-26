"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 测试变量获取
const connection_1 = require("../database/connection");
async function test() {
    const db = new connection_1.DatabaseConnection({
        type: 'sqlite',
        sqlite: { filename: './pram3.db' },
    });
    await db.connect();
    const processInstanceKey = '2251799813740297';
    // 1. 查询订单
    const order = await db.queryOne(`SELECT o.*, c.name as customer_name, c.tier as customer_tier
     FROM sales_orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE o.process_instance_key = ?`, [processInstanceKey]);
    console.log('Order:', order);
    if (order) {
        // 2. 查询明细
        const items = await db.query(`SELECT soi.*, p.name as product_name, p.product_code as product_code
       FROM sales_order_items soi
       JOIN products p ON soi.product_id = p.id
       WHERE soi.order_id = ?`, [order.id]);
        console.log('Items:', items);
        // 3. 构建变量
        const productLines = items.map((item, index) => ({
            productId: item.product_id,
            productCode: item.product_code,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            originalUnitPrice: item.unit_price,
            discountPercent: item.discount_percent || 0,
            lineTotal: item.line_total,
        }));
        const variables = {
            orderId: order.id,
            orderNumber: order.order_number,
            customerName: order.customer_name,
            customerTier: order.customer_tier,
            totalAmount: order.grand_total,
            subtotal: order.total_amount,
            taxAmount: order.tax_amount,
            lineCount: items.length,
            productLines: JSON.stringify(productLines),
        };
        console.log('Variables:', variables);
    }
    await db.close();
}
test().catch(console.error);
//# sourceMappingURL=test-variables.js.map