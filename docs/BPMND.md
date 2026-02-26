# Camunda 8 BPMN 开发经验总结

## 概述

本文档记录 PRAM3 ERP 销售订单审批流程在 Camunda 8 开发过程中遇到的问题及解决方案。

---

## 1. 表单部署问题

### 问题现象
```
Expected to find a form with id 'order-validation', 
but no form with this id is found
```

### 原因分析
`deploy-to-camunda.ts` 中的 `deployForms()` 方法仅验证表单文件格式，**没有真正部署到 Camunda 8**。

```typescript
// 错误代码 - 只是读取文件，没有部署
private async deployForms(): Promise<void> {
  for (const file of formFiles) {
    const formContent = fs.readFileSync(formPath, 'utf-8');
    const formJson = JSON.parse(formContent);
    // 这里只是打印信息，没有部署！
  }
  console.log(`共 ${formFiles.length} 个表单文件已验证`);
}
```

### 解决方案
使用 `zeebe-node` 的 `deployResource` 方法真正部署表单：

```typescript
private async deployForms(): Promise<void> {
  const { ZBClient } = require('zeebe-node');
  
  for (const file of formFiles) {
    const formPath = path.join(formsDir, file);
    const zbc = new ZBClient('localhost:26500', { useTLS: false });
    
    const result = await zbc.deployResource({
      processFilename: formPath,
    });
    
    console.log(`✅ ${file} 部署成功`);
    console.log(`   - Form Key: ${result.deployments[0]?.form?.formId}`);
    console.log(`   - Version: ${result.deployments[0]?.form?.version}`);
    
    await zbc.close();
  }
}
```

### 关键教训
- **验证 ≠ 部署**：读取并验证文件格式不代表资源已部署到服务器
- 部署后检查 Camunda Operate 或 Tasklist 确认资源是否存在

---

## 2. 排他网关条件判断失败

### 问题现象
```
Expected at least one condition to evaluate to true, 
or to have a default flow
```

### 原因分析
排他网关（Exclusive Gateway）的所有条件表达式都返回 `false`，且没有设置默认流程。

例如 `gateway-approval-result` 网关：
```xml
<bpmn:exclusiveGateway id="gateway-approval-result" name="审批结果">
  <bpmn:outgoing>flow-approved</bpmn:outgoing>
  <bpmn:outgoing>flow-rejected</bpmn:outgoing>
</bpmn:exclusiveGateway>

<bpmn:sequenceFlow id="flow-approved" sourceRef="gateway-approval-result" targetRef="gateway-auto-processing">
  <bpmn:conditionExpression>= approved = true</bpmn:conditionExpression>
</bpmn:sequenceFlow>

<bpmn:sequenceFlow id="flow-rejected" sourceRef="gateway-approval-result" targetRef="end-rejected">
  <bpmn:conditionExpression>= approved = false</bpmn:conditionExpression>
</bpmn:sequenceFlow>
```

当 `approved` 变量为 `null` 或 `undefined` 时，两个条件都不满足。

### 解决方案

#### 方案 A：添加默认流程（推荐）
为网关设置 `default` 属性：

```xml
<bpmn:exclusiveGateway id="gateway-approval-result" 
                       name="审批结果" 
                       default="flow-rejected">
```

当所有条件都不满足时，流程走向默认路径。

#### 方案 B：确保变量总是被赋值
在 UserTask 表单中强制要求提交判断变量。

### 关键教训
- 排他网关必须有**至少一个条件为 true** 或**有默认流程**
- 考虑边界情况：变量未定义、null、类型不匹配
- 对于审批类流程，建议设置默认走向拒绝/安全路径

---

## 3. 变量命名冲突

### 问题现象
流程变量被意外覆盖，导致后续条件判断失败。

原始变量结构：
```json
{
  // DMN 返回的对象
  "approvalDecision": {
    "approvalLevel": "DIRECTOR",
    "assignee": "director01"
  }
}
```

审批表单提交后：
```json
{
  // 被覆盖为字符串！
  "approvalDecision": "APPROVE"
}
```

### 原因分析
**变量名复用**：DMN 结果变量 `approvalDecision` 与表单提交的审批决定使用了同名变量。

