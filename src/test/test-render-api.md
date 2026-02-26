# 表单渲染 API 测试总结

## 当前可用的端点

### 1. 动态任务 ID（推荐）
```
GET /api/forms/task-order-{orderId}/render?userId={userId}

示例:
GET /api/forms/task-order-order-1771460717610/render?userId=user-002

流程:
1. 从 orderId 查询数据库获取 process_instance_key
2. 调用 Camunda: GET /v2/user-tasks/search?processInstanceKey=xxx
3. 获取真实任务的 userTaskKey、formKey、processDefinitionKey
4. 调用 Camunda: GET /v1/forms/{formKey}?processDefinitionKey=xxx
5. 返回表单组件
```

### 2. 模拟任务 ID（开发测试）
```
GET /api/forms/task-validation-001/render?userId=user-002

流程:
1. 返回本地模拟的 TaskInfo（含 processDefinitionKey）
2. 调用 Camunda: GET /v1/forms/order-validation?processDefinitionKey=2251799813689190
3. 返回表单组件
```

## 表单数据来源

现在表单**只从 Camunda API 获取**，不再使用本地文件：

```
Camunda 8 (port 8088)
├── /v2/user-tasks/search  → 获取任务列表
└── /v1/forms/{formId}?processDefinitionKey={key}  → 获取表单定义
```

## 关键参数说明

| 参数 | 类型 | 示例 | 说明 |
|------|------|------|------|
| taskId (URL param) | string | `task-order-xxx` | 任务标识 |
| userId (query) | string | `user-002` | 用户ID |
| userTaskKey | number | `2251799813740319` | Camunda 任务实例ID |
| formKey | string | `order-validation` | 表单定义ID |
| processDefinitionKey | number | `2251799813689190` | 流程定义Key |

## 前端调用方式

```typescript
// 推荐：使用订单ID获取任务并渲染表单
const taskResult = await formApi.getTaskByOrderId(orderId, user.id);
const task = taskResult.data.tasks[0];

// task.taskId = "2251799813740319" (Camunda userTaskKey)
// task.formKey = "order-validation"
// task.processDefinitionKey = "2251799813689190"

const renderResult = await formApi.renderForm(task.taskId, user.id);
// 实际上 renderForm 内部会根据 taskId 格式走不同逻辑
```
