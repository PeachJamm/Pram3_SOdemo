// =====================================================
// PRAM3 ERP Core - Camunda Mock Data Service
// Camunda流程引擎模拟数据服务
// =====================================================

import {
  SalesOrder,
  SalesOrderStatus,
  ApprovalLevel,
  SalesOrderItem,
  CustomerInfo,
} from '../domains/sales/models/sales-order.types';
import {
  CamundaProcessInstance,
  CamundaActivity,
  CamundaVariable,
  ExternalTask,
} from '../orchestration/camunda-integration.service';

/**
 * 模拟数据配置
 */
export interface MockConfig {
  orderCount?: number;
  maxItemsPerOrder?: number;
  maxAmount?: number;
  includeCustomFields?: boolean;
}

/**
 * Camunda模拟数据服务
 */
export class CamundaMockService {
  private config: MockConfig;

  constructor(config: MockConfig = {}) {
    this.config = {
      orderCount: config.orderCount || 10,
      maxItemsPerOrder: config.maxItemsPerOrder || 5,
      maxAmount: config.maxAmount || 50000,
      includeCustomFields: config.includeCustomFields || true,
    };
  }

  /**
   * 生成模拟的销售订单
   */
  generateSalesOrders(): SalesOrder[] {
    const orders: SalesOrder[] = [];
    
    for (let i = 0; i < (this.config.orderCount || 10); i++) {
      const order = this.createRandomOrder(i + 1);
      orders.push(order);
    }
    
    return orders;
  }

  /**
   * 生成模拟的流程实例
   */
  generateProcessInstances(orders: SalesOrder[]): CamundaProcessInstance[] {
    return orders.map(order => this.createProcessInstance(order));
  }

  /**
   * 生成模拟的审批历史
   */
  generateApprovalHistory(processInstances: CamundaProcessInstance[]): Array<{
    orderId: string;
    history: Array<{
      id: string;
      approverId: string;
      approverName: string;
      action: 'APPROVE' | 'REJECT';
      approvalLevel: ApprovalLevel;
      comment: string;
      timestamp: Date;
      customData?: Record<string, unknown>;
    }>;
  }> {
    return processInstances.map(instance => ({
      orderId: instance.businessKey,
      history: this.createApprovalHistory(instance),
    }));
  }

  /**
   * 生成模拟的外部任务
   */
  generateExternalTasks(processInstances: CamundaProcessInstance[]): ExternalTask[] {
    const tasks: ExternalTask[] = [];
    
    processInstances.forEach(instance => {
      // 为每个流程实例生成一些外部任务
      const taskCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < taskCount; i++) {
        tasks.push(this.createExternalTask(instance.id, i));
      }
    });
    
