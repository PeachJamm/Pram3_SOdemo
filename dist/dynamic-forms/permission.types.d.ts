/**
 * 鏉冮檺绾у埆
 */
export declare enum PermissionLevel {
    VIEW = "VIEW",// 鍙
    EDIT = "EDIT",// 鍙紪杈?  APPROVE = 'APPROVE', // 鍙彁浜ゅ鎵?}
    /**
     * 浠诲姟鎿嶄綔绫诲瀷
     */
    export,
    enum,
    TaskOperation
}
/**
 * 浠诲姟鎿嶄綔瀹氫箟
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
 * 瀛楁鏉冮檺閰嶇疆
 */
export interface FieldPermission {
    fieldId: string;
    permission: PermissionLevel;
    reason?: string;
}
/**
 * 鑺傜偣鏉冮檺閰嶇疆
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
 * 骞惰浠诲姟缁? */
export interface ParallelTaskGroup {
    groupId: string;
    groupName: string;
    tasks: CamundaTask[];
}
/**
 * Camunda浠诲姟锛堝寮虹増锛? */
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
 * 鍔ㄦ€丼chema鍝嶅簲
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
 * 甯︽潈闄愮殑瀛楁
 */
export interface PermissionAwareField {
    id: string;
    name: string;
    label: string;
    type: string;
    value: unknown;
    readonly: boolean;
    permission: PermissionLevel;
    validation?: FieldValidation;
    conditionalDisplay?: ConditionalRule;
}
/**
 * 瀛楁楠岃瘉瑙勫垯
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
 * 鏉′欢鏄剧ず瑙勫垯
 */
export interface ConditionalRule {
    dependsOn: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: unknown;
}
/**
 * 鐢ㄦ埛鏉冮檺涓婁笅鏂? */
export interface PermissionContext {
    userId: string;
    userRoles: string[];
    processInstanceId: string;
    currentTaskId?: string;
}
/**
 * 鏉冮檺閰嶇疆瑙勫垯
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