// =====================================================
// PRAM3 ERP Frontend - Data-Driven Dynamic Rendering Demo
// 前端数据驱动动态渲染演示
// =====================================================

import React, { useState, useEffect } from 'react';
import { PermissionLevel, TaskAction, PermissionAwareField } from '../dynamic-forms/permission.types';

// =====================================================
// 核心原理：数据驱动渲染
// =====================================================

/**
 * 前端是纯展示层，所有渲染逻辑由数据决定
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                     数据流说明                                │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                             │
 * │   后端返回Schema                                            │
 *   ──────────────────► 前端接收数据                           │
 │                                                             │
 │   schema = {                                                │
 │     "fields": [                                            │
 │       {                                                    │
 │         "id": "approvalAction",                            │
 │         "type": "enum",                                   │
 │         "readonly": false,  ←── 决定是否可编辑             │
 │         "required": true                                   │
 │       },                                                   │
 │       {                                                    │
 │         "id": "orderNumber",                               │
 │         "readonly": true,      ←── 决定是否只读             │
 │         "value": "SO001"                                   │
 │       }                                                    │
 │     ],                                                     │
 │     "actions": [            ←── 决定显示哪些按钮           │
 │       { "id": "complete", "label": "提交" },              │
 │       { "id": "claim", "label": "签收" }                   │
 │     ]                                                      │
 │   }                                                        │
 │                                                             │
 │   前端完全根据这些数据渲染，不做逻辑判断                      │
 │                                                             │
 └─────────────────────────────────────────────────────────────┘
 */

// =====================================================
// 示例：后端可以返回不同的数据来改变前端渲染
// =====================================================

/**
 * 场景1: 只读模式 - VIEW权限
 * 后端返回: 所有字段readonly=true, actions=[]
 */
const VIEW_MODE_SCHEMA: DynamicSchemaResponse = {
  schemaId: 'dept-manager-approval-form',
  schemaName: '部门经理审批',
  taskId: 'task-001',
  nodeId: 'node-approval-level1',
  permissionLevel: PermissionLevel.VIEW,
  fields: [
    {
      id: 'orderNumber',
      name: 'orderNumber',
      label: '订单号',
      type: 'text',
      value: 'SO202401150001',
      readonly: true,  // 只读
      required: false,
      permission: PermissionLevel.VIEW,
    },
    {
      id: 'approvalAction',
      name: 'approvalAction',
      label: '审批操作',
      type: 'enum',
      value: '',
      readonly: true,  // 只读 - 不能操作
      required: true,
      permission: PermissionLevel.VIEW,
    },
  ],
  actions: [],  // 没有操作按钮
  metadata: {
    orderId: 'order-001',
    orderNumber: 'SO202401150001',
    processInstanceId: 'proc-001',
    createdAt: new Date(),
  },
};

/**
 * 场景2: 编辑模式 - EDIT权限
 * 后端返回: 部分字段readonly=false, actions=[claim]
 */
const EDIT_MODE_SCHEMA: DynamicSchemaResponse = {
  ...VIEW_MODE_SCHEMA,
  permissionLevel: PermissionLevel.EDIT,
  fields: [
    {
      ...VIEW_MODE_SCHEMA.fields[1],
      readonly: false,  // 可编辑
      permission: PermissionLevel.EDIT,
    },
  ],
  actions: [
    { id: 'claim', label: '签收', icon: '📥' },
  ],
};

/**
 * 场景3: 审批模式 - APPROVE权限
 * 后端返回: 审批字段可操作, actions=[approve, reject]
 */
const APPROVE_MODE_SCHEMA: DynamicSchemaResponse = {
  ...VIEW_MODE_SCHEMA,
  permissionLevel: PermissionLevel.APPROVE,
  fields: [
    {
      id: 'approvalAction',
      name: 'approvalAction',
      label: '审批操作',
      type: 'enum',
      value: '',
      readonly: false,  // 可操作
      required: true,
      permission: PermissionLevel.APPROVE,
    },
    {
      id: 'approvalComment',
      name: 'approvalComment',
      label: '审批意见',
      type: 'textarea',
      value: '',
      readonly: false,  // 可输入
      required: true,
      permission: PermissionLevel.APPROVE,
    },
  ],
  actions: [
    { id: 'approve', label: '通过', icon: '✓', confirm: '确认通过？' },
    { id: 'reject', label: '拒绝', icon: '✗', confirm: '确认拒绝？' },
  ],
};

// =====================================================
// 前端组件：完全根据数据渲染
// =====================================================

interface DataDrivenFormProps {
  schema: DynamicSchemaResponse;  // 数据驱动
}

