# PRAM3 权限体系设计文档

## 概述

本文档描述 PRAM3 ERP 销售订单（SO）模块的权限体系设计，支持三种权限级别：**VIEW**、**EDIT**、**APPROVE**。

---

## 权限级别

### 1. VIEW（只读）

**适用角色**：
- `CUSTOMER_SERVICE` - 客服人员

**权限范围**：
- ✅ 查看SO详情
- ✅ 查看审批历史
- ✅ 查看流程进度
- ❌ 不能编辑任何字段
- ❌ 不能提交操作

**界面表现**：
- 所有表单字段 `readonly: true`
- 审批区域 `visible: false`
- 提交按钮 `visible: false`

---

### 2. EDIT（编辑）

**适用角色**：
- `SALES_REP` - 销售代表

**权限范围**：
- ✅ 创建新SO
- ✅ 编辑SO业务字段（客户、产品、数量等）
- ✅ 保存草稿
- ✅ 提交SO到审批流程
- ❌ 不能进行审批操作
- ❌ 不能查看审批区域

**界面表现**：
- 业务字段 `readonly: false`
- 系统计算字段 `readonly: true`（如总计金额）
- 审批区域 `visible: false`
- 提交按钮 `visible: true`

---

### 3. APPROVE（审批）

**适用角色**：
- `SALES_MANAGER` - 销售经理（审批 Level 1）
- `FINANCE` - 财务人员（审批 Level 2）
- `DIRECTOR` - 总监（审批 Level 3）

**权限范围**：
- ✅ 查看SO详情（只读）
- ✅ 进行审批决策（同意/拒绝/回退）
- ✅ 填写审批意见
- ✅ 回退到上一步
- ❌ 不能修改业务字段

**界面表现**：
- 业务字段 `readonly: true`
- 审批区域 `visible: true`, `readonly: false`
- 审批决策选项可见
- 提交按钮 `visible: true`

**动态分配**：
审批人由DMN决策表根据订单金额动态分配：
- `< ¥10,000` → SALES_MANAGER
- `¥10,000 - ¥100,000` → FINANCE
- `> ¥100,000` 或 VIP客户 → DIRECTOR

---

### 4. ADMIN（全能）

**适用角色**：
- `ADMIN` - 系统管理员

**权限范围**：
- ✅ 所有 VIEW 权限
- ✅ 所有 EDIT 权限
- ✅ 所有 APPROVE 权限（可审批任何级别）
- ✅ 特权：强制覆盖（Override）
- ✅ 特权：取消流程
- ✅ 特权：删除SO

---

## 权限判定逻辑

### 前端判定流程

```typescript
function determinePermission(
  currentUser: User,
  currentTask: Task
): 'VIEW' | 'EDIT' | 'APPROVE' {
  
  // 1. ADMIN 拥有所有权限
  if (currentUser.role === 'ADMIN') {
    return 'APPROVE'; // 或根据当前场景返回最合适权限
  }
  
  // 2. 检查是否是当前任务的审批人
  if (currentTask.assignee === currentUser.id) {
    return 'APPROVE';
  }
  
  // 3. 检查是否是SO的创建者且任务在创建阶段
  if (currentUser.role === 'SALES_REP' && 
      currentTask.taskType === 'CREATION') {
    return 'EDIT';
  }
  
  // 4. 默认只读
  return 'VIEW';
}
```

### 表单字段权限映射

每个表单字段都有 `permission` 属性定义：

```json
{
  "properties": {
    "permission": {
      "VIEW":   { "visible": true,  "readonly": true },
      "EDIT":   { "visible": true,  "readonly": false },
      "APPROVE": { "visible": true,  "readonly": true }
    }
  }
}
```

**特殊字段示例**：

| 字段 | VIEW | EDIT | APPROVE |
|------|------|------|---------|
| `customerId` | visible, readonly | visible, editable | visible, readonly |
| `totalAmount` | visible, readonly | visible, readonly | visible, readonly |
| `approvalDecision` | hidden | hidden | visible, editable |
| `approvalComment` | hidden | hidden | visible, editable |
| `submitBtn` | hidden | visible | visible (APPROVE时) |

---

## 数据库设计

### Users 表

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,        -- 角色: SALES_REP, SALES_MANAGER, FINANCE, DIRECTOR, ADMIN, CUSTOMER_SERVICE
  permissions TEXT,                 -- JSON数组: ["SO_VIEW", "SO_CREATE", "SO_APPROVE_LEVEL_1", ...]
  ...
);
```

### 权限常量定义

```typescript
// 权限常量
export const PERMISSIONS = {
  // VIEW
  SO_VIEW: 'SO_VIEW',
  
  // EDIT
  SO_CREATE: 'SO_CREATE',
  SO_EDIT: 'SO_EDIT',
  SO_SUBMIT: 'SO_SUBMIT',
  
  // APPROVE
  SO_APPROVE_LEVEL_1: 'SO_APPROVE_LEVEL_1',  // 销售经理
  SO_APPROVE_LEVEL_2: 'SO_APPROVE_LEVEL_2',  // 财务
  SO_APPROVE_LEVEL_3: 'SO_APPROVE_LEVEL_3',  // 总监
  SO_APPROVE_ALL: 'SO_APPROVE_ALL',          // 所有级别
  SO_ROLLBACK: 'SO_ROLLBACK',
  
  // OVERRIDE
  SO_OVERRIDE: 'SO_OVERRIDE',
  SO_CANCEL: 'SO_CANCEL',
  SO_DELETE: 'SO_DELETE',
  
  // 其他
  PRICE_VIEW: 'PRICE_VIEW',
  STRATEGIC_ACCOUNT: 'STRATEGIC_ACCOUNT',
  PROCESS_CANCEL: 'PROCESS_CANCEL',
} as const;

