# PRAM3 ERP Core - 完整架构文档

## 1. 系统整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRAM3 ERP Core                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   前端SPA   │◄──►│  API Layer  │◄──►│   Camunda   │                 │
│  │             │    │             │    │  Workflow   │                 │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                 │
│         │                   │                   │                        │
│         │                   ▼                   │                        │
│         │          ┌─────────────┐             │                        │
│         │          │Orchestration│◄────────────┘                        │
│         │          │   Layer     │                                      │
│         │          └──────┬──────┘                                      │
│         │                 │                                             │
│         │                 ▼                                             │
│         │          ┌─────────────┐                                     │
│         └─────────►│   Domain    │                                     │
│                    │   Layer     │                                     │
│                    └─────────────┘                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. 数据流图

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         完整审批流程数据流                                │
└──────────────────────────────────────────────────────────────────────────┘

  用户操作          前端              API              编排层            域服务           Camunda
    │               │                │                 │                 │               │
    │   1.进入SO    │                 │                 │                 │               │
    │──────────────►│                 │                 │                 │               │
    │               │  GET /api/v1/   │                 │                 │               │
    │               │  orders/{id}    │                 │                 │               │
    │               │────────────────►│                 │                 │               │
    │               │                 │  getOrderDetails│                 │               │
    │               │                 │───────────────►│                 │               │
    │               │                 │                 │  queryOrders   │               │
    │               │                 │                 │──────────────►│               │
    │               │                 │                 │               │               │
    │               │                 │                 │◄──────────────│               │
    │               │                 │◄───────────────│               │               │
    │               │◄────────────────│                 │               │               │
    │  显示SO信息   │                 │                 │               │               │
    │◄──────────────│                 │                 │               │               │
    │               │                 │                 │               │               │
    │   2.获取任务  │                 │                 │               │               │
    │──────────────►│                 │                 │               │               │
    │               │ GET /api/v1/    │                 │               │               │
    │               │ orders/{id}/    │                 │               │               │
    │               │ tasks           │                 │               │               │
    │               │────────────────►│                 │               │               │
    │               │                 │  getPendingTasks│               │               │
    │               │                 │────────────────►│               │               │
    │               │                 │                 │  Camunda API  │               │
    │               │                 │                 │GET /task?     │               │
    │               │                 │                 │assignee=xxx   │               │
    │               │                 │                 │──────────────►│───────────────►
    │               │                 │                 │               │    GET        │
    │               │                 │                 │               │◄──────────────│
    │               │                 │                 │◄──────────────│               │
    │               │                 │◄───────────────│               │               │
    │               │◄────────────────│                 │               │               │
    │   显示任务列表 │                 │                 │               │               │
    │◄──────────────│                 │                 │               │               │
    │               │                 │                 │               │               │
    │   3.获取表单  │                 │                 │               │               │
    │──────────────►│                 │                 │               │               │
    │               │ GET /api/v1/    │                 │               │               │
    │               │ orders/{id}/    │                 │               │               │
    │               │ schema?taskId=  │                 │               │               │
    │               │ xxx             │                 │               │               │
    │               │────────────────►│                 │               │               │
    │               │                 │ getDynamicSchema│               │               │
    │               │                 │────────────────►│               │               │
    │               │                 │                 │ 1.鉴权检查     │               │
    │               │                 │                 │ 2.获取任务信息 │               │
    │               │                 │                 │ Camunda API    │               │
    │               │                 │                 │ GET /task/{id} │               │
    │               │                 │                 │───────────────►│───────────────►
    │               │                 │                 │               │    GET        │
    │               │                 │                 │               │◄──────────────│
    │               │                 │                 │ 3.确定权限     │               │
    │               │                 │                 │ VIEW/EDIT/    │               │
    │               │                 │                 │ APPROVE       │               │
    │               │                 │                 │               │               │
    │               │                 │                 │ 4.组装字段     │               │
    │               │                 │                 │ 后端动态设置   │               │
    │               │                 │                 │ readonly属性   │               │
    │               │                 │                 │               │               │
    │               │                 │                 │ 5.生成actions  │               │
    │               │                 │                 │ 根据权限返回   │               │
    │               │                 │                 │ 可用操作       │               │
    │               │                 │◄───────────────│               │               │
    │               │◄────────────────│                 │               │               │
    │  渲染动态表单  │                 │                 │               │               │
    │◄──────────────│                 │                 │               │               │
    │   (字段readonly│ 根据权限动态设置 │                 │               │               │
    │    actions根据│ 后端返回)        │                 │               │               │
    │               │                 │                 │               │               │
    │   4.提交审批  │                 │                 │               │               │
    │──────────────►│                 │                 │               │               │
    │               │ POST /api/v1/   │                 │               │               │
    │               │ orders/{id}/   │                 │               │               │
    │               │ tasks/{taskId}/ │                 │               │               │
    │               │ complete        │                 │               │               │
    │               │────────────────►│                 │               │               │
    │               │                 │ completeTask    │               │               │
    │               │                 │───────────────►│               │               │
    │               │                 │                 │ 1.鉴权        │               │
    │               │                 │                 │ 2.验证字段    │               │
    │               │                 │                 │ 3.Camunda API│               │
    │               │                 │                 │ POST /task/  │               │
    │               │                 │                 │ {id}/complete│               │
    │               │                 │                 │─────────────►│───────────────►
    │               │                 │                 │              │    POST       │
    │               │                 │                 │              │◄──────────────│
    │               │                 │                 │ 4.更新订单状态│               │
    │               │                 │                 │──────────────►│               │
    │               │                 │                 │               │               │
    │               │                 │                 │◄──────────────│               │
    │               │                 │◄───────────────│               │               │
    │               │◄────────────────│                 │               │               │
    │  显示结果     │                 │                 │               │               │
    │◄──────────────│                 │                 │               │               │
    │               │                 │                 │               │               │
