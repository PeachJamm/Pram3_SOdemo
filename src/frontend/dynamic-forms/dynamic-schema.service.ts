// =====================================================
// PRAM3 ERP Core - Dynamic Schema Assembly Service
// 动态Schema组装服务 - 后端根据权限返回字段readonly属性
// =====================================================

import {
  SalesOrder,
  SalesOrderStatus,
} from '../../domains/sales/models/sales-order.types';
import {
  CamundaActivity,
  CamundaIntegrationService,
} from '../../orchestration/camunda-integration.service';
import {
  PermissionLevel,
  TaskOperation,
  TaskAction,
  CamundaTask,
  ParallelTaskGroup,
  DynamicSchemaResponse,
  PermissionAwareField,
  FieldPermission,
  PermissionContext,
  PermissionRule,
  DEFAULT_APPROVE_ACTIONS,
  DEFAULT_VIEW_ACTIONS,
  DEFAULT_ADMIN_ACTIONS,
} from './permission.types';

/**
 * 节点权限配置规则
 */
const NODE_PERMISSION_RULES: Record<string, PermissionRule> = {
  'node-order-create': {
    nodeId: 'node-order-create',
    userRoles: ['SALES', 'ADMIN'],
    basePermission: PermissionLevel.EDIT,
    fieldPermissions: {
      customerId: PermissionLevel.EDIT,
      items: PermissionLevel.EDIT,
      shippingAddress: PermissionLevel.EDIT,
      billingAddress: PermissionLevel.EDIT,
      notes: PermissionLevel.EDIT,
    },
    actions: [
      { id: TaskOperation.COMPLETE, label: '创建', icon: '✓', nextState: 'PENDING_APPROVAL' },
    ],
  },
  'node-order-review': {
    nodeId: 'node-order-review',
    userRoles: ['QC', 'ADMIN'],
    basePermission: PermissionLevel.EDIT,
    fieldPermissions: {
      qualityCheck: PermissionLevel.EDIT,
      notes: PermissionLevel.EDIT,
    },
    actions: DEFAULT_APPROVE_ACTIONS,
  },
  'node-approval-level1': {
    nodeId: 'node-approval-level1',
    userRoles: ['DEPT_MANAGER', 'ADMIN'],
    basePermission: PermissionLevel.APPROVE,
    fieldPermissions: {
      approvalAction: PermissionLevel.APPROVE,
      approvalComment: PermissionLevel.APPROVE,
      orderInfo: PermissionLevel.VIEW,
    },
    actions: DEFAULT_APPROVE_ACTIONS,
  },
  'node-approval-level2': {
    nodeId: 'node-approval-level2',
    userRoles: ['DIRECTOR', 'ADMIN'],
    basePermission: PermissionLevel.APPROVE,
    fieldPermissions: {
      approvalAction: PermissionLevel.APPROVE,
      approvalComment: PermissionLevel.APPROVE,
      orderInfo: PermissionLevel.VIEW,
      deptApproval: PermissionLevel.VIEW,
    },
    actions: DEFAULT_APPROVE_ACTIONS,
  },
  'node-approval-level3': {
    nodeId: 'node-approval-level3',
    userRoles: ['VP', 'ADMIN'],
    basePermission: PermissionLevel.APPROVE,
    fieldPermissions: {
      approvalAction: PermissionLevel.APPROVE,
      approvalComment: PermissionLevel.APPROVE,
      vipApproval: PermissionLevel.APPROVE,
    },
    actions: DEFAULT_APPROVE_ACTIONS,
  },
  'node-finance': {
    nodeId: 'node-finance',
    userRoles: ['FINANCE', 'ADMIN'],
    basePermission: PermissionLevel.EDIT,
    fieldPermissions: {
      invoiceNumber: PermissionLevel.EDIT,
      paymentStatus: PermissionLevel.EDIT,
    },
    actions: DEFAULT_APPROVE_ACTIONS,
  },
  'node-inventory': {
    nodeId: 'node-inventory',
    userRoles: ['WAREHOUSE', 'ADMIN'],
    basePermission: PermissionLevel.EDIT,
    fieldPermissions: {
      reservationId: PermissionLevel.EDIT,
      stockStatus: PermissionLevel.EDIT,
    },
    actions: DEFAULT_APPROVE_ACTIONS,
  },
  'node-notification': {
    nodeId: 'node-notification',
    userRoles: ['SYSTEM', 'ADMIN'],
    basePermission: PermissionLevel.VIEW,
    fieldPermissions: {
      notificationSent: PermissionLevel.VIEW,
    },
    actions: [],
  },
};

