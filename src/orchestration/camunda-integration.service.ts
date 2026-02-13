// =====================================================
// PRAM3 ERP Core - Camunda Integration Service
// Camunda流程引擎集成服务
// =====================================================

import { v4 as uuidv4 } from 'uuid';
import * as http from 'http';
import * as https from 'https';
import {
  SalesOrder,
  SalesOrderStatus,
  ApprovalLevel,
} from '../domains/sales/models/sales-order.types';

/**
 * Camunda流程定义
 */
export interface CamundaProcessDefinition {
  id: string;
  key: string;
  name: string;
  version: number;
  bpmnXml: string;
}

/**
 * Camunda流程实例
 */
export interface CamundaProcessInstance {
  id: string;
  processDefinitionId: string;
  businessKey: string;
  state: 'ACTIVE' | 'SUSPENDED' | 'COMPLETED';
  variables: Record<string, unknown>;
  startTime: Date;
  endTime?: Date;
}

/**
 * Camunda活动节点（UserTask等）
 */
export interface CamundaActivity {
  id: string;
  name: string;
  type: 'userTask' | 'serviceTask' | 'exclusiveGateway' | 'startEvent' | 'endEvent';
  formKey?: string;
  assignee?: string;
  candidateGroups?: string[];
  variables?: Record<string, unknown>;
  outgoingLinks?: string[];
  incomingLinks?: string[];
}

/**
 * Camunda变量
 */
export interface CamundaVariable {
  name: string;
  value: unknown;
  type: 'string' | 'integer' | 'double' | 'boolean' | 'date' | 'json';
}

/**
 * 外部任务
 */
export interface ExternalTask {
  id: string;
  topicName: string;
  workerId: string;
  retries: number;
  priority: number;
  variables: Record<string, unknown>;
}

/**
 * Camunda REST API客户端
 */
export class CamundaClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = 'http://localhost:8080/engine-rest') {
    this.baseUrl = baseUrl;
  }

  /**
   * 设置认证token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * 发起HTTP请求
   */
  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const statusCode = res.statusCode || 0;
            
            // 204 No Content
            if (statusCode === 204 || data === '') {
              resolve({});
              return;
            }
            
            // 错误状态码
            if (statusCode >= 400) {
              reject(new Error(`HTTP ${statusCode}: ${data}`));
              return;
            }
            
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  /**
   * 部署流程定义
   */
  async deployProcess(bpmnXml: string, name: string): Promise<string> {
    const result = await this.request('POST', '/deployment/create', {
      deploymentName: name,
      enableDuplicateFiltering: true,
      deploymentSource: 'pram3-erp',
      bpmnFiles: [
        {
          name: `${name}.bpmn`,
          bytes: Buffer.from(bpmnXml).toString('base64'),
        },
      ],
    });
    return (result as { id: string }).id;
  }

  /**
   * 获取流程定义列表
   */
  async getProcessDefinitions(): Promise<CamundaProcessDefinition[]> {
    const result = await this.request('GET', '/process-definition?latestVersion=true');
    return (result as CamundaProcessDefinition[]) || [];
  }

  /**
   * 启动流程实例
   */
  async startProcess(processKey: string, businessKey: string, variables?: Record<string, unknown>): Promise<CamundaProcessInstance> {
    const result = await this.request('POST', `/process-definition/key/${processKey}/start`, {
      businessKey,
      variables: this.variablesToCamundaFormat(variables),
    });
    return result as CamundaProcessInstance;
  }

  /**
   * 获取流程实例详情
   */
  async getProcessInstance(instanceId: string): Promise<CamundaProcessInstance | null> {
    try {
      const result = await this.request('GET', `/process-instance/${instanceId}`);
      return (result as CamundaProcessInstance) || null;
    } catch {
      return null;
    }
  }

  /**
   * 获取活动节点列表
   */
  async getActivities(instanceId: string): Promise<CamundaActivity[]> {
    const result = await this.request('GET', `/process-instance/${instanceId}/activity-instances`);
    // 实际实现中需要解析Camunda返回的树形结构
    return [];
  }

  /**
   * 获取待办任务列表
   */
  async getTasks(assignee?: string, processInstanceId?: string): Promise<CamundaActivity[]> {
    let path = '/task?active=true';
    if (assignee) path += `&assignee=${assignee}`;
    if (processInstanceId) path += `&processInstanceId=${processInstanceId}`;
    
    const result = await this.request('GET', path);
    return (result as CamundaActivity[]) || [];
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, variables?: Record<string, unknown>): Promise<void> {
    await this.request('POST', `/task/${taskId}/complete`, {
      variables: this.variablesToCamundaFormat(variables),
    });
  }

  /**
   * 声明任务
   */
  async claimTask(taskId: string, userId: string): Promise<void> {
    await this.request('POST', `/task/${taskId}/claim`, {
      userId,
    });
  }

  /**
   * 获取流程变量
   */
  async getVariables(instanceId: string): Promise<Record<string, unknown>> {
    const result = await this.request('GET', `/process-instance/${instanceId}/variables`);
    return this.variablesFromCamundaFormat(result as Record<string, CamundaVariable>);
  }

  /**
   * 设置流程变量
   */
  async setVariable(instanceId: string, name: string, value: unknown): Promise<void> {
    await this.request('PUT', `/process-instance/${instanceId}/variables/${name}`, {
      value: String(value),
      type: typeof value === 'string' ? 'string' : 'json',
    });
  }

  /**
   * 获取外部任务
   */
  async fetchExternalTasks(topicNames: string[], workerId: string, maxTasks: number = 10): Promise<ExternalTask[]> {
    const result = await this.request('POST', '/external-task/fetchAndLock', {
      workerId,
      maxTasks,
      topics: topicNames.map(topic => ({
        topicName: topic,
        lockDuration: 60000,
      })),
    });
    return (result as ExternalTask[]) || [];
  }

  /**
   * 完成外部任务
   */
  async completeExternalTask(workerId: string, taskId: string, variables?: Record<string, unknown>): Promise<void> {
    await this.request('POST', `/external-task/${taskId}/complete`, {
      workerId,
      variables: this.variablesToCamundaFormat(variables),
    });
  }

  /**
   * 取消流程实例
   */
  async deleteProcessInstance(instanceId: string, reason?: string): Promise<void> {
    await this.request('DELETE', `/process-instance/${instanceId}?deleteReason=${reason || 'cancelled'}`);
  }

  /**
   * 将变量转换为Camunda格式
   */
  private variablesToCamundaFormat(variables?: Record<string, unknown>): Record<string, { value: unknown; type: string }> | undefined {
    if (!variables) return undefined;
    
    const result: Record<string, { value: unknown; type: string }> = {};
    for (const [key, value] of Object.entries(variables)) {
      result[key] = {
        value,
        type: typeof value as string,
      };
    }
    return result;
  }

  /**
   * 从Camunda格式转换变量
   */
  private variablesFromCamundaFormat(camundaVars: Record<string, CamundaVariable>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, varDef] of Object.entries(camundaVars)) {
      result[key] = varDef.value;
    }
    return result;
  }
}

