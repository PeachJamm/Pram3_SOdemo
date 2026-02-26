"use strict";
// =====================================================
// PRAM3 ERP Frontend - Dynamic Form Schemas
// 鍔ㄦ€佽〃鍗曟ā寮忓畾涔?- 瀵瑰簲Camunda UserTask
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.formSchemaRepository = exports.vpApprovalSchema = exports.directorApprovalSchema = exports.deptManagerApprovalSchema = exports.FieldType = void 0;
exports.getFormSchema = getFormSchema;
/**
 * 琛ㄥ崟瀛楁绫诲瀷
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
// ==================== 瀹℃壒琛ㄥ崟妯″紡瀹氫箟 ====================
/**
 * 閮ㄩ棬缁忕悊瀹℃壒琛ㄥ崟
 */
exports.deptManagerApprovalSchema = {
    id: 'dept-manager-approval-form',
    name: '閮ㄩ棬缁忕悊瀹℃壒琛ㄥ崟',
    version: '1.0',
    sections: [
        {
            id: 'order-info',
            title: '璁㈠崟淇℃伅',
            order: 1,
            fields: [
                {
                    id: 'orderNumber',
                    name: 'orderNumber',
                    label: '璁㈠崟鍙?,,
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.orderNumber}',
                },
                {
                    id: 'customerName',
                    name: 'customerName',
                    label: '瀹㈡埛鍚嶇О',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.customer.name}',
                },
                {
                    id: 'totalAmount',
                    name: 'totalAmount',
                    label: '璁㈠崟閲戦',
                    type: FieldType.NUMBER,
                    readonly: true,
                    defaultValue: '${order.totalAmount}',
                    unit: '鍏?,
                },
                {
                    id: 'itemCount',
                    name: 'itemCount',
                    label: '鍟嗗搧鏁伴噺',
                    type: FieldType.NUMBER,
                    readonly: true,
                    defaultValue: '${order.items.length}',
                },
            ],
        },
        {
            id: 'approval-section',
            title: '瀹℃壒鎿嶄綔',
            order: 2,
            fields: [
                {
                    id: 'approvalAction',
                    name: 'approvalAction',
                    label: '瀹℃壒鎿嶄綔',
                    type: FieldType.ENUM,
                    required: true,
                    options: [
                        { value: 'approve', label: '閫氳繃' },
                        { value: 'reject', label: '鎷掔粷' },
                    ],
                },
                {
                    id: 'approvalComment',
                    name: 'approvalComment',
                    label: '瀹℃壒鎰忚',
                    type: FieldType.TEXTAREA,
                    required: true,
                    placeholder: '璇疯緭鍏ュ鎵规剰瑙?..',
                    rows: 4,
                    maxLength: 500,
                },
            ],
        },
    ],
    actions: [
        {
            id: 'submit',
            label: '鎻愪氦瀹℃壒',
            type: 'submit',
            style: 'primary',
            confirmation: '纭鎻愪氦瀹℃壒缁撴灉锛?,
        },
        {
            id: 'cancel',
            label: '鍙栨秷',
            type: 'cancel',
            style: 'secondary',
        },
    ],
};
/**
 * 鎬荤洃瀹℃壒琛ㄥ崟
 */
exports.directorApprovalSchema = {
    id: 'director-approval-form',
    name: '鎬荤洃瀹℃壒琛ㄥ崟',
    version: '1.0',
    sections: [
        {
            id: 'order-info',
            title: '璁㈠崟淇℃伅',
            order: 1,
            fields: [
                {
                    id: 'orderNumber',
                    name: 'orderNumber',
                    label: '璁㈠崟鍙?,,
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.orderNumber}',
                },
                {
                    id: 'customerName',
                    name: 'customerName',
                    label: '瀹㈡埛鍚嶇О',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.customer.name}',
                },
                {
                    id: 'totalAmount',
                    name: 'totalAmount',
                    label: '璁㈠崟閲戦',
                    type: FieldType.NUMBER,
                    readonly: true,
                    defaultValue: '${order.totalAmount}',
                    unit: '鍏?,
                },
                {
                    id: 'deptApproval',
                    name: 'deptApproval',
                    label: '閮ㄩ棬缁忕悊瀹℃壒鎰忚',
                    type: FieldType.TEXTAREA,
                    readonly: true,
                },
                {
                    id: 'approvalHistory',
                    name: 'approvalHistory',
                    label: '瀹℃壒鍘嗗彶',
                    type: FieldType.TABLE,
                    columns: [
                        { key: 'approver', label: '瀹℃壒浜?, type: FieldType.TEXT }, },
                        { key: 'action', label: '鎿嶄綔', type: FieldType.TEXT },
                        { key: 'comment', label: '鎰忚', type: FieldType.TEXT },
                        { key: 'timestamp', label: '鏃堕棿', type: FieldType.DATE },
                    ],
                },
            ],
        },
        {
            id: 'approval-section',
            title: '瀹℃壒鎿嶄綔',
            order: 2,
            fields: [
                {
                    id: 'approvalAction',
                    name: 'approvalAction',
                    label: '瀹℃壒鎿嶄綔',
                    type: FieldType.ENUM,
                    required: true,
                    options: [
                        { value: 'approve', label: '閫氳繃' },
                        { value: 'reject', label: '鎷掔粷' },
                    ],
                },
                {
                    id: 'approvalComment',
                    name: 'approvalComment',
                    label: '瀹℃壒鎰忚',
                    type: FieldType.TEXTAREA,
                    required: true,
                    placeholder: '璇疯緭鍏ュ鎵规剰瑙?..',
                    rows: 4,
                    maxLength: 500,
                },
            ],
        },
    ],
    actions: [
        {
            id: 'submit',
            label: '鎻愪氦瀹℃壒',
            type: 'submit',
            style: 'primary',
            confirmation: '纭鎻愪氦瀹℃壒缁撴灉锛?,
        },
        {
            id: 'cancel',
            label: '鍙栨秷',
            type: 'cancel',
            style: 'secondary',
        },
    ],
};
/**
 * VP/鎬荤粡鐞嗗鎵硅〃鍗? */