/**
 * 动态Schema组装服务
 */
export class DynamicSchemaService {
  private camundaService: CamundaIntegrationService;

  constructor(camundaService?: CamundaIntegrationService) {
    this.camundaService = camundaService || new CamundaIntegrationService();
  }

  /**
   * 获取任务对应的动态Schema
   * 后端组装，前端零配置
   */
  async getDynamicSchema(
    taskId: string,
    salesOrder: SalesOrder,
    context: PermissionContext
  ): Promise<DynamicSchemaResponse> {
    // 1. 获取Camunda任务信息
    const task = await this.getTaskInfo(taskId);
    
    // 2. 确定用户权限级别
    const permissionLevel = this.determinePermissionLevel(context, task);
    
    // 3. 获取节点权限规则
    const nodePermission = this.getNodePermission(task.nodeId, context.userRoles);
    
    // 4. 组装带权限的字段
    const fields = this.assembleFields(salesOrder, nodePermission, permissionLevel);
    
    // 5. 获取可用操作
    const actions = this.getAvailableActions(nodePermission, permissionLevel);
    
    // 6. 获取并行任务组
    const parallelGroups = await this.getParallelTasks(salesOrder.id, context);

    return {
      schemaId: task.formKey || task.nodeId,
      schemaName: task.name,
      taskId: task.id,
      nodeId: task.nodeId,
      permissionLevel,
      fields,
      actions,
      parallelGroups,
      metadata: {
        orderId: salesOrder.id,
        orderNumber: salesOrder.orderNumber,
        processInstanceId: context.processInstanceId,
        createdAt: new Date(),
      },
    };
  }

  /**
   * 获取任务信息
   */
  private async getTaskInfo(taskId: string): Promise<CamundaTask> {
    // 实际实现中，调用Camunda API获取任务详情
    // GET /task/{taskId}
    
    // 模拟返回
    return {
      id: taskId,
      nodeId: 'node-approval-level1',
      name: '部门经理审批',
      assignee: 'current-user',
      formKey: 'dept-manager-approval-form',
      priority: 0,
      permissionLevel: PermissionLevel.APPROVE,
      availableActions: DEFAULT_APPROVE_ACTIONS,
    };
  }

  /**
   * 确定用户权限级别
   */
  private determinePermissionLevel(
    context: PermissionContext,
    task: CamundaTask
  ): PermissionLevel {
    // 如果任务是当前用户的
    if (task.assignee === context.userId) {
      return PermissionLevel.APPROVE;
    }
    
    // 如果用户在候选组中
    if (task.candidateGroups?.some(role => context.userRoles.includes(role))) {
      return PermissionLevel.EDIT;
    }
    
    // 查看权限
    return PermissionLevel.VIEW;
  }

  /**
   * 获取节点权限配置
   */
  private getNodePermission(nodeId: string, userRoles: string[]): PermissionRule {
    const rule = NODE_PERMISSION_RULES[nodeId];
    
    if (rule) {
      // 检查用户角色是否匹配
      const hasAccess = rule.userRoles.some(role => userRoles.includes(role));
      if (hasAccess) {
        return rule;
      }
    }
    
    // 默认只读权限
    return {
      nodeId,
      userRoles: [],
      basePermission: PermissionLevel.VIEW,
      fieldPermissions: {},
      actions: [],
    };
  }

