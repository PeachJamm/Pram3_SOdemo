# Camunda 8.8 迁移说明

## 主要变更点

### 1. BPMN 命名空间变更

| 元素 | Camunda 7 | Camunda 8.8 |
|------|-----------|-------------|
| 命名空间 | `http://camunda.org/schema/1.0/bpmn` | `http://camunda.org/schema/zeebe/1.0` |
| User Task | `camunda:formKey` | `zeebe:formDefinition` |
| Service Task | `camunda:type` | `zeebe:taskDefinition` |
| 审批人 | `camunda:assignee` | `zeebe:assignmentDefinition` |

### 2. User Task 变更示例

**Camunda 7:**
```xml
<bpmn:userTask camunda:formKey="camunda-forms:deployment:form-key">
```

**Camunda 8.8:**
```xml
<bpmn:userTask>
  <bpmn:extensionElements>
    <zeebe:formDefinition formKey="form-key" />
    <zeebe:userTask />
    <zeebe:assignmentDefinition assignee="user-id" />
  </bpmn:extensionElements>
</bpmn:userTask>
```

### 3. Service Task (Job Worker) 变更

**Camunda 7:**
```xml
<bpmn:serviceTask camunda:type="external" camunda:topic="topic-name">
```

**Camunda 8.8:**
```xml
<bpmn:serviceTask>
  <bpmn:extensionElements>
    <zeebe:taskDefinition type="topic-name" retries="3" />
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

### 4. Business Rule Task (DMN) 变更

**Camunda 7:**
```xml
<bpmn:businessRuleTask camunda:decisionRef="decision-id">
```

**Camunda 8.8:**
```xml
<bpmn:businessRuleTask>
  <bpmn:extensionElements>
    <zeebe:taskDefinition type="io.camunda.zeebe:dmn" retries="3" />
    <zeebe:taskHeaders>
      <zeebe:header key="decisionId" value="decision-id" />
    </zeebe:taskHeaders>
  </bpmn:extensionElements>
</bpmn:businessRuleTask>
```

### 5. 条件表达式变更

**Camunda 7:**
```xml
<bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
  ${variable == 'value'}
</bpmn:conditionExpression>
```

**Camunda 8.8:**
```xml
<bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
  = variable = "value"
</bpmn:conditionExpression>
```

注意：
- 使用 `=` 开头表示表达式
- 字符串用双引号 `"`
- 相等比较用单个 `=`

### 6. Form 格式变更

**Camunda 7:**
```json
{
  "id": "form-id",
  "type": "default",
  "components": [...]
}
```

**Camunda 8.8:**
```json
{
  "$schema": "https://unpkg.com/@camunda/zeebe-element-templates-json-schema/resources/schema.json",
  "id": "form-id",
  "name": "Form Name",
  "type": "default",
  "executionPlatform": "Camunda",
  "executionPlatformVersion": "8.8.0",
  "components": [...]
}
```

### 7. DMN 命名空间变更

**Camunda 7:**
```xml
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/">
```

**Camunda 8.8:**
```xml
<definitions xmlns="https://www.omg.org/spec/DMN/20230324/MODEL/">
```

数据类型也有变化：
- `double` → `number`
- `integer` → `number`

---

## 文件清单（已更新）

### BPMN
- `src/camunda/workflows/sales-order-approval.bpmn` ✅

### DMN
- `src/camunda/dmn/select-approval-level.dmn` ✅
- `src/camunda/dmn/calculate-discount.dmn` ✅
- `src/camunda/dmn/select-price-list.dmn` ✅

### Forms
- `src/camunda/forms/order-validation.form` ✅
- `src/camunda/forms/sales-manager-approval.form` ✅
- `src/camunda/forms/finance-approval.form` ✅
- `src/camunda/forms/director-approval.form` ✅

---

## 部署命令

```bash
# 部署 BPMN
curl -X POST http://localhost:8080/v2/process-definitions \
  -H "Content-Type: multipart/form-data" \
  -F "processDefinition=@sales-order-approval.bpmn"

# 部署 DMN
curl -X POST http://localhost:8080/v2/decision-definitions \
  -H "Content-Type: multipart/form-data" \
  -F "decisionDefinition=@select-approval-level.dmn"

# 部署 Form
curl -X POST http://localhost:8080/v2/forms \
  -H "Content-Type: multipart/form-data" \
  -F "form=@order-validation.form"
```

---

## 测试验证

1. 在 Camunda Modeler 中打开 BPMN 文件
2. 确保没有错误提示
3. 部署到 Camunda 8.8 运行
4. 启动流程实例测试
