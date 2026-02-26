import { SalesOrder } from '../domains/sales/models/sales-order.types';
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
export declare class Camunda8Client {
    private zbc;
    private workers;
    constructor(config?: Partial<Camunda8Config>);
    /**
     * 部署流程定义
     */
    deployProcess(bpmnFilePath: string): Promise<{
        processDefinitionKey: string;
        version: number;
    }>;
    /**
     * 启动流程实例
     */
    startProcess(processId: string, variables: Record<string, unknown>): Promise<Camunda8ProcessInstance>;
    /**
     * 发布消息
     */
    publishMessage(options: {
        name: string;
        correlationKey: string;
        variables?: Record<string, unknown>;
        timeToLive?: number;
    }): Promise<void>;
    /**
     * 注册 Job Worker
     */
    createWorker(taskType: string, handler: (job: any) => Promise<any>, options?: {
        maxActiveJobs?: number;
        timeout?: number;
    }): any;
    /**
     * 取消流程实例
     */
    cancelProcessInstance(processInstanceKey: string): Promise<void>;
    /**
     * 设置变量
     */
    setVariables(processInstanceKey: string, variables: Record<string, unknown>): Promise<void>;
    /**
     * 关闭客户端
     */
    close(): Promise<void>;
}
/**
 * Camunda 8 Tasklist API 客户端
 */
export declare class Camunda8TasklistClient {
    private client;
    constructor(baseUrl?: string);
    getTasks(filter?: {
        state?: 'CREATED' | 'COMPLETED' | 'CANCELED';
        assignee?: string;
        candidateGroup?: string;
        processInstanceKey?: string;
    }): Promise<any[]>;
    claimTask(taskId: string, assignee: string): Promise<void>;
    getTaskByProcessInstance(processInstanceKey: string): Promise<any[]>;
    /**
     * 查询所有 User Tasks（包括已完成的）
     * 用于构建流程导航步骤
     */
    getAllUserTasks(processInstanceKey: string): Promise<any[]>;
    /**
     * 内部方法：查询 User Tasks
     */
    private queryUserTasks;
    getTaskDetails(taskId: string): Promise<any>;
    completeTask(taskId: string, variables?: Record<string, unknown>): Promise<void>;
    /**
     * 转换变量格式为 Camunda 8 v2 API 要求的格式
     * v2 API 使用更简单的格式: { "varName": "value" }
     */
    private convertVariablesV2;
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
    getForm(formId: string, processDefinitionKey: string | number, version?: number): Promise<{
        id: string;
        processDefinitionKey: string;
        title: string;
        schema: string;
        version?: number;
        tenantId?: string;
        isDeleted: boolean;
    } | null>;
    /**
     * 获取任务变量 (Camunda 8 Tasklist REST API)
     * GET /v1/tasks/{taskId}/variables
     *
     * @param taskId 任务ID (userTaskKey)
     * @returns 变量对象 { key: { value, type } }
     */
    getTaskVariables(taskId: string): Promise<Record<string, any>>;
    /**
     * 查询流程定义的数字 Key
     * 用于获取 /v1/forms API 所需的 processDefinitionKey 参数
     *
     * @param processId 流程定义ID (如: "sales-order-process")
     * @returns processDefinitionKey (数字) 或 null
     */
    getProcessDefinitionKey(processId: string): Promise<number | null>;
}
/**
 * Camunda 8 集成服务
 */
export declare class Camunda8IntegrationService {
    private zeebeClient;
    private tasklistClient;
    constructor(config?: {
        zeebeGateway?: string;
        tasklistUrl?: string;
    });
    /**
     * 启动销售订单审批流程
     */
    startApprovalProcess(salesOrder: SalesOrder): Promise<string>;
    /**
     * 获取待办任务
     */
    getTasks(processInstanceKey?: string): Promise<any[]>;
    /**
     * 完成任务
     */
    completeTask(taskId: string, action: 'APPROVE' | 'REJECT', comment: string, approverId: string): Promise<void>;
    /**
     * 注册 Service Task Workers
     */
    setupWorkers(): void;
    /**
     * 根据分配人获取待办任务
     */
    getTasksByAssignee(assignee: string): Promise<any[]>;
    /**
     * 获取任务详情（包含变量）
     */
    getTaskDetails(taskId: string): Promise<any | null>;
    /**
     * 关闭连接
     */
    close(): Promise<void>;
}
export declare const camunda8Client: Camunda8Client;
export declare const camunda8IntegrationService: Camunda8IntegrationService;
//# sourceMappingURL=camunda8-client.d.ts.map