"use strict";
// =====================================================
// PRAM3 ERP Core - Sales Order API Controller
// SO 创建与流程启动 API
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.soController = exports.SOController = void 0;
const express_1 = require("express");
const connection_1 = require("../../database/connection");
const order_service_1 = require("../../database/services/order.service");
const camunda8_client_1 = require("../../orchestration/camunda8-client");
/**
 * SO 控制器
 */
class SOController {
    constructor() {
        this.router = (0, express_1.Router)();
        this.db = new connection_1.DatabaseConnection({
            type: 'sqlite',
            sqlite: { filename: './pram3.db' },
        });
        this.orderService = new order_service_1.OrderService(this.db);
        this.camundaClient = new camunda8_client_1.Camunda8Client({
            gatewayAddress: 'localhost:26500',
            plaintext: true,
        });
        this.setupRoutes();
    }
    /**
     * 计算预期审批级别
     */
    calculateApprovalLevel(totalAmount, customerTier) {
        if (totalAmount > 50000 || customerTier === 'VIP') {
            return '总监审批 (DIRECTOR)';
        }
        else if (totalAmount >= 10000) {
            return '财务审批 (FINANCE)';
        }
        else {
            return '销售经理审批 (SALES_MANAGER)';
        }
    }
    /**
     * 计算折扣率
     */
    calculateDiscountRate(customerTier) {
        const rates = {
            'VIP': 15,
            'ENTERPRISE': 10,
            'GOLD': 5,
            'STANDARD': 0,
        };
        return rates[customerTier] || 0;
    }
    /**
     * 格式化产品明细为表单展示文本
     */
    formatProductLinesForForm(items) {
        if (items.length === 0)
            return '无产品明细';
        let table = '| 序号 | 产品 | 数量 | 单价 | 折扣 | 小计 |\n';
        table += '|------|------|------|------|------|------|\n';
        items.forEach((item, index) => {
            const discount = item.discountPercent > 0 ? `${item.discountPercent}%` : '-';
            table += `| ${index + 1} | ${item.productName} | ${item.quantity} | ¥${item.unitPrice.toFixed(2)} | ${discount} | ¥${item.lineTotal.toFixed(2)} |\n`;
        });
        return table;
    }
    /**
     * 设置路由
     */
    setupRoutes() {
        // 获取创建订单所需数据（客户、产品列表）
        this.router.get('/orders/create-data', this.getCreateData.bind(this));
        // 创建订单并启动流程
        this.router.post('/orders/create-and-start', this.createAndStartProcess.bind(this));
        // 获取订单详情（包含 product lines）
        this.router.get('/orders/:id/details', this.getOrderDetails.bind(this));
    }
    /**
     * 获取创建订单所需数据
     */
    async getCreateData(req, res) {
        try {
            await this.db.connect();
            const data = await this.orderService.getOrderCreateData();
            res.json({
                success: true,
                data: {
                    customers: data.customers.map(c => ({
                        id: c.id,
                        name: c.name,
                        code: c.code,
                        tier: c.tier,
                    })),
                    products: data.products.map(p => ({
                        id: p.id,
                        name: p.name,
                        code: p.code,
                        category: p.category,
                        unitPrice: 100, // 默认价格，实际应从价格表获取
                    })),
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取数据失败',
            });
        }
    }
    /**
     * 创建订单并启动流程
     */
    async createAndStartProcess(req, res) {
        let orderId = null;
        try {
            await this.db.connect();
            const requestData = req.body;
            // 1. 创建订单草稿
            const orderItems = requestData.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
            }));
            const draft = await this.orderService.createOrderDraft(requestData.customerId, orderItems);
            if (!draft) {
                res.status(400).json({
                    success: false,
                    error: '创建订单草稿失败',
                });
                return;
            }
            // 2. 开始数据库事务
            await this.db.beginTransaction();
            console.log('[Transaction] BEGIN - 开始创建订单');
            try {
                // 2.1 生成订单ID和订单号
                orderId = `order-${Date.now()}`;
                const orderNumber = `SO-${Date.now()}`;
                // 2.2 插入订单主表（不含 processInstanceKey，状态为 PENDING）
                await this.db.execute(`INSERT INTO sales_orders (id, order_number, customer_id, price_list_id, 
            total_amount, tax_amount, grand_total, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    orderId,
                    orderNumber,
                    requestData.customerId,
                    'plist-standard', // 默认使用标准价格表
                    draft.subtotal,
                    draft.taxAmount,
                    draft.grandTotal,
                    'PENDING', // 初始状态，等待流程启动
                    'sales01',
                ]);
                // 2.3 插入订单明细
                for (const item of draft.items) {
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
                console.log('[Transaction] 订单数据已插入，准备启动 Camunda 流程');
                // 3. 准备流程变量
                const expectedApprovalLevel = this.calculateApprovalLevel(draft.grandTotal, requestData.customerTier);
                const processVariables = {
                    orderId: orderId,
                    orderNumber: orderNumber,
                    customerId: requestData.customerId,
                    customerName: requestData.customerName,
                    customerTier: requestData.customerTier,
                    totalAmount: draft.grandTotal,
                    subtotal: draft.subtotal,
                    taxAmount: draft.taxAmount,
                    productLinesTable: this.formatProductLinesForForm(draft.items),
                    productLines: JSON.stringify(draft.items),
                    lineCount: draft.items.length,
                    currency: 'CNY',
                    expectedApprovalLevel: expectedApprovalLevel,
                    discountRate: this.calculateDiscountRate(requestData.customerTier),
                    createdBy: 'sales01',
                    createdAt: new Date().toISOString(),
                    orderHistoryCount: 0,
                };
                // 4. 启动 Camunda 流程（关键步骤，必须在事务中）
                const processInstance = await this.camundaClient.startProcess('sales-order-process', processVariables);
                console.log('[Transaction] Camunda 流程已启动:', processInstance.processInstanceKey);
                // 5. 更新订单的 processInstanceKey 和状态
                await this.db.execute(`UPDATE sales_orders SET process_instance_key = ?, status = ? WHERE id = ?`, [processInstance.processInstanceKey, 'PROCESSING', orderId]);
                // 6. 提交事务
                await this.db.commit();
                console.log('[Transaction] COMMIT - 订单创建成功');
                res.json({
                    success: true,
                    data: {
                        orderId: orderId,
                        orderNumber: orderNumber,
                        processInstanceKey: processInstance.processInstanceKey,
                        totalAmount: draft.grandTotal,
                    },
                });
            }
            catch (innerError) {
                // 事务中发生错误，回滚
                console.error('[Transaction] 事务失败，执行 ROLLBACK:', innerError);
                await this.db.rollback();
                throw innerError;
            }
        }
        catch (error) {
            console.error('创建订单失败:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '创建订单失败',
                orderId: orderId, // 返回 orderId 方便排查
            });
        }
    }
    /**
     * 获取订单详情
     */
    async getOrderDetails(req, res) {
        try {
            await this.db.connect();
            const { id } = req.params;
            // 查询订单主表
            const orders = await this.db.query(`SELECT o.*, c.name as customer_name, c.tier as customer_tier
         FROM sales_orders o
         JOIN customers c ON o.customer_id = c.id
         WHERE o.id = ?`, [id]);
            if (orders.length === 0) {
                res.status(404).json({
                    success: false,
                    error: '订单不存在',
                });
                return;
            }
            // 查询订单明细
            const items = await this.db.query(`SELECT oi.*, p.name as product_name, p.product_code
         FROM sales_order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.sales_order_id = ?`, [id]);
            res.json({
                success: true,
                data: {
                    order: orders[0],
                    items: items,
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取订单详情失败',
            });
        }
    }
}
exports.SOController = SOController;
// 导出控制器实例
exports.soController = new SOController();
//# sourceMappingURL=so-controller.js.map