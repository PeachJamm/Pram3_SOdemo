import { SalesOrder, ApprovalLevel } from '../domains/sales/models/sales-order.types';
import { CamundaProcessInstance, ExternalTask } from '../orchestration/camunda-integration.service';
/**
 * 模拟数据配置
 */
export interface MockConfig {
    orderCount?: number;
    maxItemsPerOrder?: number;
    maxAmount?: number;
    includeCustomFields?: boolean;
}
/**
 * Camunda模拟数据服务
 */
export declare class CamundaMockService {
    private config;
    constructor(config?: MockConfig);
    /**
     * 生成模拟的销售订单
     */
    generateSalesOrders(): SalesOrder[];
    /**
     * 生成模拟的流程实例
     */
    generateProcessInstances(orders: SalesOrder[]): CamundaProcessInstance[];
    /**
     * 生成模拟的审批历史
     */
    generateApprovalHistory(processInstances: CamundaProcessInstance[]): Array<{
        orderId: string;
        history: Array<{
            id: string;
            approverId: string;
            approverName: string;
            action: 'APPROVE' | 'REJECT';
            approvalLevel: ApprovalLevel;
            comment: string;
            timestamp: Date;
            customData?: Record<string, unknown>;
        }>;
    }>;
    /**
     * 生成模拟的外部任务
     */
    generateExternalTasks(processInstances: CamundaProcessInstance[]): ExternalTask[];
    /**
     * 创建随机订单
     */
    private createRandomOrder;
    /**
     * 创建随机客户
     */
    private createRandomCustomer;
    /**
     * 创建随机订单项
     */
    private createRandomItems;
    /**
     * 创建随机地址
     */
    private createRandomAddress;
    /**
     * 获取随机审批级别
     */
    private getRandomApprovalLevel;
    /**
     * 创建流程实例
     */
    private createProcessInstance;
    /**
     * 创建审批历史
     */
    private createApprovalHistory;
    /**
     * 创建外部任务
     */
    private createExternalTask;
    /**
     * 创建随机自定义字段
     */
    private createRandomCustomFields;
    /**
     * 获取所有模拟数据
     */
    getAllMockData(): {
        orders: SalesOrder[];
        processInstances: CamundaProcessInstance[];
        approvalHistory: Array<{
            orderId: string;
            history: Array<{
                id: string;
                approverId: string;
                approverName: string;
                action: 'APPROVE' | 'REJECT';
                approvalLevel: ApprovalLevel;
                comment: string;
                timestamp: Date;
                customData?: Record<string, unknown>;
            }>;
        }>;
        externalTasks: ExternalTask[];
    };
    /**
     * 重置模拟数据
     */
    reset(): void;
}
export declare const camundaMockService: CamundaMockService;
export default CamundaMockService;
//# sourceMappingURL=camunda-mock.service.d.ts.map