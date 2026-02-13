import { SalesOrder } from '../../domains/sales/models/sales-order.types';
import { CamundaIntegrationService } from '../../orchestration/camunda-integration.service';
import { TaskOperation, DynamicSchemaResponse, PermissionContext } from './permission.types';
/**
 * 动态Schema组装服务
 */
export declare class DynamicSchemaService {
    private camundaService;
    constructor(camundaService?: CamundaIntegrationService);
    /**
     * 获取任务对应的动态Schema
     * 后端组装，前端零配置
     */
    getDynamicSchema(taskId: string, salesOrder: SalesOrder, context: PermissionContext): Promise<DynamicSchemaResponse>;
    /**
     * 获取任务信息
     */
    private getTaskInfo;
    /**
     * 确定用户权限级别
     */
    private determinePermissionLevel;
    /**
     * 获取节点权限配置
     */
    private getNodePermission;
    /**
     * 组装带权限的字段
     */
    private assembleFields;
    /**
     * 获取节点特定字段
     */
    private getNodeSpecificFields;
    /**
     * 订单创建字段
     */
    private getOrderCreateFields;
    /**
     * 审批字段
     */
    private getApprovalFields;
    /**
     * 财务字段
     */
    private getFinanceFields;
    /**
     * 库存字段
     */
    private getInventoryFields;
    /**
     * 获取可用操作
     */
    private getAvailableActions;
    /**
     * 获取并行任务组
     */
    private getParallelTasks;
    /**
     * 执行任务操作
     * 基于Task ID进行操作
     */
    executeTaskOperation(taskId: string, operation: TaskOperation, variables?: Record<string, unknown>, userId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare const dynamicSchemaService: DynamicSchemaService;
//# sourceMappingURL=dynamic-schema.service.d.ts.map