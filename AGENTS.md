# PRAM3 ERP Core - AI Agent Guide

## 项目概述

PRAM3是一个采用微服务架构的ERP系统核心，本项目以**销售订单审批流程(Sales Order Approval)**作为Demo展示系统架构设计。项目实现了从订单创建、多级审批、到自动化处理的完整业务流程，集成了Camunda工作流引擎进行流程编排。

### 核心功能
- **销售订单管理**: 创建、查询、提交审批、取消订单
- **多级审批流程**: 根据金额自动分流 (<10K, 10K-100K, ≥100K)
- **动态表单渲染**: 基于权限级别的表单字段控制
- **Camunda工作流集成**: BPMN流程定义、DMN决策表

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 语言 | TypeScript | 5.1+ |
| 运行时 | Node.js | 20+ |
| 框架 | Express.js | 4.18+ |
| 数据库 | SQLite3 | 5.1+ |
| 工作流引擎 | Camunda / Zeebe | 8.3+ |
| 构建工具 | tsc / ts-node | - |

### 关键依赖
- `express`: REST API框架
- `sqlite3`: SQLite数据库驱动
- `zeebe-node`: Camunda 8客户端
- `uuid`: UUID生成
- `camunda-bpmn-moddle`: BPMN模型处理

---

## 项目结构

```
pram3-so-demo/
├── src/
│   ├── api/
│   │   └── controllers/
│   │       ├── sales-order.controller.ts    # 标准REST API控制器
│   │       └── so-controller.ts             # SO专用控制器(集成Camunda)
│   ├── camunda/
│   │   ├── dmn/                             # DMN决策表
│   │   │   ├── approval-level.dmn
│   │   │   ├── calculate-discount.dmn
│   │   │   ├── select-approval-level.dmn
│   │   │   └── select-price-list.dmn
│   │   ├── forms/                           # 表单定义
│   │   │   ├── director-approval.form
│   │   │   ├── finance-approval.form
│   │   │   ├── order-validation.form
│   │   │   └── sales-manager-approval.form
│   │   └── workflows/
│   │       └── sales-order-approval.bpmn    # BPMN流程定义
│   ├── database/
│   │   ├── connection.ts                    # 数据库连接管理
│   │   ├── init.ts                          # 数据库初始化
│   │   ├── repositories/                    # 数据访问层
│   │   │   ├── base.repository.ts
│   │   │   ├── customer.repository.ts
│   │   │   ├── product.repository.ts
│   │   │   └── user.repository.ts
│   │   ├── services/                        # 业务服务层
│   │   │   ├── customer.service.ts
│   │   │   ├── order.service.ts
│   │   │   └── product.service.ts
│   │   └── seeds/                           # 种子数据
│   │       ├── 01_users.sql
│   │       ├── 02_products.sql
│   │       ├── 03_price_lists.sql
│   │       └── 04_customers.sql
│   ├── domains/
│   │   └── sales/
│   │       ├── models/
│   │       │   └── sales-order.types.ts     # 领域模型类型
│   │       └── services/
│   │           └── sales-order.service.ts   # 领域服务
│   ├── frontend/
│   │   ├── dynamic-forms/                   # 动态表单系统
│   │   │   ├── dynamic-schema.service.ts
│   │   │   ├── form-renderer.ts
│   │   │   ├── form-schemas.ts
│   │   │   └── permission.types.ts          # 权限类型定义
│   │   └── spa/
│   │       └── so-spa.component.ts          # SO SPA组件
│   ├── orchestration/                       # 编排层
│   │   ├── camunda8-client.ts               # Camunda 8客户端
│   │   ├── camunda-integration.service.ts
│   │   └── order-orchestration.service.ts   # 订单编排服务
│   ├── test/                                # 测试脚本
│   │   ├── deploy-to-camunda.ts
│   │   ├── setup-camunda-users.ts
│   │   ├── test-full-process.ts
│   │   └── worker-db-test.ts
│   ├── types/
│   │   └── global.d.ts
│   ├── utils/
│   │   └── logger.ts
│   └── index.ts                             # 应用入口
├── docs/                                    # 详细文档
│   ├── ARCHITECTURE.md                      # 架构文档
│   ├── CAMUNDA8_MIGRATION.md               # Camunda 8迁移说明
│   ├── DATABASE.md                          # 数据库文档
│   ├── TEST_DATA.md
│   └── TEST_DATA_SUMMARY.md
├── dist/                                    # 编译输出
├── package.json
├── tsconfig.json
└── .env.example                             # 环境变量示例
```

---

## 架构设计

