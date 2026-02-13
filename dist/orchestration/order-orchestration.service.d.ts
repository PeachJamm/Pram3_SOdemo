import { SalesOrder, CreateSalesOrderRequest, ApprovalRequest, SalesOrderQueryParams, SalesOrderPagedResult } from '../domains/sales/models/sales-order.types';
/**
 * 编排服务接口
 */
export interface OrchestrationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: {
        timestamp: Date;
        traceId: string;
        source: string;
    };
}
/**
 * 订单编排服务
 * 负责协调多个域服务、处理Camunda工作流、聚合跨域数据
 */
export declare class OrderOrchestrationService {
    private traceIdCounter;
    /**
     * 创建订单并启动审批流程
     * 集成Camunda工作流
     */
    createOrderWithWorkflow(request: CreateSalesOrderRequest, createdBy: string): Promise<OrchestrationResult<{
        order: SalesOrder;
        processInstanceId: string;
    }>>;
    /**
     * 提交订单审批
     * 处理Camunda流程触发
     */
    submitOrderForApproval(orderId: string, submitterId: string): Promise<OrchestrationResult<SalesOrder>>;
    /**
     * 处理订单审批结果
     * 同步Camunda审批结果到域服务
     */
    processApprovalResult(orderId: string, approvalRequest: ApprovalRequest): Promise<OrchestrationResult<SalesOrder>>;
    /**
     * 查询订单详情（聚合多个域的数据）
     */
    getOrderDetails(orderId: string): Promise<OrchestrationResult<SalesOrder>>;
    /**
     * 查询订单列表（聚合查询）
     */
    queryOrders(params: SalesOrderQueryParams): Promise<OrchestrationResult<SalesOrderPagedResult>>;
    /**
     * 取消订单
     */
    cancelOrder(orderId: string, reason: string): Promise<OrchestrationResult<SalesOrder>>;
    /**
     * 启动审批工作流
     */
    private startApprovalWorkflow;
    /**
     * 触发Camunda流程
     */
    private triggerCamundaProcess;
    /**
     * 更新Camunda流程状态
     */
    private updateCamundaProcess;
    /**
     * 取消Camunda流程
     */
    private cancelCamundaProcess;
    /**
     * 触发自动化流程（无需人工参与）
     */
    private triggerAutomatedProcess;
    /**
     * 财务处理
     */
    private processFinance;
    /**
     * 库存预留
     */
    private reserveInventory;
    /**
     * 客户通知
     */
    private notifyCustomer;
    /**
     * 生成跟踪ID
     */
    private generateTraceId;
}
export declare const orderOrchestrationService: OrderOrchestrationService;
//# sourceMappingURL=order-orchestration.service.d.ts.map