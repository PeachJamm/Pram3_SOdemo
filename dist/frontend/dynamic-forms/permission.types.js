"use strict";
// =====================================================
// PRAM3 ERP Core - Permission Types
// 权限类型定义 - 三级控制：VIEW / EDIT / APPROVE
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ADMIN_ACTIONS = exports.DEFAULT_VIEW_ACTIONS = exports.DEFAULT_APPROVE_ACTIONS = exports.TaskOperation = exports.PermissionLevel = void 0;
/**
 * 权限级别
 */
var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel["VIEW"] = "VIEW";
    PermissionLevel["EDIT"] = "EDIT";
    PermissionLevel["APPROVE"] = "APPROVE";
})(PermissionLevel || (exports.PermissionLevel = PermissionLevel = {}));
/**
 * 任务操作类型
 */
var TaskOperation;
(function (TaskOperation) {
    TaskOperation["COMPLETE"] = "complete";
    TaskOperation["CLAIM"] = "claim";
    TaskOperation["DELEGATE"] = "delegate";
    TaskOperation["RESOLVE"] = "resolve";
})(TaskOperation || (exports.TaskOperation = TaskOperation = {}));
// 默认审批操作
exports.DEFAULT_APPROVE_ACTIONS = [
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
exports.DEFAULT_VIEW_ACTIONS = [
    {
        id: TaskOperation.CLAIM,
        label: '签收',
        icon: '📥',
    },
];
// 默认管理操作
exports.DEFAULT_ADMIN_ACTIONS = [
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
//# sourceMappingURL=permission.types.js.map