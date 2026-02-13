// =====================================================
// PRAM3 ERP Core - Order Orchestration Service
// 订单编排服务 - 跨域聚合服务层
// =====================================================

import { salesOrderService } from '../domains/sales/services/sales-order.service';
import {
  SalesOrder,
  SalesOrderStatus,
  CreateSalesOrderRequest,
  ApprovalRequest,
  SalesOrderQueryParams,
  SalesOrderPagedResult,
} from '../domains/sales/models/sales-order.types';

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
export class OrderOrchestrationService {
  private traceIdCounter = 0;

  /**
   * 创建订单并启动审批流程
   * 集成Camunda工作流
   */
  async createOrderWithWorkflow(
    request: CreateSalesOrderRequest,
    createdBy: string
  ): Promise<OrchestrationResult<{ order: SalesOrder; processInstanceId: string }>> {
    const traceId = this.generateTraceId();

    try {
      console.log(`[OrderOrchestration] 创建订单 - TraceId: ${traceId}`);

      // 1. 调用域服务创建订单
      const order = await salesOrderService.createOrder(request, createdBy);

      // 2. 启动Camunda审批工作流（如果需要审批）
      let processInstanceId: string | undefined;
      if (order.totalAmount > 0) {
        processInstanceId = await this.startApprovalWorkflow(order);
      }

      // 3. 聚合结果
      return {
        success: true,
        data: {
          order,
          processInstanceId: processInstanceId || '',
        },
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建订单失败',
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    }
  }

  /**
   * 提交订单审批
   * 处理Camunda流程触发
   */
  async submitOrderForApproval(
    orderId: string,
    submitterId: string
  ): Promise<OrchestrationResult<SalesOrder>> {
    const traceId = this.generateTraceId();

    try {
      console.log(`[OrderOrchestration] 提交审批 - TraceId: ${traceId}, OrderId: ${orderId}`);

      // 1. 提交订单
      const order = await salesOrderService.submitForApproval(orderId, submitterId);

      // 2. 触发Camunda审批流程
      await this.triggerCamundaProcess(order);

      return {
        success: true,
        data: order,
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '提交审批失败',
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    }
  }

  /**
   * 处理订单审批结果
   * 同步Camunda审批结果到域服务
   */
  async processApprovalResult(
    orderId: string,
    approvalRequest: ApprovalRequest
  ): Promise<OrchestrationResult<SalesOrder>> {
    const traceId = this.generateTraceId();

    try {
      console.log(`[OrderOrchestration] 处理审批结果 - TraceId: ${traceId}`);

      // 1. 调用域服务处理审批
      const order = await salesOrderService.processApproval(approvalRequest);

      // 2. 更新Camunda流程状态
      await this.updateCamundaProcess(order);

      // 3. 如果审批通过，触发后续业务流程（无需人工）
      if (order.status === SalesOrderStatus.APPROVED) {
        await this.triggerAutomatedProcess(order);
      }

      return {
        success: true,
        data: order,
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '处理审批结果失败',
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    }
  }

  /**
   * 查询订单详情（聚合多个域的数据）
   */
  async getOrderDetails(orderId: string): Promise<OrchestrationResult<SalesOrder>> {
    const traceId = this.generateTraceId();

    try {
      const order = await salesOrderService.getOrderById(orderId);

      if (!order) {
        return {
          success: false,
          error: '订单不存在',
          metadata: {
            timestamp: new Date(),
            traceId,
            source: 'order-orchestration',
          },
        };
      }

      return {
        success: true,
        data: order,
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '查询订单失败',
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    }
  }

  /**
   * 查询订单列表（聚合查询）
   */
  async queryOrders(
    params: SalesOrderQueryParams
  ): Promise<OrchestrationResult<SalesOrderPagedResult>> {
    const traceId = this.generateTraceId();

    try {
      const result = await salesOrderService.queryOrders(params);

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '查询订单列表失败',
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string, reason: string): Promise<OrchestrationResult<SalesOrder>> {
    const traceId = this.generateTraceId();

    try {
      const order = await salesOrderService.cancelOrder(orderId, reason);

      // 取消Camunda流程
      await this.cancelCamundaProcess(orderId);

      return {
        success: true,
        data: order,
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '取消订单失败',
        metadata: {
          timestamp: new Date(),
          traceId,
          source: 'order-orchestration',
        },
      };
    }
  }

  // ==================== Camunda集成方法 ====================

  /**
   * 启动审批工作流
   */
  private async startApprovalWorkflow(order: SalesOrder): Promise<string> {
    // Camunda集成逻辑
    console.log(`[Camunda] 启动审批流程 - OrderId: ${order.id}, Amount: ${order.totalAmount}`);
    
    // 实际实现中，这里会调用Camunda REST API
    // POST /engine-rest/process-definition/key/sales-order-approval/start
    const processInstanceId = `proc-${order.id}-${Date.now()}`;
    
    return processInstanceId;
  }

  /**
   * 触发Camunda流程
   */
  private async triggerCamundaProcess(order: SalesOrder): Promise<void> {
    console.log(`[Camunda] 触发流程 - OrderId: ${order.id}`);
    // 实现Camunda流程触发逻辑
  }

  /**
   * 更新Camunda流程状态
   */
  private async updateCamundaProcess(order: SalesOrder): Promise<void> {
    console.log(`[Camunda] 更新流程状态 - OrderId: ${order.id}, Status: ${order.status}`);
    // 实现Camunda流程状态更新逻辑
  }

  /**
   * 取消Camunda流程
   */
  private async cancelCamundaProcess(orderId: string): Promise<void> {
    console.log(`[Camunda] 取消流程 - OrderId: ${orderId}`);
    // 实现Camunda流程取消逻辑
  }

  /**
   * 触发自动化流程（无需人工参与）
   */
  private async triggerAutomatedProcess(order: SalesOrder): Promise<void> {
    console.log(`[Orchestration] 触发自动化流程 - OrderId: ${order.id}`);
    
    // 无需人参与的流程直接在这里处理
    // 例如：通知、财务处理、库存预留等
    await this.processFinance(order);
    await this.reserveInventory(order);
    await this.notifyCustomer(order);
  }

  /**
   * 财务处理
   */
  private async processFinance(order: SalesOrder): Promise<void> {
    console.log(`[Finance] 处理订单财务 - OrderId: ${order.id}, Amount: ${order.totalAmount}`);
    // 实现财务处理逻辑
  }

  /**
   * 库存预留
   */
  private async reserveInventory(order: SalesOrder): Promise<void> {
    console.log(`[Inventory] 预留库存 - OrderId: ${order.id}`);
    // 实现库存预留逻辑
  }

  /**
   * 客户通知
   */
  private async notifyCustomer(order: SalesOrder): Promise<void> {
    console.log(`[Notification] 通知客户 - OrderId: ${order.id}`);
    // 实现客户通知逻辑
  }

  /**
   * 生成跟踪ID
   */
  private generateTraceId(): string {
    this.traceIdCounter++;
    return `trace-${Date.now()}-${this.traceIdCounter}`;
  }
}

// 导出编排服务实例
export const orderOrchestrationService = new OrderOrchestrationService();