    return tasks;
  }

  /**
   * 创建随机订单
   */
  private createRandomOrder(index: number): SalesOrder {
    const orderNumber = `SO-${Date.now()}-${index}`;
    const customer = this.createRandomCustomer(index);
    const items = this.createRandomItems();
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    
    const order: SalesOrder = {
      id: `order-${orderNumber}`,
      orderNumber,
      customer,
      items,
      subtotal: totalAmount,
      taxAmount: totalAmount * 0.06,
      discountAmount: 0,
      totalAmount: totalAmount * 1.06,
      status: SalesOrderStatus.PENDING_APPROVAL,
      approvalLevel: this.getRandomApprovalLevel(),
      createdBy: `user-${Math.floor(Math.random() * 10) + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 过去7天内
      updatedAt: new Date(),
      shippingAddress: this.createRandomAddress(),
      billingAddress: this.createRandomAddress(),
    };

    // 添加自定义字段
    if (this.config.includeCustomFields) {
      (order as any).customFields = this.createRandomCustomFields(order);
    }

    return order;
  }

  /**
   * 创建随机客户
   */
  private createRandomCustomer(index: number): CustomerInfo {
    const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十'];
    const name = names[index % names.length];
    
    return {
      id: `customer-${index}`,
      name,
      email: `${name}@example.com`,
      phone: `138${Math.floor(Math.random() * 80000000) + 10000000}`,
      address: this.createRandomAddress(),
      creditLimit: Math.floor(Math.random() * 100000) + 10000,
      creditRating: Math.random() > 0.5 ? 'A' : 'B',
    };
  }

  /**
   * 创建随机订单项
   */
  private createRandomItems(): SalesOrderItem[] {
    const items: SalesOrderItem[] = [];
    const itemCount = Math.floor(Math.random() * (this.config.maxItemsPerOrder || 5)) + 1;
    
    for (let i = 0; i < itemCount; i++) {
      const quantity = Math.floor(Math.random() * 10) + 1;
      const unitPrice = Math.floor(Math.random() * 1000) + 100;
      const totalAmount = quantity * unitPrice;
      
      items.push({
        id: `item-${Date.now()}-${i}`,
        productId: `product-${i}`,
        productName: `产品${i + 1}`,
        quantity,
        unitPrice,
        discount: 0,
        tax: totalAmount * 0.06,
        totalAmount,
        description: `产品${i + 1}的描述`,
      });
    }
    
    return items;
  }

  /**
   * 创建随机地址
   */
  private createRandomAddress(): string {
    const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市'];
    const districts = ['朝阳区', '海淀区', '浦东新区', '福田区', '西湖区', '锦江区'];
    
    return `${cities[Math.floor(Math.random() * cities.length)]}${districts[Math.floor(Math.random() * districts.length)]}某街道${Math.floor(Math.random() * 100) + 1}号`;
  }

  /**
   * 获取随机审批级别
   */
  private getRandomApprovalLevel(): ApprovalLevel {
    const levels: ApprovalLevel[] = [ApprovalLevel.LEVEL_1, ApprovalLevel.LEVEL_2, ApprovalLevel.LEVEL_3];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  /**
   * 创建流程实例
   */
  private createProcessInstance(order: SalesOrder): CamundaProcessInstance {
    return {
      id: `process-${order.orderNumber}`,
      processDefinitionId: 'sales-order-process:1:abcdef123456',
      businessKey: order.id,
      state: 'ACTIVE',
      variables: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        customerId: order.customer.id,
        customerName: order.customer.name,
        approvalLevel: order.approvalLevel,
        currentStatus: order.status,
        createdBy: order.createdBy,
        // 添加自定义字段
        ...((order as any).customFields && { customFields: (order as any).customFields }),
      },
      startTime: order.createdAt,
    };
  }

  /**
   * 创建审批历史
   */
  private createApprovalHistory(instance: CamundaProcessInstance): Array<{
    id: string;
    approverId: string;
    approverName: string;
    action: 'APPROVE' | 'REJECT';
    approvalLevel: ApprovalLevel;
    comment: string;
    timestamp: Date;
    customData?: Record<string, unknown>;
  }> {
    const history: Array<{
      id: string;
      approverId: string;
      approverName: string;
      action: 'APPROVE' | 'REJECT';
      approvalLevel: ApprovalLevel;
      comment: string;
      timestamp: Date;
      customData?: Record<string, unknown>;
    }> = [];
    
    // 模拟审批历史
    const approverNames = ['张经理', '王总监', '李VP'];
    const actions: Array<'APPROVE' | 'REJECT'> = ['APPROVE', 'REJECT'];
    
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      history.push({
        id: `history-${instance.id}-${i}`,
        approverId: `user-${i + 1}`,
        approverName: approverNames[i % approverNames.length],
        action: actions[Math.floor(Math.random() * actions.length)],
        approvalLevel: ApprovalLevel[`LEVEL_${i + 1}` as keyof typeof ApprovalLevel],
        comment: `审批意见${i + 1}: ${Math.random() > 0.5 ? '同意' : '不同意'}`,
        timestamp: new Date(instance.startTime.getTime() + i * 24 * 60 * 60 * 1000),
        // 添加自定义数据
        ...(this.config.includeCustomFields && {
          customData: {
            reviewScore: Math.floor(Math.random() * 100),
            riskLevel: Math.random() > 0.7 ? 'HIGH' : 'LOW',
          },
        }),
      });
    }
    
    return history;
  }

  /**
   * 创建外部任务
   */
  private createExternalTask(processInstanceId: string, index: number): ExternalTask {
    return {
      id: `external-task-${processInstanceId}-${index}`,
      topicName: 'order-processing',
      workerId: `worker-${Math.floor(Math.random() * 5) + 1}`,
      retries: 3,
      priority: Math.floor(Math.random() * 100),
      variables: {
        processInstanceId,
        taskType: Math.random() > 0.5 ? 'STOCK_CHECK' : 'NOTIFICATION',
        priority: Math.random() > 0.5 ? 'HIGH' : 'NORMAL',
      },
    };
  }

  /**
   * 创建随机自定义字段
   */
  private createRandomCustomFields(order: SalesOrder): Record<string, unknown> {
    return {
      discountApproval: Math.random() > 0.3 ? Math.floor(Math.random() * 20) : null,
      strategicAccount: Math.random() > 0.7,
      paymentTerms: ['net30', 'net60', 'immediate'][Math.floor(Math.random() * 3)],
      customNotes: Math.random() > 0.5 ? `特殊说明: ${order.orderNumber}` : null,
      // 添加更多自定义字段
      vipCustomer: Math.random() > 0.8,
      contractType: ['标准合同', '框架协议', '特殊合同'][Math.floor(Math.random() * 3)],
      expectedPaymentDate: Math.random() > 0.6 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    };
  }

  /**
   * 获取所有模拟数据
   */
  getAllMockData(): {
    orders: SalesOrder[];
    processInstances: CamundaProcessInstance[];
    approvalHistory: Array<{
      orderId: string;
      history: Array<{
        id: string;
        approverId: string;
        approverName: string;
        action: 'APPROVE' | 'REJECT';
        approvalLevel: ApprovalLevel;
        comment: string;
        timestamp: Date;
        customData?: Record<string, unknown>;
      }>;
    }>;
    externalTasks: ExternalTask[];
  } {
    const orders = this.generateSalesOrders();
    const processInstances = this.generateProcessInstances(orders);
    const approvalHistory = this.generateApprovalHistory(processInstances);
    const externalTasks = this.generateExternalTasks(processInstances);

    return {
      orders,
      processInstances,
      approvalHistory,
      externalTasks,
    };
  }

  /**
   * 重置模拟数据
   */
  reset(): void {
    // 重置配置
    this.config = {
      orderCount: 10,
      maxItemsPerOrder: 5,
      maxAmount: 50000,
      includeCustomFields: true,
    };
  }
}

// 导出默认实例
export const camundaMockService = new CamundaMockService();
export default CamundaMockService;