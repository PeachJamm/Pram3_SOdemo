"use strict";
// =====================================================
// PRAM3 ERP Core - Camunda 8 Client
// Camunda 8 (Zeebe) gRPC Client
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.camunda8IntegrationService = exports.camunda8Client = exports.Camunda8IntegrationService = exports.Camunda8TasklistClient = exports.Camunda8Client = void 0;
const zeebe_node_1 = require("zeebe-node");
/**
 * Camunda 8 Zeebe 客户端
 */
class Camunda8Client {
    constructor(config) {
        this.workers = [];
        const defaultConfig = {
            gatewayAddress: 'localhost:26500',
            plaintext: true,
        };
        const finalConfig = { ...defaultConfig, ...config };
        this.zbc = new zeebe_node_1.ZBClient(finalConfig.gatewayAddress, {
            tenantId: finalConfig.tenantId,
            oAuth: finalConfig.auth
                ? {
                    url: finalConfig.auth.oauthUrl,
                    audience: finalConfig.gatewayAddress,
                    clientId: finalConfig.auth.clientId,
                    clientSecret: finalConfig.auth.clientSecret,
                }
                : undefined,
            useTLS: !finalConfig.plaintext,
        });
        console.log(`[Camunda8] Connected to Zeebe at ${finalConfig.gatewayAddress}`);
    }
    /**
     * 部署流程定义
     */
    async deployProcess(bpmnFilePath) {
        const result = await this.zbc.deployResource({
            processFilename: bpmnFilePath,
        });
        const deployedProcess = result.deployments[0]?.process;
        if (!deployedProcess) {
            throw new Error('Failed to deploy process');
        }
        return {
            processDefinitionKey: String(deployedProcess.processDefinitionKey),
            version: deployedProcess.version,
        };
    }
    /**
     * 启动流程实例
     */
    async startProcess(processId, variables) {
        const result = await this.zbc.createProcessInstance({
            bpmnProcessId: processId,
            variables: variables,
        });
        return {
            processInstanceKey: String(result.processInstanceKey),
            processDefinitionKey: String(result.processDefinitionKey),
            processDefinitionId: processId,
            version: result.version,
            variables,
            startTime: new Date(),
        };
    }
    /**
     * 发布消息
     */
    async publishMessage(options) {
        await this.zbc.publishMessage({
            name: options.name,
            correlationKey: options.correlationKey,
            variables: (options.variables || {}),
            timeToLive: options.timeToLive || 10000,
        });
    }
    /**
     * 注册 Job Worker
     */
    createWorker(taskType, handler, options) {
        const worker = this.zbc.createWorker({
            taskType,
            taskHandler: handler,
            maxJobsToActivate: options?.maxActiveJobs || 32,
            timeout: options?.timeout || 60000,
        });
        this.workers.push(worker);
        return worker;
    }
    /**
     * 取消流程实例
     */
    async cancelProcessInstance(processInstanceKey) {
        await this.zbc.cancelProcessInstance(processInstanceKey);
    }
    /**
     * 设置变量
     */
    async setVariables(processInstanceKey, variables) {
        await this.zbc.setVariables({
            elementInstanceKey: processInstanceKey,
            variables: variables,
            local: false,
        });
    }
    /**
     * 关闭客户端
     */
    async close() {
        for (const worker of this.workers) {
            await worker.close();
        }
        await this.zbc.close();
    }
}
exports.Camunda8Client = Camunda8Client;
/**
 * Camunda 8 Tasklist API 客户端
 */
