// =====================================================
// PRAM3 ERP Core - Camunda 8 Client
// Camunda 8 (Zeebe) gRPC Client
// =====================================================

import { ZBClient, ZBWorker, ZeebeJob, JSONDoc } from 'zeebe-node';
import { Tasklist } from '@camunda8/sdk';
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
  private client: Tasklist.TasklistApiClient;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.client = new Tasklist.TasklistApiClient({
      config: {
        CAMUNDA_TASKLIST_BASE_URL: baseUrl,
        CAMUNDA_OAUTH_DISABLED: true, // 开发环境禁用 OAuth
      },
    });
  }

  async getTasks(filter?: {
    state?: 'CREATED' | 'COMPLETED' | 'CANCELED';
    assignee?: string;
    candidateGroup?: string;
    processInstanceKey?: string;
  }): Promise<any[]> {
    // 使用 SDK 的 searchTasks 方法
    return await this.client.searchTasks({
      state: filter?.state || 'CREATED',
      processInstanceKey: filter?.processInstanceKey,
      assignee: filter?.assignee,
    });
  }

  async claimTask(taskId: string, assignee: string): Promise<void> {
    // 使用 SDK 的 assignTask
    await this.client.assignTask({
      taskId,
      assignee,
    });
  }

  async getTaskByProcessInstance(processInstanceKey: string): Promise<any[]> {
    // 查询活动的 User Tasks (state: CREATED)
    return this.queryUserTasks(processInstanceKey, 'CREATED');
  }

  /**
   * 查询所有 User Tasks（包括已完成的）
   * 用于构建流程导航步骤
   */
  async getAllUserTasks(processInstanceKey: string): Promise<any[]> {
    // 不指定 state，查询所有状态
    return this.queryUserTasks(processInstanceKey);
  }

  /**
   * 内部方法：查询 User Tasks
   */
  private async queryUserTasks(processInstanceKey: string, state?: string): Promise<any[]> {
    const url = 'http://localhost:8088/v2/user-tasks/search';
    
    try {
      const body: any = {
        filter: {
          processInstanceKey: processInstanceKey,
        },
      };
      
      // 如果指定了 state，添加到过滤条件
      if (state) {
        body.filter.state = state;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.warn(`[Camunda8Tasklist] API not available: ${response.status}`);
        return [];
      }

      const data: any = await response.json();
      return data.items || [];
    } catch (error) {
      console.warn(`[Camunda8Tasklist] API connection failed:`, error);
      return [];
    }
  }

  async getTaskDetails(taskId: string): Promise<any> {
    // 优先使用 REST API 获取任务详情（包含 formVersion）
    // SDK 的 getTask 可能不包含 formVersion
    const baseUrls = ['http://localhost:8088', 'http://localhost:8080'];
    
    for (const baseUrl of baseUrls) {
      try {
        // 尝试使用 Tasklist REST API v1 获取任务详情
        const url = `${baseUrl}/v1/tasks/${taskId}`;
        console.log(`[Camunda8Tasklist] Getting task details from: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data: any = await response.json();
          console.log(`[Camunda8Tasklist] Task details loaded: ${data.id}, formVersion: ${data.formVersion}`);
          return data;
        }
        
        if (response.status === 404) {
          console.warn(`[Camunda8Tasklist] Task not found: ${taskId}`);
          return null;
        }
        
        console.warn(`[Camunda8Tasklist] Failed from ${baseUrl}: ${response.status}`);
      } catch (error) {
        console.warn(`[Camunda8Tasklist] Connection failed to ${baseUrl}:`, error);
      }
    }
    
    // 如果 REST API 都失败了，回退到 SDK
    console.log(`[Camunda8Tasklist] Falling back to SDK for task ${taskId}`);
    return await this.client.getTask(taskId);
  }

  async completeTask(taskId: string, variables?: Record<string, unknown>): Promise<void> {
    // 使用 Camunda 8.8 v2 API (alpha) 完成任务
    const baseUrls = ['http://localhost:8088', 'http://localhost:8080'];
    
    for (const baseUrl of baseUrls) {
      try {
        // v2 API endpoint for completing user tasks
        const url = `${baseUrl}/v2/user-tasks/${taskId}/completion`;
        console.log(`[Camunda8Tasklist] Completing task via v2 API: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            variables: this.convertVariablesV2(variables),
          }),
        });

        if (response.ok) {
          console.log(`[Camunda8Tasklist] Task ${taskId} completed successfully via v2 API`);
          return;
        }
        
        if (response.status === 404) {
          console.warn(`[Camunda8Tasklist] Task not found: ${taskId}`);
          throw new Error(`Task not found: ${taskId}`);
        }
        
        const errorText = await response.text();
        console.warn(`[Camunda8Tasklist] Failed from ${baseUrl}: ${response.status} - ${errorText}`);
      } catch (error: any) {
        if (error.message?.includes('not found')) {
          throw error;
        }
        console.warn(`[Camunda8Tasklist] Connection failed to ${baseUrl}:`, error.message);
      }
    }
    
    throw new Error(`Failed to complete task ${taskId} on all endpoints`);
  }
  
  /**
   * 转换变量格式为 Camunda 8 v2 API 要求的格式
   * v2 API 使用更简单的格式: { "varName": "value" }
   */
  private convertVariablesV2(variables?: Record<string, unknown>): Record<string, any> {
    if (!variables) return {};
    
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(variables)) {
      if (value === null || value === undefined) continue;
      result[key] = value;
    }
    return result;
  }

  /**
   * 获取表单定义 (Camunda 8 Tasklist REST API)
   * GET /v1/forms/{formId}?processDefinitionKey={processDefinitionKey}&version={version}
   * 
   * 注意: processDefinitionKey 必须是数字 (如: 2251799813689190)，
   * 不是字符串流程ID (如: "sales-order-process")
   * 
   * @param formId 表单ID (如: "order-validation")
   * @param processDefinitionKey 流程定义Key (数字)
   * @param version 表单版本号(可选)，不传则获取最新版本
   * @returns 表单定义对象 { id, processDefinitionKey, title, schema, version, tenantId, isDeleted }
   */
  async getForm(formId: string, processDefinitionKey: string | number, version?: number): Promise<{
    id: string;
    processDefinitionKey: string;
    title: string;
    schema: string;
    version?: number;
    tenantId?: string;
    isDeleted: boolean;
  } | null> {
    // Tasklist API 默认端口是 8080，但我们的环境使用 8088
    const baseUrls = ['http://localhost:8088', 'http://localhost:8080'];
    
    for (const baseUrl of baseUrls) {
      try {
        let url = `${baseUrl}/v1/forms/${formId}?processDefinitionKey=${processDefinitionKey}`;
        // 如果指定了版本，添加到URL参数
        if (version !== undefined) {
          url += `&version=${version}`;
        }
        console.log(`[Camunda8Tasklist] Getting form from: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data: any = await response.json();
          console.log(`[Camunda8Tasklist] Form loaded: ${data.id}, version: ${data.version}`);
          return data as { id: string; processDefinitionKey: string; title: string; schema: string; version?: number; tenantId?: string; isDeleted: boolean; };
        }
        
        if (response.status === 404) {
          console.warn(`[Camunda8Tasklist] Form not found: ${formId} with processDefinitionKey=${processDefinitionKey}`);
          return null;
        }
        
        console.warn(`[Camunda8Tasklist] Failed from ${baseUrl}: ${response.status}`);
      } catch (error) {
        console.warn(`[Camunda8Tasklist] Connection failed to ${baseUrl}:`, error);
      }
    }
    
    return null;
  }

  /**
   * 获取任务变量 (Camunda 8 Tasklist REST API)
   * GET /v1/tasks/{taskId}/variables
   * 
   * @param taskId 任务ID (userTaskKey)
   * @returns 变量对象 { key: { value, type } }
   */
  async getTaskVariables(taskId: string): Promise<Record<string, any>> {
    const baseUrls = ['http://localhost:8088', 'http://localhost:8080'];
    
    for (const baseUrl of baseUrls) {
      try {
        const url = `${baseUrl}/v1/tasks/${taskId}/variables`;
        console.log(`[Camunda8Tasklist] Getting task variables from: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data: any = await response.json();
          // 转换为简单对象 { key: value }
          const variables: Record<string, any> = {};
          if (Array.isArray(data)) {
            for (const v of data) {
              variables[v.name] = v.value;
            }
          }
          console.log(`[Camunda8Tasklist] Task variables loaded:`, Object.keys(variables));
          return variables;
        }
        
        if (response.status === 404) {
          console.warn(`[Camunda8Tasklist] Task not found: ${taskId}`);
          return {};
        }
        
        console.warn(`[Camunda8Tasklist] Failed from ${baseUrl}: ${response.status}`);
      } catch (error) {
        console.warn(`[Camunda8Tasklist] Connection failed to ${baseUrl}:`, error);
      }
    }
    
    return {};
  }

  /**
   * 查询流程定义的数字 Key
   * 用于获取 /v1/forms API 所需的 processDefinitionKey 参数
   * 
   * @param processId 流程定义ID (如: "sales-order-process")
   * @returns processDefinitionKey (数字) 或 null
   */
  async getProcessDefinitionKey(processId: string): Promise<number | null> {
    try {
      // 使用 Camunda 8 REST API 查询流程定义
      const url = `http://localhost:8088/v1/process-definitions?filter=${encodeURIComponent(processId)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data: any = await response.json();
        // 返回第一个匹配的流程定义的 key
        if (data.items && data.items.length > 0) {
          const key = parseInt(data.items[0].processDefinitionKey, 10);
          console.log(`[Camunda8Tasklist] Found processDefinitionKey: ${key} for ${processId}`);
          return key;
        }
      }
      
      console.warn(`[Camunda8Tasklist] Process definition not found: ${processId}`);
      return null;
    } catch (error) {
      console.warn(`[Camunda8Tasklist] Failed to get process definition key:`, error);
      return null;
    }
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
   * 根据分配人获取待办任务
   */
  async getTasksByAssignee(assignee: string): Promise<any[]> {
    return await this.tasklistClient.getTasks({
      assignee,
      state: 'CREATED',
    });
  }

  /**
   * 获取任务详情（包含变量）
   */
  async getTaskDetails(taskId: string): Promise<any | null> {
    const tasks = await this.tasklistClient.getTasks();
    return tasks.find((t: any) => t.id === taskId) || null;
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
