# 测试数据总览

## 数据库Seed数据总览

### 用户 (2个主要测试用户)

| 用户名 | 角色 | 关键权限 | 用途 |
|-------|------|---------|------|
| **sales01** (张三) | SALES | 普通权限 | **测试点：普通用户创建订单** |
| **admin01** (管理员) | ADMIN | ORDER_OVERRIDE, PRICE_MODIFY, PROCESS_CANCEL | **测试点：管理员Override权限** |

> 额外用户：salesmgr01(销售经理), finance01(财务), director01(总监) - 用于审批

---

### 产品 (5个)

| 产品代码 | 名称 | 标准价 | 金牌价 | VIP价 |
|---------|------|-------|-------|------|
| P-001 | 人体工学办公椅 | 800 | 760 | 720 |
| P-002 | 电动升降办公桌 | 3500 | 3325 | 3150 |
| P-003 | 企业级服务器 | 12000 | 11400 | 10800 |
| P-004 | ERP系统许可证 | 6000 | 5700 | 5400 |
| P-005 | 企业定制解决方案 | 60000 | 57000 | 54000 |

---

### 价格表 (3个) - **关键测试点**

| 价格表代码 | 名称 | 适用客户 | 折扣幅度 |
|-----------|------|---------|---------|
| STANDARD | 标准价格表 | 标准客户 | 0% |
| GOLD | 金牌客户价格表 | 金牌/企业客户 | ~5% |
| VIP | VIP客户价格表 | VIP客户 | ~10% |

**DMN自动选择逻辑 (price-list-selection.dmn):**
```
IF 客户等级 = VIP → VIP价格表
IF 客户等级 = ENTERPRISE/GOLD → 金牌价格表  
IF 客户等级 = STANDARD AND 历史订单 >= 10 → 金牌价格表 (忠诚度升级)
ELSE → 标准价格表
```

---

### 客户 (2个主要测试客户)

| 客户代码 | 名称 | 等级 | 关联价格表 | 历史订单 | **关键测试点** |
|---------|------|-----|-----------|---------|--------------|
| **C-001** | 北京科技有限公司 | STANDARD | 标准价 | 2 | **标准客户，走标准流程** |
| **C-002** | 上海创新集团 | VIP | VIP价 | 25 | **VIP客户，享受最优价格** |

> 额外客户：杭州电子商务(GOLD), 深圳智能制造(ENTERPRISE)

---

## 集成测试场景

### 场景1: 普通用户 + 标准客户
```
用户: sales01 (普通)
客户: C-001 (北京科技，STANDARD)
产品价格: 使用标准价格表
创建SO: 正常流程，无特殊权限
```

### 场景2: 管理员 + VIP客户
```
用户: admin01 (有Override权限)
客户: C-002 (上海创新，VIP)
产品价格: 使用VIP价格表（自动10%折扣）
创建SO: 可以Override价格和流程
```

### 场景3: DMN自动选择价格表验证
```
输入: 客户等级 + 历史订单数
输出: 自动匹配价格表ID
验证: 订单中产品价格是否正确加载
```

---

## DMN决策表清单

| DMN文件 | 用途 | 输入 | 输出 |
|--------|------|------|------|
| price-list-selection.dmn | **选择价格表** | customerTier, orderHistoryCount | priceListId, priceListCode |
| approval-level.dmn | 确定审批级别 | amount, customerTier | approvalLevel, assignee |
| discount-calculation.dmn | 计算折扣 | amount, customerType, orderHistory | discountRate, discountAmount |

---

## 快速测试SQL

```sql
-- 1. 查看所有用户及权限
SELECT username, role, permissions FROM users;

-- 2. 查看客户及其关联价格表
SELECT c.name, c.tier, pl.price_list_code, pl.name as price_list_name
FROM customers c
JOIN price_lists pl ON c.price_list_id = pl.id;

-- 3. 查看产品价格对比
SELECT p.name as product, 
       MAX(CASE WHEN pl.price_list_code='STANDARD' THEN pli.unit_price END) as standard_price,
       MAX(CASE WHEN pl.price_list_code='GOLD' THEN pli.unit_price END) as gold_price,
       MAX(CASE WHEN pl.price_list_code='VIP' THEN pli.unit_price END) as vip_price
FROM products p
JOIN price_list_items pli ON p.id = pli.product_id
JOIN price_lists pl ON pli.price_list_id = pl.id
GROUP BY p.id, p.name;

-- 4. 模拟DMN决策: 根据客户等级选择价格表
SELECT 
  name,
  tier,
  CASE 
    WHEN tier = 'VIP' THEN 'pl-003 (VIP价格表)'
    WHEN tier IN ('GOLD', 'ENTERPRISE') THEN 'pl-002 (金牌价格表)'
    WHEN tier = 'STANDARD' AND order_history_count >= 10 THEN 'pl-002 (金牌价格表-忠诚度)'
    ELSE 'pl-001 (标准价格表)'
  END as selected_price_list
FROM customers;
```

---

## 测试步骤建议

1. **数据库初始化**: 执行所有SQL文件
2. **DMN部署**: 部署3个DMN文件到Camunda
3. **BPMN部署**: 部署更新后的BPMN（已集成DMN）
4. **功能测试**:
   - 用sales01登录，为C-001创建订单（标准流程）
   - 用admin01登录，为C-002创建订单（VIP价格）
   - 验证订单中的单价是否正确
5. **Override测试**:
   - admin01修改订单价格（Override权限）
   - sales01尝试修改（应被拒绝）
