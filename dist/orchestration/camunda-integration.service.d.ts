import { SalesOrder, SalesOrderStatus } from '../domains/sales/models/sales-order.types';
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
export declare class CamundaClient {
    private baseUrl;
    private authToken?;
    constructor(baseUrl?: string);
    /**
     * 设置认证token
     */
    setAuthToken(token: string): void;
    /**
     * 发起HTTP请求
     */
    private request;
    /**
     * 部署流程定义
     */
    deployProcess(bpmnXml: string, name: string): Promise<string>;
    /**
     * 获取流程定义列表
     */
    getProcessDefinitions(): Promise<CamundaProcessDefinition[]>;
    /**
     * 启动流程实例
     */
    startProcess(processKey: string, businessKey: string, variables?: Record<string, unknown>): Promise<CamundaProcessInstance>;
    /**
     * 获取流程实例详情
     */
    getProcessInstance(instanceId: string): Promise<CamundaProcessInstance | null>;
    /**
     * 获取活动节点列表
     */
    getActivities(instanceId: string): Promise<CamundaActivity[]>;
    /**
     * 获取待办任务列表
     */
    getTasks(assignee?: string, processInstanceId?: string): Promise<CamundaActivity[]>;
    /**
     * 完成任务
     */
    completeTask(taskId: string, variables?: Record<string, unknown>): Promise<void>;
    /**
     * 声明任务
     */
    claimTask(taskId: string, userId: string): Promise<void>;
    /**
     * 获取流程变量
     */
    getVariables(instanceId: string): Promise<Record<string, unknown>>;
    /**
     * 设置流程变量
     */
    setVariable(instanceId: string, name: string, value: unknown): Promise<void>;
    /**
     * 获取外部任务
     */
    fetchExternalTasks(topicNames: string[], workerId: string, maxTasks?: number): Promise<ExternalTask[]>;
    /**
     * 完成外部任务
     */
    completeExternalTask(workerId: string, taskId: string, variables?: Record<string, unknown>): Promise<void>;
    /**
     * 取消流程实例
     */
    deleteProcessInstance(instanceId: string, reason?: string): Promise<void>;
    /**
     * 将变量转换为Camunda格式
     */
    private variablesToCamundaFormat;
    /**
     * 从Camunda格式转换变量
     */
    private variablesFromCamundaFormat;
}
/**
 * Camunda流程集成服务
 * 负责编排层与Camunda的交互
 */
export declare class CamundaIntegrationService {
    private camundaClient;
    private processKey;
    constructor(camundaClient?: CamundaClient);
    /**
     * 启动审批流程
     */
    startApprovalProcess(salesOrder: SalesOrder): Promise<string>;
    /**
     * 获取当前待办任务
     */
    getCurrentTasks(processInstanceId: string): Promise<CamundaActivity[]>;
    /**
     * 获取当前审批节点
     */
    getCurrentApprovalNode(processInstanceId: string): Promise<CamundaActivity | null>;
    /**
     * 获取当前节点对应的表单Key
     */
    getCurrentFormKey(processInstanceId: string): Promise<string | null>;
    /**
     * 提交任务（完成UserTask）
     */
    submitTask(taskId: string, action: 'APPROVE' | 'REJECT', comment: string, approverId: string): Promise<void>;
    /**
     * 获取审批历史（从Camunda获取）
     */
    getApprovalHistory(processInstanceId: string): Promise<{
        approver: string;
        action: string;
        comment: string;
        timestamp: Date;
        nodeName: string;
    }[]>;
    /**
     * 设置订单状态
     */
    updateOrderStatus(processInstanceId: string, status: SalesOrderStatus): Promise<void>;
    /**
     * 获取订单状态
     */
    getOrderStatus(processInstanceId: string): Promise<SalesOrderStatus>;
    /**
     * 获取流程进度
     */
    getProcessProgress(processInstanceId: string): Promise<{
        currentNodeId: string;
        currentNodeName: string;
        currentNodeType: string;
        completedNodes: string[];
        pendingNodes: string[];
        progressPercentage: number;
    }>;
    /**
     * 取消流程
     */
    cancelProcess(processInstanceId: string, reason: string): Promise<void>;
    /**
     * 回退到指定节点
     */
    rollbackToNode(processInstanceId: string, nodeId: string): Promise<void>;
}
export declare const camundaIntegrationService: CamundaIntegrationService;
export declare const camundaClient: CamundaClient;
//# sourceMappingURL=camunda-integration.service.d.ts.map