```

## 3. 完整接口列表

### 3.1 订单管理接口

```
基础URL: /api/v1/orders

┌─────────────────────────────────────────────────────────────────────────┐
│  方法   │  路径                      │  描述                           │
├─────────┼────────────────────────────┼─────────────────────────────────┤
│  POST   │  /                        │  创建销售订单                    │
│  GET    │  /                        │  查询订单列表                    │
│  GET    │  /:id                     │  获取订单详情                    │
│  POST   │  /:id/submit              │  提交审批                        │
│  POST   │  /:id/cancel              │  取消订单                        │
│  GET    │  /:id/history              │  获取审批历史                    │
│  GET    │  /:id/tasks               │  获取待办任务 ⭐NEW              │
│  GET    │  /:id/schema               │  获取动态表单Schema ⭐NEW         │
│  POST   │  /:id/tasks/:taskId/complete│ 完成任务 ⭐NEW                  │
│  POST   │  /:id/tasks/:taskId/claim │  签收任务 ⭐NEW                  │
└─────────┴────────────────────────────┴─────────────────────────────────┘
```

### 3.2 Camunda REST API

```
基础URL: http://localhost:8080/engine-rest

┌─────────────────────────────────────────────────────────────────────────┐
│  方法   │  路径                              │  描述                   │
├─────────┼────────────────────────────────────┼─────────────────────────┤
│  POST   │  /process-definition/key/:key/start│  启动流程实例           │
│  GET    │  /task                             │  查询任务列表           │
│  GET    │  /task/:id                         │  获取任务详情           │
│  POST   │  /task/:id/claim                  │  签收任务               │
│  POST   │  /task/:id/complete                │  完成任务               │
│  GET    │  /process-instance/:id/variables  │  获取流程变量           │
│  PUT    │  /process-instance/:id/variables/:name│ 设置流程变量        │
│  DELETE │  /process-instance/:id             │  删除流程实例           │
└─────────┴────────────────────────────────────┴─────────────────────────┘
```

## 4. 鉴权流程详解

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         鉴权流程图                                        │
└──────────────────────────────────────────────────────────────────────────┘

  用户请求                                                             
    │                                                                   
    ▼                                                                   
┌───────────────────┐                                                   
│ 1.验证Token       │  检查请求头中的Authorization token                  
│                   │  JWT解析获取用户信息                              
└─────────┬─────────┘                                                   
          │                                                            
          ▼                                                            
┌───────────────────┐                                                   
│ 2.获取用户角色     │  从token或用户服务获取用户角色列表                  
│                   │  ['DEPT_MANAGER', 'ADMIN']                       
└─────────┬─────────┘                                                   
          │                                                            
          ▼                                                            
┌───────────────────┐                                                   
│ 3.检查资源权限     │  根据请求的资源类型确定所需权限                    
│                   │  • 订单查看: VIEW                                 
│                   │  • 订单编辑: EDIT                                 
│                   │  • 任务操作: APPROVE                              
└─────────┬─────────┘                                                   
          │                                                            
          ▼                                                            
┌───────────────────┐                                                   
│ 4.匹配角色权限     │  根据Node ID查找权限配置                           
│                   │  NODE_PERMISSION_RULES                            
└─────────┬─────────┘                                                   
          │                                                            
          ▼                                                            
┌───────────────────┐                                                   
│ 5.返回权限级别     │  确定最终权限级别                                  
│                   │  • VIEW (只读)                                   
│                   │  • EDIT (可编辑)                                 
│                   │  • APPROVE (可提交)                              
└─────────┬─────────┘                                                   
          │                                                            
          ▼                                                            
┌───────────────────┐                                                   
│ 6.组装Schema      │  根据权限级别动态设置字段属性                       
│                   │  • readonly = (permission !== EDIT/APPROVE)        
│                   │  • availableActions = 根据权限生成                 
└─────────┬─────────┘                                                   
          │                                                            
          ▼                                                            
返回带权限的Schema给前端
```

