"use strict";
// =====================================================
// PRAM3 ERP Core - Sales Order API Controller
// 销售订单API控制器
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesOrderController = exports.SalesOrderController = void 0;
const express_1 = require("express");
const order_orchestration_service_1 = require("../../orchestration/order-orchestration.service");
const sales_order_service_1 = require("../../domains/sales/services/sales-order.service");
const connection_1 = require("../../database/connection");
const order_service_1 = require("../../database/services/order.service");
/**
 * 销售订单API控制器
 */
class SalesOrderController {
    constructor() {
        this.router = (0, express_1.Router)();
        this.db = new connection_1.DatabaseConnection({
            type: 'sqlite',
            sqlite: { filename: './pram3.db' },
        });
        this.orderService = new order_service_1.OrderService(this.db);
        this.setupRoutes();
    }
    /**
     * 设置路由
     */
    setupRoutes() {
        // 创建订单
        this.router.post('/orders', this.createOrder.bind(this));
        // 查询订单列表
        this.router.get('/orders', this.queryOrders.bind(this));
        // 获取订单详情
        this.router.get('/orders/:id', this.getOrderById.bind(this));
        // 提交审批
        this.router.post('/orders/:id/submit', this.submitForApproval.bind(this));
        // 处理审批
        this.router.post('/orders/:id/approve', this.processApproval.bind(this));
        // 取消订单
        this.router.post('/orders/:id/cancel', this.cancelOrder.bind(this));
        // 获取审批历史
        this.router.get('/orders/:id/history', this.getApprovalHistory.bind(this));
    }
    /**
     * 创建订单
     * POST /api/v1/orders
     */
    async createOrder(req, res, next) {
        try {
            const request = req.body;
            const createdBy = req.headers['x-user-id'] || 'system';
            const result = await order_orchestration_service_1.orderOrchestrationService.createOrderWithWorkflow(request, createdBy);
            if (result.success) {
                res.status(201).json({
                    success: true,
                    data: result.data,
                    metadata: result.metadata,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error,
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * 查询订单列表
     * GET /api/v1/orders
     */
    async queryOrders(req, res, next) {
        try {
            await this.db.connect();
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
            const offset = (page - 1) * pageSize;
            // 从数据库直接查询订单
            let sql = `
        SELECT o.*, c.name as customer_name, c.tier as customer_tier, c.customer_code
        FROM sales_orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE 1=1
      `;
            const params = [];
            if (req.query.status) {
                sql += ` AND o.status = ?`;
                params.push(req.query.status);
            }
            if (req.query.customerId) {
                sql += ` AND o.customer_id = ?`;
                params.push(req.query.customerId);
            }
            // 获取总数
            const countResult = await this.db.query(sql.replace('SELECT o.*, c.name as customer_name, c.tier as customer_tier, c.customer_code', 'SELECT COUNT(*) as count'), params);
            const total = countResult[0]?.count || 0;
            // 分页查询
            sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
            params.push(pageSize, offset);
            const orders = await this.db.query(sql, params);
            res.json({
                success: true,
                data: {
                    orders: orders.map((o) => ({
                        id: o.id,
                        orderNumber: o.order_number,
                        customerId: o.customer_id,
                        customerName: o.customer_name,
                        customerTier: o.customer_tier,
                        totalAmount: o.grand_total,
                        grandTotal: o.grand_total,
                        status: o.status,
                        createdAt: o.created_at,
                        createdBy: o.created_by,
                    })),
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * 获取订单详情
     * GET /api/v1/orders/:id
     */
    async getOrderById(req, res, next) {
        try {
            await this.db.connect();
            const { id } = req.params;
            const order = await this.orderService.getOrderById(id);
            if (order) {
                res.json({
                    success: true,
                    data: order,
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: '订单不存在',
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * 提交订单审批
     * POST /api/v1/orders/:id/submit
     */
    async submitForApproval(req, res, next) {
        try {
            const { id } = req.params;
            const submitterId = req.headers['x-user-id'] || 'system';
            const result = await order_orchestration_service_1.orderOrchestrationService.submitOrderForApproval(id, submitterId);
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    message: '订单已提交审批',
                    metadata: result.metadata,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error,
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * 处理订单审批
     * POST /api/v1/orders/:id/approve
     */
    async processApproval(req, res, next) {
        try {
            const { id } = req.params;
            const approvalRequest = {
                orderId: id,
                approverId: req.headers['x-user-id'] || 'system',
                action: req.body.action,
                comment: req.body.comment,
                approvalLevel: req.body.approvalLevel,
            };
            const result = await order_orchestration_service_1.orderOrchestrationService.processApprovalResult(id, approvalRequest);
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    message: `订单已${approvalRequest.action === 'APPROVE' ? '通过' : '拒绝'}审批`,
                    metadata: result.metadata,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error,
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * 取消订单
     * POST /api/v1/orders/:id/cancel
     */
    async cancelOrder(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const result = await order_orchestration_service_1.orderOrchestrationService.cancelOrder(id, reason);
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    message: '订单已取消',
                    metadata: result.metadata,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error,
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * 获取审批历史
     * GET /api/v1/orders/:id/history
     */
    async getApprovalHistory(req, res, next) {
        try {
            const { id } = req.params;
            const history = await sales_order_service_1.salesOrderService.getApprovalHistory(id);
            res.json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SalesOrderController = SalesOrderController;
// 导出控制器实例
exports.salesOrderController = new SalesOrderController();
//# sourceMappingURL=sales-order.controller.js.map