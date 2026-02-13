# 销售订单审批流程 - 测试数据文档

## 测试环境

- **Camunda URL**: http://localhost:8080/camunda/app/
- **账号**: demo / demo
- **测试流程**: sales-order-process

---

## 测试场景总览

| 场景 | 订单金额 | 客户级别 | 期望审批人 | DMN折扣率 |
|------|----------|----------|-----------|-----------|
| TC01 | 5,000 | STANDARD | 销售经理 | 0% |
| TC02 | 15,000 | GOLD | 财务 | 5% |
| TC03 | 60,000 | ENTERPRISE | 总监 | 10% |
| TC04 | 120,000 | VIP | 总监 | 15% |
| TC05 | 8,000 | VIP | 总监 | 15% |
| TC06 | 50,000 | STANDARD(老客) | 财务 | 3% |

---

## 详细测试用例

### TC01: 小额标准订单

**基本信息**
```json
{
  "orderNumber": "SO-2024-001",
  "customerId": "CUST-STD-001",
  "customerName": "标准客户A",
  "customerTier": "STANDARD",
  "customerType": "STANDARD",
  "orderHistoryCount": 2,
  "amount": 5000,
  "items": [
    {
      "productId": "PROD-001",
      "productName": "办公椅",
      "quantity": 5,
      "unitPrice": 800,
      "total": 4000
    },
    {
      "productId": "PROD-002", 
      "productName": "办公桌",
      "quantity": 1,
      "unitPrice": 1000,
      "total": 1000
    }
  ],
  "shippingAddress": "北京市朝阳区建国路88号",
  "billingAddress": "北京市朝阳区建国路88号"
}
```

**期望结果**
- DMN审批级别: `SALES_MANAGER`
- DMN折扣率: `0%`
- 折扣金额: `0`
- 实际应付: `5000`
- 审批节点: 销售经理审批

**测试步骤**
1. 启动流程，输入以上数据
2. 验证第一个UserTask是"订单验证"
3. 完成订单验证后，系统自动执行两个DMN决策
4. 验证第二个UserTask是"销售经理审批"
5. 检查流程变量 `approvalDecision.approvalLevel` = "SALES_MANAGER"
6. 检查流程变量 `discountDecision.discountRate` = 0.0

---

### TC02: 中额金牌客户订单

**基本信息**
```json
{
  "orderNumber": "SO-2024-002",
  "customerId": "CUST-GOLD-001",
  "customerName": "金牌客户B",
  "customerTier": "GOLD",
  "customerType": "GOLD",
  "orderHistoryCount": 8,
  "amount": 15000,
  "items": [
    {
      "productId": "PROD-010",
      "productName": "服务器",
      "quantity": 2,
      "unitPrice": 7500,
      "total": 15000
    }
  ],
  "shippingAddress": "上海市浦东新区陆家嘴环路1000号",
  "billingAddress": "上海市浦东新区陆家嘴环路1000号"
}
```

**期望结果**
- DMN审批级别: `FINANCE`
- DMN折扣率: `5%`
- 折扣金额: `750`
- 实际应付: `14250`
- 审批节点: 财务审批

**测试步骤**
1. 启动流程
2. 完成"订单验证"
3. 验证流转到"财务审批"节点
4. 检查变量 `approvalDecision.assignee` = "finance"
5. 在财务审批表单中验证折扣信息已自动计算

---

### TC03: 大额企业客户订单

**基本信息**
```json
{
  "orderNumber": "SO-2024-003",
  "customerId": "CUST-ENT-001",
  "customerName": "企业客户C",
  "customerTier": "ENTERPRISE",
  "customerType": "ENTERPRISE",
  "orderHistoryCount": 12,
  "amount": 60000,
  "items": [
    {
      "productId": "PROD-100",
      "productName": "ERP系统许可证",
      "quantity": 10,
      "unitPrice": 6000,
      "total": 60000
    }
  ],
  "shippingAddress": "深圳市南山区科技园南区",
  "billingAddress": "深圳市南山区科技园南区"
}
```

**期望结果**
- DMN审批级别: `DIRECTOR`
- DMN折扣率: `10%`
- 折扣金额: `6000`
- 实际应付: `54000`
- 审批节点: 总监审批

**测试步骤**
1. 启动流程
2. 完成"订单验证"
3. 验证流转到"总监审批"节点
4. 检查 `approvalDecision.approvalLevel` = "DIRECTOR"
5. 在总监审批表单中验证可调整折扣

---

### TC04: 超大额VIP客户订单

**基本信息**
```json
{
  "orderNumber": "SO-2024-004",
  "customerId": "CUST-VIP-001",
  "customerName": "VIP客户D",
  "customerTier": "VIP",
  "customerType": "VIP",
  "orderHistoryCount": 25,
  "amount": 120000,
  "items": [
    {
      "productId": "PROD-500",
      "productName": "定制解决方案",
      "quantity": 1,
      "unitPrice": 120000,
      "total": 120000
    }
  ],
  "shippingAddress": "杭州市西湖区文三路",
  "billingAddress": "杭州市西湖区文三路"
}
```

