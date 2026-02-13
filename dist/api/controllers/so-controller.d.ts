import { Router } from 'express';
/**
 * SO 控制器
 */
export declare class SOController {
    router: Router;
    private db;
    private orderService;
    private camundaClient;
    constructor();
    /**
     * 格式化产品明细为表单展示文本
     */
    private formatProductLinesForForm;
    /**
     * 设置路由
     */
    private setupRoutes;
    /**
     * 获取创建订单所需数据
     */
    private getCreateData;
    /**
     * 创建订单并启动流程
     */
    private createAndStartProcess;
    /**
     * 获取订单详情
     */
    private getOrderDetails;
}
export declare const soController: SOController;
//# sourceMappingURL=so-controller.d.ts.map