"use strict";
// =====================================================
// PRAM3 ERP Frontend - Dynamic Form Schemas
// 动态表单模式定义 - 对应Camunda UserTask
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.formSchemaRepository = exports.vpApprovalSchema = exports.directorApprovalSchema = exports.deptManagerApprovalSchema = exports.FieldType = void 0;
exports.getFormSchema = getFormSchema;
/**
 * 表单字段类型
 */
var FieldType;
(function (FieldType) {
    FieldType["TEXT"] = "text";
    FieldType["TEXTAREA"] = "textarea";
    FieldType["NUMBER"] = "number";
    FieldType["ENUM"] = "enum";
    FieldType["DATE"] = "date";
    FieldType["BOOLEAN"] = "boolean";
    FieldType["FILE"] = "file";
    FieldType["TABLE"] = "table";
})(FieldType || (exports.FieldType = FieldType = {}));
// ==================== 审批表单模式定义 ====================
/**
 * 部门经理审批表单
 */
exports.deptManagerApprovalSchema = {
    id: 'dept-manager-approval-form',
    name: '部门经理审批表单',
    version: '1.0',
    sections: [
        {
            id: 'order-info',
            title: '订单信息',
            order: 1,
            fields: [
                {
                    id: 'orderNumber',
                    name: 'orderNumber',
                    label: '订单号',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.orderNumber}',
                },
                {
                    id: 'customerName',
                    name: 'customerName',
                    label: '客户名称',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.customer.name}',
                },
                {
                    id: 'totalAmount',
                    name: 'totalAmount',
                    label: '订单金额',
                    type: FieldType.NUMBER,
                    readonly: true,
                    defaultValue: '${order.totalAmount}',
                    unit: '元',
                },
                {
                    id: 'itemCount',
                    name: 'itemCount',
                    label: '商品数量',
                    type: FieldType.NUMBER,
                    readonly: true,
                    defaultValue: '${order.items.length}',
                },
            ],
        },
        {
            id: 'approval-section',
            title: '审批操作',
            order: 2,
            fields: [
                {
                    id: 'approvalAction',
                    name: 'approvalAction',
                    label: '审批操作',
                    type: FieldType.ENUM,
                    required: true,
                    options: [
                        { value: 'approve', label: '通过' },
                        { value: 'reject', label: '拒绝' },
                    ],
                },
                {
                    id: 'approvalComment',
                    name: 'approvalComment',
                    label: '审批意见',
                    type: FieldType.TEXTAREA,
                    required: true,
                    placeholder: '请输入审批意见...',
                    rows: 4,
                    maxLength: 500,
                },
            ],
        },
    ],
    actions: [
        {
            id: 'submit',
            label: '提交审批',
            type: 'submit',
            style: 'primary',
            confirmation: '确认提交审批结果？',
        },
        {
            id: 'cancel',
            label: '取消',
            type: 'cancel',
            style: 'secondary',
        },
    ],
};
/**
 * 总监审批表单
 */
exports.directorApprovalSchema = {
    id: 'director-approval-form',
    name: '总监审批表单',
    version: '1.0',
    sections: [
        {
            id: 'order-info',
            title: '订单信息',
            order: 1,
            fields: [
                {
                    id: 'orderNumber',
                    name: 'orderNumber',
                    label: '订单号',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.orderNumber}',
                },
                {
                    id: 'customerName',
                    name: 'customerName',
                    label: '客户名称',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.customer.name}',
                },
                {
                    id: 'totalAmount',
                    name: 'totalAmount',
                    label: '订单金额',
                    type: FieldType.NUMBER,
                    readonly: true,
                    defaultValue: '${order.totalAmount}',
                    unit: '元',
                },
                {
                    id: 'deptApproval',
                    name: 'deptApproval',
                    label: '部门经理审批意见',
                    type: FieldType.TEXTAREA,
                    readonly: true,
                },
                {
                    id: 'approvalHistory',
                    name: 'approvalHistory',
                    label: '审批历史',
                    type: FieldType.TABLE,
                    columns: [
                        { key: 'approver', label: '审批人', type: FieldType.TEXT },
                        { key: 'action', label: '操作', type: FieldType.TEXT },
                        { key: 'comment', label: '意见', type: FieldType.TEXT },
                        { key: 'timestamp', label: '时间', type: FieldType.DATE },
                    ],
                },
            ],
        },
        {
            id: 'approval-section',
            title: '审批操作',
            order: 2,
            fields: [
                {
                    id: 'approvalAction',
                    name: 'approvalAction',
                    label: '审批操作',
                    type: FieldType.ENUM,
                    required: true,
                    options: [
                        { value: 'approve', label: '通过' },
                        { value: 'reject', label: '拒绝' },
                    ],
                },
                {
                    id: 'approvalComment',
                    name: 'approvalComment',
                    label: '审批意见',
                    type: FieldType.TEXTAREA,
                    required: true,
                    placeholder: '请输入审批意见...',
                    rows: 4,
                    maxLength: 500,
                },
            ],
        },
    ],
    actions: [
        {
            id: 'submit',
            label: '提交审批',
            type: 'submit',
            style: 'primary',
            confirmation: '确认提交审批结果？',
        },
        {
            id: 'cancel',
            label: '取消',
            type: 'cancel',
            style: 'secondary',
        },
    ],
};
/**
 * VP/总经理审批表单
 */
