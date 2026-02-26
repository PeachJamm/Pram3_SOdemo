# 表单渲染 API 文档

## 概述

本文档描述 PRAM3 ERP 的表单渲染 API，支持基于用户权限的动态表单渲染。

**核心功能**：
- 根据用户ID和任务ID渲染表单
- 自动应用权限过滤（VIEW/EDIT/APPROVE）
- 支持表单提交到Camunda
- 查询用户待办任务列表

---

## API 端点

### 1. 渲染表单

**GET** `/api/forms/:taskId/render?userId=xxx`

根据任务ID和用户ID渲染表单，返回过滤后的表单组件。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | string | 是 | Camunda任务ID（路径参数） |
| userId | string | 是 | 用户ID（查询参数） |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "formId": "order-validation",
    "formName": "订单验证",
    "permissionLevel": "APPROVE",
    "userInfo": {
      "id": "user-003",
      "username": "salesmgr01",
      "fullName": "李四",
      "role": "SALES_MANAGER"
    },
    "taskInfo": {
      "taskId": "2251799813757663",
      "taskName": "订单验证",
      "assignee": "salesmgr01",
      "isAssignedToUser": true
    },
    "components": [
      {
        "id": "Field_order_info_card",
        "label": "订单信息",
        "type": "text",
        "text": "### 📋 订单信息\n\n**订单号:** SO-20240218001...",
        "readonly": true
      }
    ],
    "variables": {
      "orderNumber": "SO-20240218001",
      "customerName": "上海创新集团",
      "totalAmount": 274752,
      "productLinesTable": "| 序号 | 产品 |..."
    },
    "processFlow": {
      "processInstanceKey": "2251799813757643",
      "processStatus": "ACTIVE",
      "currentStepId": "task-order-validation",
      "bpmnXml": "...",
      "steps": [
        { "id": "start-event", "name": "订单提交", "status": "COMPLETED" },
        { "id": "task-order-validation", "name": "订单验证", "status": "CURRENT", "assignee": "salesmgr01" },
        { "id": "task-sales-manager", "name": "销售经理审批", "status": "PENDING" },
        { "id": "task-finance", "name": "财务审批", "status": "PENDING" }
      ]
    },
    "approvalHistory": [
      {
        "id": "hist-xxx",
        "stepName": "订单提交",
        "approverName": "sales01",
        "action": "COMPLETE",
        "createdAt": "2026-02-21T10:00:00Z"
      }
    ]
  }
}
```

#### 权限级别说明

| 权限级别 | 可见字段 | 可编辑字段 |
|---------|---------|-----------|
| VIEW | 所有业务字段 | 无（全部readonly） |
| EDIT | 业务字段 + 提交按钮 | 业务字段 |
| APPROVE | 业务字段（只读）+ 审批区域 | 审批决策、审批意见 |

---

### 2. 提交表单

**POST** `/api/forms/:taskId/submit`

提交表单数据到Camunda，完成任务。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | string | 是 | Camunda任务ID（路径参数） |

#### 请求体

```json
{
  "userId": "user-003",
  "variables": {
    "validationResult": "PASS",
    "validationComment": "订单信息完整"
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "taskId": "task-validation-001",
    "completedBy": "salesmgr01",
    "completedAt": "2026-02-18T10:30:00Z",
    "variables": {
      "validationResult": "PASS",
      "validationComment": "订单信息完整"
    }
  }
}
```

---

### 3. 获取表单Schema

**GET** `/api/forms/schema/:formKey`

获取表单定义（原始Schema，用于预览或开发调试）。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| formKey | string | 是 | 表单Key（如 order-validation） |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "formId": "order-validation",
    "formName": "订单验证",
    "properties": {
      "taskType": "USER_TASK",
      "assigneeSource": "DMN"
    },
    "fields": [
      { "key": "validationResult", "label": "验证结果", "type": "radio", "required": true },
      { "key": "validationComment", "label": "拒绝原因", "type": "textarea", "required": false }
    ]
  }
}
```

---

### 4. 获取待办任务列表

**GET** `/api/forms/tasks/pending?userId=xxx`

获取用户的待办任务列表。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID（查询参数） |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "userId": "user-003",
    "username": "salesmgr01",
    "taskCount": 2,
    "tasks": [
      {
        "taskId": "task-001",
        "taskName": "订单验证",
        "formKey": "order-validation",
        "processInstanceKey": "2251799813689190",
        "createdAt": "2026-02-18T10:00:00Z"
      },
      {
        "taskId": "task-002",
        "taskName": "销售经理审批",
        "formKey": "sales-manager-approval",
        "processInstanceKey": "2251799813689200",
        "createdAt": "2026-02-18T10:15:00Z"
      }
    ]
  }
}
```

---

## 前端使用示例

### React Hook 示例

```typescript
import { useState, useEffect } from 'react';

interface UseFormRenderOptions {
  taskId: string;
  userId: string;
}

