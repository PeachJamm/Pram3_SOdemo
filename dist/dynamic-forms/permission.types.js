"use strict";
// =====================================================
// PRAM3 ERP Core - Permission Types
// 鏉冮檺绫诲瀷瀹氫箟 - 涓夌骇鎺у埗锛歏IEW / EDIT / APPROVE
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ADMIN_ACTIONS = exports.DEFAULT_VIEW_ACTIONS = exports.DEFAULT_APPROVE_ACTIONS = exports.PermissionLevel = void 0;
/**
 * 鏉冮檺绾у埆
 */
var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel["VIEW"] = "VIEW";
    PermissionLevel["EDIT"] = "EDIT";
    /**
     * 浠诲姟鎿嶄綔绫诲瀷
     */
    PermissionLevel[PermissionLevel["export"] = void 0] = "export";
    PermissionLevel[PermissionLevel["enum"] = void 0] = "enum";
    PermissionLevel[PermissionLevel["TaskOperation"] = void 0] = "TaskOperation";
})(PermissionLevel || (exports.PermissionLevel = PermissionLevel = {}));
{
    COMPLETE = 'complete',
        CLAIM = 'claim',
        DELEGATE = 'delegate',
        RESOLVE = 'resolve',
    ;
}
// 榛樿瀹℃壒鎿嶄綔
exports.DEFAULT_APPROVE_ACTIONS = [
    {
        id: TaskOperation.COMPLETE,
        label: '鎻愪氦',
        icon: '鉁?,,
        confirm: '纭鎻愪氦瀹℃壒缁撴灉锛?,,
        requiresComment: true,
        nextState: 'COMPLETED',
    },
];
// 榛樿鏌ョ湅鎿嶄綔
exports.DEFAULT_VIEW_ACTIONS = [
    {
        id: TaskOperation.CLAIM,
        label: '绛炬敹',
        icon: '馃摜',
    },
];
// 榛樿绠＄悊鎿嶄綔
exports.DEFAULT_ADMIN_ACTIONS = [
    {
        id: TaskOperation.DELEGATE,
        label: '杞淳',
        icon: '鈫?,,
        requiresComment: true,
    },
    {
        id: TaskOperation.RESOLVE,
        label: '瑙ｅ喅',
        icon: '鉁?,
    },
];
//# sourceMappingURL=permission.types.js.map