**期望结果**
- DMN审批级别: `DIRECTOR` (金额>5万)
- DMN折扣率: `15%` (VIP客户)
- 折扣金额: `18000`
- 实际应付: `102000`
- 审批节点: 总监审批

**关键验证点**
- VIP客户即使订单金额>5万，也需要总监审批
- 享受最高15%折扣率

---

### TC05: VIP客户小额订单（特殊场景）

**基本信息**
```json
{
  "orderNumber": "SO-2024-005",
  "customerId": "CUST-VIP-002",
  "customerName": "VIP客户E",
  "customerTier": "VIP",
  "customerType": "VIP",
  "orderHistoryCount": 30,
  "amount": 8000,
  "items": [
    {
      "productId": "PROD-050",
      "productName": "配件包",
      "quantity": 10,
      "unitPrice": 800,
      "total": 8000
    }
  ],
  "shippingAddress": "广州市天河区珠江新城",
  "billingAddress": "广州市天河区珠江新城"
}
```

**期望结果**
- DMN审批级别: `DIRECTOR` (VIP客户强制总监审批)
- DMN折扣率: `15%`
- 折扣金额: `1200`
- 实际应付: `6800`
- 审批节点: 总监审批

**关键验证点**
- 即使金额<1万，VIP客户也需要总监审批
- 验证DMN中客户级别的优先级高于金额

---

### TC06: 标准客户大额老客订单（边缘场景）

**基本信息**
```json
{
  "orderNumber": "SO-2024-006",
  "customerId": "CUST-STD-OLD",
  "customerName": "老客户F",
  "customerTier": "STANDARD",
  "customerType": "STANDARD",
  "orderHistoryCount": 8,
  "amount": 50000,
  "items": [
    {
      "productId": "PROD-200",
      "productName": "批量采购-办公设备",
      "quantity": 50,
      "unitPrice": 1000,
      "total": 50000
    }
  ],
  "shippingAddress": "成都市高新区天府大道",
  "billingAddress": "成都市高新区天府大道"
}
```

**期望结果**
- DMN审批级别: `FINANCE` (金额5万属于中额)
- DMN折扣率: `3%` (标准客户+大额+老客)
- 折扣金额: `1500`
- 实际应付: `48500`
- 审批节点: 财务审批

**关键验证点**
- 标准客户大额订单走财务审批（不是总监）
- 历史订单数>5，享受3%小额折扣

---

## 测试执行检查清单

### 启动流程前准备
- [ ] Camunda引擎已启动
- [ ] BPMN流程已部署
- [ ] DMN决策表已部署
- [ ] 表单已部署

### 通用验证项
- [ ] 流程实例成功创建
- [ ] 第一个UserTask是"订单验证"
- [ ] DMN决策自动执行（无人工干预）
- [ ] 流程变量正确设置
- [ ] 路由到正确的审批节点
- [ ] 审批表单正确显示折扣信息
- [ ] 审批通过后进入自动处理节点
- [ ] 库存预留和通知任务自动完成
- [ ] 流程正常结束

### DMN决策验证
- [ ] approval-level.dmn 返回正确的审批级别
- [ ] approval-level.dmn 返回正确的审批人
- [ ] discount-calculation.dmn 返回正确的折扣率
- [ ] discount-calculation.dmn 返回正确的折扣金额

### 异常场景（可选）
- [ ] 审批拒绝场景
- [ ] 变量缺失场景
- [ ] 并发流程场景

---

## 快速启动测试命令

```bash
# 1. 确保Camunda运行中
curl http://localhost:8080/engine-rest/engine

# 2. 部署流程（如需要）
# 通过Camunda Modeler或REST API部署

# 3. 启动测试流程实例
curl -X POST http://localhost:8080/engine-rest/process-definition/key/sales-order-process/start \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "orderNumber": {"value": "SO-TEST-001", "type": "string"},
      "customerName": {"value": "测试客户", "type": "string"},
      "customerTier": {"value": "GOLD", "type": "string"},
      "customerType": {"value": "GOLD", "type": "string"},
      "orderHistoryCount": {"value": 5, "type": "integer"},
      "amount": {"value": 15000, "type": "double"}
    }
  }'

# 4. 查询待办任务
curl http://localhost:8080/engine-rest/task?processDefinitionKey=sales-order-process

# 5. 完成任务
curl -X POST http://localhost:8080/engine-rest/task/{taskId}/complete \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "approved": {"value": true, "type": "boolean"},
      "approvalComment": {"value": "审批通过", "type": "string"}
    }
  }'
```

---

## 问题记录模板

| 测试用例 | 问题描述 | 截图/日志 | 严重程度 | 状态 |
|---------|---------|----------|---------|------|
| TC01 | | | | |
| TC02 | | | | |
| TC03 | | | | |
| TC04 | | | | |
| TC05 | | | | |
| TC06 | | | | |