exports.vpApprovalSchema = {
    id: 'vp-approval-form',
    name: 'VP/总经理审批表单',
    version: '1.0',
    sections: [
        {
            id: 'order-info',
            title: '订单信息',
            order: 1,
            fields: [
                {
                    id: 'orderNumber',
                    name: 'orderNumber',
                    label: '订单号',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.orderNumber}',
                },
                {
                    id: 'customerName',
                    name: 'customerName',
                    label: '客户名称',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.customer.name}',
                },
                {
                    id: 'totalAmount',
                    name: 'totalAmount',
                    label: '订单金额',
                    type: FieldType.NUMBER,
                    readonly: true,
                    defaultValue: '${order.totalAmount}',
                    unit: '元',
                },
                {
                    id: 'customerCredit',
                    name: 'customerCredit',
                    label: '客户信用评级',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.customer.creditRating}',
                },
                {
                    id: 'approvalHistory',
                    name: 'approvalHistory',
                    label: '审批历史',
                    type: FieldType.TABLE,
                    columns: [
                        { key: 'approver', label: '审批人', type: FieldType.TEXT },
                        { key: 'level', label: '级别', type: FieldType.TEXT },
                        { key: 'action', label: '操作', type: FieldType.TEXT },
                        { key: 'comment', label: '意见', type: FieldType.TEXT },
                        { key: 'timestamp', label: '时间', type: FieldType.DATE },
                    ],
                },
            ],
        },
        {
            id: 'approval-section',
            title: '审批操作',
            order: 2,
            fields: [
                {
                    id: 'approvalAction',
                    name: 'approvalAction',
                    label: '审批操作',
                    type: FieldType.ENUM,
                    required: true,
                    options: [
                        { value: 'approve', label: '通过' },
                        { value: 'reject', label: '拒绝' },
                    ],
                },
                {
                    id: 'approvalComment',
                    name: 'approvalComment',
                    label: '审批意见',
                    type: FieldType.TEXTAREA,
                    required: true,
                    placeholder: '请输入审批意见...',
                    rows: 4,
                    maxLength: 500,
                },
                {
                    id: 'vipApproval',
                    name: 'vipApproval',
                    label: '特殊审批标记',
                    type: FieldType.BOOLEAN,
                    checkboxStyle: 'switch',
                    conditionalDisplay: {
                        dependsOn: 'totalAmount',
                        operator: 'greaterThan',
                        value: 500000,
                    },
                },
            ],
        },
    ],
    actions: [
        {
            id: 'submit',
            label: '提交审批',
            type: 'submit',
            style: 'primary',
            confirmation: '确认提交审批结果？',
        },
        {
            id: 'cancel',
            label: '取消',
            type: 'cancel',
            style: 'secondary',
        },
    ],
};
/**
 * 表单模式仓库
 */
exports.formSchemaRepository = {
    'dept-manager-approval-form': exports.deptManagerApprovalSchema,
    'director-approval-form': exports.directorApprovalSchema,
    'vp-approval-form': exports.vpApprovalSchema,
};
/**
 * 根据表单Key获取模式
 */
function getFormSchema(formKey) {
    return exports.formSchemaRepository[formKey] || null;
}
//# sourceMappingURL=form-schemas.js.map