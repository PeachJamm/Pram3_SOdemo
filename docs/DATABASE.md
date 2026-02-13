# PRAM3 ERP - 数据库文档

## 数据库设计

### 表结构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │  price_lists    │     │    products     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ username        │◄────┤ price_list_code │     │ product_code    │
│ email           │     │ name            │     │ name            │
│ role            │     │ currency        │     │ category        │
│ permissions     │     └────────┬────────┘     │ cost_price      │
└─────────────────┘              │              └─────────────────┘
                                 │                       ▲
                                 │                       │
┌─────────────────┐     ┌────────┴────────┐     ┌───────┴─────────┐
│    customers    │     │ price_list_items│     │ sales_order_    │
├─────────────────┤     ├─────────────────┤     │    items        │
│ id (PK)         │     │ id (PK)         │     ├─────────────────┤
│ customer_code   │◄────┤ price_list_id   │     │ id (PK)         │
│ tier            │     │ product_id      │────►│ sales_order_id  │
│ customer_type   │     │ unit_price      │     │ product_id      │
│ price_list_id   │────►└─────────────────┘     │ quantity        │
│ credit_limit    │                              │ unit_price      │
│ order_history   │     ┌─────────────────┐     │ line_total      │
└─────────────────┘     │  sales_orders   │     └─────────────────┘
                        ├─────────────────┤              ▲
                        │ id (PK)         │              │
                        │ order_number    │──────────────┘
                        │ customer_id     │────┐
                        │ price_list_id   │    │
                        │ total_amount    │    │
                        │ status          │    │
                        │ created_by      │────┘
                        └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ approval_history│
                        ├─────────────────┤
                        │ id (PK)         │
                        │ sales_order_id  │
                        │ approver_id     │
                        │ action          │
                        └─────────────────┘
```

---

## Seed 数据说明

### 1. 用户 (Users) - 5个用户

| ID | 用户名 | 角色 | 权限 | 用途 |
|----|-------|------|------|------|
| user-001 | sales01 | SALES | 普通权限 | **测试点：普通用户** |
| user-002 | admin01 | ADMIN | ORDER_OVERRIDE, PROCESS_CANCEL, PRICE_MODIFY | **测试点：Override权限** |
| user-003 | salesmgr01 | SALES_MANAGER | APPROVE_LEVEL_1 | 销售经理审批 |
| user-004 | finance01 | FINANCE | APPROVE_LEVEL_2 | 财务审批 |
| user-005 | director01 | DIRECTOR | APPROVE_LEVEL_3 | 总监审批 |

### 2. 产品 (Products) - 5个产品

| ID | 产品代码 | 名称 | 类别 | 成本价 |
|----|---------|------|------|-------|
| prod-001 | P-001 | 人体工学办公椅 | 办公家具 | 500 |
| prod-002 | P-002 | 电动升降办公桌 | 办公家具 | 2500 |
| prod-003 | P-003 | 企业级服务器 | IT设备 | 8000 |
| prod-004 | P-004 | ERP系统许可证 | 软件服务 | 5000 |
| prod-005 | P-005 | 企业定制解决方案 | 服务 | 50000 |

### 3. 价格表 (Price Lists) - 3个价格表

| ID | 代码 | 名称 | 用途 |
|----|-----|------|------|
| pl-001 | STANDARD | 标准价格表 | 标准客户默认价格 |
| pl-002 | GOLD | 金牌客户价格表 | 金牌/企业客户，约5%折扣 |
| pl-003 | VIP | VIP客户价格表 | VIP客户，约10%折扣 |

**价格明细示例：**

| 产品 | 标准价 | 金牌价(5% off) | VIP价(10% off) |
|------|--------|---------------|---------------|
| 办公椅 | 800 | 760 | 720 |
| 办公桌 | 3500 | 3325 | 3150 |
| 服务器 | 12000 | 11400 | 10800 |

### 4. 客户 (Customers) - 4个客户

| ID | 代码 | 名称 | 等级 | 价格表 | 历史订单 | **测试点** |
|----|-----|------|-----|--------|---------|-----------|
| cust-001 | C-001 | 北京科技有限公司 | STANDARD | 标准价 | 2 | **测试点：标准客户** |
| cust-002 | C-002 | 上海创新集团 | VIP | VIP价 | 25 | **测试点：VIP客户** |
| cust-003 | C-003 | 杭州电子商务公司 | GOLD | 金牌价 | 8 | 金牌客户 |
| cust-004 | C-004 | 深圳智能制造有限公司 | ENTERPRISE | 金牌价 | 12 | 企业客户 |

---

## DMN 决策表

### 1. price-list-selection.dmn
根据客户信息自动选择价格表

**输入：**
- customerTier: 客户等级 (STANDARD, GOLD, ENTERPRISE, VIP)
- customerType: 客户类型
- orderHistoryCount: 历史订单数

**输出：**
- priceListId: 价格表ID
- priceListCode: 价格表代码
- priceListName: 价格表名称
- discountTier: 折扣等级 (TIER_1, TIER_2, TIER_3)

**规则：**
- VIP → VIP价格表
- ENTERPRISE/GOLD → 金牌价格表
- STANDARD + 订单数≥10 → 金牌价格表 (忠诚度奖励)
- 其他 → 标准价格表

### 2. approval-level.dmn
确定审批级别（已在TEST_DATA.md中定义）

### 3. discount-calculation.dmn
计算折扣率（已在TEST_DATA.md中定义）

---

## 使用示例

### 场景：VIP客户创建订单

```javascript
// 1. 查询客户信息
const customer = await db.query(
  'SELECT * FROM customers WHERE id = ?', 
  ['cust-002']
);
// 结果：上海创新集团，VIP，关联VIP价格表(pl-003)

