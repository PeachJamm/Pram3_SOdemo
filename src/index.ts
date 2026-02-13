// =====================================================
// PRAM3 ERP Core - Main Application Entry Point
// 主应用入口
// =====================================================

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { salesOrderController } from './api/controllers/sales-order.controller';
import { soController } from './api/controllers/so-controller';
import { orderOrchestrationService } from './orchestration/order-orchestration.service';

/**
 * PRAM3 ERP核心应用
 */
class Pram3Application {
  private app: express.Application;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // 请求日志中间件
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    });

    // API版本前缀
    const apiPrefix = '/api/v1';
    // 注意：soController 要在 salesOrderController 之前，避免 /orders/:id 覆盖 /orders/create-data
    this.app.use(apiPrefix, soController.router);
    this.app.use(apiPrefix, salesOrderController.router);

    // 静态文件服务 - SO 创建页面
    this.app.use('/so-create', express.static(path.join(__dirname, 'frontend', 'so-create.html')));
    this.app.use('/so-list', express.static(path.join(__dirname, 'frontend', 'so-list.html')));

    // Camunda集成端点
    this.app.post('/api/camunda/external-task/:taskId/complete', this.handleExternalTaskComplete.bind(this));
    this.app.get('/api/camunda/tasks/:processInstanceId', this.getActiveTasks.bind(this));
    
    // 动态表单渲染端点
    this.app.get('/api/forms/:formKey/render', this.renderForm.bind(this));
  }

  /**
   * 错误处理
   */
  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
  private async handleExternalTaskComplete(req: Request, res: Response): Promise<void> {
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
  private async getActiveTasks(req: Request, res: Response): Promise<void> {
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
  private async renderForm(req: Request, res: Response): Promise<void> {
    const { formKey } = req.params;
    const { orderId } = req.query;

    console.log('Render Form:', formKey, orderId);

    // 获取订单数据
    let orderData = {};
    if (orderId) {
      const result = await orderOrchestrationService.getOrderDetails(orderId as string);
      if (result.success && result.data) {
        orderData = result.data;
      }
    }

    // 导入动态表单渲染器
    const { renderForm } = await import('./frontend/dynamic-forms/form-renderer');
    const renderResult = renderForm(formKey, orderData as Record<string, unknown>, {});

    res.json({
      success: true,
      ...renderResult,
    });
  }

  /**
   * 启动应用
   */
  public start(): void {
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

// 启动应用
const app = new Pram3Application(3001);
app.start();

export { Pram3Application };
