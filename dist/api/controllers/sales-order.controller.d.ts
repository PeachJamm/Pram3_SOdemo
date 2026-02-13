import { Router } from 'express';
/**
 * API响应类型
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
/**
 * 销售订单API控制器
 */
export declare class SalesOrderController {
    router: Router;
    constructor();
    /**
     * 设置路由
     */
    private setupRoutes;
    /**
     * 创建订单
     * POST /api/v1/orders
     */
    private createOrder;
    /**
     * 查询订单列表
     * GET /api/v1/orders
     */
    private queryOrders;
    /**
     * 获取订单详情
     * GET /api/v1/orders/:id
     */
    private getOrderById;
    /**
     * 提交订单审批
     * POST /api/v1/orders/:id/submit
     */
    private submitForApproval;
    /**
     * 处理订单审批
     * POST /api/v1/orders/:id/approve
     */
    private processApproval;
    /**
     * 取消订单
     * POST /api/v1/orders/:id/cancel
     */
    private cancelOrder;
    /**
     * 获取审批历史
     * GET /api/v1/orders/:id/history
     */
    private getApprovalHistory;
}
export declare const salesOrderController: SalesOrderController;
//# sourceMappingURL=sales-order.controller.d.ts.map