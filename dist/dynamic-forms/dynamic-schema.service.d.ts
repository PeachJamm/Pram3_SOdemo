import { SalesOrder } from '../../domains/sales/models/sales-order.types';
import { CamundaIntegrationService } from '../../orchestration/camunda-integration.service';
import { DynamicSchemaResponse, PermissionContext } from './permission.types';
/**
 * 鍔ㄦ€丼chema缁勮鏈嶅姟
 */
export declare class DynamicSchemaService {
    private camundaService;
    constructor(camundaService?: CamundaIntegrationService);
    /**
     * 鑾峰彇浠诲姟瀵瑰簲鐨勫姩鎬丼chema
     * 鍚庣缁勮锛屽墠绔浂閰嶇疆
     */
    getDynamicSchema(taskId: string, salesOrder: SalesOrder, context: PermissionContext): Promise<DynamicSchemaResponse>;
    /**
     * 鑾峰彇浠诲姟淇℃伅
     */
    private getTaskInfo;
    /**
     * 纭畾鐢ㄦ埛鏉冮檺绾у埆
     */
    private determinePermissionLevel;
}
//# sourceMappingURL=dynamic-schema.service.d.ts.map