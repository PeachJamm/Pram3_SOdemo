// =====================================================
// Type Definitions
// 类型定义 - 与Camunda表单和BPMN保持一致
// =====================================================

// 用户
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
}

// 权限级别
export type PermissionLevel = 'VIEW' | 'EDIT' | 'APPROVE';

// 销售订单
export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  totalAmount: number;
  grandTotal: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  processInstanceKey?: string;
}

// 表单字段外观配置
interface FieldAppearance {
  prefixAdorner?: string;
  style?: Record<string, any>;
}

// 表单字段权限配置
interface FieldPermission {
  VIEW: { visible: boolean; readonly: boolean };
  EDIT: { visible: boolean; readonly: boolean };
  APPROVE: { visible: boolean; readonly: boolean };
}

// 表单组件 - 与Camunda表单JSON一致
export interface FormComponent {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'radio' | 'select' | 'group' | 'button' | 'html';
  key?: string;
  value?: any;
  readonly?: boolean;
  visible?: boolean;
  
  // 布局
  layout?: {
    row?: string;
    columns?: number | null;
  };
  
  // 内容
  text?: string;
  content?: string;
  
  // 样式和外观
  appearance?: FieldAppearance;
  
  // 权限配置
  properties?: {
    permission?: FieldPermission;
    fontFamily?: string;
    [key: string]: any;
  };
  
  // 嵌套组件
  components?: FormComponent[];
  
  // 验证
  validate?: {
    required?: boolean;
  };
  
  // 选项（radio/select）
  values?: Array<{ label: string; value: string }>;
  
  // 行数（textarea）
  rows?: number;
  
  // 条件显示
  conditional?: {
    hide?: string;
  };
  
  // 按钮动作
  action?: 'submit' | 'reset' | 'custom';
}

// Camunda任务信息
export interface TaskInfo {
  taskId: string;
  taskName: string;
  formKey: string;
  assignee: string | null;
  processInstanceKey: string;
  variables: Record<string, any>;
}

// 渲染后的表单
export interface RenderedForm {
  formId: string;
  formName: string;
  permissionLevel: PermissionLevel;
  userInfo: User;
  taskInfo: {
    taskId: string;
    taskName: string;
    assignee: string | null;
    isAssignedToUser: boolean;
  };
  components: FormComponent[];
  variables: Record<string, any>;
}

// 待办任务
export interface PendingTask {
  taskId: string;
  taskName: string;
  formKey: string;
  processInstanceKey: string;
  createdAt: string;
}

// API响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 流程步骤
export interface ProcessStep {
  id: string;
  name: string;
  type: 'USERTASK' | 'DMN' | 'START' | 'END';
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
}

// 历史记录
export interface HistoryRecord {
  id: string;
  timestamp: string;
  type: 'USER_ACTION' | 'SYSTEM_DECISION' | 'PROCESS_EVENT';
  actor: string;
  action: string;
  details?: string;
  comment?: string;
}

// Chatbot消息
export interface ChatbotMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
}
