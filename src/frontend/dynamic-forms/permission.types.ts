// =====================================================
// PRAM3 ERP Core - Permission Types
// 权限类型定义 - 三级控制：VIEW / EDIT / APPROVE
// =====================================================

/**
 * 权限级别
 */
export enum PermissionLevel {
  VIEW = 'VIEW',       // 可见
  EDIT = 'EDIT',       // 可编辑
  APPROVE = 'APPROVE', // 可提交审批
}

/**
 * 任务操作类型
 */
export enum TaskOperation {
  COMPLETE = 'complete',
  CLAIM = 'claim',
  DELEGATE = 'delegate',
  RESOLVE = 'resolve',
}

/**
 * 任务操作定义
 */
export interface TaskAction {
  id: TaskOperation;
  label: string;
  icon: string;
  confirm?: string;
  requiresComment?: boolean;
  nextState?: string;
}

/**
 * 字段权限配置
 */
export interface FieldPermission {
  fieldId: string;
  permission: PermissionLevel;
  reason?: string;
}

/**
 * 节点权限配置
 */
export interface NodePermission {
  nodeId: string;
  nodeName: string;
  viewFields: FieldPermission[];
  editFields: FieldPermission[];
  approveFields: FieldPermission[];
  availableActions: TaskAction[];
}

/**
 * 并行任务组
 */
export interface ParallelTaskGroup {
  groupId: string;
  groupName: string;
  tasks: CamundaTask[];
}

/**
 * Camunda任务（增强版）
 */
export interface CamundaTask {
  id: string;                    // Task ID - 操作key
  nodeId: string;                // Node ID - 业务key
  name: string;
  assignee?: string;
  candidateGroups?: string[];
  formKey?: string;
  dueDate?: Date;
  priority: number;
  variables?: Record<string, unknown>;
  permissionLevel: PermissionLevel;
  availableActions: TaskAction[];
}

/**
 * 动态Schema响应
 */
export interface DynamicSchemaResponse {
  schemaId: string;
  schemaName: string;
  taskId: string;               // 当前任务ID
  nodeId: string;               // 节点ID
  permissionLevel: PermissionLevel; // 当前用户权限
  fields: PermissionAwareField[];
  actions: TaskAction[];
  parallelGroups?: ParallelTaskGroup[];
  metadata: {
    orderId: string;
    orderNumber: string;
    processInstanceId: string;
    createdAt: Date;
  };
}

/**
 * 带权限的字段
 */
export interface PermissionAwareField {
  id: string;
  name: string;
  label: string;
  type: string;
  value: unknown;
  readonly: boolean;             // 后端根据权限动态设置
  required: boolean;
  permission: PermissionLevel;
  validation?: FieldValidation;
  conditionalDisplay?: ConditionalRule;
}

/**
 * 字段验证规则
 */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
}

/**
 * 条件显示规则
 */
export interface ConditionalRule {
  dependsOn: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: unknown;
}

/**
 * 用户权限上下文
 */
export interface PermissionContext {
  userId: string;
  userRoles: string[];
  processInstanceId: string;
  currentTaskId?: string;
}

/**
 * 权限配置规则
 */
export interface PermissionRule {
  nodeId: string;
  userRoles: string[];
  basePermission: PermissionLevel;
  fieldPermissions: Record<string, PermissionLevel>;
  actions: TaskAction[];
}

// 默认审批操作
export const DEFAULT_APPROVE_ACTIONS: TaskAction[] = [
  {
    id: TaskOperation.COMPLETE,
    label: '提交',
    icon: '✓',
    confirm: '确认提交审批结果？',
    requiresComment: true,
    nextState: 'COMPLETED',
  },
];

// 默认查看操作
export const DEFAULT_VIEW_ACTIONS: TaskAction[] = [
  {
    id: TaskOperation.CLAIM,
    label: '签收',
    icon: '📥',
  },
];

// 默认管理操作
export const DEFAULT_ADMIN_ACTIONS: TaskAction[] = [
  {
    id: TaskOperation.DELEGATE,
    label: '转派',
    icon: '↪',
    requiresComment: true,
  },
  {
    id: TaskOperation.RESOLVE,
    label: '解决',
    icon: '✓',
  },
];