  /**
   * 组装带权限的字段
   */
  private assembleFields(
    salesOrder: SalesOrder,
    nodePermission: PermissionRule,
    userPermission: PermissionLevel
  ): PermissionAwareField[] {
    const fields: PermissionAwareField[] = [];
    
    // 订单基本信息（只读）
    fields.push({
      id: 'orderNumber',
      name: 'orderNumber',
      label: '订单号',
      type: 'text',
      value: salesOrder.orderNumber,
      readonly: true,
      required: false,
      permission: PermissionLevel.VIEW,
    });
    
    fields.push({
      id: 'customerName',
      name: 'customerName',
      label: '客户名称',
      type: 'text',
      value: salesOrder.customer.name,
      readonly: true,
      required: false,
      permission: PermissionLevel.VIEW,
    });
    
    fields.push({
      id: 'totalAmount',
      name: 'totalAmount',
      label: '订单金额',
      type: 'number',
      value: salesOrder.totalAmount,
      readonly: true,
      required: false,
      permission: PermissionLevel.VIEW,
    });
    
    fields.push({
      id: 'status',
      name: 'status',
      label: '状态',
      type: 'text',
      value: salesOrder.status,
      readonly: true,
      required: false,
      permission: PermissionLevel.VIEW,
    });
    
    // 审批相关字段（根据权限动态设置readonly）
    if (userPermission === PermissionLevel.APPROVE || userPermission === PermissionLevel.EDIT) {
      fields.push({
        id: 'approvalAction',
        name: 'approvalAction',
        label: '审批操作',
        type: 'enum',
        value: '',
        readonly: userPermission !== PermissionLevel.APPROVE,
        required: true,
        permission: PermissionLevel.APPROVE,
      });
      
      fields.push({
        id: 'approvalComment',
        name: 'approvalComment',
        label: '审批意见',
        type: 'textarea',
        value: '',
        readonly: userPermission !== PermissionLevel.APPROVE,
        required: true,
        permission: PermissionLevel.APPROVE,
        validation: {
          maxLength: 500,
        },
      });
    }
    
    // 根据节点类型添加特定字段
    const nodeFields = this.getNodeSpecificFields(nodePermission.nodeId, salesOrder, userPermission);
    fields.push(...nodeFields);
    
    return fields;
  }

  /**
   * 获取节点特定字段
   */
  private getNodeSpecificFields(
    nodeId: string,
    salesOrder: SalesOrder,
    permission: PermissionLevel
  ): PermissionAwareField[] {
    switch (nodeId) {
      case 'node-order-create':
        return this.getOrderCreateFields(salesOrder, permission);
      case 'node-approval-level1':
      case 'node-approval-level2':
      case 'node-approval-level3':
        return this.getApprovalFields(salesOrder, permission);
      case 'node-finance':
        return this.getFinanceFields(salesOrder, permission);
      case 'node-inventory':
        return this.getInventoryFields(salesOrder, permission);
      default:
        return [];
    }
  }

  /**
   * 订单创建字段
   */
  private getOrderCreateFields(
    salesOrder: SalesOrder,
    permission: PermissionLevel
  ): PermissionAwareField[] {
    const readonly = permission !== PermissionLevel.EDIT;
    
    return [
      {
        id: 'items',
        name: 'items',
        label: '订单明细',
        type: 'table',
        value: salesOrder.items,
        readonly,
        required: true,
        permission: PermissionLevel.EDIT,
      },
      {
        id: 'shippingAddress',
        name: 'shippingAddress',
        label: '送货地址',
        type: 'text',
        value: salesOrder.shippingAddress,
        readonly,
        required: true,
        permission: PermissionLevel.EDIT,
      },
      {
        id: 'billingAddress',
        name: 'billingAddress',
        label: '账单地址',
        type: 'text',
        value: salesOrder.billingAddress,
        readonly,
        required: true,
        permission: PermissionLevel.EDIT,
      },
    ];
  }

