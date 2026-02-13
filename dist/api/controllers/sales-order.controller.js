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
/**
 * 销售订单API控制器
 */
class SalesOrderController {
    constructor() {
        this.router = (0, express_1.Router)();
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
            const params = {
                status: req.query.status,
                customerId: req.query.customerId,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : undefined,
                maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : undefined,
                page: req.query.page ? parseInt(req.query.page) : 1,
                pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : 10,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
            };
            const result = await order_orchestration_service_1.orderOrchestrationService.queryOrders(params);
            if (result.success) {
                res.json({
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
     * 获取订单详情
     * GET /api/v1/orders/:id
     */
    async getOrderById(req, res, next) {
        try {
            const { id } = req.params;
            const result = await order_orchestration_service_1.orderOrchestrationService.getOrderDetails(id);
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    metadata: result.metadata,
                });
            }
            else {
                res.status(404).json({
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