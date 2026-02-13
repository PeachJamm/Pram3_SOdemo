// =====================================================
// PRAM3 ERP Core - Sales Order API Controller
// 销售订单API控制器
// =====================================================

import { Router, Request, Response, NextFunction } from 'express';
import { orderOrchestrationService } from '../../orchestration/order-orchestration.service';
import { salesOrderService } from '../../domains/sales/services/sales-order.service';
import { DatabaseConnection } from '../../database/connection';
import { OrderService } from '../../database/services/order.service';
import {
  CreateSalesOrderRequest,
  ApprovalRequest,
  SalesOrderQueryParams,
} from '../../domains/sales/models/sales-order.types';

/**
 * API响应类型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 销售订单API控制器
 */
export class SalesOrderController {
  public router: Router;
  private db: DatabaseConnection;
  private orderService: OrderService;

  constructor() {
    this.router = Router();
    this.db = new DatabaseConnection({
      type: 'sqlite',
      sqlite: { filename: './pram3.db' },
    });
    this.orderService = new OrderService(this.db);
    this.setupRoutes();
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 创建订单
    this.router.post('/orders', this.createOrder.bind(this));
    
    // 查询订单列表
    this.router.get('/orders', this.queryOrders.bind(this));
    
    // 获取订单详情
    this.router.get('/orders/:id', this.getOrderById.bind(this));
    
    // 提交审批
    this.router.post('/orders/:id/submit', this.submitForApproval.bind(this));
    
    // 处理审批
    this.router.post('/orders/:id/approve', this.processApproval.bind(this));
    
    // 取消订单
    this.router.post('/orders/:id/cancel', this.cancelOrder.bind(this));
    
    // 获取审批历史
    this.router.get('/orders/:id/history', this.getApprovalHistory.bind(this));
  }

  /**
   * 创建订单
   * POST /api/v1/orders
   */
  private async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateSalesOrderRequest = req.body;
      const createdBy = req.headers['x-user-id'] as string || 'system';

      const result = await orderOrchestrationService.createOrderWithWorkflow(request, createdBy);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          metadata: result.metadata,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 查询订单列表
   * GET /api/v1/orders
   */
  private async queryOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.db.connect();
      
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      const offset = (page - 1) * pageSize;

      // 从数据库直接查询订单
      let sql = `
        SELECT o.*, c.name as customer_name, c.tier as customer_tier, c.customer_code
        FROM sales_orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (req.query.status) {
        sql += ` AND o.status = ?`;
        params.push(req.query.status);
      }
      if (req.query.customerId) {
        sql += ` AND o.customer_id = ?`;
        params.push(req.query.customerId);
      }

      // 获取总数
      const countResult = await this.db.query(
        sql.replace('SELECT o.*, c.name as customer_name, c.tier as customer_tier, c.customer_code', 'SELECT COUNT(*) as count'),
        params
      );
      const total = countResult[0]?.count || 0;

      // 分页查询
      sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
      params.push(pageSize, offset);

      const orders = await this.db.query(sql, params);

      res.json({
        success: true,
        data: orders.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          customer_id: o.customer_id,
          customer_name: o.customer_name,
          customerName: o.customer_name,
          customer_tier: o.customer_tier,
          grand_total: o.grand_total,
          grandTotal: o.grand_total,
          totalAmount: o.grand_total,
          status: o.status,
          created_at: o.created_at,
          createdAt: o.created_at,
        })),
        metadata: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取订单详情
   * GET /api/v1/orders/:id
   */
  private async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.db.connect();
      const { id } = req.params;

      const order = await this.orderService.getOrderById(id);

      if (order) {
        res.json({
          success: true,
          data: order,
        });
      } else {
        res.status(404).json({
          success: false,
          error: '订单不存在',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 提交订单审批
   * POST /api/v1/orders/:id/submit
   */
  private async submitForApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const submitterId = req.headers['x-user-id'] as string || 'system';

      const result = await orderOrchestrationService.submitOrderForApproval(id, submitterId);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: '订单已提交审批',
          metadata: result.metadata,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 处理订单审批
   * POST /api/v1/orders/:id/approve
   */
  private async processApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const approvalRequest: ApprovalRequest = {
        orderId: id,
        approverId: req.headers['x-user-id'] as string || 'system',
        action: req.body.action,
        comment: req.body.comment,
        approvalLevel: req.body.approvalLevel,
      };

      const result = await orderOrchestrationService.processApprovalResult(id, approvalRequest);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `订单已${approvalRequest.action === 'APPROVE' ? '通过' : '拒绝'}审批`,
          metadata: result.metadata,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取消订单
   * POST /api/v1/orders/:id/cancel
   */
  private async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await orderOrchestrationService.cancelOrder(id, reason);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: '订单已取消',
          metadata: result.metadata,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取审批历史
   * GET /api/v1/orders/:id/history
   */
  private async getApprovalHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const history = await salesOrderService.getApprovalHistory(id);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

// 导出控制器实例
export const salesOrderController = new SalesOrderController();
