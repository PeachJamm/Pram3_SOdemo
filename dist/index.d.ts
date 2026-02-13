/**
 * PRAM3 ERP核心应用
 */
declare class Pram3Application {
    private app;
    private port;
    constructor(port?: number);
    /**
     * 设置中间件
     */
    private setupMiddleware;
    /**
     * 设置路由
     */
    private setupRoutes;
    /**
     * 错误处理
     */
    private setupErrorHandling;
    /**
     * 处理Camunda外部任务完成
     */
    private handleExternalTaskComplete;
    /**
     * 获取活动任务
     */
    private getActiveTasks;
    /**
     * 渲染动态表单
     */
    private renderForm;
    /**
     * 启动应用
     */
    start(): void;
}
export { Pram3Application };
//# sourceMappingURL=index.d.ts.map