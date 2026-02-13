// =====================================================
// PRAM3 ERP Frontend - React App
// 前端React应用 - TypeScript + JSX
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { PermissionLevel, TaskAction, PermissionAwareField, ParallelTaskGroup, DynamicSchemaResponse } from '../dynamic-forms/permission.types';
import { SalesOrder, SalesOrderStatus } from '../../domains/sales/models/sales-order.types';
import './App.css';

// =====================================================
// API调用封装
// =====================================================

const API_BASE = '/api/v1';

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': 'user001',
      'X-User-Roles': 'DEPT_MANAGER',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

// =====================================================
// 组件定义
// =====================================================

// 1. 顶部状态栏组件
interface HeaderProps {
  order: SalesOrder;
  isActive: boolean;
  onToggleActive: (value: boolean) => void;
  onOverride: () => void;
  onShowComments: () => void;
  commentCount: number;
}

function Header({ order, isActive, onToggleActive, onOverride, onShowComments, commentCount }: HeaderProps) {
  const statusLabels: Record<SalesOrderStatus, string> = {
    [SalesOrderStatus.DRAFT]: '草稿',
    [SalesOrderStatus.PENDING_APPROVAL]: '待审批',
    [SalesOrderStatus.APPROVED]: '已审批',
    [SalesOrderStatus.REJECTED]: '已拒绝',
    [SalesOrderStatus.CANCELLED]: '已取消',
    [SalesOrderStatus.PROCESSING]: '处理中',
    [SalesOrderStatus.COMPLETED]: '已完成',
  };

  return (
    <div className="so-header">
      <div className="header-left">
        <span className="so-id">SO-{order.orderNumber}</span>
        <span className={`so-status status-${order.status.toLowerCase()}`}>
          {statusLabels[order.status]}
        </span>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => onToggleActive(e.target.checked)}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">{isActive ? 'Active' : 'Inactive'}</span>
        </label>
      </div>
      <div className="header-actions">
        <button className="btn btn-override" onClick={onOverride} disabled={!isActive}>
          Override
        </button>
        <button className="btn btn-comment" onClick={onShowComments}>
          <span className="comment-icon">💬</span>
          {commentCount > 0 && <span className="comment-badge">{commentCount}</span>}
        </button>
      </div>
    </div>
  );
}

// 2. 进度条节点组件
interface ProgressNodeProps {
  nodeId: string;
  name: string;
  type: 'circle' | 'square' | 'diamond';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  isCurrent: boolean;
  onClick: () => void;
}

function ProgressNode({ name, type, status, isCurrent, onClick }: ProgressNodeProps) {
  const statusClass = `status-${status}`;
  const shapeClass = `shape-${type}`;
  
  return (
    <div 
      className={`progress-node ${shapeClass} ${statusClass} ${isCurrent ? 'current' : ''}`}
      onClick={onClick}
    >
      <span className="node-icon">
        {type === 'circle' && '📝'}
        {type === 'square' && '📋'}
        {type === 'diamond' && '✓'}
      </span>
      <span className="node-label">{name}</span>
      {status === 'in-progress' && <span className="pulse-indicator"></span>}
    </div>
  );
}

// 3. 进度条组件
interface ProgressBarProps {
  nodes: {
    nodeId: string;
    name: string;
    type: 'circle' | 'square' | 'diamond';
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
  }[];
  currentNodeId: string;
  onNodeClick: (nodeId: string) => void;
  canRollback: boolean;
  onRollback: () => void;
}

function ProgressBar({ nodes, currentNodeId, onNodeClick, canRollback, onRollback }: ProgressBarProps) {
  return (
    <div className="so-progress">
      <div className="progress-track">
        {nodes.map((node, index) => (
          <React.Fragment key={node.nodeId}>
            {index > 0 && <div className="progress-connection"></div>}
            <ProgressNode
              {...node}
              isCurrent={node.nodeId === currentNodeId}
              onClick={() => onNodeClick(node.nodeId)}
            />
          </React.Fragment>
        ))}
      </div>
      <div className="rollback-section">
        <button 
          className="btn btn-rollback" 
          onClick={onRollback}
          disabled={!canRollback}
        >
          ← 回退
        </button>
      </div>
    </div>
  );
}

