"use strict";
// =====================================================
// PRAM3 ERP Core - Main Application Entry Point
// 主应用入口
// =====================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pram3Application = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sales_order_controller_1 = require("./api/controllers/sales-order.controller");
const so_controller_1 = require("./api/controllers/so-controller");
const form_controller_1 = require("./api/controllers/form-controller");
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
        // CORS配置 - 允许前端访问
        this.app.use((0, cors_1.default)({
            origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
            credentials: true,
        }));
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
        // 注意：soController 要在 salesOrderController 之前，避免 /orders/:id 覆盖 /orders/create-data
        this.app.use(apiPrefix, so_controller_1.soController.router);
        this.app.use(apiPrefix, sales_order_controller_1.salesOrderController.router);
        // 表单渲染 API（新权限体系）
        // 包含：GET /api/forms/:taskId/render?userId=xxx
        //       POST /api/forms/:taskId/submit
        //       GET /api/forms/schema/:formKey
        //       GET /api/forms/tasks/pending?userId=xxx
        this.app.use('/api', form_controller_1.formController.router);
        // 前端页面路由 - 重定向到新的 React 前端 (端口 5173)
        this.app.get('/so-create', (req, res) => {
            res.redirect('http://localhost:5173/so-create');
        });
        this.app.get('/so-list', (req, res) => {
            res.redirect('http://localhost:5173/so-list');
        });
        // Camunda集成端点
        this.app.post('/api/camunda/external-task/:taskId/complete', this.handleExternalTaskComplete.bind(this));
        this.app.get('/api/camunda/tasks/:processInstanceId', this.getActiveTasks.bind(this));
        // 动态表单渲染端点（旧版，保留兼容）
        this.app.get('/api/forms/:formKey/render-legacy', this.renderForm.bind(this));
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
        // 旧版表单渲染已弃用，使用 /api/forms/:taskId/render 端点
        res.status(410).json({
            success: false,
            error: '此端点已弃用，请使用 GET /api/forms/:taskId/render?userId=xxx',
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
║  - GET    /api/forms/:taskId/render?userId=xxx  Render form   ║
║  - POST   /api/forms/:taskId/submit             Submit form   ║
║  - GET    /api/forms/schema/:formKey            Form schema   ║
║  - GET    /api/forms/tasks/pending?userId=xxx   Pending tasks ║
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