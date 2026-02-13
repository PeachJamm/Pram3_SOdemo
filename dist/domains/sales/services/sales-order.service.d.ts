import { SalesOrder, CreateSalesOrderRequest, ApprovalRequest, SalesOrderQueryParams, SalesOrderPagedResult, ApprovalHistory } from '../models/sales-order.types';
/**
 * 销售订单领域服务
 * 负责订单的CRUD、状态流转、金额计算等核心业务逻辑
 */
export declare class SalesOrderService {
    private orders;
    private approvalHistory;
    /**
     * 创建销售订单
     */
    createOrder(request: CreateSalesOrderRequest, createdBy: string): Promise<SalesOrder>;
    /**
     * 获取销售订单详情
     */
    getOrderById(orderId: string): Promise<SalesOrder | null>;
    /**
     * 查询销售订单列表
     */
    queryOrders(params: SalesOrderQueryParams): Promise<SalesOrderPagedResult>;
    /**
     * 提交订单审批
     */
    submitForApproval(orderId: string, submitterId: string): Promise<SalesOrder>;
    /**
     * 处理订单审批
     */
    processApproval(request: ApprovalRequest): Promise<SalesOrder>;
    /**
     * 取消订单
     */
    cancelOrder(orderId: string, reason: string): Promise<SalesOrder>;
    /**
     * 获取审批历史
     */
    getApprovalHistory(orderId: string): Promise<ApprovalHistory[]>;
    /**
     * 根据金额确定审批级别
     */
    private determineApprovalLevel;
    /**
     * 计算订单项总金额
     */
    private calculateItemTotal;
    /**
     * 生成订单号
     */
    private generateOrderNumber;
}
export declare const salesOrderService: SalesOrderService;
//# sourceMappingURL=sales-order.service.d.ts.map