### 分层架构 (Domain Driven Design)

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端层 (Frontend)                        │
│                    SO SPA Component / 动态表单                   │
├─────────────────────────────────────────────────────────────────┤
│                          API Layer                               │
│              REST Controllers (Express Router)                   │
├─────────────────────────────────────────────────────────────────┤
│                      Orchestration Layer                         │
│    跨域聚合服务 / Camunda集成 / 动态Schema组装                   │
├─────────────────────────────────────────────────────────────────┤
│                        Domain Layer                              │
│              Sales Domain / 领域服务 / 领域模型                  │
├─────────────────────────────────────────────────────────────────┤
│                     Database Layer                               │
│         Repositories / Services / SQLite                        │
└─────────────────────────────────────────────────────────────────┘
```

### 数据流向

1. **创建订单**: 用户 → API → Orchestration → Domain Service → Database → 启动Camunda流程
2. **审批处理**: Camunda生成任务 → 前端获取Schema → 用户提交 → Orchestration → 更新订单状态
3. **自动化流程**: 审批通过 → Orchestration → 财务处理/库存预留/客户通知

---

## 构建和运行命令

### 安装依赖
```bash
npm install
```

### 编译项目
```bash
npm run build
```

### 开发模式启动
```bash
npm run dev
```

### 生产模式启动
```bash
npm run build
npm start
```

### 数据库初始化
```bash
npm run db:init       # 初始化数据库表结构
npm run db:seed       # 插入种子数据
```

### 测试命令
```bash
npm test              # 运行Jest测试
npm run test:worker   # 测试Worker DB集成
npm run test:deploy   # 部署BPMN到Camunda
npm run test:full     # 完整流程测试
```

---

## 配置说明

### 环境变量 (.env)

复制 `.env.example` 为 `.env`:

```bash
# Camunda 版本选择
CAMUNDA_VERSION=8       # Camunda 8 (推荐) 或 7

# Camunda 8 本地配置
ZEEBE_GATEWAY=localhost:26500
ZEEBE_PLAINTEXT=true
OPERATE_URL=http://localhost:8080
TASKLIST_URL=http://localhost:8081

# Camunda 8 SaaS配置 (可选)
# ZEEBE_ADDRESS=your-cluster.bru-2.zeebe.camunda.io:443
# ZEEBE_CLIENT_ID=your-client-id
# ZEEBE_CLIENT_SECRET=your-client-secret

# 应用配置
NODE_ENV=development
PORT=3001
```

### TypeScript配置 (tsconfig.json)

- **目标**: ES2020
- **模块**: CommonJS
- **严格模式**: 启用
- **输出目录**: `./dist`
- **源码目录**: `./src`
- **声明文件**: 生成 `.d.ts` 和 source map

---

## API端点

### 订单管理 API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/orders` | 创建销售订单 |
| GET | `/api/v1/orders` | 查询订单列表 |
| GET | `/api/v1/orders/:id` | 获取订单详情 |
| POST | `/api/v1/orders/:id/submit` | 提交审批 |
| POST | `/api/v1/orders/:id/approve` | 处理审批 |
| POST | `/api/v1/orders/:id/cancel` | 取消订单 |
| GET | `/api/v1/orders/:id/history` | 获取审批历史 |

### SO专用 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/orders/create-data` | 获取创建订单所需数据 |
| POST | `/api/v1/orders/create-and-start` | 创建订单并启动Camunda流程 |
| GET | `/api/v1/orders/:id/details` | 获取订单详情(含明细) |

### 动态表单 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/forms/:formKey/render` | 渲染动态表单 |

### Camunda集成 API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/camunda/external-task/:taskId/complete` | 完成外部任务 |
| GET | `/api/camunda/tasks/:processInstanceId` | 获取活动任务 |

### 静态页面

| 路径 | 描述 |
|------|------|
| `/so-create` | 创建SO页面 |
| `/so-list` | SO列表页面 |
| `/health` | 健康检查 |

---

## 代码风格指南

### TypeScript规范

1. **严格类型**: 启用 `strict: true`，避免使用 `any`
2. **接口命名**: PascalCase，前缀表示用途 (e.g., `CreateOrderRequest`, `SalesOrder`)
3. **枚举命名**: PascalCase，值使用UPPER_SNAKE_CASE
4. **类型文件**: 领域类型放在 `domains/{domain}/models/` 下

### 代码组织

```typescript
// 文件头部注释
// =====================================================
// PRAM3 ERP Core - 模块名称
// 中文描述
// =====================================================

// 导入顺序: 标准库 → 第三方 → 内部模块
import { Request, Response } from 'express';
import { orderService } from './services/order.service';

// 类名: PascalCase
export class OrderController {
  // 私有成员: 下划线前缀或private关键字
  private db: DatabaseConnection;
  
  // 方法名: camelCase
  async createOrder(req: Request, res: Response): Promise<void> {
    // 实现
  }
}

// 导出接口
export interface OrderResult {
  success: boolean;
  data?: Order;
  error?: string;
}
```

### 日志规范

```typescript
// 使用统一的日志格式
console.log(`[${new Date().toISOString()}] [模块名] 描述信息`);

// 示例
console.log(`[OrderOrchestration] 创建订单 - TraceId: ${traceId}`);
console.log(`[Camunda] 启动流程 - OrderId: ${order.id}`);
```