## 5. 完整调用日志示例

### 5.1 创建订单流程

```bash
# 请求
POST /api/v1/orders
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-User-Id: user001
X-User-Roles: SALES

{
  "customerId": "cust001",
  "items": [...],
  "shippingAddress": "北京市",
  "billingAddress": "北京市"
}

# 后端日志输出
[2024-01-15 10:30:00] [INFO] [AUTH] Token验证成功 - UserId: user001, Roles: [SALES]
[2024-01-15 10:30:00] [INFO] [API] POST /api/v1/orders - TraceId: trace-1705288200000-1
[2024-01-15 10:30:00] [INFO] [ORCHESTRATION] 调用OrderOrchestrationService.createOrderWithWorkflow()
[2024-01-15 10:30:00] [INFO] [DOMAIN] 调用SalesOrderService.createOrder()
[2024-01-15 10:30:00] [INFO] [DOMAIN] 订单创建成功 - OrderId: order-xxx, OrderNumber: SO202401150001
[2024-01-15 10:30:00] [INFO] [CAMUNDA] 启动流程 - ProcessKey: salesOrderApprovalProcess
[2024-01-15 10:30:00] [INFO] [CAMUNDA] Camunda API: POST /process-definition/key/salesOrderApprovalProcess/start
[2024-01-15 10:30:00] [INFO] [CAMUNDA] Request Body: {"businessKey":"order-xxx","variables":{...}}
[2024-01-15 10:30:00] [INFO] [CAMUNDA] Response: {"id":"proc-xxx","state":"ACTIVE"}
[2024-01-15 10:30:00] [INFO] [API] 响应: 201 Created - {"success":true,"data":{"order":{...},"processInstanceId":"proc-xxx"}}
```

### 5.2 获取动态表单Schema

```bash
# 请求
GET /api/v1/orders/order-xxx/schema?taskId=task-001
Authorization: Bearer <jwt_token>
X-User-Id: user001
X-User-Roles: DEPT_MANAGER

# 后端日志输出
[2024-01-15 10:35:00] [INFO] [AUTH] Token验证成功 - UserId: user001, Roles: [DEPT_MANAGER]
[2024-01-15 10:35:00] [INFO] [API] GET /api/v1/orders/order-xxx/schema - TraceId: trace-1705288500000-1
[2024-01-15 10:35:00] [INFO] [ORCHESTRATION] 调用DynamicSchemaService.getDynamicSchema()
[2024-01-15 10:35:00] [INFO] [AUTH] 鉴权检查 - UserRoles: [DEPT_MANAGER], Required: APPROVE
[2024-01-15 10:35:00] [INFO] [AUTH] 权限级别确定: APPROVE
[2024-01-15 10:35:00] [INFO] [CAMUNDA] 获取任务详情 - TaskId: task-001
[2024-01-15 10:35:00] [INFO] [CAMUNDA] Camunda API: GET /task/task-001
[2024-01-15 10:35:00] [INFO] [CAMUNDA] Response: {"id":"task-001","nodeId":"node-approval-level1","name":"部门经理审批",...}
[2024-01-15 10:35:00] [INFO] [SCHEMA] 组装字段 - PermissionLevel: APPROVE
[2024-01-15 10:35:00] [INFO] [SCHEMA] 字段权限:
[2024-01-15 10:35:00] [INFO] [SCHEMA]   - orderNumber: VIEW (readonly: true)
[2024-01-15 10:35:00] [INFO] [SCHEMA]   - customerName: VIEW (readonly: true)
[2024-01-15 10:35:00] [INFO] [SCHEMA]   - totalAmount: VIEW (readonly: true)
[2024-01-15 10:35:00] [INFO] [SCHEMA]   - approvalAction: APPROVE (readonly: false)
[2024-01-15 10:35:00] [INFO] [SCHEMA]   - approvalComment: APPROVE (readonly: false)
[2024-01-15 10:35:00] [INFO] [SCHEMA] 生成Actions: [complete, claim]
[2024-01-15 10:35:00] [INFO] [API] 响应: 200 OK - {"schemaId":"dept-manager-approval-form","taskId":"task-001","nodeId":"node-approval-level1","permissionLevel":"APPROVE","fields":[...],"actions":[...]}
```

