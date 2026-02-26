# Camunda 8 API 使用文档

本文档整理 PRAM3 项目中使用的 Camunda 8 API，说明每个 API 的用途、调用方式和在代码中的使用位置。

---

## 一、API 概览

| API 名称 | 端点 | 用途 | 所在文件/函数 |
|---------|------|------|--------------|
| Task Search API | `POST /v2/user-tasks/search` | 搜索用户任务列表 | `camunda8-client.ts:queryUserTasks()` |
| Task Detail API | `GET /v1/tasks/{taskId}` | 获取任务详情（含 formVersion） | `camunda8-client.ts:getTaskDetails()` |
| Task Variables API | `GET /v1/tasks/{taskId}/variables` | 获取任务变量 | `camunda8-client.ts:getTaskVariables()` |
| Complete Task API | `POST /v2/user-tasks/{taskId}/completion` | 完成任务 | `camunda8-client.ts:completeTask()` |
| Form API | `GET /v1/forms/{formId}` | 获取表单定义（含 schema 和 version） | `camunda8-client.ts:getForm()` |
| Process Instance API | `GET /v2/process-instances/{key}` | 获取流程实例状态 | `form-controller.ts:getProcessInstanceStatus()` |
| Process Definition XML API | `GET /v2/process-definitions/{key}/xml` | 获取 BPMN XML | `form-controller.ts:getProcessFlowStatus()` |
| Process Definition Search API | `GET /v1/process-definitions` | 搜索流程定义 | `camunda8-client.ts:getProcessDefinitionKey()` |

---

## 二、API 详细说明

### 1. Task Search API（任务搜索）

**端点**: `POST http://localhost:8088/v2/user-tasks/search`

**用途**: 查询指定流程实例下的用户任务列表

**请求体**:
```json
{
  "filter": {
    "processInstanceKey": "2251799813760205",
    "state": "CREATED"  // 可选：CREATED, COMPLETED, CANCELED
  }
}
```

**响应**:
```json
{
  "items": [
    {
      "userTaskKey": "2251799813760225",
      "elementId": "task-order-validation",
      "elementName": "订单验证",
      "assignee": null,
      "processInstanceKey": "2251799813760205",
      "processDefinitionKey": "2251799813689190",
      "formId": "order-validation",
      // 注意：此 API 不返回 formVersion
      ...
    }
  ]
}
```

**代码位置**: 
- `src/orchestration/camunda8-client.ts:queryUserTasks()` (第 256-291 行)

**使用场景**:
- `getTaskByOrderId()`：根据订单获取流程实例下的所有任务
- `getTaskByProcessInstance()`：获取活动的 User Tasks

---

### 2. Task Detail API（任务详情）

**端点**: `GET http://localhost:8088/v1/tasks/{taskId}`

**用途**: 获取单个任务的完整详情，包括 `formVersion`

**响应**:
```json
{
  "id": "2251799813760225",
  "name": "订单验证",
  "formId": "order-validation",
  "formVersion": 2,              // ← 表单版本号
  "formKey": "camunda-forms:bpmn:order-validation",
  "processDefinitionKey": "2251799813689190",
  "processInstanceKey": "2251799813760205",
  "assignee": null,
  "taskState": "CREATED",
  "candidateGroups": ["sales-managers"],
  ...
}
```

**代码位置**: 
- `src/orchestration/camunda8-client.ts:getTaskDetails()` (第 293-335 行)

**使用场景**:
- `getTaskByOrderId()`：在获取任务列表后，并行获取每个任务的详细信息（包含 formVersion）
- `getTaskInfoFromCamunda()`：获取单个任务的 formVersion

**注意**: 
- `/v2/user-tasks/search` 不返回 `formVersion`，需要通过此 API 单独获取

---

### 3. Form API（表单定义）

**端点**: `GET http://localhost:8088/v1/forms/{formId}?processDefinitionKey={processDefinitionKey}&version={version}`

**用途**: 获取部署的表单定义（JSON Schema）和版本号

**参数**:
- `formId`: 表单 ID（如 `order-validation`）
- `processDefinitionKey`: 流程定义 Key（数字，如 `2251799813689190`）
- `version` (可选): 表单版本号，不传则返回最新版本

**响应**:
```json
{
  "id": "order-validation",
  "processDefinitionKey": "2251799813689190",
  "title": "订单验证",
  "schema": "{\"components\":[{...}],...}",  // JSON 字符串
  "version": 2,                                   // 表单版本号
  "tenantId": null,
  "isDeleted": false
}
```

**代码位置**: 
- `src/orchestration/camunda8-client.ts:getForm()` (第 392-445 行)

**使用场景**:
- `loadFormSchema()`：渲染表单时获取表单定义和版本号

**调用示例**:
```bash
# 获取最新版本
curl http://localhost:8088/v1/forms/order-validation?processDefinitionKey=2251799813689190

# 获取指定版本
curl http://localhost:8088/v1/forms/order-validation?processDefinitionKey=2251799813689190&version=2
```

---

### 4. Complete Task API（完成任务）

**端点**: `POST http://localhost:8088/v2/user-tasks/{taskId}/completion`

