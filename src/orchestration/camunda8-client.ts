// =====================================================
// PRAM3 ERP Core - Camunda 8 Client
// Camunda 8 (Zeebe) gRPC Client
// =====================================================

import { ZBClient, ZBWorker, ZeebeJob, JSONDoc } from 'zeebe-node';
import {
  SalesOrder,
  SalesOrderStatus,
} from '../domains/sales/models/sales-order.types';

/**
 * Camunda 8 流程实例
 */
export interface Camunda8ProcessInstance {
  processInstanceKey: string;
  processDefinitionKey: string;
  processDefinitionId: string;
  version: number;
  variables: Record<string, unknown>;
  startTime: Date;
}

/**
 * Camunda 8 任务（User Task）
 */
export interface Camunda8Task {
  jobKey: string;
  processInstanceKey: string;
  elementId: string;
  elementName: string;
  assignee?: string;
  candidateGroups?: string[];
  variables: Record<string, unknown>;
  formKey?: string;
  customHeaders: Record<string, string>;
}

/**
 * Camunda 8 客户端配置
 */
export interface Camunda8Config {
  gatewayAddress: string;
  tenantId?: string;
  auth?: {
    clientId: string;
    clientSecret: string;
    oauthUrl: string;
  };
  plaintext?: boolean;
}

/**
 * Camunda 8 Zeebe 客户端
 */
export class Camunda8Client {
  private zbc: ZBClient;
  private workers: ZBWorker<any, any, any>[] = [];

  constructor(config?: Partial<Camunda8Config>) {
    const defaultConfig: Camunda8Config = {
      gatewayAddress: 'localhost:26500',
      plaintext: true,
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.zbc = new ZBClient(finalConfig.gatewayAddress, {
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
  async deployProcess(bpmnFilePath: string): Promise<{
    processDefinitionKey: string;
    version: number;
  }> {
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
  async startProcess(
    processId: string,
    variables: Record<string, unknown>
  ): Promise<Camunda8ProcessInstance> {
    const result = await this.zbc.createProcessInstance({
      bpmnProcessId: processId,
      variables: variables as JSONDoc,
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
  async publishMessage(options: {
    name: string;
    correlationKey: string;
    variables?: Record<string, unknown>;
    timeToLive?: number;
  }): Promise<void> {
    await this.zbc.publishMessage({
      name: options.name,
      correlationKey: options.correlationKey,
      variables: (options.variables || {}) as JSONDoc,
      timeToLive: options.timeToLive || 10000,
    });
  }

  /**
   * 注册 Job Worker
   */
  createWorker(
    taskType: string,
    handler: (job: any) => Promise<any>,
    options?: {
      maxActiveJobs?: number;
      timeout?: number;
    }
  ): any {
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
  async cancelProcessInstance(processInstanceKey: string): Promise<void> {
    await this.zbc.cancelProcessInstance(
      processInstanceKey as any
    );
  }

  /**
   * 设置变量
   */
  async setVariables(
    processInstanceKey: string,
    variables: Record<string, unknown>
  ): Promise<void> {
    await this.zbc.setVariables({
      elementInstanceKey: processInstanceKey,
      variables: variables as JSONDoc,
      local: false,
    });
  }

  /**
   * 关闭客户端
   */
  async close(): Promise<void> {
    for (const worker of this.workers) {
      await worker.close();
    }
    await this.zbc.close();
  }
}

/**
 * Camunda 8 Tasklist API 客户端
 */
export class Camunda8TasklistClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = 'http://localhost:8080/tasklist') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private async graphqlQuery(query: string, variables?: Record<string, unknown>): Promise<any> {
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

    const result: any = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  async getTasks(filter?: {
    state?: 'CREATED' | 'COMPLETED' | 'CANCELED';
    assignee?: string;
    candidateGroup?: string;
    processInstanceKey?: string;
  }): Promise<any[]> {
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

  async claimTask(taskId: string, assignee: string): Promise<void> {
    const mutation = `
      mutation ClaimTask($taskId: String!, $assignee: String!) {
        claimTask(taskId: $taskId, assignee: $assignee) {
          id
        }
      }
    `;

    await this.graphqlQuery(mutation, { taskId, assignee });
  }

  async completeTask(taskId: string, variables?: Record<string, unknown>): Promise<void> {
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

/**
 * Camunda 8 集成服务
 */
export class Camunda8IntegrationService {
  private zeebeClient: Camunda8Client;
  private tasklistClient: Camunda8TasklistClient;

  constructor(config?: {
    zeebeGateway?: string;
    tasklistUrl?: string;
  }) {
    this.zeebeClient = new Camunda8Client({
      gatewayAddress: config?.zeebeGateway || 'localhost:26500',
      plaintext: true,
    });

    this.tasklistClient = new Camunda8TasklistClient(
      config?.tasklistUrl || 'http://localhost:8080/tasklist'
    );
  }

  /**
   * 启动销售订单审批流程
   */
  async startApprovalProcess(salesOrder: SalesOrder): Promise<string> {
    const instance = await this.zeebeClient.startProcess(
      'sales-order-process',
      {
        orderId: salesOrder.id,
        orderNumber: salesOrder.orderNumber,
        totalAmount: salesOrder.totalAmount,
        customerId: salesOrder.customer.id,
        customerName: salesOrder.customer.name,
        approvalLevel: salesOrder.approvalLevel,
        currentStatus: salesOrder.status,
        createdBy: salesOrder.createdBy,
      }
    );

    return instance.processInstanceKey;
  }

  /**
   * 获取待办任务
   */
  async getTasks(processInstanceKey?: string): Promise<any[]> {
    return await this.tasklistClient.getTasks({
      processInstanceKey,
      state: 'CREATED',
    });
  }

  /**
   * 完成任务
   */
  async completeTask(
    taskId: string,
    action: 'APPROVE' | 'REJECT',
    comment: string,
    approverId: string
  ): Promise<void> {
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
  setupWorkers(): void {
    // 财务处理 Worker
    this.zeebeClient.createWorker(
      'finance-processing',
      async (job: any) => {
        console.log(`[Worker] Processing finance for order: ${job.variables.orderId}`);
        return job.complete({
          financeProcessed: true,
          invoiceNumber: `INV-${Date.now()}`,
        });
      }
    );

    // 库存预留 Worker
    this.zeebeClient.createWorker(
      'inventory-reservation',
      async (job: any) => {
        console.log(`[Worker] Reserving inventory for order: ${job.variables.orderId}`);
        return job.complete({
          inventoryReserved: true,
          reservationId: `RES-${Date.now()}`,
        });
      }
    );

    // 客户通知 Worker
    this.zeebeClient.createWorker(
      'notification',
      async (job: any) => {
        console.log(`[Worker] Sending notification for order: ${job.variables.orderId}`);
        return job.complete({
          notificationSent: true,
          sentAt: new Date().toISOString(),
        });
      }
    );

    console.log('[Camunda8] Service task workers registered');
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    await this.zeebeClient.close();
  }
}

// 导出单例
export const camunda8Client = new Camunda8Client();
export const camunda8IntegrationService = new Camunda8IntegrationService();