class Camunda8TasklistClient {
    constructor(baseUrl = 'http://localhost:8080/tasklist') {
        this.baseUrl = baseUrl;
    }
    setAuthToken(token) {
        this.authToken = token;
    }
    async graphqlQuery(query, variables) {
        const response = await fetch(`${this.baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });
        if (!response.ok) {
            throw new Error(`Tasklist API error: ${response.status}`);
        }
        const result = await response.json();
        if (result.errors) {
            throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
        }
        return result.data;
    }
    async getTasks(filter) {
        const query = `
      query GetTasks($filter: TaskQuery!) {
        tasks(query: $filter) {
          id
          name
          taskDefinitionId
          processName
          assignee
          creationTime
          completionTime
          variables {
            id
            name
            value
          }
        }
      }
    `;
        const data = await this.graphqlQuery(query, {
            filter: {
                state: filter?.state || 'CREATED',
                ...filter,
            },
        });
        return data.tasks || [];
    }
    async claimTask(taskId, assignee) {
        const mutation = `
      mutation ClaimTask($taskId: String!, $assignee: String!) {
        claimTask(taskId: $taskId, assignee: $assignee) {
          id
        }
      }
    `;
        await this.graphqlQuery(mutation, { taskId, assignee });
    }
    async completeTask(taskId, variables) {
        const mutation = `
      mutation CompleteTask($taskId: String!, $variables: [VariableInput!]) {
        completeTask(taskId: $taskId, variables: $variables) {
          id
        }
      }
    `;
        const varsArray = Object.entries(variables || {}).map(([name, value]) => ({
            name,
            value: JSON.stringify(value),
        }));
        await this.graphqlQuery(mutation, { taskId, variables: varsArray });
    }
}
exports.Camunda8TasklistClient = Camunda8TasklistClient;
/**
 * Camunda 8 集成服务
 */
class Camunda8IntegrationService {
    constructor(config) {
        this.zeebeClient = new Camunda8Client({
            gatewayAddress: config?.zeebeGateway || 'localhost:26500',
            plaintext: true,
        });
        this.tasklistClient = new Camunda8TasklistClient(config?.tasklistUrl || 'http://localhost:8080/tasklist');
    }
    /**
     * 启动销售订单审批流程
     */
    async startApprovalProcess(salesOrder) {
        const instance = await this.zeebeClient.startProcess('sales-order-process', {
            orderId: salesOrder.id,
            orderNumber: salesOrder.orderNumber,
            totalAmount: salesOrder.totalAmount,
            customerId: salesOrder.customer.id,
            customerName: salesOrder.customer.name,
            approvalLevel: salesOrder.approvalLevel,
            currentStatus: salesOrder.status,
            createdBy: salesOrder.createdBy,
        });
        return instance.processInstanceKey;
    }
    /**
     * 获取待办任务
     */
    async getTasks(processInstanceKey) {
        return await this.tasklistClient.getTasks({
            processInstanceKey,
            state: 'CREATED',
        });
    }
    /**
     * 完成任务
     */
    async completeTask(taskId, action, comment, approverId) {
        await this.tasklistClient.completeTask(taskId, {
            approvalAction: action,
            approvalComment: comment,
            approverId,
            approvalTimestamp: new Date().toISOString(),
        });
    }
    /**
     * 注册 Service Task Workers
     */
    setupWorkers() {
        // 财务处理 Worker
        this.zeebeClient.createWorker('finance-processing', async (job) => {
            console.log(`[Worker] Processing finance for order: ${job.variables.orderId}`);
            return job.complete({
                financeProcessed: true,
                invoiceNumber: `INV-${Date.now()}`,
            });
        });
        // 库存预留 Worker
        this.zeebeClient.createWorker('inventory-reservation', async (job) => {
            console.log(`[Worker] Reserving inventory for order: ${job.variables.orderId}`);
            return job.complete({
                inventoryReserved: true,
                reservationId: `RES-${Date.now()}`,
            });
        });
        // 客户通知 Worker
        this.zeebeClient.createWorker('notification', async (job) => {
            console.log(`[Worker] Sending notification for order: ${job.variables.orderId}`);
            return job.complete({
                notificationSent: true,
                sentAt: new Date().toISOString(),
            });
        });
        console.log('[Camunda8] Service task workers registered');
    }
    /**
     * 关闭连接
     */
    async close() {
        await this.zeebeClient.close();
    }
}
exports.Camunda8IntegrationService = Camunda8IntegrationService;
// 导出单例
exports.camunda8Client = new Camunda8Client();
exports.camunda8IntegrationService = new Camunda8IntegrationService();
//# sourceMappingURL=camunda8-client.js.map