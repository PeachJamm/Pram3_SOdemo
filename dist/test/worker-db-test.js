"use strict";
// =====================================================
// PRAM3 ERP Core - Worker & Database Test Script
// 使用模拟数据测试 Job Worker 和数据库操作
// 无需启动 Camunda 引擎
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../database/connection");
const order_service_1 = require("../database/services/order.service");
const customer_service_1 = require("../database/services/customer.service");
const product_service_1 = require("../database/services/product.service");
const camunda_mock_service_1 = require("../mock/camunda-mock.service");
/**
 * 测试运行器
 */
class TestRunner {
    constructor() {
        this.results = [];
        this.db = new connection_1.DatabaseConnection({
            type: 'sqlite',
            sqlite: { filename: './pram3.db' },
        });
        this.mockService = new camunda_mock_service_1.CamundaMockService({ orderCount: 3 });
        this.orderService = new order_service_1.OrderService(this.db);
        this.customerService = new customer_service_1.CustomerService(this.db);
        this.productService = new product_service_1.ProductService(this.db);
    }
    /**
     * 运行单个测试
     */
    async runTest(name, testFn) {
        const startTime = Date.now();
        try {
            const data = await testFn();
            return {
                name,
                status: 'PASS',
                duration: Date.now() - startTime,
                data,
            };
        }
        catch (error) {
            return {
                name,
                status: 'FAIL',
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * 测试数据库连接
     */
    async testDatabaseConnection() {
        return this.runTest('数据库连接测试', async () => {
            await this.db.connect();
            const result = await this.db.query('SELECT 1 as test');
            return { connected: true, result };
        });
    }
    /**
     * 测试客户数据加载
     */
    async testCustomerService() {
        return this.runTest('客户服务测试', async () => {
            const customers = await this.customerService.getCustomerSelectList();
            const customerInfo = await this.customerService.getCustomerForOrder('cust-001');
            return {
                customerCount: customers.length,
                sampleCustomer: customerInfo?.customer.name
            };
        });
    }
    /**
     * 测试产品数据加载
     */
    async testProductService() {
        return this.runTest('产品服务测试', async () => {
            const products = await this.productService.getProductSelectList();
            const productWithPrice = await this.productService.getProductWithPrice('prod-001', 'pl-001');
            return {
                productCount: products.length,
                sampleProduct: productWithPrice?.name,
                price: productWithPrice?.unit_price
            };
        });
    }
    /**
     * 测试订单创建草稿
     */
    async testOrderDraftCreation() {
        return this.runTest('订单草稿创建测试', async () => {
            const items = [
                { productId: 'prod-001', quantity: 2 },
                { productId: 'prod-002', quantity: 1 },
            ];
            const draft = await this.orderService.createOrderDraft('cust-001', items);
            return {
                customerName: draft?.customerName,
                priceListCode: draft?.priceListCode,
                itemCount: draft?.items.length,
                subtotal: draft?.subtotal,
                taxAmount: draft?.taxAmount,
                grandTotal: draft?.grandTotal,
            };
        });
    }
    /**
     * 测试订单保存到数据库
     */
    async testOrderSave() {
        return this.runTest('订单保存测试', async () => {
            const items = [{ productId: 'prod-001', quantity: 2 }];
            const draft = await this.orderService.createOrderDraft('cust-001', items);
            if (!draft)
                throw new Error('Failed to create order draft');
            const orderId = await this.orderService.saveOrder(draft, 'test-user');
            return { orderId, saved: true };
        });
    }
    /**
     * 测试模拟数据生成
     */
    async testMockDataGeneration() {
        return this.runTest('模拟数据生成测试', async () => {
            const mockData = this.mockService.getAllMockData();
            return {
                orderCount: mockData.orders.length,
                processInstanceCount: mockData.processInstances.length,
                approvalHistoryCount: mockData.approvalHistory.length,
                externalTaskCount: mockData.externalTasks.length,
                sampleOrder: {
                    id: mockData.orders[0]?.id,
                    orderNumber: mockData.orders[0]?.orderNumber,
                    totalAmount: mockData.orders[0]?.totalAmount,
                    status: mockData.orders[0]?.status,
                },
            };
        });
    }
    /**
     * 模拟 Job Worker 处理
     */
    async testJobWorkerSimulation() {
        return this.runTest('Job Worker 模拟测试', async () => {
            const mockData = this.mockService.getAllMockData();
            const order = mockData.orders[0];
            // 模拟不同类型的 Job Worker 处理
            const workerResults = {
                financeProcessing: await this.simulateFinanceWorker(order),
                inventoryReservation: await this.simulateInventoryWorker(order),
                notification: await this.simulateNotificationWorker(order),
            };
            return {
                orderId: order.id,
                workers: workerResults,
            };
        });
    }
    /**
     * 模拟财务处理 Worker
     */
    async simulateFinanceWorker(order) {
        console.log(`  [Worker:finance-processing] 处理订单: ${order.id}`);
        // 模拟处理延迟
        await this.delay(100);
        const invoiceNumber = `INV-${Date.now()}`;
        const result = {
            processed: true,
            invoiceNumber,
            processedAt: new Date().toISOString(),
            amount: order.totalAmount,
        };
        console.log(`  [Worker:finance-processing] 完成，发票号: ${invoiceNumber}`);
        return result;
    }
    /**
     * 模拟库存预留 Worker
     */
    async simulateInventoryWorker(order) {
        console.log(`  [Worker:inventory-reservation] 预留库存: ${order.id}`);
        await this.delay(150);
        const reservationId = `RES-${Date.now()}`;
        const result = {
            reserved: true,
            reservationId,
            items: order.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                reserved: true,
            })),
        };
        console.log(`  [Worker:inventory-reservation] 完成，预留ID: ${reservationId}`);
        return result;
    }
    /**
     * 模拟通知 Worker
     */
    async simulateNotificationWorker(order) {
        console.log(`  [Worker:notification] 发送通知: ${order.id}`);
        await this.delay(50);
        const result = {
            sent: true,
            sentAt: new Date().toISOString(),
            channels: ['email', 'sms'],
            recipient: order.customer.email,
        };
        console.log(`  [Worker:notification] 完成，渠道: ${result.channels.join(', ')}`);
        return result;
    }
    /**
     * 测试完整的订单流程（模拟）
     */
    async testCompleteOrderFlow() {
        return this.runTest('完整订单流程测试', async () => {
            const mockData = this.mockService.getAllMockData();
            const order = mockData.orders[0];
            const processInstance = mockData.processInstances[0];
            // 模拟完整的订单处理流程
            const flowSteps = [];
            // Step 1: 订单验证
            console.log('  [Flow] Step 1: 订单验证');
            flowSteps.push({ step: 'validation', status: 'PASSED' });
            await this.delay(100);
            // Step 2: 确定审批级别
            console.log('  [Flow] Step 2: 确定审批级别');
            const approvalLevel = order.totalAmount > 50000 ? 'DIRECTOR' :
                order.totalAmount > 10000 ? 'FINANCE' : 'SALES_MANAGER';
            flowSteps.push({ step: 'approval-level', level: approvalLevel });
            await this.delay(100);
            // Step 3: 计算折扣
            console.log('  [Flow] Step 3: 计算折扣');
            const discountRate = order.customer.creditRating === 'A' ? 0.1 : 0.05;
            flowSteps.push({ step: 'discount', rate: discountRate, amount: order.totalAmount * discountRate });
            await this.delay(100);
            // Step 4: 模拟审批（使用模拟历史）
            console.log('  [Flow] Step 4: 模拟审批');
            const history = mockData.approvalHistory.find(h => h.orderId === order.id);
            flowSteps.push({
                step: 'approval',
                historyCount: history?.history.length || 0,
                finalDecision: history?.history[history.history.length - 1]?.action || 'APPROVE'
            });
            await this.delay(100);
            // Step 5: 执行 Service Task
            console.log('  [Flow] Step 5: 执行 Service Tasks');
            const workerResults = await this.testJobWorkerSimulation();
            flowSteps.push({ step: 'service-tasks', status: 'COMPLETED' });
            return {
                orderId: order.id,
                processInstanceId: processInstance.id,
                flowSteps,
                totalSteps: flowSteps.length,
            };
        });
    }
    /**
     * 测试订单查询
     */
    async testOrderQuery() {
        return this.runTest('订单查询测试', async () => {
            // 先创建一个订单
            const items = [{ productId: 'prod-001', quantity: 1 }];
            const draft = await this.orderService.createOrderDraft('cust-002', items);
            if (!draft)
                throw new Error('Failed to create order draft');
            const orderId = await this.orderService.saveOrder(draft, 'test-user');
            // 查询数据库中的订单
            const orders = await this.db.query('SELECT * FROM sales_orders WHERE id = ?', [orderId]);
            const orderItems = await this.db.query('SELECT * FROM sales_order_items WHERE sales_order_id = ?', [orderId]);
            return {
                orderFound: orders.length > 0,
                orderStatus: orders[0]?.status,
                itemCount: orderItems.length,
            };
        });
    }
    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * 运行所有测试
     */
    async runAllTests() {
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║         PRAM3 ERP - Worker & Database Test Suite              ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        // 数据库测试
        console.log('📦 数据库连接测试...');
        this.results.push(await this.testDatabaseConnection());
        console.log('📋 服务层测试...');
        this.results.push(await this.testCustomerService());
        this.results.push(await this.testProductService());
        console.log('📝 订单创建测试...');
        this.results.push(await this.testOrderDraftCreation());
        this.results.push(await this.testOrderSave());
        this.results.push(await this.testOrderQuery());
        // 模拟数据测试
        console.log('🎲 模拟数据生成测试...');
        this.results.push(await this.testMockDataGeneration());
        console.log('⚙️  Job Worker 模拟测试...');
        this.results.push(await this.testJobWorkerSimulation());
        console.log('🔄 完整流程测试...');
        this.results.push(await this.testCompleteOrderFlow());
        // 打印结果
        this.printResults();
    }
    /**
     * 打印测试结果
     */
    printResults() {
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║                      测试结果汇总                             ║');
        console.log('╠══════════════════════════════════════════════════════════════╣');
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
            const status = result.status.padEnd(4);
            console.log(`║ ${icon} ${result.name.padEnd(45)} ${status} ${result.duration.toString().padStart(5)}ms ║`);
            if (result.error) {
                console.log(`║   ⚠️  Error: ${result.error.substring(0, 40).padEnd(40)} ║`);
            }
            if (result.data && typeof result.data === 'object') {
                const dataStr = JSON.stringify(result.data).substring(0, 50);
                console.log(`║   📊 Data: ${dataStr.padEnd(46)} ║`);
            }
        });
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║ 总计: ${passed.toString().padStart(2)} 通过 | ${failed.toString().padStart(2)} 失败 | ${totalDuration.toString().padStart(5)}ms          ║`);
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        // 关闭数据库连接
        this.db.close();
    }
}
// 运行测试
const runner = new TestRunner();
runner.runAllTests().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
});
//# sourceMappingURL=worker-db-test.js.map