  /**
   * 审批字段
   */
  private getApprovalFields(
    salesOrder: SalesOrder,
    permission: PermissionLevel
  ): PermissionAwareField[] {
    const readonly = permission !== PermissionLevel.APPROVE;
    
    return [
      {
        id: 'approvalHistory',
        name: 'approvalHistory',
        label: '审批历史',
        type: 'table',
        value: [],
        readonly: true,
        required: false,
        permission: PermissionLevel.VIEW,
      },
      {
        id: 'deptApproval',
        name: 'deptApproval',
        label: '部门经理意见',
        type: 'textarea',
        value: salesOrder.approvalComment || '',
        readonly: true,
        required: false,
        permission: PermissionLevel.VIEW,
      },
    ];
  }

  /**
   * 财务字段
   */
  private getFinanceFields(
    salesOrder: SalesOrder,
    permission: PermissionLevel
  ): PermissionAwareField[] {
    const readonly = permission !== PermissionLevel.EDIT;
    
    return [
      {
        id: 'invoiceNumber',
        name: 'invoiceNumber',
        label: '发票号',
        type: 'text',
        value: '',
        readonly,
        required: true,
        permission: PermissionLevel.EDIT,
      },
      {
        id: 'paymentStatus',
        name: 'paymentStatus',
        label: '付款状态',
        type: 'enum',
        value: 'PENDING',
        readonly,
        required: true,
        permission: PermissionLevel.EDIT,
      },
    ];
  }

  /**
   * 库存字段
   */
  private getInventoryFields(
    salesOrder: SalesOrder,
    permission: PermissionLevel
  ): PermissionAwareField[] {
    const readonly = permission !== PermissionLevel.EDIT;
    
    return [
      {
        id: 'reservationId',
        name: 'reservationId',
        label: '预留单号',
        type: 'text',
        value: '',
        readonly,
        required: true,
        permission: PermissionLevel.EDIT,
      },
      {
        id: 'stockStatus',
        name: 'stockStatus',
        label: '库存状态',
        type: 'enum',
        value: 'PENDING',
        readonly,
        required: true,
        permission: PermissionLevel.EDIT,
      },
    ];
  }

  /**
   * 获取可用操作
   */
  private getAvailableActions(
    nodePermission: PermissionRule,
    userPermission: PermissionLevel
  ): TaskAction[] {
    if (userPermission === PermissionLevel.APPROVE) {
      return nodePermission.actions.length > 0 ? nodePermission.actions : DEFAULT_APPROVE_ACTIONS;
    }
    
    if (userPermission === PermissionLevel.EDIT) {
      return DEFAULT_VIEW_ACTIONS;
    }
    
    return [];
  }

  /**
   * 获取并行任务组
   */
  private async getParallelTasks(
    orderId: string,
    context: PermissionContext
  ): Promise<ParallelTaskGroup[]> {
    // 实际实现中，查询同一流程实例中的所有活动任务
    // GET /task?processInstanceId={instanceId}
    
    // 模拟返回
    return [
      {
        groupId: 'approval-group',
        groupName: '审批任务',
        tasks: [],
      },
    ];
  }

  /**
   * 执行任务操作
   * 基于Task ID进行操作
   */
  async executeTaskOperation(
    taskId: string,
    operation: TaskOperation,
    variables?: Record<string, unknown>,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    switch (operation) {
      case TaskOperation.COMPLETE:
        // 调用Camunda完成任务
        // POST /task/{taskId}/complete
        console.log(`Complete task ${taskId}`, variables);
        return { success: true, message: '任务已完成' };
        
      case TaskOperation.CLAIM:
        // 调用Camunda签收任务
        // POST /task/{taskId}/claim
        console.log(`Claim task ${taskId} by ${userId}`);
        return { success: true, message: '任务已签收' };
        
      case TaskOperation.DELEGATE:
        // 调用Camunda转派任务
        // POST /task/{taskId}/delegate
        console.log(`Delegate task ${taskId}`, variables);
        return { success: true, message: '任务已转派' };
        
      case TaskOperation.RESOLVE:
        // 调用Camunda解决任务
        console.log(`Resolve task ${taskId}`, variables);
        return { success: true, message: '任务已解决' };
        
      default:
        return { success: false, message: '未知操作' };
    }
  }
}

// 导出服务实例
export const dynamicSchemaService = new DynamicSchemaService();
