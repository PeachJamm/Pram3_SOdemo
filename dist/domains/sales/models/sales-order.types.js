"use strict";
// =====================================================
// PRAM3 ERP Core - Sales Order Domain Types
// 销售订单域模型定义
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalLevel = exports.SalesOrderStatus = void 0;
/**
 * 销售订单状态枚举
 */
var SalesOrderStatus;
(function (SalesOrderStatus) {
    SalesOrderStatus["DRAFT"] = "DRAFT";
    SalesOrderStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    SalesOrderStatus["APPROVED"] = "APPROVED";
    SalesOrderStatus["REJECTED"] = "REJECTED";
    SalesOrderStatus["CANCELLED"] = "CANCELLED";
    SalesOrderStatus["PROCESSING"] = "PROCESSING";
    SalesOrderStatus["COMPLETED"] = "COMPLETED";
})(SalesOrderStatus || (exports.SalesOrderStatus = SalesOrderStatus = {}));
/**
 * 销售订单审批级别
 */
var ApprovalLevel;
(function (ApprovalLevel) {
    ApprovalLevel["LEVEL_1"] = "LEVEL_1";
    ApprovalLevel["LEVEL_2"] = "LEVEL_2";
    ApprovalLevel["LEVEL_3"] = "LEVEL_3";
})(ApprovalLevel || (exports.ApprovalLevel = ApprovalLevel = {}));
//# sourceMappingURL=sales-order.types.js.map