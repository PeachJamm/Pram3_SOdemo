# PRAM3 ERP Core - Sales Order Approval Demo

## 项目概述

PRAM3是一个采用微服务架构的ERP系统核心，本项目以**销售订单审批流程**作为demo来展示系统架构设计。

## 核心特性

### 1. 微服务架构 - Domain Driven Design
- **Sales Domain** (销售域) - 独立的业务领域
- **Orchestration Layer** (编排层) - 跨域聚合服务
- **API Layer** (API层) - RESTful接口暴露

### 2. Camunda工作流集成
- **人工审批流程** - 通过Camunda管理用户任务
- **自动处理流程** - 无需人工的流程由编排层直接处理
- **动态表单渲染** - 根据Camunda UserTask自动渲染对应表单

### 3. 前端动态表单系统
- 基于表单模式(schema)动态渲染
- 支持条件显示规则
- 可配置的验证规则

## 项目结构

```
pram3-so-demo/
├── src/
│   ├── domains/
│   │   └── sales/
│   │       ├── models/
│   │       │   └── sales-order.types.ts    # 销售订单类型定义
│   │       └── services/
│   │           └── sales-order.service.ts   # 销售订单领域服务
│   ├── orchestration/
│   │   └── order-orchestration.service.ts  # 订单编排服务
│   ├── api/
│   │   └── controllers/
│   │       └── sales-order.controller.ts   # API控制器
│   ├── camunda/
│   │   └── workflows/
│   │       └── sales-order-approval.bpmn  # BPMN工作流定义
│   ├── frontend/
│   │   └── dynamic-forms/
│   │       ├── form-schemas.ts             # 动态表单模式
│   │       └── form-renderer.ts            # 表单渲染引擎
│   ├── utils/
│   │   └── logger.ts                       # 日志工具
│   ├── types/
│   │   └── global.d.ts                     # 全局类型声明
│   └── index.ts                            # 应用入口
├── package.json
├── tsconfig.json
└── README.md
```

## API接口

### 销售订单管理

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/orders` | 创建销售订单 |
| GET | `/api/v1/orders` | 查询订单列表 |
| GET | `/api/v1/orders/:id` | 获取订单详情 |
| POST | `/api/v1/orders/:id/submit` | 提交审批 |
| POST | `/api/v1/orders/:id/approve` | 处理审批 |
| POST | `/api/v1/orders/:id/cancel` | 取消订单 |
| GET | `/api/v1/orders/:id/history` | 获取审批历史 |

### Camunda集成

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/camunda/external-task/:taskId/complete` | 完成外部任务 |
| GET | `/api/camunda/tasks/:processInstanceId` | 获取活动任务 |

### 动态表单

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/forms/:formKey/render` | 渲染动态表单 |

## 审批流程

### 流程说明

1. **订单创建** → 用户创建销售订单（草稿状态）
2. **提交审批** → 订单提交至Camunda工作流
3. **自动分流** → 根据金额确定审批级别：
   - < 10,000: 仅部门经理审批
   - 10,000-100,000: 部门经理 + 总监审批
   - ≥ 100,000: 三级审批（部门经理 → 总监 → VP）
4. **审批处理** → 审批人通过前端动态表单处理
5. **自动流程** → 审批通过后自动触发：
   - 财务处理
   - 库存预留
   - 客户通知

### 审批级别

| 级别 | 角色 | 金额范围 |
|------|------|----------|
| Level 1 | 部门经理 | < 10,000 |
| Level 2 | 总监 | 10,000 - 100,000 |
| Level 3 | VP/总经理 | ≥ 100,000 |

## Camunda集成

### 工作流定义

工作流定义文件: [`src/camunda/workflows/sales-order-approval.bpmn`](src/camunda/workflows/sales-order-approval.bpmn)

### 流程节点

| 节点类型 | 节点ID | 描述 |
|----------|--------|------|
| UserTask | UserTask_DeptManager | 部门经理审批 |
| UserTask | UserTask_Director | 总监审批 |
| UserTask | UserTask_VP | VP/总经理审批 |
| ServiceTask | ServiceTask_Finance | 财务处理（自动） |
| ServiceTask | ServiceTask_Inventory | 库存预留（自动） |
| ServiceTask | ServiceTask_Notification | 客户通知（自动） |

## 动态表单

### 表单配置

| 表单Key | 描述 |
|---------|------|
| `dept-manager-approval-form` | 部门经理审批表单 |
| `director-approval-form` | 总监审批表单 |
| `vp-approval-form` | VP/总经理审批表单 |

### 表单字段类型

- `text` - 文本输入
- `textarea` - 多行文本
- `number` - 数字输入
- `enum` - 下拉选择
- `date` - 日期选择
- `boolean` - 布尔选择
- `table` - 表格展示

## 快速开始

### 安装依赖

```bash
npm install
```

### 编译项目

```bash
npm run build
```

### 启动服务

```bash
npm start
```

### 开发模式

```bash
npm run dev
```

## 使用示例

### 1. 创建订单

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user001" \
  -d '{
    "customerId": "cust001",
    "items": [
      {
        "productId": "prod001",
        "productName": "产品A",
        "quantity": 10,
        "unitPrice": 100,
        "discount": 0,
        "tax": 13
      }
    ],
    "shippingAddress": "北京市朝阳区",
    "billingAddress": "北京市朝阳区"
  }'
```

