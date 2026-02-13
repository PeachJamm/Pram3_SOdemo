// =====================================================
// PRAM3 ERP Core - Sales Order Domain Service
// 销售订单域服务实现
// =====================================================

import { v4 as uuidv4 } from 'uuid';

// 简单的UUID生成器（替代uuid包）
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
import {
  SalesOrder,
  SalesOrderStatus,
  ApprovalLevel,
  CreateSalesOrderRequest,
  ApprovalRequest,
  SalesOrderQueryParams,
  SalesOrderPagedResult,
  ApprovalHistory,
  SalesOrderItem,
} from '../models/sales-order.types';

/**
 * 销售订单领域服务
 * 负责订单的CRUD、状态流转、金额计算等核心业务逻辑
 */
export class SalesOrderService {
  private orders: Map<string, SalesOrder> = new Map();
  private approvalHistory: Map<string, ApprovalHistory[]> = new Map();

  /**
   * 创建销售订单
   */
  async createOrder(request: CreateSalesOrderRequest, createdBy: string): Promise<SalesOrder> {
    const orderId = generateUUID();
    const orderNumber = this.generateOrderNumber();

    // 计算订单金额
    const items: SalesOrderItem[] = request.items.map((item, index) => ({
      ...item,
      id: uuidv4(),
      totalAmount: this.calculateItemTotal(item.quantity, item.unitPrice, item.discount, item.tax),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.tax, 0);
    const discountAmount = items.reduce((sum, item) => sum + item.discount, 0);
    const totalAmount = subtotal + taxAmount - discountAmount;

    const order: SalesOrder = {
      id: orderId,
      orderNumber,
      customer: {
        id: request.customerId,
        name: '客户名称', // 实际应从客户服务获取
        email: 'customer@example.com',
        phone: '13800138000',
        address: '客户地址',
        creditLimit: 100000,
        creditRating: 'A',
      },
      items,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      status: SalesOrderStatus.DRAFT,
      approvalLevel: this.determineApprovalLevel(totalAmount),
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      expectedDeliveryDate: request.expectedDeliveryDate,
      shippingAddress: request.shippingAddress,
      billingAddress: request.billingAddress,
      notes: request.notes,
    };

    this.orders.set(orderId, order);
    return order;
  }

  /**
   * 获取销售订单详情
   */
  async getOrderById(orderId: string): Promise<SalesOrder | null> {
    return this.orders.get(orderId) || null;
  }

  /**
   * 查询销售订单列表
   */
  async queryOrders(params: SalesOrderQueryParams): Promise<SalesOrderPagedResult> {
    let orders = Array.from(this.orders.values());

    // 过滤条件
    if (params.status) {
      orders = orders.filter((order) => order.status === params.status);
    }
    if (params.customerId) {
      orders = orders.filter((order) => order.customer.id === params.customerId);
    }
    if (params.startDate) {
      orders = orders.filter((order) => order.createdAt >= params.startDate!);
    }
    if (params.endDate) {
      orders = orders.filter((order) => order.createdAt <= params.endDate!);
    }
    if (params.minAmount !== undefined) {
      orders = orders.filter((order) => order.totalAmount >= params.minAmount!);
    }
    if (params.maxAmount !== undefined) {
      orders = orders.filter((order) => order.totalAmount <= params.maxAmount!);
    }

    // 排序
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    orders.sort((a, b) => {
      const aVal = a[sortBy as keyof SalesOrder] ?? '';
      const bVal = b[sortBy as keyof SalesOrder] ?? '';
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = orders.length;
    const totalPages = Math.ceil(total / pageSize);
    const pagedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

    return {
      orders: pagedOrders,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * 提交订单审批
   */
  async submitForApproval(orderId: string, submitterId: string): Promise<SalesOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    if (order.status !== SalesOrderStatus.DRAFT) {
      throw new Error('只有草稿状态的订单可以提交审批');
    }

    order.status = SalesOrderStatus.PENDING_APPROVAL;
    order.updatedAt = new Date();
    this.orders.set(orderId, order);

    return order;
  }

  /**
   * 处理订单审批
   */
  async processApproval(request: ApprovalRequest): Promise<SalesOrder> {
    const order = this.orders.get(request.orderId);
    if (!order) {
      throw new Error(`订单不存在: ${request.orderId}`);
    }

    if (order.status !== SalesOrderStatus.PENDING_APPROVAL) {
      throw new Error('只有待审批状态的订单可以处理');
    }

    // 记录审批历史
    const history: ApprovalHistory = {
      id: uuidv4(),
      orderId: request.orderId,
      approverId: request.approverId,
      approverName: '审批人', // 实际应从用户服务获取
      action: request.action,
      approvalLevel: request.approvalLevel,
      comment: request.comment,
      timestamp: new Date(),
    };

    const historyList = this.approvalHistory.get(request.orderId) || [];
    historyList.push(history);
    this.approvalHistory.set(request.orderId, historyList);

    // 处理审批结果
    if (request.action === 'APPROVE') {
      order.status = SalesOrderStatus.APPROVED;
      order.approver = request.approverId;
      order.approvalDate = new Date();
      order.approvalComment = request.comment;
    } else {
      order.status = SalesOrderStatus.REJECTED;
      order.approver = request.approverId;
      order.approvalDate = new Date();
      order.approvalComment = request.comment;
    }

    order.updatedAt = new Date();
    this.orders.set(request.orderId, order);

    return order;
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string, reason: string): Promise<SalesOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    if (order.status === SalesOrderStatus.COMPLETED || order.status === SalesOrderStatus.CANCELLED) {
      throw new Error('已完成或已取消的订单不能取消');
    }

    order.status = SalesOrderStatus.CANCELLED;
    order.notes = `取消原因: ${reason}`;
    order.updatedAt = new Date();
    this.orders.set(orderId, order);

    return order;
  }

  /**
   * 获取审批历史
   */
  async getApprovalHistory(orderId: string): Promise<ApprovalHistory[]> {
    return this.approvalHistory.get(orderId) || [];
  }

  /**
   * 根据金额确定审批级别
   */
  private determineApprovalLevel(amount: number): ApprovalLevel {
    if (amount < 10000) {
      return ApprovalLevel.LEVEL_1;
    } else if (amount < 100000) {
      return ApprovalLevel.LEVEL_2;
    } else {
      return ApprovalLevel.LEVEL_3;
    }
  }

  /**
   * 计算订单项总金额
   */
  private calculateItemTotal(quantity: number, unitPrice: number, discount: number, tax: number): number {
    const subtotal = quantity * unitPrice;
    return subtotal - discount + tax;
  }

  /**
   * 生成订单号
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const prefix = 'SO';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${year}${month}${day}${random}`;
  }
}

// 导出服务实例
export const salesOrderService = new SalesOrderService();
