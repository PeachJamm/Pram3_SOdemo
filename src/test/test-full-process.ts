// =====================================================
// PRAM3 ERP Core - Full Process Test with Camunda 8
// 完整的端到端流程测试
// =====================================================

import { Camunda8Client, Camunda8IntegrationService } from '../orchestration/camunda8-client';
import { DatabaseConnection } from '../database/connection';
import { OrderService } from '../database/services/order.service';

/**
 * 完整流程测试
 */
class FullProcessTest {
  private zeebeClient: Camunda8Client;
  private integrationService: Camunda8IntegrationService;
  private db: DatabaseConnection;
  private orderService: OrderService;

  constructor() {
    this.zeebeClient = new Camunda8Client({
      gatewayAddress: 'localhost:26500',
      plaintext: true,
    });
    this.integrationService = new Camunda8IntegrationService();
    this.db = new DatabaseConnection({
      type: 'sqlite',
      sqlite: { filename: './pram3.db' },
    });
    this.orderService = new OrderService(this.db);
  }

  /**
   * 运行完整测试
   */
  async run(): Promise<void> {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           Camunda 8 完整流程测试                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
      // 0. 连接数据库
      console.log('📦 连接数据库...');
      await this.db.connect();

      // 1. 创建订单
      const orderData = await this.createOrder();
      console.log('✅ 订单创建成功:', orderData.orderId);

      // 2. 启动流程实例
      const processInstance = await this.startProcess(orderData);
      console.log('✅ 流程实例启动:', processInstance.processInstanceKey);

      // 3. 设置 Workers 处理 Service Tasks
      this.setupWorkers();
      console.log('✅ Workers 已注册\n');

      // 4. 等待并显示任务
      console.log('⏳ 等待任务生成 (5 秒)...\n');
      await this.delay(5000);

      // 5. 查询并显示当前任务
      await this.showActiveTasks(processInstance.processInstanceKey);

      console.log('\n✅ 测试流程完成！');
      console.log('\n接下来的步骤:');
      console.log('  1. 访问 http://localhost:8081 (Tasklist) 查看待办任务');
      console.log('  2. 使用以下账号登录:');
      console.log('     - sales01 / sales01 (销售员)');
      console.log('     - admin01 / admin01 (管理员，有 ORDER_OVERRIDE 权限)');
      console.log('  3. 完成订单验证任务，触发后续审批流程');

    } catch (error) {
      console.error('\n❌ 测试失败:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 创建订单
   */
  private async createOrder(): Promise<{ orderId: string; orderData: any }> {
    console.log('📝 步骤 1: 创建订单...');

    const items = [
      { productId: 'prod-001', quantity: 2 },
      { productId: 'prod-002', quantity: 1 },
    ];

    const draft = await this.orderService.createOrderDraft('cust-001', items);
    if (!draft) throw new Error('创建订单草稿失败');

    const orderId = await this.orderService.saveOrder(draft, 'sales01');

    return {
      orderId,
      orderData: {
        orderId,
        orderNumber: `SO-${Date.now()}`,
        customerId: draft.customerId,
        customerName: draft.customerName,
        totalAmount: draft.grandTotal,
        customerTier: 'STANDARD',
        orderHistoryCount: 0,
      },
    };
  }

  /**
   * 启动流程实例
   */
  private async startProcess(orderInfo: { orderId: string; orderData: any }): Promise<any> {
    console.log('\n🚀 步骤 2: 启动审批流程...');

    const variables = {
      orderId: orderInfo.orderId,
      orderNumber: orderInfo.orderData.orderNumber,
      customerId: orderInfo.orderData.customerId,
      customerName: orderInfo.orderData.customerName,
      totalAmount: orderInfo.orderData.totalAmount,
      customerTier: orderInfo.orderData.customerTier,
      orderHistoryCount: orderInfo.orderData.orderHistoryCount,
      createdBy: 'sales01',
    };

    const instance = await this.zeebeClient.startProcess('sales-order-process', variables);
    
    return instance;
  }

  /**
   * 设置 Workers
   */
  private setupWorkers(): void {
    console.log('\n⚙️  步骤 3: 注册 Job Workers...');

    // 财务处理 Worker
    this.zeebeClient.createWorker(
      'finance-processing',
      async (job) => {
        console.log(`  💰 [finance-processing] 处理订单: ${job.variables.orderId}`);
        return job.complete({
          financeProcessed: true,
          invoiceNumber: `INV-${Date.now()}`,
          processedAt: new Date().toISOString(),
        });
      },
      { maxActiveJobs: 5 }
    );

    // 库存预留 Worker
    this.zeebeClient.createWorker(
      'inventory-reservation',
      async (job) => {
        console.log(`  📦 [inventory-reservation] 预留库存: ${job.variables.orderId}`);
        return job.complete({
          inventoryReserved: true,
          reservationId: `RES-${Date.now()}`,
          reservedAt: new Date().toISOString(),
        });
      },
      { maxActiveJobs: 5 }
    );

    // 通知 Worker
    this.zeebeClient.createWorker(
      'send-notification',
      async (job) => {
        console.log(`  📧 [send-notification] 发送通知: ${job.variables.orderId}`);
        return job.complete({
          notificationSent: true,
          sentAt: new Date().toISOString(),
          channel: 'email',
        });
      },
      { maxActiveJobs: 5 }
    );
  }

  /**
   * 显示活动任务
   */
  private async showActiveTasks(processInstanceKey: string): Promise<void> {
    console.log('📋 当前活动任务:');
    
    try {
      // 通过 Tasklist API 查询任务
      const tasks = await this.integrationService.getTasks(processInstanceKey);
      
      if (tasks.length === 0) {
        console.log('  暂无待办任务 (流程可能已完成或等待中)');
      } else {
        tasks.forEach((task, index) => {
          console.log(`  ${index + 1}. ${task.name} (${task.id})`);
          console.log(`     分配人: ${task.assignee || '未分配'}`);
          console.log(`     创建时间: ${task.creationTime}`);
        });
      }
    } catch (error) {
      console.log('  无法获取任务列表 (Tasklist 可能尚未就绪)');
    }
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    console.log('\n🧹 清理资源...');
    await this.zeebeClient.close();
    await this.integrationService.close();
    this.db.close();
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 运行测试
const test = new FullProcessTest();
test.run().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