### 2. 提交审批

```bash
curl -X POST http://localhost:3000/api/v1/orders/{orderId}/submit \
  -H "X-User-Id: user001"
```

### 3. 处理审批

```bash
curl -X POST http://localhost:3000/api/v1/orders/{orderId}/approve \
  -H "Content-Type: application/json" \
  -d '{
    "action": "APPROVE",
    "comment": "审批通过",
    "approvalLevel": "LEVEL_1"
  }'
```

### 4. 渲染审批表单

```bash
curl http://localhost:3000/api/forms/dept-manager-approval-form/render?orderId={orderId}
```

## 技术栈

- **语言**: TypeScript
- **运行时**: Node.js
- **框架**: Express.js
- **工作流引擎**: Camunda
- **前端**: 动态表单渲染

## 架构设计原则

1. **领域驱动设计** - 清晰的域边界
2. **松耦合** - 域服务独立，编排层协调
3. **可扩展** - 易于添加新的业务域
4. **前后端分离** - API与动态表单渲染分离

## SO SPA 审批生命周期

SO SPA是一个完整的销售订单审批生命周期单页应用组件。

### 组件功能

| 功能 | 描述 |
|------|------|
| **顶部状态栏** | 显示SO ID、状态、Active/Inactive切换 |
| **进度条** | 可视化流程进度 |
| **节点形状** | 圆形(自定义表单)、方形(主表单)、菱形(审批/逻辑判断) |
| **节点颜色** | 灰色(待执行)、橙色(进行中)、绿色(已完成)、红色(失败) |
| **回退功能** | 可回退到上一个节点重新编辑 |
| **Override** | 管理员可强制Override流程 |
| **评论功能** | 记录审批过程中的评论 |
| **Save/Submit** | 保存草稿或提交下一步 |

### 节点类型

| 类型 | 形状 | 描述 |
|------|------|------|
| CUSTOM_FORM | 圆形 📝 | 自定义表单 |
| MAIN_FORM | 方形 📋 | 主表单 |
| APPROVAL | 菱形 ✓ | 审批节点 |
| LOGIC_GATE | 菱形 ◇ | 逻辑判断 |

### 审批流程节点

1. **创建订单** - MAIN_FORM (方形)
2. **订单审核** - CUSTOM_FORM (圆形)
3. **部门经理审批** - APPROVAL (菱形) - <10,000
4. **总监审批** - APPROVAL (菱形) - 10,000-100,000
5. **VP审批** - APPROVAL (菱形) - ≥100,000
6. **财务处理** - CUSTOM_FORM (圆形) - 自动
7. **库存预留** - CUSTOM_FORM (圆形) - 自动
8. **客户通知** - CUSTOM_FORM (圆形) - 自动
9. **订单完成** - MAIN_FORM (方形)

### 组件使用

```typescript
import { SOSPAComponent } from './src/frontend/spa/so-spa.component';

// 创建SPA组件
const spa = new SOSPAComponent(salesOrder, {
  onSave: (data) => {
    console.log('保存数据:', data);
  },
  onSubmit: (data) => {
    console.log('提交数据:', data);
    // 验证并跳转到下一步
  },
  onRollback: (nodeId) => {
    console.log('回退到节点:', nodeId);
  },
  onOverride: (reason) => {
    console.log('Override原因:', reason);
  },
});

// 渲染HTML
const html = spa.render();
document.getElementById('so-spa-container').innerHTML = html;
```

### 组件文件

- [`src/frontend/spa/so-spa.component.ts`](src/frontend/spa/so-spa.component.ts) - SO SPA组件实现

## 启动 Camunda 工作流引擎

### 方式 1：自动下载并启动（推荐）

```bash
npm run camunda:start
```

### 方式 2：手动下载后启动

1. **下载 Camunda Run**
   - 访问: https://github.com/camunda/camunda-bpm-platform/releases/tag/7.21.0
   - 下载: `camunda-bpm-run-7.21.0.zip`

2. **解压到项目目录**
   ```
   Pram3_SOdemo/
   ├── camunda-run/          <-- 解压到这里
   │   ├── start.bat
   │   └── ...
   ```

3. **双击启动**
   ```
   start-camunda.bat
   ```

### 访问 Camunda

- **Web 界面**: http://localhost:8080/camunda/app/
- **REST API**: http://localhost:8080/engine-rest
- **默认账号**: demo / demo

### 常用命令

```bash
npm run camunda:start     # 启动 Camunda（自动下载）
npm run camunda:stop      # 停止 Camunda
npm run deploy:bpmn       # 部署 BPMN 流程
```

## License

MIT