export function useFormRender({ taskId, userId }: UseFormRenderOptions) {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForm() {
      try {
        const response = await fetch(
          `/api/forms/${taskId}/render?userId=${userId}`
        );
        const result = await response.json();
        
        if (result.success) {
          setFormData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [taskId, userId]);

  const submitForm = async (variables: Record<string, any>) => {
    const response = await fetch(`/api/forms/${taskId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, variables }),
    });
    return response.json();
  };

  return { formData, loading, error, submitForm };
}

// 使用示例
function ApprovalPage({ taskId, userId }) {
  const { formData, loading, error, submitForm } = useFormRender({ taskId, userId });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <h1>{formData.formName}</h1>
      <p>权限: {formData.permissionLevel}</p>
      
      {/* 渲染表单组件 */}
      {formData.components.map(component => (
        <FormField 
          key={component.id} 
          component={component}
          readonly={component.readonly}
        />
      ))}
      
      {/* 提交按钮（根据权限显示） */}
      {formData.permissionLevel === 'APPROVE' && (
        <button onClick={() => submitForm(formValues)}>
          提交审批
        </button>
      )}
    </div>
  );
}
```

---

## 权限判定逻辑

### 判定流程

```
1. 获取用户信息（role, permissions）
   ↓
2. 获取任务信息（assignee, formKey, variables）
   ↓
3. 检查是否是ADMIN → 返回APPROVE
   ↓
4. 检查 user.username === task.assignee → 返回APPROVE
   ↓
5. 检查是否是订单创建者且任务在编辑阶段 → 返回EDIT
   ↓
6. 检查 role === SALES_REP → 返回VIEW（或其他适当级别）
   ↓
7. 默认返回VIEW
```

### 角色权限映射

| 角色 | 默认权限级别 | 说明 |
|------|-------------|------|
| ADMIN | APPROVE | 拥有所有权限 |
| SALES_MANAGER | APPROVE（当assignee匹配） | 小额订单审批 |
| FINANCE | APPROVE（当assignee匹配） | 中额订单审批 |
| DIRECTOR | APPROVE（当assignee匹配） | 大额订单审批 |
| SALES_REP | EDIT（自己的订单） | 创建和编辑订单 |
| CUSTOMER_SERVICE | VIEW | 只读查看 |

---

## 表单字段权限配置

表单JSON中每个字段都可以配置 `permission` 属性：

```json
{
  "label": "审批决策",
  "type": "radio",
  "key": "approvalDecision",
  "properties": {
    "permission": {
      "VIEW": { "visible": false, "readonly": true },
      "EDIT": { "visible": false, "readonly": true },
      "APPROVE": { "visible": true, "readonly": false }
    }
  }
}
```

### 权限属性

| 属性 | 类型 | 说明 |
|------|------|------|
| visible | boolean | 是否可见（false则隐藏该字段） |
| readonly | boolean | 是否只读 |

### 默认权限规则

当字段未配置 `permission` 时，使用以下默认规则：

- **VIEW**: 所有字段 `readonly: true`
- **EDIT**: 输入字段可编辑，审批字段隐藏
- **APPROVE**: 业务字段只读，审批字段可编辑

---

## 错误处理

### 常见错误码

| HTTP状态码 | 错误信息 | 说明 |
|-----------|---------|------|
| 400 | 缺少 userId 参数 | 请求缺少必需参数 |
| 403 | 无权限提交此任务 | 用户不是任务assignee |
| 404 | 用户不存在 | userId无效 |
| 404 | 任务不存在或已完成 | taskId无效或任务已完成 |
| 500 | 表单定义加载失败 | 表单文件不存在或格式错误 |

### 错误响应格式

```json
{
  "success": false,
  "error": "用户不存在"
}
```

---

## 5. 获取订单任务列表

**GET** `/api/forms/tasks/by-order/:orderId?userId=xxx`

根据订单ID查询关联的Camunda待办任务（含完整流程变量）。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderId | string | 是 | 订单ID（路径参数） |
| userId | string | 是 | 用户ID（查询参数） |

### 响应示例

```json
{
  "success": true,
  "data": {
    "orderId": "order-1771640232438",
    "processInstanceKey": "2251799813757643",
    "taskCount": 1,
    "tasks": [
      {
        "taskId": "2251799813757998",
        "taskName": "订单验证",
        "taskDefinitionId": "task-order-validation",
        "processInstanceKey": "2251799813757643",
        "processDefinitionKey": "2251799813689190",
        "formKey": "order-validation",
        "assignee": "salesmgr01",
        "createdAt": "2026-02-21T02:15:09.757Z",
        "variables": {
          "orderId": "order-1771640232438",
          "orderNumber": "SO-1771640232438",
          "customerName": "上海创新集团",
          "customerTier": "VIP",
          "totalAmount": 1526.4,
          "subtotal": 1440,
          "taxAmount": 86.4,
          "lineCount": 1,
          "productLines": "[{\"productId\":\"prod-001\",...}]",
          "productLinesTable": "| 序号 | 产品 |...",
          "expectedApprovalLevel": "总监审批 (DIRECTOR)",
          "discountRate": 15
        }
      }
    ],
    "isMock": false
  }
}
```

### 非 UserTask 情况处理

当流程没有活动的 UserTask（正在执行自动任务、等待外部事件或已结束）时，API 返回 `taskCount: 0`，并包含 `nonUserTaskInfo`：

```json
{
  "success": true,
  "data": {
    "orderId": "order-xxx",
    "processInstanceKey": "2251799813757643",
    "taskCount": 0,
    "tasks": [],
    "nonUserTaskInfo": {
      "taskId": "non-user-task-2251799813757643",
      "taskName": "库存预留（自动）",
      "taskDefinitionId": "task-inventory",
      "processInstanceKey": "2251799813757643",
      "formKey": null,
      "assignee": null,
      "variables": { ... },
      "processStatus": "ACTIVE",
      "currentElement": "库存预留（自动）",
      "isNonUserTask": true
    },
    "processStatus": "ACTIVE"
  }
}
```

**前端处理建议**：
```typescript
if (result.data.taskCount === 0) {
  // 没有 UserTask，显示流程状态或自动任务信息
  if (result.data.nonUserTaskInfo) {
    showProcessStatus(result.data.nonUserTaskInfo);
  }
} else {
  // 正常渲染表单
  renderForm(result.data.tasks[0]);
}
```

**常见非 UserTask 状态**：
| 状态 | 显示文本 | 说明 |
|------|---------|------|
| ACTIVE + 自动任务 | "库存预留（自动）" | 执行 Service Task |
| ACTIVE + 网关 | "审批路由" | 等待条件判断 |
| COMPLETED | "流程已完成" | 流程正常结束 |
| CANCELED | "流程已取消" | 流程被终止 |

### 使用场景

前端页面加载流程：
1. 用户进入订单详情页（已知 orderId）
2. 调用此 API 获取当前待办任务
3. 使用 `taskDefinitionId`（如 `task-order-validation`）调用渲染表单 API

---

## 订单管理 API

### 创建订单并启动流程

**POST** `/api/v1/orders/create-and-start`

创建销售订单并同步启动 Camunda 审批流程。

#### 请求体

```json
{
  "customerId": "cust-002",
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "unitPrice": 800
    }
  ]
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "orderId": "order-1771640232438",
    "orderNumber": "SO-1771640232438",
    "processInstanceKey": "2251799813757643",
    "status": "PROCESSING"
  }
}
```

#### 事务说明

此接口使用数据库事务保证原子性：
1. BEGIN TRANSACTION
2. INSERT sales_orders（生成订单）
3. INSERT sales_order_items（保存明细）
4. 调用 Camunda 启动流程
5. UPDATE sales_orders SET process_instance_key = ?
6. COMMIT

如果任何步骤失败，自动 ROLLBACK。

---

## 完整前端调用流程

```typescript
// 1. 创建订单
const orderRes = await fetch('/api/v1/orders/create-and-start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'cust-002',
    items: [{ productId: 'prod-001', quantity: 2, unitPrice: 800 }]
  })
});
const { orderId } = (await orderRes.json()).data;

// 2. 获取任务
const taskRes = await fetch(`/api/forms/tasks/by-order/${orderId}?userId=${userId}`);
const { tasks } = (await taskRes.json()).data;
const task = tasks[0]; // 获取第一个任务

// 3. 渲染表单
const renderRes = await fetch(`/api/forms/${task.taskDefinitionId}/render?userId=${userId}`);
const formData = (await renderRes.json()).data;

// 4. 提交表单
const submitRes = await fetch(`/api/forms/${task.taskDefinitionId}/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    variables: {
      orderId,
      validationResult: 'PASS',
      validationComment: '审核通过'
    }
  })
});
```

---

## 相关文档

- `CAMUNDA_API.md` - Camunda 8 API 详细说明
- `PERMISSION_SYSTEM.md` - 权限体系设计
- `FRONTEND_DESIGN.md` - 前端整体设计
- `BPMND.md` - BPMN开发经验

---

## 审批历史记录

表单提交时，系统会自动保存以下信息到 `approval_history` 表：

| 字段 | 存储内容 | 用途 |
|------|---------|------|
| `action` | COMPLETE/APPROVE/REJECT | 审批决策 |
| `comment` | 审批意见 | 显示在历史时间线 |
| `variables` | **完整表单数据(JSON)** | 记录提交时的所有字段值 |
| `task_id` | Camunda 任务ID | 关联具体任务 |

**variables 存储示例**：
```json
{
  "orderId": "order-1771643175048",
  "validationResult": "PASS",
  "validationComment": "审核通过，继续流程",
  "productLinesTable": "| 序号 | 产品 |...",
  "totalAmount": 1526.4
}
```

**前端历史展示**：
```typescript
approvalHistory.map(record => (
  <TimelineItem key={record.id}>
    <div>{record.stepName}</div>
    <div>审批人: {record.approverName}</div>
    <div>意见: {record.comment}</div>
    {/* 可展开查看完整表单数据 */}
    <details>
      <summary>查看提交的表单数据</summary>
      <pre>{JSON.stringify(record.variables, null, 2)}</pre>
    </details>
  </TimelineItem>
))
```

---

*版本：v1.2*
*更新日期：2026-02-21*
