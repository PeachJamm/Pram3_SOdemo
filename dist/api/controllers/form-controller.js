"use strict";
// =====================================================
// Form Controller
// 表单渲染 API 控制器
// 提供 /api/forms/:taskId/render?userId=xxx 接口
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.formController = exports.FormController = void 0;
const express_1 = require("express");
const connection_1 = require("../../database/connection");
const user_service_1 = require("../../database/services/user.service");
const form_renderer_service_1 = require("../../dynamic-forms/form-renderer.service");
const camunda8_client_1 = require("../../orchestration/camunda8-client");
/**
 * 任务信息缓存（用于数字taskId查找）
 * key: taskId (如 "2251799813740319")
 * value: TaskInfo
 */
const taskInfoCache = new Map();
/**
 * 表单控制器
 */
class FormController {
    constructor() {
        this.router = (0, express_1.Router)();
        this.db = new connection_1.DatabaseConnection({
            type: 'sqlite',
            sqlite: { filename: './pram3.db' },
        });
        this.userService = new user_service_1.UserService(this.db);
        this.formRenderer = new form_renderer_service_1.FormRendererService();
        this.camundaClient = new camunda8_client_1.Camunda8Client({
            gatewayAddress: 'localhost:26500',
            plaintext: true,
        });
        this.camundaTasklist = new camunda8_client_1.Camunda8TasklistClient('http://localhost:8088/tasklist');
        this.camundaIntegration = new camunda8_client_1.Camunda8IntegrationService();
        this.setupRoutes();
    }
    /**
     * 设置路由
     */
    setupRoutes() {
        // 渲染表单 - GET /api/forms/:taskId/render?userId=xxx
        this.router.get('/forms/:taskId/render', this.renderForm.bind(this));
        // 提交表单 - POST /api/forms/:taskId/submit
        this.router.post('/forms/:taskId/submit', this.submitForm.bind(this));
        // 获取表单定义（不带权限过滤，用于预览）- GET /api/forms/:formKey/schema
        this.router.get('/forms/schema/:formKey', this.getFormSchema.bind(this));
        // 获取用户的待办任务列表 - GET /api/forms/tasks?userId=xxx
        this.router.get('/forms/tasks/pending', this.getPendingTasks.bind(this));
        // 根据订单ID获取待办任务 - GET /api/forms/tasks/by-order/:orderId?userId=xxx
        this.router.get('/forms/tasks/by-order/:orderId', this.getTaskByOrderId.bind(this));
    }
    /**
     * 渲染表单 API
     * GET /api/forms/:taskId/render?userId=xxx
     *
     * 响应示例：
     * {
     *   success: true,
     *   data: {
     *     formId: "order-validation",
     *     formName: "订单验证",
     *     permissionLevel: "APPROVE",
     *     userInfo: { id, username, fullName, role },
     *     taskInfo: { taskId, taskName, assignee, isAssignedToUser },
     *     components: [...],  // 过滤后的表单组件
     *     variables: {...}    // 流程变量
     *   }
     * }
     */
    async renderForm(req, res) {
        const { taskId } = req.params;
        const { userId } = req.query;
        if (!userId) {
            res.status(400).json({
                success: false,
                error: '缺少 userId 参数',
            });
            return;
        }
        try {
            await this.db.connect();
            // 1. 获取用户信息
            const user = await this.userService.getUserById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: '用户不存在',
                });
                return;
            }
            // 2. 从Camunda获取任务信息
            const taskInfo = await this.getTaskInfoFromCamunda(taskId);
            if (!taskInfo) {
                res.status(404).json({
                    success: false,
                    error: '任务不存在或已完成',
                });
                return;
            }
            // 3. 从Camunda加载表单定义（调用 Form API: GET /v1/forms/{formId}?processDefinitionKey={processDefinitionKey}）
            let formResult = null;
            try {
                formResult = await this.loadFormSchema(taskInfo);
            }
            catch (formError) {
                console.error('[FormController] Failed to load form from Camunda:', formError);
                res.status(500).json({
                    success: false,
                    error: `表单定义加载失败: ${formError instanceof Error ? formError.message : '未知错误'}`,
                });
                return;
            }
            // 检查 formResult 是否为 null
            if (!formResult) {
                res.status(500).json({
                    success: false,
                    error: '表单定义加载失败: 返回结果为空',
                });
                return;
            }
            const formSchema = formResult.schema;
            const formVersionFromApi = formResult.version; // 从 Form API 获取的版本号
            // 4. 判定权限级别
            const permissionLevel = this.userService.determinePermissionLevel(user, taskInfo.assignee, formSchema.id, taskInfo.variables.createdBy);
            console.log(`[FormController] User ${user.username} (${user.role}) -> ${permissionLevel} for task ${taskId}, formVersion: ${formVersionFromApi}`);
            // 5. 【如实渲染】直接返回原始表单，不做任何修改
            // 只填充变量值，保留所有原始组件和属性
            const rawComponents = this.fillFormValues(formSchema.components, taskInfo.variables);
            // 6. 查询流程状态
            const processFlow = await this.getProcessFlowStatus(taskInfo);
            // 7. 返回响应
            // 优先使用从 Form API 获取的版本号，如果没有则使用 task 中的版本号
            const finalFormVersion = formVersionFromApi !== undefined ? formVersionFromApi : taskInfo.formVersion;
            const response = {
                success: true,
                data: {
                    formId: formSchema.id,
                    formName: formSchema.name,
                    formVersion: finalFormVersion, // 从 Form API 获取的版本号（如实返回）
                    permissionLevel,
                    userInfo: {
                        id: user.id,
                        username: user.username,
                        fullName: user.fullName,
                        role: user.role,
                    },
                    taskInfo: {
                        taskId: taskInfo.id,
                        taskName: taskInfo.name,
                        assignee: taskInfo.assignee,
                        isAssignedToUser: taskInfo.assignee === user.username,
                    },
                    components: rawComponents,
                    variables: taskInfo.variables,
                    processFlow, // 流程导航（仅当前任务相关）
                },
            };
            res.json(response);
        }
        catch (error) {
            console.error('[FormController] Render form error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '渲染表单失败',
            });
        }
    }
    /**
     * 提交表单 API
     * POST /api/forms/:taskId/submit
     *
     * 请求体：
     * {
     *   variables: {
     *     approvalDecision: "APPROVE",
     *     approvalComment: "同意",
     *     ...
     *   }
     * }
     */
    async submitForm(req, res) {
        const { taskId } = req.params;
        const { userId, variables } = req.body;
        if (!userId || !variables) {
            res.status(400).json({
                success: false,
                error: '缺少 userId 或 variables',
            });
            return;
        }
        try {
            await this.db.connect();
            // 1. 验证用户是否有权限提交
            const user = await this.userService.getUserById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: '用户不存在',
                });
                return;
            }
            // 2. 获取任务信息
            const taskInfo = await this.getTaskInfoFromCamunda(taskId);
            if (!taskInfo) {
                res.status(404).json({
                    success: false,
                    error: '任务不存在',
                });
                return;
            }
            // 3. 权限检查
            const canSubmit = taskInfo.assignee === user.username || user.role === 'ADMIN';
            if (!canSubmit) {
                res.status(403).json({
                    success: false,
                    error: '无权限提交此任务',
                });
                return;
            }
            // 4. 开始事务
            await this.db.beginTransaction();
            console.log(`[Transaction] BEGIN - 开始提交表单 ${taskId}`);
            try {
                // 4.1 保存审批历史记录
                const orderId = variables.orderId || taskInfo.processInstanceKey;
                const approvalDecision = variables.approvalDecision || variables.decision || 'COMPLETE';
                const approvalComment = variables.approvalComment || variables.comment || '';
                // 保存表单数据到 variables 字段（JSON格式）
                const variablesJson = JSON.stringify(variables);
                await this.db.execute(`INSERT INTO approval_history (id, sales_order_id, approver_id, task_id,
            approval_level, action, comment, variables, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    `hist-${Date.now()}`,
                    orderId,
                    user.id,
                    taskInfo.id, // 记录任务ID
                    user.role,
                    approvalDecision,
                    approvalComment,
                    variablesJson, // 保存完整表单数据
                    new Date().toISOString(),
                ]);
                console.log(`[Transaction] 审批历史已保存`);
                // 4.2 根据审批决定更新订单状态
                let newStatus = 'PROCESSING';
                if (approvalDecision === 'REJECT') {
                    newStatus = 'REJECTED';
                }
                else if (approvalDecision === 'APPROVE') {
                    // 检查是否是最终审批（可以根据流程变量判断）
                    newStatus = 'APPROVED';
                }
                // 更新订单状态
                await this.db.execute(`UPDATE sales_orders SET status = ?, updated_at = ? 
           WHERE id = ? OR process_instance_key = ?`, [newStatus, new Date().toISOString(), orderId, taskInfo.processInstanceKey]);
                console.log(`[Transaction] 订单状态已更新为 ${newStatus}`);
                // 4.3 调用Camunda完成任务
                // 使用 taskInfo.id（真实的 Camunda userTaskKey，数字）而非 taskId（可能是缓存key）
                const camundaTaskId = taskInfo.id;
                console.log(`[FormController] Completing Camunda task: ${camundaTaskId}`);
                try {
                    await this.camundaTasklist.completeTask(camundaTaskId, variables);
                    console.log(`[FormController] Task ${camundaTaskId} completed in Camunda by ${user.username}`);
                }
                catch (camundaError) {
                    console.error(`[FormController] Camunda completion failed:`, camundaError);
                    // Camunda 失败需要抛出错误，让事务回滚
                    throw new Error(`Camunda任务完成失败: ${camundaError instanceof Error ? camundaError.message : '未知错误'}`);
                }
                // 4.4 提交事务
                await this.db.commit();
                console.log(`[Transaction] COMMIT - 表单提交成功`);
                res.json({
                    success: true,
                    data: {
                        taskId,
                        completedBy: user.username,
                        completedAt: new Date().toISOString(),
                        variables,
                        orderStatus: newStatus,
                    },
                });
            }
            catch (innerError) {
                // 事务中发生错误，回滚
                console.error(`[Transaction] 事务失败，执行 ROLLBACK:`, innerError);
                await this.db.rollback();
                throw innerError;
            }
        }
        catch (error) {
            console.error('[FormController] Submit form error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '提交表单失败',
            });
        }
    }
    /**
     * 获取表单定义（原始Schema，用于预览）
     * GET /api/forms/schema/:formKey
     */
    async getFormSchema(req, res) {
        const { formKey } = req.params;
        try {
            const formSchema = await this.formRenderer.loadFormSchema(formKey);
            if (!formSchema) {
                res.status(404).json({
                    success: false,
                    error: '表单定义不存在',
                });
                return;
            }
            // 提取字段信息
            const fields = this.formRenderer.extractFormFields(formSchema);
            res.json({
                success: true,
                data: {
                    formId: formSchema.id,
                    formName: formSchema.name,
                    properties: formSchema.properties,
                    fields,
                    // 不包含完整组件定义，避免暴露过多细节
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取表单定义失败',
            });
        }
    }
    /**
     * 获取用户待办任务列表
     * GET /api/forms/tasks/pending?userId=xxx
     */
    async getPendingTasks(req, res) {
        const { userId } = req.query;
        if (!userId) {
            res.status(400).json({
                success: false,
                error: '缺少 userId 参数',
            });
            return;
        }
        try {
            await this.db.connect();
            // 1. 获取用户信息
            const user = await this.userService.getUserById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: '用户不存在',
                });
                return;
            }
            // 2. 从Camunda获取分配给该用户的任务
            // 注意：实际应该从Tasklist API查询
            // 这里简化返回模拟数据
            const tasks = await this.camundaIntegration.getTasksByAssignee(user.username);
            res.json({
                success: true,
                data: {
                    userId: user.id,
                    username: user.username,
                    taskCount: tasks.length,
                    tasks: tasks.map((task) => ({
                        taskId: task.id,
                        taskName: task.name,
                        formKey: task.formKey,
                        processInstanceKey: task.processInstanceKey,
                        createdAt: task.creationTime,
                    })),
                },
            });
        }
        catch (error) {
            console.error('[FormController] Get pending tasks error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取待办任务失败',
            });
        }
    }
    /**
     * 根据订单ID获取待办任务
     * GET /api/forms/tasks/by-order/:orderId?userId=xxx
     */
    async getTaskByOrderId(req, res) {
        const { orderId } = req.params;
        const { userId } = req.query;
        if (!userId) {
            res.status(400).json({
                success: false,
                error: '缺少 userId 参数',
            });
            return;
        }
        try {
            await this.db.connect();
            // 1. 获取用户信息
            const user = await this.userService.getUserById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: '用户不存在',
                });
                return;
            }
            // 2. 从数据库获取订单对应的流程实例Key
            const order = await this.db.queryOne(`SELECT process_instance_key, order_number FROM sales_orders WHERE id = ?`, [orderId]);
            if (!order || !order.process_instance_key) {
                res.status(404).json({
                    success: false,
                    error: '订单不存在或未关联流程实例',
                });
                return;
            }
            // 3. 从Camunda Tasklist查询该流程实例下的待办任务
            let tasks = [];
            let isMock = false;
            try {
                // 使用 REST API 查询真实任务
                tasks = await this.camundaTasklist.getTaskByProcessInstance(order.process_instance_key);
                console.log('[FormController] Camunda tasks found:', tasks.length);
            }
            catch (tasklistError) {
                console.warn('[FormController] Tasklist query failed:', tasklistError);
                // Tasklist不可用或查询失败，返回模拟数据
                isMock = true;
            }
            // 4. 查询流程实例状态（用于流程导航）
            const processStatus = await this.getProcessInstanceStatus(order.process_instance_key);
            // 5. 查询审批历史
            const approvalHistory = await this.getApprovalHistory(orderId);
            // 6. 如果没有活动的 UserTask（自动任务、等待中或已结束）
            if (tasks.length === 0) {
                const fullVariables = await this.getOrderVariablesFromDB(order.process_instance_key);
                // 构建流程导航步骤（基于流程状态）
                const processFlow = await this.buildProcessFlowForOrder(order.process_instance_key, processStatus.currentElementId || 'unknown', null // 没有当前任务
                );
                // 构建非 UserTask 的响应（用于前端展示流程状态）
                const nonUserTaskInfo = {
                    taskId: `non-user-task-${order.process_instance_key}`,
                    taskName: this.getNonUserTaskName(processStatus),
                    taskDefinitionId: processStatus.currentElementId || 'unknown',
                    processInstanceKey: order.process_instance_key,
                    processDefinitionKey: processStatus.processDefinitionKey,
                    formKey: null,
                    assignee: null,
                    candidateGroups: [],
                    createdAt: new Date().toISOString(),
                    variables: fullVariables,
                    processStatus: processStatus.state,
                    currentElement: processStatus.currentElementName,
                    isNonUserTask: true,
                    rawData: processStatus,
                };
                res.json({
                    success: true,
                    data: {
                        orderId,
                        processInstanceKey: order.process_instance_key,
                        taskCount: 0,
                        tasks: [],
                        nonUserTaskInfo,
                        processFlow, // 流程导航
                        approvalHistory, // 审批历史
                        processStatus: processStatus.state,
                        isMock: false,
                    },
                });
                return;
            }
            // 5. 处理真实任务，构建响应并缓存TaskInfo
            // 从数据库获取完整订单变量（包括产品明细）
            console.log(`[FormController] Getting variables for processInstanceKey: ${order.process_instance_key}`);
            const fullVariables = await this.getOrderVariablesFromDB(order.process_instance_key);
            console.log(`[FormController] Got variables:`, Object.keys(fullVariables));
            // 获取第一个任务作为当前任务（用于流程导航）
            const firstTask = tasks[0];
            const currentElementId = firstTask.elementId || firstTask.taskDefinitionId || 'unknown';
            // 构建流程导航
            const processFlow = await this.buildProcessFlowForOrder(order.process_instance_key, currentElementId, firstTask);
            // 获取每个任务的详细信息（包含 formVersion）
            const taskDetailsPromises = tasks.map(async (task) => {
                const taskId = task.userTaskKey || task.id;
                try {
                    // 使用 Tasklist API 获取完整的任务详情（包含 formVersion）
                    const detailedTask = await this.camundaTasklist.getTaskDetails(taskId);
                    return { ...task, ...detailedTask };
                }
                catch (e) {
                    console.warn(`[FormController] Failed to get task details for ${taskId}:`, e);
                    return task;
                }
            });
            const tasksWithDetails = await Promise.all(taskDetailsPromises);
            const mappedTasks = tasksWithDetails.map((task) => {
                // 从 elementId 推断 formKey
                let formKey = 'order-validation';
                const elementId = task.elementId || task.taskDefinitionId || '';
                if (elementId.includes('validation')) {
                    formKey = 'order-validation';
                }
                else if (elementId.includes('sales-manager')) {
                    formKey = 'sales-manager-approval';
                }
                else if (elementId.includes('finance')) {
                    formKey = 'finance-approval';
                }
                else if (elementId.includes('director')) {
                    formKey = 'director-approval';
                }
                const taskId = task.userTaskKey || task.id;
                const processDefinitionKey = task.processDefinitionKey;
                const formVersion = task.formVersion;
                console.log(`[FormController] Caching task: ${taskId}, formVersion: ${formVersion}`);
                // 构建 TaskInfo 并缓存（供renderForm使用）
                const taskInfo = {
                    id: taskId,
                    name: task.elementName || task.name || '订单验证',
                    formKey: formKey,
                    formVersion: formVersion, // 缓存表单版本号
                    assignee: task.assignee || null,
                    processInstanceKey: task.processInstanceKey,
                    processDefinitionKey: processDefinitionKey,
                    variables: fullVariables,
                };
                // 用 taskId 和 taskDefinitionId 都缓存，方便查找
                taskInfoCache.set(taskId, taskInfo);
                taskInfoCache.set(elementId, taskInfo);
                return {
                    taskId: taskId,
                    taskName: task.elementName || task.name,
                    taskDefinitionId: task.elementId || task.taskDefinitionId,
                    processInstanceKey: task.processInstanceKey,
                    processDefinitionKey: processDefinitionKey,
                    formKey: formKey,
                    formVersion: formVersion, // 返回表单版本号
                    assignee: task.assignee,
                    candidateGroups: task.candidateGroups,
                    createdAt: task.creationDate || task.creationTime,
                    variables: fullVariables,
                    rawData: task,
                };
            });
            res.json({
                success: true,
                data: {
                    orderId,
                    processInstanceKey: order.process_instance_key,
                    taskCount: tasks.length,
                    tasks: mappedTasks,
                    processFlow, // 流程导航
                    approvalHistory, // 审批历史
                    isMock: false,
                },
            });
        }
        catch (error) {
            console.error('[FormController] Get task by order ID error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取任务失败',
            });
        }
    }
    /**
     * 为用户创建模拟任务（当Camunda不可用时）
     */
    createMockTaskForUser(user, orderId, orderNumber) {
        // 根据用户角色确定任务类型
        let taskName = '订单验证';
        let formKey = 'order-validation';
        if (user.role === 'SALES_MANAGER') {
            taskName = '销售经理审批';
            formKey = 'sales-manager-approval';
        }
        else if (user.role === 'FINANCE') {
            taskName = '财务审批';
            formKey = 'finance-approval';
        }
        else if (user.role === 'DIRECTOR') {
            taskName = '总监审批';
            formKey = 'director-approval';
        }
        return {
            taskId: `task-${orderId}`,
            taskName,
            taskDefinitionId: formKey,
            processInstanceKey: `mock-process-${orderId}`,
            assignee: user.username,
            candidateGroups: [],
            createdAt: new Date().toISOString(),
            variables: {
                orderId,
                orderNumber,
            },
        };
    }
    /**
     * 从数据库获取完整订单变量（包括产品明细）
     */
    async getOrderVariablesFromDB(processInstanceKey) {
        try {
            // 1. 获取订单主表数据
            const order = await this.db.queryOne(`SELECT o.*, c.name as customer_name, c.tier as customer_tier
         FROM sales_orders o
         JOIN customers c ON o.customer_id = c.id
         WHERE o.process_instance_key = ?`, [processInstanceKey]);
            if (!order) {
                return {};
            }
            // 2. 获取订单明细
            const items = await this.db.query(`SELECT soi.*, p.name as product_name, p.product_code as product_code
         FROM sales_order_items soi
         JOIN products p ON soi.product_id = p.id
         WHERE soi.sales_order_id = ?`, [order.id]);
            // 3. 构建产品明细表格
            const productLines = items.map((item, index) => ({
                productId: item.product_id,
                productCode: item.product_code,
                productName: item.product_name,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                originalUnitPrice: item.unit_price,
                discountPercent: item.discount_percent || 0,
                lineTotal: item.line_total,
            }));
            // 4. 构建产品表格字符串（用于显示）
            const productLinesTable = this.buildProductLinesTable(productLines);
            // 5. 计算预期审批级别
            const expectedApprovalLevel = this.calculateExpectedApprovalLevel(order.grand_total, order.customer_tier);
            // 6. 计算折扣率（简化计算）
            const discountRate = order.customer_tier === 'VIP' ? 15 : order.customer_tier === 'GOLD' ? 10 : 0;
            return {
                orderId: order.id,
                orderNumber: order.order_number,
                customerId: order.customer_id,
                customerName: order.customer_name,
                customerTier: order.customer_tier,
                totalAmount: order.grand_total,
                subtotal: order.total_amount,
                taxAmount: order.tax_amount,
                currency: 'CNY', // 默认币种
                createdBy: order.created_by,
                createdAt: order.created_at,
                lineCount: items.length,
                productLines: JSON.stringify(productLines),
                productLinesTable: productLinesTable,
                expectedApprovalLevel: expectedApprovalLevel,
                discountRate: discountRate,
                orderHistoryCount: 0, // 可以从历史表查询
            };
        }
        catch (e) {
            console.warn('[FormController] Failed to get order variables from DB:', e);
        }
        return {};
    }
    /**
     * 构建产品明细表格字符串
     */
    buildProductLinesTable(productLines) {
        if (productLines.length === 0) {
            return '| 序号 | 产品 | 数量 | 单价 | 折扣 | 小计 |\n|------|------|------|------|------|------|';
        }
        let table = '| 序号 | 产品 | 数量 | 单价 | 折扣 | 小计 |\n|------|------|------|------|------|------|\n';
        productLines.forEach((item, index) => {
            const discount = item.discountPercent > 0 ? `${item.discountPercent}%` : '-';
            table += `| ${index + 1} | ${item.productName} | ${item.quantity} | ¥${item.unitPrice.toFixed(2)} | ${discount} | ¥${item.lineTotal.toFixed(2)} |\n`;
        });
        return table.trim();
    }
    /**
     * 计算预期审批级别
     */
    calculateExpectedApprovalLevel(totalAmount, customerTier) {
        if (totalAmount >= 100000 || customerTier === 'VIP') {
            return '总监审批 (DIRECTOR)';
        }
        else if (totalAmount >= 10000) {
            return '财务审批 (FINANCE)';
        }
        else {
            return '销售经理审批 (SALES_MANAGER)';
        }
    }
    /**
     * 查询流程实例状态（用于非 UserTask 情况）
     */
    async getProcessInstanceStatus(processInstanceKey) {
        try {
            const response = await fetch(`http://localhost:8088/v2/process-instances/${processInstanceKey}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    state: data.state || 'ACTIVE',
                    processDefinitionKey: data.processDefinitionKey,
                    currentElementId: data.currentElementId,
                    currentElementName: this.mapElementIdToName(data.currentElementId),
                    hasIncident: data.hasIncident,
                };
            }
        }
        catch (e) {
            console.warn('[FormController] Failed to get process instance status:', e);
        }
        return {
            state: 'ACTIVE',
            processDefinitionKey: '2251799813689190',
            currentElementName: '未知状态',
        };
    }
    /**
     * 根据元素ID获取名称
     */
    mapElementIdToName(elementId) {
        if (!elementId)
            return '流程处理中';
        const mapping = {
            'start-event': '订单提交',
            'task-order-validation': '订单验证',
            'task-determine-approval-level': '确定审批级别',
            'task-calculate-discount': '计算折扣',
            'gateway-approval-path': '审批路由',
            'task-sales-manager': '销售经理审批',
            'task-finance': '财务审批',
            'task-director': '总监审批',
            'gateway-approval-result': '审批结果判断',
            'task-inventory': '库存预留（自动）',
            'task-notification': '客户通知（自动）',
            'task-finance-processing': '财务处理（自动）',
            'end-event': '流程结束',
        };
        return mapping[elementId] || elementId;
    }
    /**
     * 获取非 UserTask 的显示名称
     */
    getNonUserTaskName(processStatus) {
        switch (processStatus.state) {
            case 'COMPLETED':
                return '流程已完成';
            case 'CANCELED':
                return '流程已取消';
            case 'ACTIVE':
            default:
                return processStatus.currentElementName || '自动处理中';
        }
    }
    /**
     * 获取流程状态（用于左侧和header流程导航）
     */
    async getProcessFlowStatus(taskInfo) {
        const processInstanceKey = taskInfo.processInstanceKey;
        const processDefinitionKey = taskInfo.processDefinitionKey || '2251799813689190';
        const currentElementId = taskInfo.variables?.taskDefinitionId ||
            taskInfo.variables?.elementId ||
            'task-order-validation';
        // 1. 查询 Camunda 流程实例状态
        let processStatus = 'ACTIVE';
        try {
            const response = await fetch(`http://localhost:8088/v2/process-instances/${processInstanceKey}`);
            if (response.ok) {
                const data = await response.json();
                processStatus = data.state || 'ACTIVE';
            }
        }
        catch (e) {
            console.warn('[FormController] Failed to get process status:', e);
        }
        // 2. 从 Camunda 获取 BPMN XML
        let bpmnXml = '';
        try {
            const response = await fetch(`http://localhost:8088/v2/process-definitions/${processDefinitionKey}/xml`);
            if (response.ok) {
                const data = await response.json();
                bpmnXml = data.xml || '';
                console.log(`[FormController] BPMN XML loaded: ${bpmnXml.length} chars`);
            }
        }
        catch (e) {
            console.warn('[FormController] Failed to get BPMN XML:', e);
        }
        // 3. 从 Camunda 获取流程实例状态 + 数据库审批历史计算步骤状态
        const steps = await this.getFlowNodeStatus(processInstanceKey, currentElementId, taskInfo);
        return {
            processInstanceKey,
            processStatus,
            currentStepId: currentElementId,
            bpmnXml,
            steps,
        };
    }
    /**
     * 为订单构建流程导航（用于 getTaskByOrderId）
     */
    async buildProcessFlowForOrder(processInstanceKey, currentElementId, currentTask) {
        // 查询 Camunda 流程实例状态
        let processStatus = 'ACTIVE';
        try {
            const response = await fetch(`http://localhost:8088/v2/process-instances/${processInstanceKey}`);
            if (response.ok) {
                const data = await response.json();
                processStatus = data.state || 'ACTIVE';
            }
        }
        catch (e) {
            console.warn('[FormController] Failed to get process status:', e);
        }
        // 构建步骤状态
        const steps = await this.buildStepsForOrder(processInstanceKey, currentElementId, currentTask);
        return {
            processInstanceKey,
            processStatus,
            currentStepId: currentElementId,
            steps,
        };
    }
    /**
     * 获取流程步骤状态（用于 renderForm）
     */
    async getFlowNodeStatus(processInstanceKey, currentElementId, taskInfo) {
        // 从数据库 orderId 查询审批历史
        let orderId = taskInfo.variables?.orderId;
        if (!orderId) {
            try {
                const order = await this.db.queryOne(`SELECT id FROM sales_orders WHERE process_instance_key = ?`, [processInstanceKey]);
                if (order)
                    orderId = order.id;
            }
            catch (e) {
                console.warn('[FormController] Failed to get order:', e);
            }
        }
        const completedSteps = orderId ? await this.getCompletedStepsFromHistory(orderId) : [];
        // 流程步骤定义（从 BPMN 解析或预定义）
        const allSteps = [
            { id: 'start-event', name: '订单提交', status: 'PENDING', type: 'start' },
            { id: 'task-order-validation', name: '订单验证', status: 'PENDING', type: 'usertask' },
            { id: 'task-determine-approval-level', name: '确定审批级别', status: 'PENDING', type: 'dmn' },
            { id: 'task-calculate-discount', name: '计算折扣', status: 'PENDING', type: 'dmn' },
            { id: 'gateway-approval-path', name: '审批路由', status: 'PENDING', type: 'gateway' },
            { id: 'task-sales-manager', name: '销售经理审批', status: 'PENDING', type: 'usertask' },
            { id: 'task-finance', name: '财务审批', status: 'PENDING', type: 'usertask' },
            { id: 'task-director', name: '总监审批', status: 'PENDING', type: 'usertask' },
            { id: 'gateway-approval-result', name: '审批结果', status: 'PENDING', type: 'gateway' },
            { id: 'task-inventory', name: '库存预留', status: 'PENDING', type: 'service' },
            { id: 'task-notification', name: '客户通知', status: 'PENDING', type: 'service' },
            { id: 'end-event', name: '流程结束', status: 'PENDING', type: 'end' },
        ];
        // 更新步骤状态
        let foundCurrent = false;
        for (const step of allSteps) {
            const completedStep = completedSteps.find(s => s.stepId === step.id);
            if (completedStep) {
                step.status = 'COMPLETED';
                step.assignee = completedStep.assignee;
                step.completedAt = completedStep.completedAt;
                step.comment = completedStep.comment;
            }
            else if (!foundCurrent && step.id === currentElementId) {
                step.status = 'CURRENT';
                step.assignee = taskInfo.assignee || undefined;
                foundCurrent = true;
            }
            else if (foundCurrent) {
                step.status = 'PENDING';
            }
        }
        return allSteps;
    }
    /**
     * 为订单构建步骤（从 Camunda User Tasks 获取）
     */
    async buildStepsForOrder(processInstanceKey, currentElementId, currentTask) {
        // 1. 从 Camunda 获取所有 User Tasks（包括已完成）
        const userTasks = await this.camundaTasklist.getAllUserTasks(processInstanceKey);
        console.log(`[FormController] Loaded ${userTasks.length} user tasks from Camunda`);
        // 2. 转换为 steps（包含类型）
        const steps = userTasks.map((task) => {
            const isCurrent = task.elementId === currentElementId ||
                task.userTaskKey === currentTask?.userTaskKey;
            return {
                id: task.elementId || task.taskDefinitionId,
                name: task.elementName || task.name || task.taskDefinitionId,
                status: this.mapTaskStateToStatus(task.state, isCurrent),
                type: 'usertask',
                assignee: task.assignee,
                completedAt: task.completionTime,
                comment: task.variables?.comment || task.variables?.approvalComment,
            };
        });
        // 3. 插入 DMN 决策节点（褐色显示）
        const dmnNodes = [
            {
                id: 'task-determine-approval-level',
                name: '确定审批级别',
                status: this.inferDmnStatus('task-determine-approval-level', steps, currentElementId),
                type: 'dmn'
            },
            {
                id: 'task-calculate-discount',
                name: '计算折扣',
                status: this.inferDmnStatus('task-calculate-discount', steps, currentElementId),
                type: 'dmn'
            },
        ];
        // 4. 插入网关节点
        const gatewayNodes = [
            {
                id: 'gateway-approval-path',
                name: '审批路由',
                status: this.inferGatewayStatus('gateway-approval-path', steps, currentElementId),
                type: 'gateway'
            },
            {
                id: 'gateway-approval-result',
                name: '审批结果',
                status: this.inferGatewayStatus('gateway-approval-result', steps, currentElementId),
                type: 'gateway'
            }
        ];
        // 5. 合并所有节点，按流程顺序排序
        const allSteps = this.mergeStepsInOrder(steps, dmnNodes, gatewayNodes);
        // 6. 如果没有从 Camunda 获取到任务，回退到硬编码步骤
        if (steps.length === 0) {
            console.warn('[FormController] No user tasks from Camunda, using fallback steps');
            return this.buildFallbackSteps(currentElementId, currentTask);
        }
        // 4. 确保当前步骤被标记为 CURRENT
        const currentStep = allSteps.find(s => s.id === currentElementId);
        if (currentStep && currentStep.status !== 'COMPLETED') {
            currentStep.status = 'CURRENT';
            if (currentTask?.assignee && !currentStep.assignee) {
                currentStep.assignee = currentTask.assignee;
            }
        }
        return allSteps;
    }
    /**
     * 将 Camunda Task state 映射为前端 status
     */
    mapTaskStateToStatus(state, isCurrent) {
        switch (state) {
            case 'COMPLETED':
                return 'COMPLETED';
            case 'CREATED':
            case 'ACTIVATED':
                return isCurrent ? 'CURRENT' : 'PENDING';
            case 'CANCELED':
            case 'TERMINATED':
                return 'PENDING'; // 或标记为特殊状态
            default:
                return isCurrent ? 'CURRENT' : 'PENDING';
        }
    }
    /**
     * 推断 DMN 节点状态
     */
    inferDmnStatus(dmnId, userTasks, currentElementId) {
        // DMN 在订单验证之后，第一个审批任务之前
        const orderValidation = userTasks.find(t => t.id === 'task-order-validation');
        const firstApproval = userTasks.find(t => t.id === 'task-sales-manager' || t.id === 'task-finance' || t.id === 'task-director');
        if (firstApproval?.status === 'COMPLETED' || firstApproval?.status === 'CURRENT') {
            return 'COMPLETED';
        }
        if (orderValidation?.status === 'COMPLETED' && dmnId === currentElementId) {
            return 'CURRENT';
        }
        return 'PENDING';
    }
    /**
     * 推断网关状态
     */
    inferGatewayStatus(gatewayId, userTasks, currentElementId) {
        // 根据前后任务状态推断
        const beforeTask = userTasks.find(t => gatewayId === 'gateway-approval-path' ? t.id === 'task-order-validation' :
            gatewayId === 'gateway-approval-result' ?
                (t.id === 'task-sales-manager' || t.id === 'task-finance' || t.id === 'task-director') :
                false);
        if (beforeTask?.status === 'COMPLETED') {
            return 'COMPLETED';
        }
        if (beforeTask?.status === 'CURRENT') {
            return 'CURRENT';
        }
        return 'PENDING';
    }
    /**
     * 按流程顺序合并所有步骤
     */
    mergeStepsInOrder(userTasks, dmnNodes, gatewayNodes) {
        // 定义流程顺序
        const processOrder = [
            'start-event',
            'task-order-validation',
            'task-determine-approval-level',
            'task-calculate-discount',
            'gateway-approval-path',
            'task-sales-manager',
            'task-finance',
            'task-director',
            'gateway-approval-result',
            'task-inventory',
            'task-notification',
            'end-event'
        ];
        // 合并所有节点
        const allNodes = [...userTasks, ...dmnNodes, ...gatewayNodes];
        // 按流程顺序排序
        return processOrder
            .map(id => allNodes.find(n => n.id === id))
            .filter((n) => n !== undefined);
    }
    /**
     * 回退步骤（当 Camunda API 不可用时）
     */
    buildFallbackSteps(currentElementId, currentTask) {
        const allSteps = [
            { id: 'start-event', name: '订单提交', status: 'COMPLETED', type: 'start' },
            { id: 'task-order-validation', name: '订单验证', status: 'PENDING', type: 'usertask' },
            { id: 'task-determine-approval-level', name: '确定审批级别', status: 'PENDING', type: 'dmn' },
            { id: 'task-calculate-discount', name: '计算折扣', status: 'PENDING', type: 'dmn' },
            { id: 'gateway-approval-path', name: '审批路由', status: 'PENDING', type: 'gateway' },
            { id: 'task-sales-manager', name: '销售经理审批', status: 'PENDING', type: 'usertask' },
            { id: 'task-finance', name: '财务审批', status: 'PENDING', type: 'usertask' },
            { id: 'task-director', name: '总监审批', status: 'PENDING', type: 'usertask' },
            { id: 'gateway-approval-result', name: '审批结果', status: 'PENDING', type: 'gateway' },
            { id: 'task-inventory', name: '库存预留', status: 'PENDING', type: 'service' },
            { id: 'task-notification', name: '客户通知', status: 'PENDING', type: 'service' },
            { id: 'end-event', name: '流程结束', status: 'PENDING', type: 'end' },
        ];
        let foundCurrent = false;
        for (const step of allSteps) {
            if (!foundCurrent && step.id === currentElementId) {
                step.status = 'CURRENT';
                step.assignee = currentTask?.assignee || undefined;
                foundCurrent = true;
            }
            else if (foundCurrent) {
                step.status = 'PENDING';
            }
        }
        return allSteps;
    }
    /**
     * 将 Camunda 状态映射为前端状态
     */
    mapCamundaStateToStatus(camundaState, nodeId, currentElementId) {
        switch (camundaState) {
            case 'COMPLETED':
                return 'COMPLETED';
            case 'ACTIVE':
            case 'ACTIVATED':
                return 'CURRENT';
            default:
                return nodeId === currentElementId ? 'CURRENT' : 'PENDING';
        }
    }
    /**
     * 从审批历史获取已完成的步骤
     */
    async getCompletedStepsFromHistory(orderId) {
        try {
            const history = await this.db.query(`SELECT ah.*, u.username, u.full_name 
         FROM approval_history ah
         JOIN users u ON ah.approver_id = u.id
         WHERE ah.sales_order_id = ?
         ORDER BY ah.created_at ASC`, [orderId]);
            return history.map((h) => ({
                stepId: this.mapActionToStepId(h.action),
                stepName: this.mapActionToStepName(h.action),
                assignee: h.full_name || h.username,
                completedAt: h.created_at,
                comment: h.comment,
            }));
        }
        catch (e) {
            console.warn('[FormController] Failed to get history:', e);
            return [];
        }
    }
    /**
     * 将 action 映射到步骤 ID
     */
    mapActionToStepId(action) {
        const mapping = {
            'SUBMIT': 'start-event',
            'VALIDATE': 'task-order-validation',
            'APPROVE_SM': 'task-sales-manager',
            'APPROVE_FINANCE': 'task-finance',
            'APPROVE_DIRECTOR': 'task-director',
            'COMPLETE': 'task-order-validation',
        };
        return mapping[action] || 'unknown';
    }
    /**
     * 将 action 映射到步骤名称
     */
    mapActionToStepName(action) {
        const mapping = {
            'SUBMIT': '订单提交',
            'VALIDATE': '订单验证',
            'APPROVE_SM': '销售经理审批',
            'APPROVE_FINANCE': '财务审批',
            'APPROVE_DIRECTOR': '总监审批',
            'COMPLETE': '完成',
        };
        return mapping[action] || action;
    }
    /**
     * 获取审批历史（用于页面右侧时间线）
     */
    async getApprovalHistory(orderId) {
        try {
            const history = await this.db.query(`SELECT ah.id, ah.action, ah.comment, ah.created_at, 
                u.username, u.full_name, u.role
         FROM approval_history ah
         JOIN users u ON ah.approver_id = u.id
         WHERE ah.sales_order_id = ?
         ORDER BY ah.created_at ASC`, [orderId]);
            return history.map((h) => ({
                id: h.id,
                stepName: this.mapActionToStepName(h.action),
                approverName: h.full_name || h.username,
                action: h.action,
                comment: h.comment,
                createdAt: h.created_at,
            }));
        }
        catch (e) {
            console.warn('[FormController] Failed to get approval history:', e);
            return [];
        }
    }
    /**
     * 【如实渲染】只填充表单值，不做任何权限过滤或组件修改
     */
    fillFormValues(components, variables) {
        if (!components)
            return [];
        return components.map(component => {
            // 浅拷贝组件
            const filled = { ...component };
            // 只填充值，不做任何其他修改
            if (component.key && variables[component.key] !== undefined) {
                filled.value = variables[component.key];
            }
            // 递归处理子组件
            if (component.components && component.components.length > 0) {
                filled.components = this.fillFormValues(component.components, variables);
            }
            return filled;
        });
    }
    /**
     * 从Camunda获取任务信息
     * 支持通过 taskId 或 taskDefinitionId 查找
     */
    async getTaskInfoFromCamunda(taskId) {
        // 1. 先查缓存（可能通过 getTaskByOrderId 已缓存）
        const cachedTask = taskInfoCache.get(taskId);
        if (cachedTask) {
            console.log(`[FormController] Task found in cache: ${taskId}`);
            // 如果缓存中没有变量，尝试从数据库获取
            if (!cachedTask.variables || Object.keys(cachedTask.variables).length === 0) {
                cachedTask.variables = await this.getOrderVariablesFromDB(cachedTask.processInstanceKey);
            }
            return cachedTask;
        }
        // 2. 处理动态任务（以 task-order- 开头）
        if (taskId.startsWith('task-order-')) {
            const orderId = taskId.replace('task-order-', '');
            // 先尝试从数据库获取订单信息
            const order = await this.db.queryOne(`SELECT o.*, c.name as customer_name, c.tier as customer_tier,
                c.price_list_id, o.process_instance_key
         FROM sales_orders o
         JOIN customers c ON o.customer_id = c.id
         WHERE o.id = ?`, [orderId]);
            if (order && order.process_instance_key) {
                // 尝试从 Camunda 获取真实任务
                try {
                    const tasks = await this.camundaTasklist.getTaskByProcessInstance(order.process_instance_key);
                    if (tasks.length > 0) {
                        const task = tasks[0]; // 获取第一个任务
                        const taskId = task.userTaskKey || task.id;
                        // 使用 Tasklist API 获取完整的任务详情（包含 formVersion）
                        // /v2/user-tasks/search 不返回 formVersion，需要单独获取
                        let taskDetails = task;
                        try {
                            const detailedTask = await this.camundaTasklist.getTaskDetails(taskId);
                            if (detailedTask) {
                                taskDetails = detailedTask;
                                console.log(`[FormController] Got task details, formVersion: ${detailedTask.formVersion}`);
                            }
                        }
                        catch (detailError) {
                            console.warn('[FormController] Failed to get task details, using basic task info:', detailError);
                        }
                        // 从 elementId 推断 formKey
                        // 例如: task-order-validation -> order-validation
                        // task-sales-manager -> sales-manager-approval
                        let formKey = 'order-validation';
                        const elementId = taskDetails.elementId || taskDetails.taskDefinitionId || task.elementId || task.taskDefinitionId || '';
                        if (elementId.includes('validation')) {
                            formKey = 'order-validation';
                        }
                        else if (elementId.includes('sales-manager')) {
                            formKey = 'sales-manager-approval';
                        }
                        else if (elementId.includes('finance')) {
                            formKey = 'finance-approval';
                        }
                        else if (elementId.includes('director')) {
                            formKey = 'director-approval';
                        }
                        // 保存 processDefinitionKey 和 formVersion 用于后续获取表单
                        const processDefinitionKey = taskDetails.processDefinitionKey || task.processDefinitionKey;
                        const formVersion = taskDetails.formVersion;
                        console.log(`[FormController] Task info: formKey=${formKey}, formVersion=${formVersion}, processDefinitionKey=${processDefinitionKey}`);
                        return {
                            id: taskId,
                            name: taskDetails.elementName || taskDetails.name || task.elementName || task.name || '订单验证',
                            formKey: formKey,
                            formVersion: formVersion, // 保存表单版本号
                            assignee: taskDetails.assignee || task.assignee || 'salesmgr01',
                            processInstanceKey: taskDetails.processInstanceKey || task.processInstanceKey,
                            processDefinitionKey: processDefinitionKey, // 保存用于获取表单
                            variables: {
                                orderId: order.id,
                                orderNumber: order.order_number,
                                customerName: order.customer_name,
                                customerTier: order.customer_tier,
                                totalAmount: order.grand_total,
                                subtotal: order.total_amount,
                                taxAmount: order.tax_amount,
                                createdBy: order.created_by,
                                ...taskDetails.variables,
                                ...task.variables, // 合并 Camunda 变量
                            },
                        };
                    }
                }
                catch (camundaError) {
                    console.warn('[FormController] Failed to get task from Camunda:', camundaError);
                }
                // Camunda 不可用或没有任务，返回基于数据库的模拟数据（含processDefinitionKey用于获取表单）
                return {
                    id: taskId,
                    name: '订单验证',
                    formKey: 'order-validation',
                    assignee: 'salesmgr01',
                    processInstanceKey: order.process_instance_key,
                    processDefinitionKey: '2251799813689190', // 已知的processDefinitionKey
                    variables: {
                        orderId: order.id,
                        orderNumber: order.order_number,
                        customerName: order.customer_name,
                        customerTier: order.customer_tier,
                        totalAmount: order.grand_total,
                        subtotal: order.total_amount,
                        taxAmount: order.tax_amount,
                        createdBy: order.created_by,
                    },
                };
            }
        }
        // 未找到任务
        console.warn(`[FormController] Task not found: ${taskId}`);
        return null;
    }
    /**
     * 从Camunda加载表单定义（仅使用Camunda API，无本地回退）
     *
     * @param taskInfo 任务信息（必须包含formKey、processDefinitionKey和formVersion）
     * @returns 表单定义对象（包含 schema 和 version）
     */
    async loadFormSchema(taskInfo) {
        const formKey = taskInfo.formKey;
        const processDefinitionKey = taskInfo.processDefinitionKey;
        const formVersion = taskInfo.formVersion;
        if (!processDefinitionKey) {
            throw new Error('缺少 processDefinitionKey，无法从Camunda获取表单');
        }
        console.log(`[FormController] Loading form from Camunda: formKey=${formKey}, processDefinitionKey=${processDefinitionKey}, version=${formVersion}`);
        // 调用 Camunda Form API: GET /v1/forms/{formId}?processDefinitionKey={processDefinitionKey}
        const camundaForm = await this.camundaTasklist.getForm(formKey, processDefinitionKey, formVersion);
        if (!camundaForm || !camundaForm.schema) {
            throw new Error(`表单未找到: ${formKey} (processDefinitionKey=${processDefinitionKey}, version=${formVersion})`);
        }
        console.log(`[FormController] Form loaded from Camunda: ${camundaForm.id}, version: ${camundaForm.version}`);
        // 返回解析后的 schema 和 version，供前端如实渲染
        return {
            schema: JSON.parse(camundaForm.schema),
            version: camundaForm.version, // 从 Camunda Form API 返回的版本号
        };
    }
}
exports.FormController = FormController;
// 导出控制器实例
exports.formController = new FormController();
//# sourceMappingURL=form-controller.js.map