exports.vpApprovalSchema = {
    id: 'vp-approval-form',
    name: 'VP/鎬荤粡鐞嗗鎵硅〃鍗?,,
    version: '1.0',
    sections: [
        {
            id: 'order-info',
            title: '璁㈠崟淇℃伅',
            order: 1,
            fields: [
                {
                    id: 'orderNumber',
                    name: 'orderNumber',
                    label: '璁㈠崟鍙?,,
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.orderNumber}',
                },
                {
                    id: 'customerName',
                    name: 'customerName',
                    label: '瀹㈡埛鍚嶇О',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.customer.name}',
                },
                {
                    id: 'totalAmount',
                    name: 'totalAmount',
                    label: '璁㈠崟閲戦',
                    type: FieldType.NUMBER,
                    readonly: true,
                    defaultValue: '${order.totalAmount}',
                    unit: '鍏?,
                },
                {
                    id: 'customerCredit',
                    name: 'customerCredit',
                    label: '瀹㈡埛淇＄敤璇勭骇',
                    type: FieldType.TEXT,
                    readonly: true,
                    defaultValue: '${order.customer.creditRating}',
                },
                {
                    id: 'approvalHistory',
                    name: 'approvalHistory',
                    label: '瀹℃壒鍘嗗彶',
                    type: FieldType.TABLE,
                    columns: [
                        { key: 'approver', label: '瀹℃壒浜?, type: FieldType.TEXT }, },
                        { key: 'level', label: '绾у埆', type: FieldType.TEXT },
                        { key: 'action', label: '鎿嶄綔', type: FieldType.TEXT },
                        { key: 'comment', label: '鎰忚', type: FieldType.TEXT },
                        { key: 'timestamp', label: '鏃堕棿', type: FieldType.DATE },
                    ],
                },
            ],
        },
        {
            id: 'approval-section',
            title: '瀹℃壒鎿嶄綔',
            order: 2,
            fields: [
                {
                    id: 'approvalAction',
                    name: 'approvalAction',
                    label: '瀹℃壒鎿嶄綔',
                    type: FieldType.ENUM,
                    required: true,
                    options: [
                        { value: 'approve', label: '閫氳繃' },
                        { value: 'reject', label: '鎷掔粷' },
                    ],
                },
                {
                    id: 'approvalComment',
                    name: 'approvalComment',
                    label: '瀹℃壒鎰忚',
                    type: FieldType.TEXTAREA,
                    required: true,
                    placeholder: '璇疯緭鍏ュ鎵规剰瑙?..',
                    rows: 4,
                    maxLength: 500,
                },
                {
                    id: 'vipApproval',
                    name: 'vipApproval',
                    label: '鐗规畩瀹℃壒鏍囪',
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
            label: '鎻愪氦瀹℃壒',
            type: 'submit',
            style: 'primary',
            confirmation: '纭鎻愪氦瀹℃壒缁撴灉锛?,
        },
        {
            id: 'cancel',
            label: '鍙栨秷',
            type: 'cancel',
            style: 'secondary',
        },
    ],
};
/**
 * 琛ㄥ崟妯″紡浠撳簱
 */
exports.formSchemaRepository = {
    'dept-manager-approval-form': exports.deptManagerApprovalSchema,
    'director-approval-form': exports.directorApprovalSchema,
    'vp-approval-form': exports.vpApprovalSchema,
};
/**
 * 鏍规嵁琛ㄥ崟Key鑾峰彇妯″紡
 */
function getFormSchema(formKey) {
    return exports.formSchemaRepository[formKey] || null;
}
//# sourceMappingURL=form-schemas.js.map