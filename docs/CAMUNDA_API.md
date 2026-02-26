# Camunda 8 API 配置文档

## 环境信息

### Docker 端口映射
| 服务 | 容器端口 | 宿主机端口 | 说明 |
|------|---------|-----------|------|
| Orchestration (Zeebe + Operate + Tasklist) | 8080 | **8088** | REST API 统一入口 |
| Zeebe gRPC | 26500 | 26500 | 流程引擎 gRPC |
| Elasticsearch | 9200 | 9200 | 数据存储 |

---

## 测试成功的 API 端点

### 1. v2 User Tasks API (Alpha) ⭐ 推荐使用

#### 1.1 查询任务列表
```http
POST http://localhost:8088/v2/user-tasks/search
Content-Type: application/json

{
  "filter": {
    "processInstanceKey": "2251799813731999",
    "state": "CREATED"
  },
  "sort": [
    { "field": "creationDate", "order": "ASC" }
  ]
}
```

**响应示例：**
```json
{
  "items": [
    {
      "userTaskKey": "2251799813732021",
      "name": "订单验证",
      "elementId": "task-order-validation",
      "processInstanceKey": "2251799813731999",
      "processDefinitionKey": "2251799813689190",
      "formKey": "2251799813694949",
      "state": "CREATED",
      "creationDate": "2026-02-19T00:25:17.926Z"
    }
  ]
}
```

**用途：** 根据流程实例 key 查询待办任务

---

#### 1.2 完成任务
```http
POST http://localhost:8088/v2/user-tasks/{userTaskKey}/completion
Content-Type: application/json

{
  "variables": {
    "validationResult": "PASS",
    "validationComment": "测试通过"
  }
}
```

**响应：** 200 OK (无响应体)

**用途：** 提交表单并驱动流程前进

**注意：** 
- 使用 `userTaskKey` (如 `2251799813732021`) 而非 `taskDefinitionId`
- 变量格式为简单键值对，无需指定类型

---

### 2. v1 Forms API

#### 2.1 获取表单定义
```http
GET http://localhost:8088/v1/forms/{formId}?processDefinitionKey={processDefinitionKey}
```

**示例：**
```http
GET http://localhost:8088/v1/forms/order-validation?processDefinitionKey=2251799813689190
```

**响应示例：**
```json
{
  "id": "order-validation",
  "processDefinitionKey": "2251799813689190",
  "title": "订单验证",
  "schema": "{ \"components\": [...] }",
  "version": 2,
  "tenantId": "<default>",
  "isDeleted": false
}
```

**注意：**
- `processDefinitionKey` 必须是**数字** (如 `2251799813689190`)
- 不是字符串流程 ID (如 `sales-order-process`)

---

### 3. v1 Tasks API

#### 3.1 获取任务详情
```http
GET http://localhost:8088/v1/tasks/{taskId}
```

**响应示例：**
```json
{
  "id": "2251799813757663",
  "name": "订单验证",
  "taskDefinitionId": "task-order-validation",
  "processName": "销售订单审批流程",
  "processDefinitionKey": "2251799813689190",
  "processInstanceKey": "2251799813757643",
  "formId": "order-validation",
  "formKey": "2251799813694949",
  "taskState": "CREATED",
  "implementation": "ZEEBE_USER_TASK",
  "creationDate": "2026-02-21T02:15:09.757+0000"
}
```

**注意：** 
- 任务实现类型为 `ZEEBE_USER_TASK` (Camunda 8.8 新类型)
- **不支持**通过此 API 直接完成或分配任务

---

## API 对比

| 功能 | v1 API | v2 API (推荐) |
|------|--------|---------------|
| 查询任务列表 | ❌ 不支持 | ✅ POST /v2/user-tasks/search |
| 获取任务详情 | ✅ GET /v1/tasks/{id} | ✅ GET /v2/user-tasks/{id} |
| 完成任务 | ❌ 405 错误 | ✅ POST /v2/user-tasks/{id}/completion |
| 获取表单 | ✅ GET /v1/forms/{id} | ❌ 不支持 |
| 分配任务 | ❌ 不支持 | ❌ 不支持 (通过 Zeebe 自动分配) |

---