BPMN 配置：
```xml
<zeebe:calledDecision 
  decisionId="select-approval-level" 
  resultVariable="approvalDecision" />
```

表单提交：
```json
{
  "approvalDecision": "APPROVE",  // 覆盖了 DMN 结果！
  "approvalComment": "同意"
}
```

### 解决方案

#### 推荐做法：职责分离
使用不同的变量名区分不同阶段的决策：

| 阶段 | 变量名 | 类型 | 值示例 |
|------|--------|------|--------|
| DMN 返回 | `approvalLevel` | string | `"DIRECTOR"` |
| 审批结果 | `approvalDecision` | string | `"APPROVE"` / `"REJECT"` |

BPMN 配置更新：
```xml
<!-- 调用 DMN -->
<zeebe:calledDecision 
  decisionId="select-approval-level" 
  resultVariable="approvalLevel" />

<!-- 网关条件 -->
<bpmn:conditionExpression>= approvalLevel = "DIRECTOR"</bpmn:conditionExpression>
<bpmn:conditionExpression>= approvalDecision = "APPROVE"</bpmn:conditionExpression>
```

DMN 简化为单输出：
```xml
<output id="Output_1" label="审批级别" name="approvalLevel" typeRef="string" />
```

### 关键教训
- **避免变量名复用**：不同阶段的决策使用不同的变量名
- **简化变量结构**：能用简单字符串就不用嵌套对象
- **明确变量职责**：每个变量有单一明确的用途

---

## 4. 变量类型匹配

### 问题现象
条件表达式始终返回 false，即使值看起来正确。

### 常见原因
1. **类型不匹配**：
   ```xml
   <!-- 错误：字符串比较但没有引号 -->
   <bpmn:conditionExpression>= approvalLevel = DIRECTOR</bpmn:conditionExpression>
   
   <!-- 正确：字符串需要引号 -->
   <bpmn:conditionExpression>= approvalLevel = "DIRECTOR"</bpmn:conditionExpression>
   ```

2. **大小写敏感**：
   ```
   "director" ≠ "DIRECTOR"
   ```

3. **空格问题**：
   ```
   "DIRECTOR " ≠ "DIRECTOR"
   ```

### 解决方案
- 确保条件表达式中的字符串值加引号
- 统一使用大写或小写（建议大写）
- 在表单中使用下拉选择（enum）而非文本输入

---

## 5. 部署版本管理

### 现象
修改 BPMN/DMN 后，流程行为没有变化。

### 原因
Camunda 8 使用 **Version Tag** 管理资源版本。如果部署时版本号没有递增，新实例可能仍在使用旧版本定义。

### 解决方案
每次修改后重新部署，Camunda 会自动递增版本：

```bash
npm run test:deploy
```

部署输出示例：
```
✅ 流程部署成功
   - Process Definition Key: 2251799813689190
   - Version: 4  ← 版本号递增
```

### 关键教训
- 修改 BPMN/DMN/表单后必须重新部署
- 已启动的流程实例继续使用其创建时的版本定义
- 新版本只影响新启动的流程实例

---

## 最佳实践总结

### 变量命名规范
```
DMN返回:      {决策名}Level      如 approvalLevel, discountLevel
审批结果:     {决策名}Decision   如 approvalDecision
审批意见:     {决策名}Comment    如 approvalComment
审批人:       {决策名}Assignee   如 approvalAssignee
```

### 网关设计原则
1. **排他网关必须有默认路径**，防止条件判断失败
2. **默认路径走向安全状态**（如拒绝、回退）
3. **条件表达式使用简单比较**，避免复杂逻辑

### 部署检查清单
- [ ] BPMN 流程已部署
- [ ] DMN 决策表已部署
- [ ] 表单已部署（使用 `deployResource`）
- [ ] 版本号已递增
- [ ] 条件表达式语法正确
- [ ] 变量名无冲突

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/camunda/workflows/sales-order-approval.bpmn` | 主流程定义 |
| `src/camunda/dmn/select-approval-level.dmn` | 审批级别决策表 |
| `src/camunda/forms/*.form` | 用户任务表单 |
| `src/test/deploy-to-camunda.ts` | 部署脚本 |

---

*最后更新：2026-02-18*
