import { Router } from 'express';
/**
 * 表单控制器
 */
export declare class FormController {
    router: Router;
    private db;
    private userService;
    private formRenderer;
    private camundaClient;
    private camundaTasklist;
    private camundaIntegration;
    constructor();
    /**
     * 设置路由
     */
    private setupRoutes;
    /**
     * 渲染表单 API
     * GET /api/forms/:taskId/render?userId=xxx
     *
     * 响应示例：
     * {
     *   success: true,
     *   data: {
     *     formId: "order-validation",
     *     formName: "订单验证",
     *     permissionLevel: "APPROVE",
     *     userInfo: { id, username, fullName, role },
     *     taskInfo: { taskId, taskName, assignee, isAssignedToUser },
     *     components: [...],  // 过滤后的表单组件
     *     variables: {...}    // 流程变量
     *   }
     * }
     */
    private renderForm;
    /**
     * 提交表单 API
     * POST /api/forms/:taskId/submit
     *
     * 请求体：
     * {
     *   variables: {
     *     approvalDecision: "APPROVE",
     *     approvalComment: "同意",
     *     ...
     *   }
     * }
     */
    private submitForm;
    /**
     * 获取表单定义（原始Schema，用于预览）
     * GET /api/forms/schema/:formKey
     */
    private getFormSchema;
    /**
     * 获取用户待办任务列表
     * GET /api/forms/tasks/pending?userId=xxx
     */
    private getPendingTasks;
    /**
     * 根据订单ID获取待办任务
     * GET /api/forms/tasks/by-order/:orderId?userId=xxx
     */
    private getTaskByOrderId;
    /**
     * 为用户创建模拟任务（当Camunda不可用时）
     */
    private createMockTaskForUser;
    /**
     * 从数据库获取完整订单变量（包括产品明细）
     */
    private getOrderVariablesFromDB;
    /**
     * 构建产品明细表格字符串
     */
    private buildProductLinesTable;
    /**
     * 计算预期审批级别
     */
    private calculateExpectedApprovalLevel;
    /**
     * 查询流程实例状态（用于非 UserTask 情况）
     */
    private getProcessInstanceStatus;
    /**
     * 根据元素ID获取名称
     */
    private mapElementIdToName;
    /**
     * 获取非 UserTask 的显示名称
     */
    private getNonUserTaskName;
    /**
     * 获取流程状态（用于左侧和header流程导航）
     */
    private getProcessFlowStatus;
    /**
     * 为订单构建流程导航（用于 getTaskByOrderId）
     */
    private buildProcessFlowForOrder;
    /**
     * 获取流程步骤状态（用于 renderForm）
     */
    private getFlowNodeStatus;
    /**
     * 为订单构建步骤（从 Camunda User Tasks 获取）
     */
    private buildStepsForOrder;
    /**
     * 将 Camunda Task state 映射为前端 status
     */
    private mapTaskStateToStatus;
    /**
     * 推断 DMN 节点状态
     */
    private inferDmnStatus;
    /**
     * 推断网关状态
     */
    private inferGatewayStatus;
    /**
     * 按流程顺序合并所有步骤
     */
    private mergeStepsInOrder;
    /**
     * 回退步骤（当 Camunda API 不可用时）
     */
    private buildFallbackSteps;
    /**
     * 将 Camunda 状态映射为前端状态
     */
    private mapCamundaStateToStatus;
    /**
     * 从审批历史获取已完成的步骤
     */
    private getCompletedStepsFromHistory;
    /**
     * 将 action 映射到步骤 ID
     */
    private mapActionToStepId;
    /**
     * 将 action 映射到步骤名称
     */
    private mapActionToStepName;
    /**
     * 获取审批历史（用于页面右侧时间线）
     */
    private getApprovalHistory;
    /**
     * 【如实渲染】只填充表单值，不做任何权限过滤或组件修改
     */
    private fillFormValues;
    /**
     * 从Camunda获取任务信息
     * 支持通过 taskId 或 taskDefinitionId 查找
     */
    private getTaskInfoFromCamunda;
    /**
     * 从Camunda加载表单定义（仅使用Camunda API，无本地回退）
     *
     * @param taskInfo 任务信息（必须包含formKey、processDefinitionKey和formVersion）
     * @returns 表单定义对象（包含 schema 和 version）
     */
    private loadFormSchema;
}
export declare const formController: FormController;
//# sourceMappingURL=form-controller.d.ts.map