**用途**: 提交表单并完成任务

**请求体**:
```json
{
  "variables": {
    "validationResult": "PASS",
    "validationComment": "订单信息完整"
  }
}
```

**代码位置**: 
- `src/orchestration/camunda8-client.ts:completeTask()` (第 337-390 行)

**使用场景**:
- `submitForm()`：用户提交表单时调用

---

### 5. Process Instance API（流程实例状态）

**端点**: `GET http://localhost:8088/v2/process-instances/{processInstanceKey}`

**用途**: 获取流程实例的当前状态

**响应**:
```json
{
  "processInstanceKey": "2251799813760205",
  "processDefinitionKey": "2251799813689190",
  "state": "ACTIVE",           // ACTIVE, COMPLETED, CANCELED
  "currentElementId": "task-order-validation",
  "hasIncident": false
}
```

**代码位置**: 
- `src/api/controllers/form-controller.ts:getProcessInstanceStatus()` (第 863-891 行)

**使用场景**:
- 获取流程当前状态（是否完成、当前节点等）
- 构建流程导航步骤

---

### 6. Process Definition XML API（BPMN XML）

**端点**: `GET http://localhost:8088/v2/process-definitions/{processDefinitionKey}/xml`

**用途**: 获取流程定义的 BPMN XML（用于流程图展示）

**响应**:
```json
{
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bpmn:definitions...>"
}
```

**代码位置**: 
- `src/api/controllers/form-controller.ts:getProcessFlowStatus()` (第 964 行)

**使用场景**:
- 前端展示流程图

---

## 三、表单渲染流程中的 API 调用链

当调用 `GET /api/forms/:taskId/render?userId=xxx` 时，后端的 API 调用流程：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         表单渲染 API 调用流程                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 获取任务信息                                                              │
│     ├─ 如果 taskId 在缓存中 → 直接返回缓存                                    │
│     └─ 否则调用 Camunda:                                                    │
│        ├─ POST /v2/user-tasks/search (获取任务列表)                          │
│        └─ GET /v1/tasks/{taskId} (获取 formVersion)                         │
│                                                                             │
│  2. 获取表单定义                                                              │
│     └─ GET /v1/forms/{formId}?processDefinitionKey={key}&version={version}  │
│                                                                             │
│  3. 获取流程状态（可选）                                                       │
│     ├─ GET /v2/process-instances/{key}                                      │
│     └─ GET /v2/process-definitions/{key}/xml                                │
│                                                                             │
│  4. 返回响应                                                                  │
│     └─ { formId, formName, formVersion, components, variables, ... }        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 四、关键概念说明

### Task API vs Form API

| 特性 | Task API | Form API |
|------|----------|----------|
| 端点前缀 | `/v1/tasks`, `/v2/user-tasks` | `/v1/forms` |
| 用途 | 管理任务（查询、完成、分配） | 获取表单定义 |
| 返回 `formVersion` | Task Detail API 返回 | 返回 |
| 返回 `schema` | 不返回 | 返回 |

### processDefinitionKey vs processDefinitionId

| 名称 | 格式 | 示例 | 用途 |
|------|------|------|------|
| processDefinitionId | 字符串 | `"sales-order-process"` | 启动流程时使用 |
| processDefinitionKey | 数字 | `"2251799813689190"` | Form API 等需要使用 |

**获取方式**:
```typescript
// 从任务对象中获取
task.processDefinitionKey  // "2251799813689190"

// 或通过 API 查询
GET /v1/process-definitions?filter=sales-order-process
```

### formVersion 的获取途径

1. **从 Task Detail API 获取**（推荐）:
   ```typescript
   GET /v1/tasks/{taskId}
   // 返回: { formVersion: 2, ... }
   ```

2. **从 Form API 获取**:
   ```typescript
   GET /v1/forms/{formId}?processDefinitionKey={key}
   // 返回: { version: 2, schema: "..." }
   ```

---

## 五、代码中的 API 配置

### 默认端口配置

```typescript
// src/orchestration/camunda8-client.ts
const baseUrls = ['http://localhost:8088', 'http://localhost:8080'];

// Camunda 8.5+ 默认端口
// - Zeebe Gateway: 26500 (gRPC)
// - Operate: 8080
// - Tasklist: 8080 (或 8088 在某些配置中)
// - REST API (v2): 8088
```

### 环境差异

| 环境 | Tasklist API | REST API (v2) |
|------|-------------|---------------|
| Camunda 8.4 | `http://localhost:8080` | - |
| Camunda 8.5+ | `http://localhost:8080` | `http://localhost:8088` |
| c8run | `http://localhost:8080` | `http://localhost:8080` |

---

## 六、参考资料

- [Camunda 8 Tasklist API 文档](https://docs.camunda.io/docs/apis-tools/tasklist-api-rest/specifications/get-task/)
- [Camunda 8 Form API 文档](https://docs.camunda.io/docs/apis-tools/tasklist-api-rest/specifications/get-form/)
- [Camunda 8 REST API (v2) 文档](https://docs.camunda.io/docs/apis-tools/orchestration-cluster-api-rest/specifications/get-user-task/)