function DataDrivenForm({ schema }: DataDrivenFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // 数据驱动渲染 - 完全根据schema渲染
  return (
    <div className="data-driven-form">
      {/* 1. 权限指示器 */}
      <div className="permission-indicator">
        当前权限: <strong>{schema.permissionLevel}</strong>
      </div>

      {/* 2. 动态字段渲染 - 完全由fields数组决定 */}
      <div className="fields-container">
        {schema.fields.map((field) => (
          <DynamicFieldRenderer
            key={field.id}
            field={field}
            value={formData[field.id] ?? field.value}
            onChange={(value) => setFormData({ ...formData, [field.id]: value })}
          />
        ))}
      </div>

      {/* 3. 动态按钮渲染 - 完全由actions数组决定 */}
      <div className="actions-container">
        {schema.actions.map((action) => (
          <button
            key={action.id}
            className={`btn btn-${action.id}`}
            onClick={() => handleAction(action)}
            disabled={schema.permissionLevel === PermissionLevel.VIEW}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>

      {/* 4. 当前数据快照 - 展示数据驱动效果 */}
      <div className="data-snapshot">
        <h4>当前数据快照:</h4>
        <pre>{JSON.stringify({ schema: schema.schemaId, formData }, null, 2)}</pre>
      </div>
    </div>
  );
}

// 动态字段渲染组件
function DynamicFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: PermissionAwareField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  // 完全根据field属性渲染，不做额外判断
  return (
    <div className="field-wrapper">
      <label>
        {field.label}
        {field.required && <span className="required">*</span>}
      </label>
      
      {field.type === 'text' && (
        <input
          type="text"
          value={String(value ?? '')}
          disabled={field.readonly}  // 由后端决定
          onChange={(e) => onChange(e.target.value)}
          className="field-input"
        />
      )}
      
      {field.type === 'textarea' && (
        <textarea
          value={String(value ?? '')}
          disabled={field.readonly}  // 由后端决定
          onChange={(e) => onChange(e.target.value)}
          className="field-textarea"
        />
      )}
      
      {field.type === 'enum' && (
        <select
          value={String(value ?? '')}
          disabled={field.readonly}  // 由后端决定
          onChange={(e) => onChange(e.target.value)}
          className="field-select"
        >
          <option value="">请选择</option>
          {(field as any).options?.map((opt: { value: string; label: string }) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      
      <div className="field-meta">
        readonly: {String(field.readonly)} | permission: {field.permission}
      </div>
    </div>
  );
}

// 处理操作
function handleAction(action: TaskAction) {
  if (action.confirm && !confirm(action.confirm)) {
    return;
  }
  alert(`执行操作: ${action.label}`);
}

// =====================================================
// 演示：切换不同数据模式
// =====================================================

function DataDrivenDemo() {
  const [currentSchema, setCurrentSchema] = useState<DynamicSchemaResponse>(VIEW_MODE_SCHEMA);

  return (
    <div className="demo-container">
      <h2>Data-Driven Dynamic Rendering Demo</h2>
      
      {/* 模式切换按钮 */}
      <div className="mode-switcher">
        <button onClick={() => setCurrentSchema(VIEW_MODE_SCHEMA)}>
          VIEW模式 (只读)
        </button>
        <button onClick={() => setCurrentSchema(EDIT_MODE_SCHEMA)}>
          EDIT模式 (可签收)
        </button>
        <button onClick={() => setCurrentSchema(APPROVE_MODE_SCHEMA)}>
          APPROVE模式 (可审批)
        </button>
      </div>
      
      {/* 渲染表单 - 完全由数据驱动 */}
      <DataDrivenForm schema={currentSchema} />
      
      {/* 说明 */}
      <div className="demo-explanation">
        <h3>如何改变渲染:</h3>
        <ol>
          <li>修改后端返回的schema数据</li>
          <li>改变字段的<code>readonly</code>属性</li>
          <li>改变<code>actions</code>数组的内容</li>
          <li>前端会自动根据新数据重新渲染</li>
        </ol>
        <h3>测试方法:</h3>
        <ul>
          <li>点击上方按钮切换不同权限模式</li>
          <li>观察字段的只读状态变化</li>
          <li>观察按钮的显示变化</li>
        </ul>
      </div>
    </div>
  );
}

// =====================================================
// 实际API调用示例
// =====================================================

/**
 * 真实场景中，前端通过API获取schema
 */
async function fetchDynamicSchema(orderId: string, taskId: string): Promise<DynamicSchemaResponse> {
  const response = await fetch(`/api/v1/orders/${orderId}/schema?taskId=${taskId}`, {
    headers: {
      'Authorization': 'Bearer xxx',
      'X-User-Id': 'user001',
      'X-User-Roles': 'DEPT_MANAGER',
    },
  });
  
  if (!response.ok) {
    throw new Error('获取Schema失败');
  }
  
  return response.json();
}

/**
 * 前端使用示例
 */
function RealWorldUsage({ orderId }: { orderId: string }) {
  const [schema, setSchema] = useState<DynamicSchemaResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载数据
  const loadSchema = async () => {
    setLoading(true);
    try {
      const data = await fetchDynamicSchema(orderId, 'task-001');
      setSchema(data);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 渲染 - 完全由schema数据决定
  if (loading) return <div>加载中...</div>;
  if (!schema) return <button onClick={loadSchema}>加载表单</button>;

  return <DataDrivenForm schema={schema} />;
}

export { DataDrivenDemo, RealWorldUsage };
