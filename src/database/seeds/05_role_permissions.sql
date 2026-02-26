-- =====================================================
-- Seed Data: Role Permission Mapping
-- 角色权限映射定义 - 用于前端权限控制
-- =====================================================

-- 角色权限映射表（如果需要在代码外维护）
-- 注意：实际权限判断逻辑在代码中实现，此表仅供参考

-- VIEW 权限角色（只能查看）
-- CUSTOMER_SERVICE: ["SO_VIEW"]

-- EDIT 权限角色（创建和编辑SO）
-- SALES_REP: ["SO_CREATE", "SO_EDIT", "SO_SUBMIT"]

-- APPROVE 权限角色（由DMN动态分配）
-- SALES_MANAGER: ["SO_VIEW", "SO_APPROVE_LEVEL_1", "SO_ROLLBACK"]
-- FINANCE: ["SO_VIEW", "SO_APPROVE_LEVEL_2", "SO_ROLLBACK", "PRICE_VIEW"]
-- DIRECTOR: ["SO_VIEW", "SO_APPROVE_LEVEL_3", "SO_ROLLBACK", "SO_OVERRIDE", "STRATEGIC_ACCOUNT"]

-- ADMIN 权限角色（全能）
-- ADMIN: ["SO_VIEW", "SO_CREATE", "SO_EDIT", "SO_APPROVE_ALL", "SO_OVERRIDE", "SO_CANCEL", "SO_DELETE", "PROCESS_CANCEL"]

-- =====================================================
-- 权限说明文档
-- =====================================================

/*
权限前缀说明：
- SO_*     : Sales Order 相关权限
- PRICE_*  : 价格相关权限
- PROCESS_*: 流程控制权限

权限层级：
1. VIEW  (只读)
   - SO_VIEW: 查看SO详情、查看历史
   
2. EDIT  (编辑)
   - SO_CREATE: 创建新SO
   - SO_EDIT: 编辑SO业务字段（客户、产品等）
   - SO_SUBMIT: 提交SO到审批流程
   
3. APPROVE (审批)
   - SO_APPROVE_LEVEL_1: 销售经理审批（小额 < 10K）
   - SO_APPROVE_LEVEL_2: 财务审批（中额 10K-100K）
   - SO_APPROVE_LEVEL_3: 总监审批（大额 > 100K 或 VIP）
   - SO_APPROVE_ALL: 可审批任何级别（ADMIN）
   - SO_ROLLBACK: 可回退到上一步
   
4. OVERRIDE (特权)
   - SO_OVERRIDE: 强制覆盖流程（ADMIN/总监）
   - SO_CANCEL: 取消进行中的SO
   - SO_DELETE: 删除SO（物理删除）
   
5. 其他
   - PRICE_VIEW: 查看价格信息
   - STRATEGIC_ACCOUNT: 战略客户标记
   - PROCESS_CANCEL: 取消流程实例

权限判定逻辑（前端）：
1. 获取当前用户 role 和 permissions
2. 获取当前任务 assignee
3. 判定权限级别：
   - 如果 user.id === task.assignee → APPROVE
   - 如果 permissions 包含 SO_CREATE → EDIT
   - 如果 permissions 只包含 SO_VIEW → VIEW
   - ADMIN 角色拥有所有权限

表单字段权限映射：
- VIEW: 所有字段 readonly=true
- EDIT: 业务字段 readonly=false, 审批区域 hidden
- APPROVE: 业务字段 readonly=true, 审批区域 visible+editable
*/