// 角色权限映射
export const ROLE_PERMISSIONS = {
  CUSTOMER_SERVICE: [PERMISSIONS.SO_VIEW],
  
  SALES_REP: [PERMISSIONS.SO_VIEW, PERMISSIONS.SO_CREATE, 
              PERMISSIONS.SO_EDIT, PERMISSIONS.SO_SUBMIT],
  
  SALES_MANAGER: [PERMISSIONS.SO_VIEW, PERMISSIONS.SO_APPROVE_LEVEL_1, 
                  PERMISSIONS.SO_ROLLBACK],
  
  FINANCE: [PERMISSIONS.SO_VIEW, PERMISSIONS.SO_APPROVE_LEVEL_2, 
            PERMISSIONS.SO_ROLLBACK, PERMISSIONS.PRICE_VIEW],
  
  DIRECTOR: [PERMISSIONS.SO_VIEW, PERMISSIONS.SO_APPROVE_LEVEL_3, 
             PERMISSIONS.SO_ROLLBACK, PERMISSIONS.SO_OVERRIDE, 
             PERMISSIONS.STRATEGIC_ACCOUNT],
  
  ADMIN: [PERMISSIONS.SO_VIEW, PERMISSIONS.SO_CREATE, 
          PERMISSIONS.SO_EDIT, PERMISSIONS.SO_APPROVE_ALL, 
          PERMISSIONS.SO_OVERRIDE, PERMISSIONS.SO_CANCEL, 
          PERMISSIONS.SO_DELETE, PERMISSIONS.PROCESS_CANCEL],
};
```

---

## 表单文件权限配置

所有 Camunda 表单文件都包含权限配置：

### 示例：`order-validation.form`

```json
{
  "properties": {
    "taskType": "USER_TASK",
    "assigneeSource": "DMN",
    "supportedPermissions": ["VIEW", "EDIT", "APPROVE"]
  }
}
```

### 示例：字段级权限

```json
{
  "label": "验证结果",
  "type": "radio",
  "key": "validationResult",
  "properties": {
    "permission": {
      "VIEW": { "visible": false, "readonly": true },
      "EDIT": { "visible": false, "readonly": true },
      "APPROVE": { "visible": true, "readonly": false }
    }
  }
}
```

---

## 前端渲染逻辑

### 1. 获取表单Schema

```typescript
async function loadFormWithPermission(taskId: string, user: User) {
  // 1. 获取表单定义
  const formSchema = await camundaApi.getFormSchema(taskId);
  
  // 2. 判定权限级别
  const permissionLevel = determinePermission(user, taskId);
  
  // 3. 应用权限过滤
  const filteredSchema = applyPermission(formSchema, permissionLevel);
  
  return filteredSchema;
}
```

### 2. 应用权限过滤

```typescript
function applyPermission(schema: FormSchema, permission: PermissionLevel): FormSchema {
  const filteredComponents = schema.components.map(component => {
    const fieldPermission = component.properties?.permission?.[permission];
    
    if (!fieldPermission) {
      return component; // 默认保持原样
    }
    
    // 应用权限设置
    return {
      ...component,
      readonly: fieldPermission.readonly,
      // 如果 hidden，从组件列表中移除
      ...(fieldPermission.visible === false && { _hidden: true }),
    };
  }).filter(c => !c._hidden);
  
  return {
    ...schema,
    components: filteredComponents,
  };
}
```

---

## 界面差异化设计

### 桌面端

| 权限 | 界面元素 |
|------|---------|
| VIEW | 左侧SO信息 + 右侧历史，无操作区 |
| EDIT | 左侧SO信息 + 中间编辑表单 + 提交按钮 |
| APPROVE | 左侧SO信息（只读）+ 中间审批表单 + 决策选项 |

### 移动端

| 权限 | 界面元素 |
|------|---------|
| VIEW | 折叠式信息展示，底部无操作按钮 |
| EDIT | 可编辑字段，底部[保存][提交]按钮 |
| APPROVE | 只读信息，底部[同意][拒绝][回退]按钮 |

---

## 回退机制权限

**谁能回退？**
- 当前审批人（APPROVE权限）
- ADMIN

**回退规则**：
- 只能回退到**上一步**（紧邻的前一个UserTask）
- 回退产生新的历史记录
- 原审批记录保留（标记为"已回退"）

---

## 相关文档

- `FRONTEND_DESIGN.md` - 前端整体设计
- `BPMND.md` - BPMN开发经验
- `DATABASE.md` - 数据库设计

---

*版本：v1.0*
*更新日期：2026-02-18*