/**
 * Camunda流程集成服务
 * 负责编排层与Camunda的交互
 */
export class CamundaIntegrationService {
  private camundaClient: CamundaClient;
  private processKey = 'salesOrderApprovalProcess';

  constructor(camundaClient?: CamundaClient) {
    this.camundaClient = camundaClient || new CamundaClient();
  }

  /**
   * 启动审批流程
   */
  async startApprovalProcess(salesOrder: SalesOrder): Promise<string> {
    const instance = await this.camundaClient.startProcess(
      this.processKey,
      salesOrder.id,
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

    return instance.id;
  }

  /**
   * 获取当前待办任务
   */
  async getCurrentTasks(processInstanceId: string): Promise<CamundaActivity[]> {
    return await this.camundaClient.getTasks(undefined, processInstanceId);
  }

  /**
   * 获取当前审批节点
   */
  async getCurrentApprovalNode(processInstanceId: string): Promise<CamundaActivity | null> {
    const tasks = await this.camundaClient.getTasks(undefined, processInstanceId);
    return tasks.find(t => t.type === 'userTask') || null;
  }

  /**
   * 获取当前节点对应的表单Key
   */
  async getCurrentFormKey(processInstanceId: string): Promise<string | null> {
    const currentNode = await this.getCurrentApprovalNode(processInstanceId);
    return currentNode?.formKey || null;
  }

  /**
   * 提交任务（完成UserTask）
   */
  async submitTask(
    taskId: string,
    action: 'APPROVE' | 'REJECT',
    comment: string,
    approverId: string
  ): Promise<void> {
    await this.camundaClient.completeTask(taskId, {
      approvalAction: action,
      approvalComment: comment,
      approverId,
      approvalTimestamp: new Date().toISOString(),
    });
  }

  /**
   * 获取审批历史（从Camunda获取）
   */
  async getApprovalHistory(processInstanceId: string): Promise<{
    approver: string;
    action: string;
    comment: string;
    timestamp: Date;
    nodeName: string;
  }[]> {
    const variables = await this.camundaClient.getVariables(processInstanceId);
    
    // 实际实现中，应该查询历史任务表
    // GET /history/task?processInstanceId={instanceId}
    return [];
  }

  /**
   * 设置订单状态
   */
  async updateOrderStatus(processInstanceId: string, status: SalesOrderStatus): Promise<void> {
    await this.camundaClient.setVariable(processInstanceId, 'currentStatus', status);
  }

  /**
   * 获取订单状态
   */
  async getOrderStatus(processInstanceId: string): Promise<SalesOrderStatus> {
    const variables = await this.camundaClient.getVariables(processInstanceId);
    return (variables['currentStatus'] as SalesOrderStatus) || SalesOrderStatus.DRAFT;
  }

  /**
   * 获取流程进度
   */
  async getProcessProgress(processInstanceId: string): Promise<{
    currentNodeId: string;
    currentNodeName: string;
    currentNodeType: string;
    completedNodes: string[];
    pendingNodes: string[];
    progressPercentage: number;
  }> {
    // 实际实现中，需要解析BPMN流程图来确定进度
    return {
      currentNodeId: '',
      currentNodeName: '',
      currentNodeType: '',
      completedNodes: [],
      pendingNodes: [],
      progressPercentage: 0,
    };
  }

  /**
   * 取消流程
   */
  async cancelProcess(processInstanceId: string, reason: string): Promise<void> {
    await this.camundaClient.deleteProcessInstance(processInstanceId, reason);
  }

  /**
   * 回退到指定节点
   */
  async rollbackToNode(processInstanceId: string, nodeId: string): Promise<void> {
    // Camunda不直接支持回退到任意节点
    // 实际实现中需要：
    // 1. 调用ManagementService执行回退
    // 2. 或者创建新的流程实例
    console.log(`Rollback to node: ${nodeId} for process: ${processInstanceId}`);
  }
}

// 导出服务实例
export const camundaIntegrationService = new CamundaIntegrationService();
export const camundaClient = new CamundaClient();