// 2. DMN自动选择价格表
const priceListDecision = await dmn.evaluate('select-price-list', {
  customerTier: 'VIP',
  customerType: 'VIP',
  orderHistoryCount: 25
});
// 结果：priceListId = 'pl-003', priceListCode = 'VIP'

// 3. 查询产品价格
const prices = await db.query(
  `SELECT p.*, pli.unit_price 
   FROM products p
   JOIN price_list_items pli ON p.id = pli.product_id
   WHERE pli.price_list_id = ?`,
  ['pl-003']
);
// 结果：所有产品使用VIP价格（10%折扣）

// 4. 创建销售订单
const order = {
  customerId: 'cust-002',
  priceListId: 'pl-003',
  items: [
    { productId: 'prod-001', quantity: 10, unitPrice: 720 }, // VIP价
    { productId: 'prod-002', quantity: 5, unitPrice: 3150 }  // VIP价
  ],
  totalAmount: 22950 // 自动计算
};
```

---

## 数据库初始化命令

### MySQL
```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE pram3_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 执行schema
mysql -u root -p pram3_erp < src/database/schema.sql

# 插入seed数据
mysql -u root -p pram3_erp < src/database/seeds/01_users.sql
mysql -u root -p pram3_erp < src/database/seeds/02_products.sql
mysql -u root -p pram3_erp < src/database/seeds/03_price_lists.sql
mysql -u root -p pram3_erp < src/database/seeds/04_customers.sql
```

### SQLite (开发测试)
```bash
# 创建数据库
sqlite3 pram3.db < src/database/schema.sql
sqlite3 pram3.db < src/database/seeds/01_users.sql
sqlite3 pram3.db < src/database/seeds/02_products.sql
sqlite3 pram3.db < src/database/seeds/03_price_lists.sql
sqlite3 pram3.db < src/database/seeds/04_customers.sql
```

---

## 测试检查清单

- [ ] 用户权限验证（普通用户 vs Override用户）
- [ ] 价格表自动选择（DMN决策）
- [ ] 不同客户等级看到不同价格
- [ ] 订单创建时自动关联价格表
- [ ] 订单金额计算正确（含折扣）