## 关键字段说明

### Task 对象字段

| 字段 | 示例值 | 说明 |
|------|--------|------|
| `userTaskKey` | `2251799813732021` | 任务实例唯一标识（数字） |
| `taskDefinitionId` | `task-order-validation` | 任务定义 ID（BPMN elementId） |
| `processInstanceKey` | `2251799813731999` | 流程实例标识（数字） |
| `processDefinitionKey` | `2251799813689190` | 流程定义标识（数字） |
| `formKey` | `2251799813694949` | 表单标识（数字，部署后生成） |
| `formId` | `order-validation` | 表单定义 ID（与 BPMN 中 formId 对应） |

---

## 当前实现状态

### ✅ 已实现集成

| 功能 | 代码位置 | API 端点 |
|------|----------|----------|
| 查询任务列表 | `camunda8-client.ts` | `POST /v2/user-tasks/search` |
| 完成任务 | `camunda8-client.ts` | `POST /v2/user-tasks/{id}/completion` |
| 获取表单定义 | `camunda8-client.ts` | `GET /v1/forms/{formId}` |
| 启动流程 | `so-controller.ts` | Zeebe gRPC `CreateProcessInstance` |

### 代码示例

```typescript
// src/orchestration/camunda8-client.ts

// 1. 查询任务
async getTaskByProcessInstance(processInstanceKey: string): Promise<any[]> {
  const url = 'http://localhost:8088/v2/user-tasks/search';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter: { processInstanceKey, state: 'CREATED' }
    }),
  });
  const data = await response.json();
  return data.items || [];
}

// 2. 完成任务
async completeTask(taskId: string, variables?: Record<string, unknown>): Promise<void> {
  const url = `http://localhost:8088/v2/user-tasks/${taskId}/completion`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variables }),
  });
}

// 3. 获取表单
async getForm(formId: string, processDefinitionKey: string | number): Promise<any> {
  const url = `http://localhost:8088/v1/forms/${formId}?processDefinitionKey=${processDefinitionKey}`;
  const response = await fetch(url);
  return await response.json();
}
```

---

## 测试命令

```bash
# 1. 查询任务列表
curl -X POST http://localhost:8088/v2/user-tasks/search \
  -H "Content-Type: application/json" \
  -d '{"filter":{"processInstanceKey":"2251799813731999","state":"CREATED"}}'

# 2. 完成任务
curl -X POST http://localhost:8088/v2/user-tasks/2251799813732021/completion \
  -H "Content-Type: application/json" \
  -d '{"variables":{"validationResult":"PASS"}}'

# 3. 获取表单定义
curl http://localhost:8088/v1/forms/order-validation?processDefinitionKey=2251799813689190

# 4. 获取任务详情
curl http://localhost:8088/v1/tasks/2251799813732021
```

---

## 注意事项

1. **processDefinitionKey 是数字**，不是字符串 `sales-order-process`
2. **v1 Tasks API 不支持完成任务**，必须使用 v2 API
3. **v2 API 是 Alpha 功能**，需要在 Docker 中启用 `CAMUNDA_REST_QUERY_ENABLED=true`
4. **ZEEBE_USER_TASK** 类型任务需要通过 v2 API 完成
5. **BPMN XML 获取**：`/v2/process-definitions/{key}/xml` 返回的 XML 可能不完整，建议前端使用本地 BPMN 文件或简化版流程图
6. **Flow Node Instances**：`/v2/flow-node-instances` 端点在当前版本（8.8 Alpha）不可用，步骤状态通过 **数据库审批历史 + 当前任务** 计算得出

## 流程状态计算逻辑

由于 Camunda 8.8 Alpha API 限制，步骤状态通过以下方式计算：

```
步骤状态 = 
  - 审批历史中有记录 → COMPLETED
  - 与当前任务ID匹配 → CURRENT  
  - 其他 → PENDING
```

**数据来源**：
- **已完成的步骤**：`approval_history` 数据库表
- **当前步骤**：Camunda 任务查询（`/v2/user-tasks/search`）
- **流程状态**：Camunda 流程实例查询（`/v2/process-instances/{id}`）

**限制**：无法获取网关（gateway）和并行分支的实时状态
