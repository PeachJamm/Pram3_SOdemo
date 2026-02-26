"use strict";
// =====================================================
// PRAM3 ERP Core - Dynamic Schema Assembly Service
// 鍔ㄦ€丼chema缁勮鏈嶅姟 - 鍚庣鏍规嵁鏉冮檺杩斿洖瀛楁readonly灞炴€?// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicSchemaService = void 0;
const sales_order_types_1 = require("../../domains/sales/models/sales-order.types");
const camunda_integration_service_1 = require("../../orchestration/camunda-integration.service");
const permission_types_1 = require("./permission.types");
/**
 * 鑺傜偣鏉冮檺閰嶇疆瑙勫垯
 */
const NODE_PERMISSION_RULES = {
    'node-order-create': {
        nodeId: 'node-order-create',
        userRoles: ['SALES', 'ADMIN'],
        basePermission: permission_types_1.PermissionLevel.EDIT,
        fieldPermissions: {
            customerId: permission_types_1.PermissionLevel.EDIT,
            items: permission_types_1.PermissionLevel.EDIT,
            shippingAddress: permission_types_1.PermissionLevel.EDIT,
            billingAddress: permission_types_1.PermissionLevel.EDIT,
            notes: permission_types_1.PermissionLevel.EDIT,
        },
        actions: [
            { id: permission_types_1.TaskOperation.COMPLETE, label: '鍒涘缓', icon: '鉁?, nextState: ', PENDING_APPROVAL, ' },:  }
        ],
    },
    'node-order-review': {
        nodeId: 'node-order-review',
        userRoles: ['QC', 'ADMIN'],
        basePermission: permission_types_1.PermissionLevel.EDIT,
        fieldPermissions: {
            qualityCheck: permission_types_1.PermissionLevel.EDIT,
            notes: permission_types_1.PermissionLevel.EDIT,
        },
        actions: permission_types_1.DEFAULT_APPROVE_ACTIONS,
    },
    'node-approval-level1': {
        nodeId: 'node-approval-level1',
        userRoles: ['DEPT_MANAGER', 'ADMIN'],
        basePermission: permission_types_1.PermissionLevel.APPROVE,
        fieldPermissions: {
            approvalAction: permission_types_1.PermissionLevel.APPROVE,
            approvalComment: permission_types_1.PermissionLevel.APPROVE,
            orderInfo: permission_types_1.PermissionLevel.VIEW,
        },
        actions: permission_types_1.DEFAULT_APPROVE_ACTIONS,
    },
    'node-approval-level2': {
        nodeId: 'node-approval-level2',
        userRoles: ['DIRECTOR', 'ADMIN'],
        basePermission: permission_types_1.PermissionLevel.APPROVE,
        fieldPermissions: {
            approvalAction: permission_types_1.PermissionLevel.APPROVE,
            approvalComment: permission_types_1.PermissionLevel.APPROVE,
            orderInfo: permission_types_1.PermissionLevel.VIEW,
            deptApproval: permission_types_1.PermissionLevel.VIEW,
        },
        actions: permission_types_1.DEFAULT_APPROVE_ACTIONS,
    },
    'node-approval-level3': {
        nodeId: 'node-approval-level3',
        userRoles: ['VP', 'ADMIN'],
        basePermission: permission_types_1.PermissionLevel.APPROVE,
        fieldPermissions: {
            approvalAction: permission_types_1.PermissionLevel.APPROVE,
            approvalComment: permission_types_1.PermissionLevel.APPROVE,
            vipApproval: permission_types_1.PermissionLevel.APPROVE,
        },
        actions: permission_types_1.DEFAULT_APPROVE_ACTIONS,
    },
    'node-finance': {
        nodeId: 'node-finance',
        userRoles: ['FINANCE', 'ADMIN'],
        basePermission: permission_types_1.PermissionLevel.EDIT,
        fieldPermissions: {
            invoiceNumber: permission_types_1.PermissionLevel.EDIT,
            paymentStatus: permission_types_1.PermissionLevel.EDIT,
        },
        actions: permission_types_1.DEFAULT_APPROVE_ACTIONS,
    },
    'node-inventory': {
        nodeId: 'node-inventory',
        userRoles: ['WAREHOUSE', 'ADMIN'],
        basePermission: permission_types_1.PermissionLevel.EDIT,
        fieldPermissions: {
            reservationId: permission_types_1.PermissionLevel.EDIT,
            stockStatus: permission_types_1.PermissionLevel.EDIT,
        },
        actions: permission_types_1.DEFAULT_APPROVE_ACTIONS,
    },
    'node-notification': {
        nodeId: 'node-notification',
        userRoles: ['SYSTEM', 'ADMIN'],
        basePermission: permission_types_1.PermissionLevel.VIEW,
        fieldPermissions: {
            notificationSent: permission_types_1.PermissionLevel.VIEW,
        },
        actions: [],
    },
};
/**
 * 鍔ㄦ€丼chema缁勮鏈嶅姟
 */
class DynamicSchemaService {
    constructor(camundaService) {
        this.camundaService = camundaService || new camunda_integration_service_1.CamundaIntegrationService();
    }
    /**
     * 鑾峰彇浠诲姟瀵瑰簲鐨勫姩鎬丼chema
     * 鍚庣缁勮锛屽墠绔浂閰嶇疆
     */
    async getDynamicSchema(taskId, salesOrder, context) {
        // 1. 鑾峰彇Camunda浠诲姟淇℃伅
        const task = await this.getTaskInfo(taskId);
        // 2. 纭畾鐢ㄦ埛鏉冮檺绾у埆
        const permissionLevel = this.determinePermissionLevel(context, task);
        // 3. 鑾峰彇鑺傜偣鏉冮檺瑙勫垯
        const nodePermission = this.getNodePermission(task.nodeId, context.userRoles);
        // 4. 缁勮甯︽潈闄愮殑瀛楁
        const fields = this.assembleFields(salesOrder, nodePermission, permissionLevel);
        // 5. 鑾峰彇鍙敤鎿嶄綔
        const actions = this.getAvailableActions(nodePermission, permissionLevel);
        // 6. 鑾峰彇骞惰浠诲姟缁?    const parallelGroups = await this.getParallelTasks(salesOrder.id, context);
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
     * 鑾峰彇浠诲姟淇℃伅
     */
    async getTaskInfo(taskId) {
        // 瀹為檯瀹炵幇涓紝璋冪敤Camunda API鑾峰彇浠诲姟璇︽儏
        // GET /task/{taskId}
        // 妯℃嫙杩斿洖
        return {
            id: taskId,
            nodeId: 'node-approval-level1',
            name: '閮ㄩ棬缁忕悊瀹℃壒',
            assignee: 'current-user',
            formKey: 'dept-manager-approval-form',
            priority: 0,
            permissionLevel: permission_types_1.PermissionLevel.APPROVE,
            availableActions: permission_types_1.DEFAULT_APPROVE_ACTIONS,
        };
    }
    /**
     * 纭畾鐢ㄦ埛鏉冮檺绾у埆
     */
    determinePermissionLevel(context, task) {
        // 濡傛灉浠诲姟鏄綋鍓嶇敤鎴风殑
        if (task.assignee === context.userId) {
            return permission_types_1.PermissionLevel.APPROVE;
        }
        // 濡傛灉鐢ㄦ埛鍦ㄥ€欓€夌粍涓?    if (task.candidateGroups?.some(role => context.userRoles.includes(role))) {
        return permission_types_1.PermissionLevel.EDIT;
    }
}
exports.DynamicSchemaService = DynamicSchemaService;
// 鏌ョ湅鏉冮檺
return permission_types_1.PermissionLevel.VIEW;
getNodePermission(nodeId, string, userRoles, string[]);
permission_types_1.PermissionRule;
{
    const rule = NODE_PERMISSION_RULES[nodeId];
    if (rule) {
        // 妫€鏌ョ敤鎴疯鑹叉槸鍚﹀尮閰?      const hasAccess = rule.userRoles.some(role => userRoles.includes(role));
        if (hasAccess) {
            return rule;
        }
    }
    // 榛樿鍙鏉冮檺
    return {
        nodeId,
        userRoles: [],
        basePermission: permission_types_1.PermissionLevel.VIEW,
        fieldPermissions: {},
        actions: [],
    };
}
assembleFields(salesOrder, sales_order_types_1.SalesOrder, nodePermission, permission_types_1.PermissionRule, userPermission, permission_types_1.PermissionLevel);
permission_types_1.PermissionAwareField[];
{
    const fields = [];
    // 璁㈠崟鍩烘湰淇℃伅锛堝彧璇伙級
    fields.push({
        id: 'orderNumber',
        name: 'orderNumber',
        label: '璁㈠崟鍙?,,
        type: 'text',
        value: salesOrder.orderNumber,
        readonly: true,
        required: false,
        permission: permission_types_1.PermissionLevel.VIEW,
    });
    fields.push({
        id: 'customerName',
        name: 'customerName',
        label: '瀹㈡埛鍚嶇О',
        type: 'text',
        value: salesOrder.customer.name,
        readonly: true,
        required: false,
        permission: permission_types_1.PermissionLevel.VIEW,
    });
    fields.push({
        id: 'totalAmount',
        name: 'totalAmount',
        label: '璁㈠崟閲戦',
        type: 'number',
        value: salesOrder.totalAmount,
        readonly: true,
        required: false,
        permission: permission_types_1.PermissionLevel.VIEW,
    });
    fields.push({
        id: 'status',
        name: 'status',
        label: '鐘舵€?,,
        type: 'text',
        value: salesOrder.status,
        readonly: true,
        required: false,
        permission: permission_types_1.PermissionLevel.VIEW,
    });
    // 瀹℃壒鐩稿叧瀛楁锛堟牴鎹潈闄愬姩鎬佽缃畆eadonly锛?    if (userPermission === PermissionLevel.APPROVE || userPermission === PermissionLevel.EDIT) {
    fields.push({
        id: 'approvalAction',
        name: 'approvalAction',
        label: '瀹℃壒鎿嶄綔',
        type: 'enum',
        value: '',
        readonly: userPermission !== permission_types_1.PermissionLevel.APPROVE,
        required: true,
        permission: permission_types_1.PermissionLevel.APPROVE,
    });
    fields.push({
        id: 'approvalComment',
        name: 'approvalComment',
        label: '瀹℃壒鎰忚',
        type: 'textarea',
        value: '',
        readonly: userPermission !== permission_types_1.PermissionLevel.APPROVE,
        required: true,
        permission: permission_types_1.PermissionLevel.APPROVE,
        validation: {
            maxLength: 500,
        },
    });
}
// 鏍规嵁鑺傜偣绫诲瀷娣诲姞鐗瑰畾瀛楁
const nodeFields = this.getNodeSpecificFields(nodePermission.nodeId, salesOrder, userPermission);
fields.push(...nodeFields);
return fields;
getNodeSpecificFields(nodeId, string, salesOrder, sales_order_types_1.SalesOrder, permission, permission_types_1.PermissionLevel);
permission_types_1.PermissionAwareField[];
{
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
getOrderCreateFields(salesOrder, sales_order_types_1.SalesOrder, permission, permission_types_1.PermissionLevel);
permission_types_1.PermissionAwareField[];
{
    const readonly = permission !== permission_types_1.PermissionLevel.EDIT;
    return [
        {
            id: 'items',
            name: 'items',
            label: '璁㈠崟鏄庣粏',
            type: 'table',
            value: salesOrder.items,
            readonly,
            required: true,
            permission: permission_types_1.PermissionLevel.EDIT,
        },
        {
            id: 'shippingAddress',
            name: 'shippingAddress',
            label: '閫佽揣鍦板潃',
            type: 'text',
            value: salesOrder.shippingAddress,
            readonly,
            required: true,
            permission: permission_types_1.PermissionLevel.EDIT,
        },
        {
            id: 'billingAddress',
            name: 'billingAddress',
            label: '璐﹀崟鍦板潃',
            type: 'text',
            value: salesOrder.billingAddress,
            readonly,
            required: true,
            permission: permission_types_1.PermissionLevel.EDIT,
        },
    ];
}
getApprovalFields(salesOrder, sales_order_types_1.SalesOrder, permission, permission_types_1.PermissionLevel);
permission_types_1.PermissionAwareField[];
{
    const readonly = permission !== permission_types_1.PermissionLevel.APPROVE;
    return [
        {
            id: 'approvalHistory',
            name: 'approvalHistory',
            label: '瀹℃壒鍘嗗彶',
            type: 'table',
            value: [],
            readonly: true,
            required: false,
            permission: permission_types_1.PermissionLevel.VIEW,
        },
        {
            id: 'deptApproval',
            name: 'deptApproval',
            label: '閮ㄩ棬缁忕悊鎰忚',
            type: 'textarea',
            value: salesOrder.approvalComment || '',
            readonly: true,
            required: false,
            permission: permission_types_1.PermissionLevel.VIEW,
        },
    ];
}
getFinanceFields(salesOrder, sales_order_types_1.SalesOrder, permission, permission_types_1.PermissionLevel);
permission_types_1.PermissionAwareField[];
{
    const readonly = permission !== permission_types_1.PermissionLevel.EDIT;
    return [
        {
            id: 'invoiceNumber',
            name: 'invoiceNumber',
            label: '鍙戠エ鍙?,,
            type: 'text',
            value: '',
            readonly,
            required: true,
            permission: permission_types_1.PermissionLevel.EDIT,
        },
        {
            id: 'paymentStatus',
            name: 'paymentStatus',
            label: '浠樻鐘舵€?,,
            type: 'enum',
            value: 'PENDING',
            readonly,
            required: true,
            permission: permission_types_1.PermissionLevel.EDIT,
        },
    ];
}
getInventoryFields(salesOrder, sales_order_types_1.SalesOrder, permission, permission_types_1.PermissionLevel);
permission_types_1.PermissionAwareField[];
{
    const readonly = permission !== permission_types_1.PermissionLevel.EDIT;
    return [
        {
            id: 'reservationId',
            name: 'reservationId',
            label: '棰勭暀鍗曞彿',
            type: 'text',
            value: '',
            readonly,
            required: true,
            permission: permission_types_1.PermissionLevel.EDIT,
        },
        {
            id: 'stockStatus',
            name: 'stockStatus',
            label: '搴撳瓨鐘舵€?,,
            type: 'enum',
            value: 'PENDING',
            readonly,
            required: true,
            permission: permission_types_1.PermissionLevel.EDIT,
        },
    ];
}
getAvailableActions(nodePermission, permission_types_1.PermissionRule, userPermission, permission_types_1.PermissionLevel);
permission_types_1.TaskAction[];
{
    if (userPermission === permission_types_1.PermissionLevel.APPROVE) {
        return nodePermission.actions.length > 0 ? nodePermission.actions : permission_types_1.DEFAULT_APPROVE_ACTIONS;
    }
    if (userPermission === permission_types_1.PermissionLevel.EDIT) {
        return permission_types_1.DEFAULT_VIEW_ACTIONS;
    }
    return [];
}
async;
getParallelTasks(orderId, string, context, permission_types_1.PermissionContext);
Promise < permission_types_1.ParallelTaskGroup[] > {
    // 瀹為檯瀹炵幇涓紝鏌ヨ鍚屼竴娴佺▼瀹炰緥涓殑鎵€鏈夋椿鍔ㄤ换鍔?    // GET /task?processInstanceId={instanceId}
    // 妯℃嫙杩斿洖
    return: [
        {
            groupId: 'approval-group',
            groupName: '瀹℃壒浠诲姟',
            tasks: [],
        },
    ]
};
/**
 * 鎵ц浠诲姟鎿嶄綔
 * 鍩轰簬Task ID杩涜鎿嶄綔
 */
async;
executeTaskOperation(taskId, string, operation, permission_types_1.TaskOperation, variables ?  : Record, userId ?  : string);
Promise < { success: boolean, message: string } > {
    switch(operation) {
    },
    case: permission_types_1.TaskOperation.COMPLETE,
    // 璋冪敤Camunda瀹屾垚浠诲姟
    // POST /task/{taskId}/complete
    console, : .log(`Complete task ${taskId}`, variables),
    return: { success: true, message: '浠诲姟宸插畬鎴? };,
        case: permission_types_1.TaskOperation.CLAIM,
        // 璋冪敤Camunda绛炬敹浠诲姟
        // POST /task/{taskId}/claim
        console, : .log(`Claim task ${taskId} by ${userId}`),
        return: { success: true, message: '浠诲姟宸茬鏀? };,
            case: permission_types_1.TaskOperation.DELEGATE,
            // 璋冪敤Camunda杞淳浠诲姟
            // POST /task/{taskId}/delegate
            console, : .log(`Delegate task ${taskId}`, variables),
            return: { success: true, message: '浠诲姟宸茶浆娲? };,
                case: permission_types_1.TaskOperation.RESOLVE,
                // 璋冪敤Camunda瑙ｅ喅浠诲姟
                console, : .log(`Resolve task ${taskId}`, variables),
                return: { success: true, message: '浠诲姟宸茶В鍐? };,
                    default: ,
                    return: { success: false, message: '鏈煡鎿嶄綔' }
                }
            }
        }
        // 瀵煎嚭鏈嶅姟瀹炰緥
        ,
        // 瀵煎嚭鏈嶅姟瀹炰緥
        const: dynamicSchemaService = new DynamicSchemaService() }
};
//# sourceMappingURL=dynamic-schema.service.js.map