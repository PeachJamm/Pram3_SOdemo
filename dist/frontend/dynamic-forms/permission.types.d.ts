/**
 * 权限级别
 */
export declare enum PermissionLevel {
    VIEW = "VIEW",// 可见
    EDIT = "EDIT",// 可编辑
    APPROVE = "APPROVE"
}
/**
 * 任务操作类型
 */
export declare enum TaskOperation {
    COMPLETE = "complete",
    CLAIM = "claim",
    DELEGATE = "delegate",
    RESOLVE = "resolve"
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
    id: string;
    nodeId: string;
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
    taskId: string;
    nodeId: string;
    permissionLevel: PermissionLevel;
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
    readonly: boolean;
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
export declare const DEFAULT_APPROVE_ACTIONS: TaskAction[];
export declare const DEFAULT_VIEW_ACTIONS: TaskAction[];
export declare const DEFAULT_ADMIN_ACTIONS: TaskAction[];
//# sourceMappingURL=permission.types.d.ts.map