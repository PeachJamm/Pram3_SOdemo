# 数据库使用指南

## 快速开始

### 1. 初始化数据库

```bash
# 运行初始化脚本
npx ts-node src/database/init.ts
```

或代码中调用：
```typescript
import { initializeDatabase } from './database/init';
await initializeDatabase('./pram3.db');
```

---

## 基础使用示例

### 连接数据库

```typescript
import { db } from './database';

await db.connect();
```

### 客户自动加载示例

```typescript
import { CustomerService, ProductService, OrderService } from './database';

// 创建服务实例
const customerService = new CustomerService(db);
const productService = new ProductService(db);
const orderService = new OrderService(db);

// 1. 获取客户选择列表（下拉框用）
const customers = await customerService.getCustomerSelectList();
console.log(customers);
// 输出:
// [
//   { id: 'cust-001', customer_code: 'C-001', name: '北京科技有限公司', tier: 'STANDARD', displayText: '北京科技有限公司 (C-001) - STANDARD' },
//   { id: 'cust-002', customer_code: 'C-002', name: '上海创新集团', tier: 'VIP', displayText: '上海创新集团 (C-002) - VIP' }
// ]

// 2. 搜索客户
const searchResults = await customerService.searchCustomers('北京');

// 3. 获取客户完整信息（自动加载关联的价格表）
const customerInfo = await customerService.getCustomerFullInfo('cust-002');
console.log(customerInfo);
// 输出:
// {
//   id: 'cust-002',
//   name: '上海创新集团',
//   tier: 'VIP',
//   price_list_id: 'pl-003',
//   price_list_code: 'VIP',
//   price_list_name: 'VIP客户价格表',
//   price_list_info: { id: 'pl-003', code: 'VIP', name: 'VIP客户价格表' }
// }
```

### 产品自动加载示例

```typescript
// 1. 获取基础产品列表
const products = await productService.getProductSelectList();

// 2. 获取指定价格表的产品（含价格）- 关键功能
const vipProducts = await productService.getProductsByPriceList('pl-003');
console.log(vipProducts);
// 输出:
// [
//   { id: 'prod-001', product_code: 'P-001', name: '人体工学办公椅', unit_price: 720, displayText: '人体工学办公椅 (P-001) - ¥720' },
//   { id: 'prod-002', product_code: 'P-002', name: '电动升降办公桌', unit_price: 3150, displayText: '电动升降办公桌 (P-002) - ¥3150' }
// ]

// 3. 搜索产品
const searchProducts = await productService.searchProducts('办公');
```

### 创建订单（自动加载价格）

```typescript
// 创建订单 - 自动根据客户加载对应价格表的产品价格
const orderDraft = await orderService.createOrderDraft(
  'cust-002',  // VIP客户
  [
    { productId: 'prod-001', quantity: 10 },  // 办公椅 x 10
    { productId: 'prod-002', quantity: 5 },   // 办公桌 x 5
  ]
);

console.log(orderDraft);
// 输出:
// {
//   customerId: 'cust-002',
//   customerName: '上海创新集团',
//   priceListId: 'pl-003',
//   priceListCode: 'VIP',
//   items: [
//     {
//       productId: 'prod-001',
//       productCode: 'P-001',
//       productName: '人体工学办公椅',
//       quantity: 10,
//       unitPrice: 720,        // VIP价格
//       originalUnitPrice: 720,
//       lineTotal: 7200
//     },
//     {
//       productId: 'prod-002',
//       productCode: 'P-002',
//       productName: '电动升降办公桌',
//       quantity: 5,
//       unitPrice: 3150,       // VIP价格
//       lineTotal: 15750
//     }
//   ],
//   subtotal: 22950,
//   discountAmount: 0,
//   taxAmount: 1377,
//   grandTotal: 24327
// }
```

---

## API 接口示例

### Express 路由示例

```typescript
import { Router } from 'express';
import { db, CustomerService, ProductService, OrderService } from '../database';

const router = Router();

// 获取客户列表
router.get('/customers/select', async (req, res) => {
  const service = new CustomerService(db);
  const customers = await service.getCustomerSelectList();
  res.json({ success: true, data: customers });
});

// 搜索客户
router.get('/customers/search', async (req, res) => {
  const { keyword } = req.query;
  const service = new CustomerService(db);
  const customers = await service.searchCustomers(keyword as string);
  res.json({ success: true, data: customers });
});

// 获取客户完整信息
router.get('/customers/:id/full', async (req, res) => {
  const service = new CustomerService(db);
  const customer = await service.getCustomerFullInfo(req.params.id);
  res.json({ success: true, data: customer });
});

// 获取产品列表（根据客户价格表）
router.get('/products/by-customer/:customerId', async (req, res) => {
  const customerService = new CustomerService(db);
  const productService = new ProductService(db);
  
  // 获取客户的价格表
  const customerInfo = await customerService.getCustomerForOrder(req.params.customerId);
  if (!customerInfo) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }
  
  // 获取该价格表的产品
  const products = await productService.getProductsByPriceList(customerInfo.priceListId);
  res.json({ success: true, data: products });
});

// 创建订单草稿
router.post('/orders/draft', async (req, res) => {
  const { customerId, items } = req.body;
  const orderService = new OrderService(db);
  
  try {
    const draft = await orderService.createOrderDraft(customerId, items);
    res.json({ success: true, data: draft });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
```

---

## 数据流向

```
用户选择客户
    │
    ▼
获取客户信息 ───────┐
    │              │
    ▼              │
获取 price_list_id │
    │              │
    ▼              │
加载该价格表的     │
产品价格           │
    │              │
    ▼              │
计算订单金额 ◄─────┘
    │
    ▼
保存订单
```

---

## Seed 数据速查

### 用户
- **sales01** (张三) - 普通销售
- **admin01** (管理员) - 有Override权限

### 客户
- **C-001** 北京科技有限公司 - STANDARD - 标准价格表
- **C-002** 上海创新集团 - VIP - VIP价格表

### 产品价格对比
| 产品 | 标准价 | VIP价 |
|------|-------|------|
| 办公椅 | ¥800 | ¥720 |
| 办公桌 | ¥3500 | ¥3150 |
| 服务器 | ¥12000 | ¥10800 |
