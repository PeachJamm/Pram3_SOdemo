/**
 * 销售订单状态枚举
 */
export declare enum SalesOrderStatus {
    DRAFT = "DRAFT",// 草稿
    PENDING_APPROVAL = "PENDING_APPROVAL",// 待审批
    APPROVED = "APPROVED",// 已审批
    REJECTED = "REJECTED",// 已拒绝
    CANCELLED = "CANCELLED",// 已取消
    PROCESSING = "PROCESSING",// 处理中
    COMPLETED = "COMPLETED"
}
/**
 * 销售订单审批级别
 */
export declare enum ApprovalLevel {
    LEVEL_1 = "LEVEL_1",// 初级审批（部门经理）
    LEVEL_2 = "LEVEL_2",// 中级审批（总监）
    LEVEL_3 = "LEVEL_3"
}
/**
 * 订单项模型
 */
export interface SalesOrderItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    totalAmount: number;
    description?: string;
}
/**
 * 客户信息
 */
export interface CustomerInfo {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    creditLimit: number;
    creditRating: string;
}
/**
 * 销售订单主模型
 */
export interface SalesOrder {
    id: string;
    orderNumber: string;
    customer: CustomerInfo;
    items: SalesOrderItem[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    status: SalesOrderStatus;
    approvalLevel: ApprovalLevel;
    approver?: string;
    approvalDate?: Date;
    approvalComment?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    expectedDeliveryDate?: Date;
    shippingAddress: string;
    billingAddress: string;
    notes?: string;
}
/**
 * 创建销售订单请求
 */
export interface CreateSalesOrderRequest {
    customerId: string;
    items: Omit<SalesOrderItem, 'id'>[];
    expectedDeliveryDate?: Date;
    shippingAddress: string;
    billingAddress: string;
    notes?: string;
}
/**
 * 销售订单审批请求
 */
export interface ApprovalRequest {
    orderId: string;
    approverId: string;
    action: 'APPROVE' | 'REJECT';
    comment?: string;
    approvalLevel: ApprovalLevel;
}
/**
 * 销售订单查询参数
 */
export interface SalesOrderQueryParams {
    status?: SalesOrderStatus;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
/**
 * 销售订单分页结果
 */
export interface SalesOrderPagedResult {
    orders: SalesOrder[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
/**
 * 订单审批历史记录
 */
export interface ApprovalHistory {
    id: string;
    orderId: string;
    approverId: string;
    approverName: string;
    action: 'APPROVE' | 'REJECT';
    approvalLevel: ApprovalLevel;
    comment?: string;
    timestamp: Date;
}
//# sourceMappingURL=sales-order.types.d.ts.map