### 5.3 提交审批

```bash
# 请求
POST /api/v1/orders/order-xxx/tasks/task-001/complete
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-User-Id: user001
X-User-Roles: DEPT_MANAGER

{
  "action": "APPROVE",
  "comment": "审批通过，订单金额合理"
}

# 后端日志输出
[2024-01-15 10:40:00] [INFO] [AUTH] Token验证成功 - UserId: user001, Roles: [DEPT_MANAGER]
[2024-01-15 10:40:00] [INFO] [API] POST /api/v1/orders/order-xxx/tasks/task-001/complete - TraceId: trace-1705288800000-1
[2024-01-15 10:40:00] [INFO] [ORCHESTRATION] 调用DynamicSchemaService.executeTaskOperation()
[2024-01-15 10:40:00] [INFO] [AUTH] 鉴权检查 - UserRoles: [DEPT_MANAGER], TaskAssignee: user001 ✓
[2024-01-15 10:40:00] [INFO] [VALIDATION] 验证字段:
[2024-01-15 10:40:00] [INFO] [VALIDATION]   - approvalAction: "APPROVE" ✓
[2024-01-15 10:40:00] [INFO] [VALIDATION]   - approvalComment: "审批通过..." ✓
[2024-01-15 10:40:00] [INFO] [CAMUNDA] 完成任务 - TaskId: task-001
[2024-01-15 10:40:00] [INFO] [CAMUNDA] Camunda API: POST /task/task-001/complete
[2024-01-15 10:40:00] [INFO] [CAMUNDA] Request Body: {"variables":{"approvalAction":{"value":"APPROVE","type":"string"},"approvalComment":{"value":"审批通过...","type":"string"},"approverId":{"value":"user001","type":"string"}}}
[2024-01-15 10:40:00] [INFO] [CAMUNDA] Response: 204 No Content
[2024-01-15 10:40:00] [INFO] [DOMAIN] 更新订单状态 - OrderId: order-xxx, Status: APPROVED
[2024-01-15 10:40:00] [INFO] [ORCHESTRATION] 触发自动化流程:
[2024-01-15 10:40:00] [INFO] [ORCHESTRATION]   1. 财务处理 - ServiceTask_Finance
[2024-01-15 10:40:00] [INFO] [ORCHESTRATION]   2. 库存预留 - ServiceTask_Inventory
[2024-01-15 10:40:00] [INFO] [ORCHESTRATION]   3. 客户通知 - ServiceTask_Notification
[2024-01-15 10:40:00] [INFO] [API] 响应: 200 OK - {"success":true,"message":"任务已完成"}
```

## 6. 前端代码结构

```
src/frontend/
├── index.html                    # 前端入口HTML
├── spa/
│   └── so-spa.component.ts       # ⭐ SO SPA主组件
└── dynamic-forms/
    ├── form-schemas.ts           # 基础表单模式定义
    ├── form-renderer.ts          # ⭐ 动态表单渲染器
    ├── permission.types.ts       # ⭐ 权限类型定义
    └── dynamic-schema.service.ts # ⭐ 后端Schema组装服务
```

### 6.1 SO SPA组件

