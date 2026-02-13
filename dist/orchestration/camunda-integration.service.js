"use strict";
// =====================================================
// PRAM3 ERP Core - Camunda Integration Service
// Camunda流程引擎集成服务
// =====================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.camundaClient = exports.camundaIntegrationService = exports.CamundaIntegrationService = exports.CamundaClient = void 0;
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const sales_order_types_1 = require("../domains/sales/models/sales-order.types");
/**
 * Camunda REST API客户端
 */
class CamundaClient {
    constructor(baseUrl = 'http://localhost:8080/engine-rest') {
        this.baseUrl = baseUrl;
    }
    /**
     * 设置认证token
     */
    setAuthToken(token) {
        this.authToken = token;
    }
    /**
     * 发起HTTP请求
     */
    async request(method, path, body) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const client = url.protocol === 'https:' ? https : http;
            const options = {
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
                    }
                    catch (error) {
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
    async deployProcess(bpmnXml, name) {
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
        return result.id;
    }
    /**
     * 获取流程定义列表
     */
    async getProcessDefinitions() {
        const result = await this.request('GET', '/process-definition?latestVersion=true');
        return result || [];
    }
    /**
     * 启动流程实例
     */
    async startProcess(processKey, businessKey, variables) {
        const result = await this.request('POST', `/process-definition/key/${processKey}/start`, {
            businessKey,
            variables: this.variablesToCamundaFormat(variables),
        });
        return result;
    }
    /**
     * 获取流程实例详情
     */
    async getProcessInstance(instanceId) {
        try {
            const result = await this.request('GET', `/process-instance/${instanceId}`);
            return result || null;
        }
        catch {
            return null;
        }
    }
    /**
     * 获取活动节点列表
     */
    async getActivities(instanceId) {
        const result = await this.request('GET', `/process-instance/${instanceId}/activity-instances`);
        // 实际实现中需要解析Camunda返回的树形结构
        return [];
    }
    /**
     * 获取待办任务列表
     */
    async getTasks(assignee, processInstanceId) {
        let path = '/task?active=true';
        if (assignee)
            path += `&assignee=${assignee}`;
        if (processInstanceId)
            path += `&processInstanceId=${processInstanceId}`;
        const result = await this.request('GET', path);
        return result || [];
    }
    /**
     * 完成任务
     */
    async completeTask(taskId, variables) {
        await this.request('POST', `/task/${taskId}/complete`, {
            variables: this.variablesToCamundaFormat(variables),
        });
    }
    /**
     * 声明任务
     */
    async claimTask(taskId, userId) {
        await this.request('POST', `/task/${taskId}/claim`, {
            userId,
        });
    }
    /**
     * 获取流程变量
     */
    async getVariables(instanceId) {
        const result = await this.request('GET', `/process-instance/${instanceId}/variables`);
        return this.variablesFromCamundaFormat(result);
    }
    /**
     * 设置流程变量
     */
    async setVariable(instanceId, name, value) {
        await this.request('PUT', `/process-instance/${instanceId}/variables/${name}`, {
            value: String(value),
            type: typeof value === 'string' ? 'string' : 'json',
        });
    }
    /**
     * 获取外部任务
     */
    async fetchExternalTasks(topicNames, workerId, maxTasks = 10) {
        const result = await this.request('POST', '/external-task/fetchAndLock', {
            workerId,
            maxTasks,
            topics: topicNames.map(topic => ({
                topicName: topic,
                lockDuration: 60000,
            })),
        });
        return result || [];
    }
    /**
     * 完成外部任务
     */
    async completeExternalTask(workerId, taskId, variables) {
        await this.request('POST', `/external-task/${taskId}/complete`, {
            workerId,
            variables: this.variablesToCamundaFormat(variables),
        });
    }
    /**
     * 取消流程实例
     */
    async deleteProcessInstance(instanceId, reason) {
        await this.request('DELETE', `/process-instance/${instanceId}?deleteReason=${reason || 'cancelled'}`);
    }
    /**
     * 将变量转换为Camunda格式
     */
    variablesToCamundaFormat(variables) {
        if (!variables)
            return undefined;
        const result = {};
        for (const [key, value] of Object.entries(variables)) {
            result[key] = {
                value,
                type: typeof value,
            };
        }
        return result;
    }
    /**
     * 从Camunda格式转换变量
     */
    variablesFromCamundaFormat(camundaVars) {
        const result = {};
        for (const [key, varDef] of Object.entries(camundaVars)) {
            result[key] = varDef.value;
        }
        return result;
    }
}
exports.CamundaClient = CamundaClient;
/**
 * Camunda流程集成服务
 * 负责编排层与Camunda的交互
 */
class CamundaIntegrationService {
    constructor(camundaClient) {
        this.processKey = 'salesOrderApprovalProcess';
        this.camundaClient = camundaClient || new CamundaClient();
    }
    /**
     * 启动审批流程
     */
    async startApprovalProcess(salesOrder) {
        const instance = await this.camundaClient.startProcess(this.processKey, salesOrder.id, {
            orderId: salesOrder.id,
            orderNumber: salesOrder.orderNumber,
            totalAmount: salesOrder.totalAmount,
            customerId: salesOrder.customer.id,
            customerName: salesOrder.customer.name,
            approvalLevel: salesOrder.approvalLevel,
            currentStatus: salesOrder.status,
            createdBy: salesOrder.createdBy,
        });
        return instance.id;
    }
    /**
     * 获取当前待办任务
     */
    async getCurrentTasks(processInstanceId) {
        return await this.camundaClient.getTasks(undefined, processInstanceId);
    }
    /**
     * 获取当前审批节点
     */
    async getCurrentApprovalNode(processInstanceId) {
        const tasks = await this.camundaClient.getTasks(undefined, processInstanceId);
        return tasks.find(t => t.type === 'userTask') || null;
    }
    /**
     * 获取当前节点对应的表单Key
     */
    async getCurrentFormKey(processInstanceId) {
        const currentNode = await this.getCurrentApprovalNode(processInstanceId);
        return currentNode?.formKey || null;
    }
    /**
     * 提交任务（完成UserTask）
     */
    async submitTask(taskId, action, comment, approverId) {
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
    async getApprovalHistory(processInstanceId) {
        const variables = await this.camundaClient.getVariables(processInstanceId);
        // 实际实现中，应该查询历史任务表
        // GET /history/task?processInstanceId={instanceId}
        return [];
    }
    /**
     * 设置订单状态
     */
    async updateOrderStatus(processInstanceId, status) {
        await this.camundaClient.setVariable(processInstanceId, 'currentStatus', status);
    }
    /**
     * 获取订单状态
     */
    async getOrderStatus(processInstanceId) {
        const variables = await this.camundaClient.getVariables(processInstanceId);
        return variables['currentStatus'] || sales_order_types_1.SalesOrderStatus.DRAFT;
    }
    /**
     * 获取流程进度
     */
    async getProcessProgress(processInstanceId) {
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
    async cancelProcess(processInstanceId, reason) {
        await this.camundaClient.deleteProcessInstance(processInstanceId, reason);
    }
    /**
     * 回退到指定节点
     */
    async rollbackToNode(processInstanceId, nodeId) {
        // Camunda不直接支持回退到任意节点
        // 实际实现中需要：
        // 1. 调用ManagementService执行回退
        // 2. 或者创建新的流程实例
        console.log(`Rollback to node: ${nodeId} for process: ${processInstanceId}`);
    }
}
exports.CamundaIntegrationService = CamundaIntegrationService;
// 导出服务实例
exports.camundaIntegrationService = new CamundaIntegrationService();
exports.camundaClient = new CamundaClient();
//# sourceMappingURL=camunda-integration.service.js.map