// 4. 动态表单字段组件
interface DynamicFieldProps {
  field: PermissionAwareField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  const inputProps = {
    id: field.id,
    name: field.name,
    value: value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
      onChange(e.target.value),
    disabled: field.readonly,
    required: field.required,
    className: 'form-input',
  };

  return (
    <div className="form-field" data-field-id={field.id}>
      <label htmlFor={field.id} className="field-label">
        {field.label}
        {field.required && <span className="required-mark">*</span>}
      </label>
      
      {field.type === 'text' && (
        <input type="text" {...inputProps} />
      )}
      
      {field.type === 'number' && (
        <input type="number" {...inputProps} />
      )}
      
      {field.type === 'textarea' && (
        <textarea {...inputProps} rows={4}></textarea>
      )}
      
      {field.type === 'enum' && (
        <select {...inputProps}>
          <option value="">请选择</option>
          {field.validation?.['enumOptions']?.map((opt: { value: string; label: string }) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      
      {field.type === 'table' && (
        <div className="table-wrapper">
          <table className="form-table">
            <thead>
              <tr>
                {(field as any).columns?.map((col: { key: string; label: string }) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(value as any[])?.map((row, i) => (
                <tr key={i}>
                  {(field as any).columns?.map((col: { key: string }) => (
                    <td key={col.key}>{row[col.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {field.permission !== PermissionLevel.VIEW && (
        <span className="permission-badge" data-permission={field.permission}>
          {field.permission === PermissionLevel.EDIT && '可编辑'}
          {field.permission === PermissionLevel.APPROVE && '可审批'}
        </span>
      )}
    </div>
  );
}

// 5. 动态表单组件
interface DynamicFormProps {
  schema: DynamicSchemaResponse | null;
  formData: Record<string, unknown>;
  onFormChange: (data: Record<string, unknown>) => void;
  onAction: (action: string) => void;
}

function DynamicForm({ schema, formData, onFormChange, onAction }: DynamicFormProps) {
  if (!schema) {
    return <div className="form-loading">加载中...</div>;
  }

  return (
    <div className="dynamic-form">
      <div className="form-header">
        <h2>{schema.schemaName}</h2>
        <span className="permission-indicator">
          权限级别: {schema.permissionLevel === PermissionLevel.VIEW && '只读'}
          {schema.permissionLevel === PermissionLevel.EDIT && '可编辑'}
          {schema.permissionLevel === PermissionLevel.APPROVE && '可审批'}
        </span>
      </div>

      {/* 表单字段 */}
      <div className="form-body">
        {schema.fields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={(value) => onFormChange({ ...formData, [field.id]: value })}
          />
        ))}
      </div>

      {/* 动态操作按钮 */}
      <div className="form-actions">
        {schema.actions.map((action) => (
          <button
            key={action.id}
            className={`btn btn-action-${action.id}`}
            onClick={() => onAction(action.id)}
            disabled={schema.permissionLevel === PermissionLevel.VIEW}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// 6. 并行任务Tab组件
interface ParallelTabsProps {
  groups: ParallelTaskGroup[];
  activeTaskId: string;
  onTaskSelect: (taskId: string) => void;
}

function ParallelTabs({ groups, activeTaskId, onTaskSelect }: ParallelTabsProps) {
  if (groups.length === 0) return null;

  return (
    <div className="parallel-tabs">
      {groups.map((group) => (
        <div key={group.groupId} className="task-group">
          <div className="group-title">{group.groupName}</div>
          <div className="task-tabs">
            {group.tasks.map((task) => (
              <button
                key={task.id}
                className={`task-tab ${task.id === activeTaskId ? 'active' : ''}`}
                onClick={() => onTaskSelect(task.id)}
              >
                {task.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// 主应用组件
// =====================================================

function App() {
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [schema, setSchema] = useState<DynamicSchemaResponse | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isActive, setIsActive] = useState(true);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载订单数据
  useEffect(() => {
    const orderId = 'demo-order-001';
    loadOrder(orderId);
  }, []);

  // 加载订单详情
  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const result = await fetchAPI<{ success: boolean; data: SalesOrder }>(`/orders/${orderId}`);
      if (result.success) {
        setOrder(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载动态Schema
  const loadSchema = async (taskId: string) => {
    if (!order) return;
    
    try {
      setLoading(true);
      const result = await fetchAPI<DynamicSchemaResponse>(
        `/orders/${order.id}/schema?taskId=${taskId}`
      );
      setSchema(result);
      setFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载表单失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理节点点击
  const handleNodeClick = async (nodeId: string) => {
    // 找到对应的任务ID并加载Schema
    // 实际实现中需要从任务列表中获取
    const taskId = `task-${nodeId}`;
    await loadSchema(taskId);
  };

  // 处理表单变更
  const handleFormChange = (data: Record<string, unknown>) => {
    setFormData(data);
  };

  // 处理操作按钮
  const handleAction = async (actionId: string) => {
    if (!order || !schema) return;
    
    try {
      setLoading(true);
      
      // 调用API完成任务
      await fetchAPI(`/orders/${order.id}/tasks/${schema.taskId}/${actionId}`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      // 刷新数据
      await loadOrder(order.id);
      await loadSchema(schema.taskId);
      
      alert('操作成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理回退
  const handleRollback = async () => {
    if (!order || !schema) return;
    
    // 调用回退API
    alert('回退功能待实现');
  };

  // 处理Override
  const handleOverride = () => {
    const reason = prompt('请输入Override原因:');
    if (reason) {
      console.log('Override reason:', reason);
      alert('Override成功！');
    }
  };

  // 处理显示评论
  const handleShowComments = () => {
    alert('评论面板待实现');
  };

  // 渲染进度节点
  const progressNodes = [
    { nodeId: 'node-order-create', name: '创建订单', type: 'square' as const, status: 'completed' as const },
    { nodeId: 'node-order-review', name: '订单审核', type: 'circle' as const, status: 'pending' as const },
    { nodeId: 'node-approval-level1', name: '部门审批', type: 'diamond' as const, status: 'in-progress' as const },
    { nodeId: 'node-approval-level2', name: '总监审批', type: 'diamond' as const, status: 'pending' as const },
    { nodeId: 'node-finance', name: '财务处理', type: 'circle' as const, status: 'pending' as const },
    { nodeId: 'node-complete', name: '订单完成', type: 'square' as const, status: 'pending' as const },
  ];

  if (loading && !order) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">错误: {error}</div>;
  }

  if (!order) {
    return <div className="error">订单不存在</div>;
  }

  return (
    <div className="so-spa">
      <Header
        order={order}
        isActive={isActive}
        onToggleActive={setIsActive}
        onOverride={handleOverride}
        onShowComments={handleShowComments}
        commentCount={commentCount}
      />

      {schema?.parallelGroups && schema.parallelGroups.length > 0 && (
        <ParallelTabs
          groups={schema.parallelGroups}
          activeTaskId={schema.taskId}
          onTaskSelect={(taskId) => loadSchema(taskId)}
        />
      )}

      <ProgressBar
        nodes={progressNodes}
        currentNodeId={schema?.nodeId || 'node-approval-level1'}
        onNodeClick={handleNodeClick}
        canRollback={schema?.permissionLevel === PermissionLevel.APPROVE || schema?.permissionLevel === PermissionLevel.EDIT}
        onRollback={handleRollback}
      />

      <div className="so-content">
        <DynamicForm
          schema={schema}
          formData={formData}
          onFormChange={handleFormChange}
          onAction={handleAction}
        />
      </div>

      <div className="so-footer">
        <div className="footer-left">
          <span className="last-updated">
            最后更新: {order.updatedAt?.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