### 错误处理

```typescript
try {
  const result = await someAsyncOperation();
  return { success: true, data: result };
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : '操作失败',
    metadata: { timestamp: new Date(), traceId }
  };
}
```

---

## 测试策略

### 测试文件位置
- `src/test/`: 集成测试脚本
- 单元测试: 与源文件同目录，命名 `{filename}.test.ts`

### 测试类型

1. **单元测试**: 使用Jest测试独立函数和类
2. **集成测试**: 测试数据库服务、Camunda客户端集成
3. **端到端测试**: `test-full-process.ts` 测试完整业务流程

### 运行测试

```bash
# 单元测试
npm test

# Worker DB测试
npm run test:worker

# 完整流程测试
npm run test:full
```

---

## 数据库设计

### 核心表

| 表名 | 描述 |
|------|------|
| `users` | 用户表(含角色和权限) |
| `customers` | 客户表(含等级、关联价格表) |
| `products` | 产品表 |
| `price_lists` | 价格表 |
| `price_list_items` | 价格表明细 |
| `sales_orders` | 销售订单主表 |
| `sales_order_items` | 订单明细表 |
| `approval_history` | 审批历史 |

### Seed数据用户

| 用户名 | 角色 | 特殊权限 |
|--------|------|---------|
| sales01 | SALES | 普通销售 |
| admin01 | ADMIN | ORDER_OVERRIDE, PROCESS_CANCEL |
| salesmgr01 | SALES_MANAGER | APPROVE_LEVEL_1 |
| finance01 | FINANCE | APPROVE_LEVEL_2 |
| director01 | DIRECTOR | APPROVE_LEVEL_3 |

---

## Camunda集成

### BPMN流程节点

| 节点ID | 类型 | 描述 |
|--------|------|------|
| UserTask_SalesManager | UserTask | 销售经理审批 |
| UserTask_Finance | UserTask | 财务审批 |
| UserTask_Director | UserTask | 总监审批 |
| ServiceTask_Finance | ServiceTask | 财务处理(自动) |
| ServiceTask_Inventory | ServiceTask | 库存预留(自动) |
| ServiceTask_Notification | ServiceTask | 客户通知(自动) |

### 审批级别规则

| 金额范围 | 审批级别 |
|---------|---------|
| < ¥10,000 | 销售经理审批 |
| ¥10,000 - ¥100,000 | 财务审批 |
| > ¥100,000 或 VIP客户 | 总监审批 |

### DMN决策表

1. **select-approval-level.dmn**: 根据金额选择审批级别
2. **select-price-list.dmn**: 根据客户等级选择价格表
3. **calculate-discount.dmn**: 计算折扣率

---

## 动态表单系统

### 权限级别

| 级别 | 描述 | 字段权限 |
|------|------|---------|
| VIEW | 可见 | 全部只读 |
| EDIT | 可编辑 | 部分可编辑 |
| APPROVE | 可审批 | 审批字段可编辑，其他只读 |

### 字段权限动态设置

```typescript
// 后端根据权限设置readonly属性
const field: PermissionAwareField = {
  id: 'approvalComment',
  name: 'approvalComment',
  label: '审批意见',
  type: 'textarea',
  value: '',
  readonly: permissionLevel !== PermissionLevel.APPROVE, // 动态设置
  required: true,
  permission: permissionLevel
};
```

---

## 开发注意事项

### 添加新API端点

1. 在 `src/api/controllers/` 添加控制器方法
2. 如需数据库操作，在 `src/database/services/` 添加服务方法
3. 在 `src/index.ts` 的 `setupRoutes()` 中注册路由

### 修改数据库Schema

1. 更新 `src/database/schema.sql`
2. 更新 `src/database/repositories/` 中的类型定义
3. 更新 `src/database/services/` 中的业务逻辑
4. 运行 `npm run db:init` 重新初始化

### Camunda流程变更

1. 使用 Camunda Modeler 编辑 `.bpmn` 文件
2. 更新 DMN 决策表(如需要)
3. 更新表单定义(如需要)
4. 部署到Camunda服务器: `npm run test:deploy`

---

## 部署检查清单

- [ ] 运行 `npm run build` 确保无编译错误
- [ ] 运行 `npm test` 确保所有测试通过
- [ ] 配置 `.env` 环境变量
- [ ] 运行 `npm run db:init` 初始化数据库
- [ ] 运行 `npm run db:seed` 插入种子数据
- [ ] 确保Camunda服务器可访问
- [ ] 部署BPMN/DMN/Forms到Camunda
- [ ] 启动应用: `npm start`

---

## 相关文档

- `README.md`: 项目简介和快速开始
- `docs/ARCHITECTURE.md`: 完整架构文档和数据流
- `docs/DATABASE.md`: 数据库设计和DMN说明
- `docs/CAMUNDA8_MIGRATION.md`: Camunda 7→8迁移指南
- `src/database/USAGE.md`: 数据库使用示例

---

## License

MIT
