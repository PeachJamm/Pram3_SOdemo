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
    private baseUrl;
    private authToken?;
    constructor(baseUrl?: string);
    setAuthToken(token: string): void;
    private graphqlQuery;
    getTasks(filter?: {
        state?: 'CREATED' | 'COMPLETED' | 'CANCELED';
        assignee?: string;
        candidateGroup?: string;
        processInstanceKey?: string;
    }): Promise<any[]>;
    claimTask(taskId: string, assignee: string): Promise<void>;
    completeTask(taskId: string, variables?: Record<string, unknown>): Promise<void>;
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
     * 关闭连接
     */
    close(): Promise<void>;
}
export declare const camunda8Client: Camunda8Client;
export declare const camunda8IntegrationService: Camunda8IntegrationService;
//# sourceMappingURL=camunda8-client.d.ts.map