```typescript
// src/frontend/spa/so-spa.component.ts

export class SOSPAComponent {
  // 状态管理
  state: SOSPAState = {
    currentTaskId: '',           // Task ID - 操作key
    currentNodeId: '',            // Node ID - 业务key
    permissionLevel: PermissionLevel.VIEW,
    fields: [],
    actions: [],                  // 后端返回的可用操作
    parallelTasks: [],            // 并行任务Tab
  };

  // 主方法
  render(): string {
    // 1. 渲染顶部状态栏
    // 2. 渲染进度条（带节点形状和颜色）
    // 3. 渲染当前任务表单（字段readonly由后端决定）
    // 4. 渲染操作按钮（actions由后端动态生成）
  }

  // 获取动态Schema
  async loadDynamicSchema(taskId: string): Promise<void> {
    // 调用API: GET /api/v1/orders/{id}/schema?taskId=xxx
    const response = await fetch(`/api/v1/orders/${this.orderId}/schema?taskId=${taskId}`);
    const schema = await response.json();
    
    // 更新状态
    this.state.currentTaskId = schema.taskId;
    this.state.currentNodeId = schema.nodeId;
    this.state.permissionLevel = schema.permissionLevel;
    this.state.fields = schema.fields;        // 包含readonly属性
    this.state.actions = schema.actions;       // 后端返回的操作
    this.state.parallelTasks = schema.parallelGroups || [];
    
    // 渲染表单
    this.renderForm();
  }

  // 执行操作
  async executeAction(actionId: string): Promise<void> {
    const action = this.state.actions.find(a => a.id === actionId);
    if (!action) return;
    
    // 调用API: POST /api/v1/orders/{id}/tasks/{taskId}/complete
    await fetch(`/api/v1/orders/${this.orderId}/tasks/${this.state.currentTaskId}/${actionId}`, {
      method: 'POST',
      body: JSON.stringify(this.getFormData()),
    });
    
    // 刷新数据
    await this.loadDynamicSchema(this.state.currentTaskId);
  }

  // 渲染方法
  render(): string {
    return `
      <!-- 顶部状态栏 -->
      <div class="so-spa-header">
        <span class="so-id">${this.orderNumber}</span>
        <span class="so-status">${this.status}</span>
        <toggle v-model="isActive" />
      </div>

      <!-- 进度条 -->
      <div class="progress-bar">
        ${this.state.parallelTasks.map(group => `
          <div class="task-group">
            ${group.tasks.map(task => `
              <div class="node ${task.nodeType} ${task.status}">
                ${this.getNodeIcon(task.nodeType)}
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>

      <!-- 动态表单 -->
      <div class="form-container">
        ${this.state.fields.map(field => `
          <div class="field">
            <label>${field.label}</label>
            <input 
              type="${field.type}"
              :value="field.value"
              :readonly="field.readonly"  <!-- ⭐ 由后端决定 -->
            />
          </div>
        `).join('')}
      </div>

      <!-- 动态操作按钮 -->
      <div class="actions">
        ${this.state.actions.map(action => `
          <button @click="executeAction('${action.id}')">
            ${action.icon} ${action.label}
          </button>
        `).join('')}
      </div>
    `;
  }
}
```

### 6.2 动态表单渲染器

```typescript
// src/frontend/dynamic-forms/form-renderer.ts

export class FormRenderer {
  // 渲染带权限的字段
  renderField(field: PermissionAwareField): string {
    // ⭐ readonly由后端设置，前端直接使用
    const readonlyAttr = field.readonly ? 'readonly' : '';
    const requiredAttr = field.required ? 'required' : '';
    
    return `
      <div class="form-field" data-field-id="${field.id}">
        <label>${field.label}</label>
        <input 
          type="${field.type}"
          name="${field.name}"
          value="${field.value}"
          ${readonlyAttr}
          ${requiredAttr}
          data-permission="${field.permission}"
        />
      </div>
    `;
  }

  // 渲染动态操作按钮
  renderActions(actions: TaskAction[]): string {
    // ⭐ actions由后端生成，前端只负责渲染
    return actions.map(action => `
      <button 
        class="btn btn-${action.id}"
        data-action="${action.id}"
        ${action.confirm ? `onclick="return confirm('${action.confirm}')"` : ''}
      >
        ${action.icon} ${action.label}
      </button>
    `).join('');
  }
}
```

## 7. 前后端交互总结

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         前后端交互流程                                    │
└──────────────────────────────────────────────────────────────────────────┘

  前端                                      后端
   │                                         │
   │  1. 进入SO页面                           │
   │  ────────────────────────────────────►  │
   │                                         │  API: GET /api/v1/orders/{id}
   │                                         │  调用SalesOrderService
   │                                         │  返回订单数据
   │  ◄───────────────────────────────────   │
   │                                         │
   │  2. 获取待办任务列表                      │
   │  ────────────────────────────────────►  │
   │                                         │  API: GET /api/v1/orders/{id}/tasks
   │                                         │  调用Camunda API: GET /task
   │                                         │  返回任务列表
   │  ◄───────────────────────────────────   │
   │                                         │
   │  3. 点击任务，获取动态Schema              │
   │  ────────────────────────────────────►  │
   │                                         │  API: GET /api/v1/orders/{id}/schema?taskId=xxx
   │                                         │
   │                                         │  ┌─────────────────────┐
   │                                         │  │  鉴权流程            │
   │                                         │  │  1.验证Token        │
   │                                         │  │  2.获取用户角色      │
   │                                         │  │  3.检查权限          │
   │                                         │  │  4.组装Schema       │
   │                                         │  │  5.返回字段(带readonly)│
   │                                         │  │     和actions       │
   │                                         │  └─────────────────────┘
   │                                         │
   │  ◄───────────────────────────────────   │
   │     返回带权限的Schema                    │
   │     {                                    │
   │       "fields": [                        │
   │         {"id":"x","readonly":true},  ←─── 后端设置     │
   │         {"id":"y","readonly":false} ←─── 后端设置     │
   │       ],                                 │
   │       "actions": [                  ←─── 后端生成     │
   │         {"id":"complete","label":"提交"},        │
   │         {"id":"claim","label":"签收"}            │
   │       ]                                    │
   │     }                                      │
   │                                         │
   │  4. 前端渲染                              │
   │     • 根据field.readonly渲染              │
   │     • 根据actions渲染按钮                 │
   │     ⭐ 前端零配置                         │
   │                                         │
   │  5. 用户提交                              │
   │  ────────────────────────────────────►  │
   │     POST /api/v1/orders/{id}/tasks/{taskId}/complete
   │                                         │  调用Camunda API完成
   │                                         │  更新订单状态
   │                                         │  触发自动化流程
   │  ◄───────────────────────────────────   │
   │     返回结果                              │
   │                                         │
```

## 8. Camunda集成总结

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      Camunda交互流程                                      │
└──────────────────────────────────────────────────────────────────────────┘

  编排层                              Camunda
   │                                   │
   │  1. 启动流程                       │
   │  ──────────────────────────────►  │
   │  POST /process-definition/       │
   │  key/salesOrderApprovalProcess/  │
   │  start                           │
   │  Body: {businessKey, variables}   │
   │                                   │
   │  ◄───────────────────────────────  │
   │  Response: {id, state}            │
   │                                   │
   │  2. 查询任务                       │
   │  ──────────────────────────────►  │
   │  GET /task?assignee=xxx           │
   │                                   │
   │  ◄───────────────────────────────  │
   │  Response: [tasks...]             │
   │                                   │
   │  3. 签收任务                       │
   │  ──────────────────────────────►  │
   │  POST /task/{id}/claim            │
   │  Body: {userId}                   │
   │                                   │
   │  4. 完成任务                       │
   │  ──────────────────────────────►  │
   │  POST /task/{id}/complete         │
   │  Body: {variables}                │
   │                                   │
   │  5. 获取变量                       │
   │  ──────────────────────────────►  │
   │  GET /process-instance/{id}/      │
   │  variables                        │
   │                                   │
   │  6. 设置变量                       │
   │  ──────────────────────────────►  │
   │  PUT /process-instance/{id}/      │
   │  variables/{name}                 │
```

## 9. 权限控制总结

| 场景 | 用户角色 | 节点 | 权限级别 | readonly字段 | 可用操作 |
|------|---------|------|---------|-------------|---------|
| 创建订单 | SALES | node-order-create | EDIT | 无 | [创建] |
| 质量检查 | QC | node-order-review | EDIT | 订单信息 | [通过, 拒绝] |
| 部门审批 | DEPT_MANAGER | node-approval-level1 | APPROVE | 订单信息 | [通过, 拒绝, 签收] |
| 总监审批 | DIRECTOR | node-approval-level2 | APPROVE | 订单信息, 部门审批意见 | [通过, 拒绝, 签收] |
| VP审批 | VP | node-approval-level3 | APPROVE | 全部只读 | [通过, 拒绝, 签收] |
| 查看历史 | ANY | any | VIEW | 全部只读 | [] |

## 10. 启动命令

```bash
# 安装依赖
npm install

# 编译
npm run build

# 启动后端
npm start

# Camunda (需要单独启动)
# docker run -d -p 8080:8080 camunda/camunda-bpm-platform:latest
```
