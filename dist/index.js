"use strict";
// =====================================================
// PRAM3 ERP Core - Main Application Entry Point
// 主应用入口
// =====================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pram3Application = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const sales_order_controller_1 = require("./api/controllers/sales-order.controller");
const so_controller_1 = require("./api/controllers/so-controller");
const order_orchestration_service_1 = require("./orchestration/order-orchestration.service");
/**
 * PRAM3 ERP核心应用
 */
class Pram3Application {
    constructor(port = 3001) {
        this.port = port;
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    /**
     * 设置中间件
     */
    setupMiddleware() {
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // 请求日志中间件
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }
    /**
     * 设置路由
     */
    setupRoutes() {
        // 健康检查
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            });
        });
        // API版本前缀
        const apiPrefix = '/api/v1';
        this.app.use(apiPrefix, sales_order_controller_1.salesOrderController.router);
        this.app.use(apiPrefix, so_controller_1.soController.router);
        // 静态文件服务 - SO 创建页面
        this.app.use('/so-create', express_1.default.static(path_1.default.join(__dirname, 'frontend', 'so-create.html')));
        this.app.use('/so-list', express_1.default.static(path_1.default.join(__dirname, 'frontend', 'so-list.html')));
        // Camunda集成端点
        this.app.post('/api/camunda/external-task/:taskId/complete', this.handleExternalTaskComplete.bind(this));
        this.app.get('/api/camunda/tasks/:processInstanceId', this.getActiveTasks.bind(this));
        // 动态表单渲染端点
        this.app.get('/api/forms/:formKey/render', this.renderForm.bind(this));
    }
    /**
     * 错误处理
     */
    setupErrorHandling() {
        this.app.use((err, req, res, next) => {
            console.error('Error:', err.message);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: err.message,
            });
        });
    }
    /**
     * 处理Camunda外部任务完成
     */
    async handleExternalTaskComplete(req, res) {
        const { taskId } = req.params;
        const { variables } = req.body;
        console.log('Camunda External Task Complete:', taskId, variables);
        // 实际实现中，这里会调用Camunda REST API
        // POST /engine-rest/external-task/{taskId}/complete
        res.json({
            success: true,
            message: 'Task completed',
            taskId,
        });
    }
    /**
     * 获取活动任务
     */
    async getActiveTasks(req, res) {
        const { processInstanceId } = req.params;
        console.log('Get Active Tasks:', processInstanceId);
        // 实际实现中，这里会调用Camunda REST API
        // GET /engine-rest/task?processInstanceId={processInstanceId}
        res.json({
            success: true,
            tasks: [],
            processInstanceId,
        });
    }
    /**
     * 渲染动态表单
     */
    async renderForm(req, res) {
        const { formKey } = req.params;
        const { orderId } = req.query;
        console.log('Render Form:', formKey, orderId);
        // 获取订单数据
        let orderData = {};
        if (orderId) {
            const result = await order_orchestration_service_1.orderOrchestrationService.getOrderDetails(orderId);
            if (result.success && result.data) {
                orderData = result.data;
            }
        }
        // 导入动态表单渲染器
        const { renderForm } = await Promise.resolve().then(() => __importStar(require('./frontend/dynamic-forms/form-renderer')));
        const renderResult = renderForm(formKey, orderData, {});
        res.json({
            success: true,
            ...renderResult,
        });
    }
    /**
     * 启动应用
     */
    start() {
        this.app.listen(this.port, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    PRAM3 ERP Core Server                      ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${this.port}                    ║
║  API Base URL: http://localhost:${this.port}/api/v1                   ║
║  Health Check: http://localhost:${this.port}/health                   ║
╠══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                   ║
║  - POST   /api/v1/orders           Create order               ║
║  - GET    /api/v1/orders           List orders                ║
║  - GET    /api/v1/orders/:id       Get order details          ║
║  - POST   /api/v1/orders/:id/submit  Submit for approval      ║
║  - POST   /api/v1/orders/:id/approve Process approval         ║
║  - POST   /api/v1/orders/:id/cancel  Cancel order             ║
║  - GET    /api/forms/:key/render   Render dynamic form        ║
╚══════════════════════════════════════════════════════════════╝
║  Frontend Pages:                                              ║
║  - http://localhost:${this.port}/so-create    Create SO       ║
║  - http://localhost:${this.port}/so-list      SO List         ║
╚══════════════════════════════════════════════════════════════╝
      `);
        });
    }
}
exports.Pram3Application = Pram3Application;
// 启动应用
const app = new Pram3Application(3001);
app.start();
//# sourceMappingURL=index.js.map