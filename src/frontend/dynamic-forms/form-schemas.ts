// =====================================================
// PRAM3 ERP Frontend - Dynamic Form Schemas
// 动态表单模式定义 - 对应Camunda UserTask
// =====================================================

/**
 * 表单字段类型
 */
export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  ENUM = 'enum',
  DATE = 'date',
  BOOLEAN = 'boolean',
  FILE = 'file',
  TABLE = 'table',
}

/**
 * 基础字段配置
 */
export interface BaseField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  validation?: FieldValidation;
  conditionalDisplay?: ConditionalRule;
}

/**
 * 字段验证规则
 */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
}

/**
 * 条件显示规则
 */
export interface ConditionalRule {
  dependsOn: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: unknown;
}

/**
 * 文本字段
 */
export interface TextField extends BaseField {
  type: FieldType.TEXT | FieldType.TEXTAREA;
  maxLength?: number;
  rows?: number;
}

/**
 * 数字字段
 */
export interface NumberField extends BaseField {
  type: FieldType.NUMBER;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * 枚举字段（下拉选择）
 */
export interface EnumField extends BaseField {
  type: FieldType.ENUM;
  options: EnumOption[];
}

/**
 * 枚举选项
 */
export interface EnumOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * 日期字段
 */
export interface DateField extends BaseField {
  type: FieldType.DATE;
  dateFormat?: string;
  minDate?: string;
  maxDate?: string;
}

/**
 * 布尔字段
 */
export interface BooleanField extends BaseField {
  type: FieldType.BOOLEAN;
  checkboxStyle?: 'switch' | 'checkbox';
}

/**
 * 表格字段
 */
export interface TableField extends BaseField {
  type: FieldType.TABLE;
  columns: TableColumn[];
  editable?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

/**
 * 表格列配置
 */
export interface TableColumn {
  key: string;
  label: string;
  type: FieldType;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * 订单信息只读字段组
 */
export interface OrderInfoSection {
  type: 'section';
  title: string;
  fields: ReadonlyField[];
}

/**
 * 只读字段
 */
export interface ReadonlyField {
  id: string;
  label: string;
  value: string | number;
}

/**
 * 表单模式（组合多种字段）
 */
export interface FormSchema {
  id: string;
  name: string;
  version: string;
  sections: FormSection[];
  actions: FormAction[];
}

/**
 * 表单区块
 */
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: (TextField | NumberField | EnumField | DateField | BooleanField | TableField)[];
  order: number;
}

/**
 * 表单动作按钮
 */
export interface FormAction {
  id: string;
  label: string;
  type: 'submit' | 'approve' | 'reject' | 'cancel';
  style: 'primary' | 'secondary' | 'danger';
  confirmation?: string;
  nextTask?: string;
}

// ==================== 审批表单模式定义 ====================

/**
 * 部门经理审批表单
 */
export const deptManagerApprovalSchema: FormSchema = {
  id: 'dept-manager-approval-form',
  name: '部门经理审批表单',
  version: '1.0',
  sections: [
    {
      id: 'order-info',
      title: '订单信息',
      order: 1,
      fields: [
        {
          id: 'orderNumber',
          name: 'orderNumber',
          label: '订单号',
          type: FieldType.TEXT,
          readonly: true,
          defaultValue: '${order.orderNumber}',
        },
        {
          id: 'customerName',
          name: 'customerName',
          label: '客户名称',
          type: FieldType.TEXT,
          readonly: true,
          defaultValue: '${order.customer.name}',
        },
        {
          id: 'totalAmount',
          name: 'totalAmount',
          label: '订单金额',
          type: FieldType.NUMBER,
          readonly: true,
          defaultValue: '${order.totalAmount}',
          unit: '元',
        },
        {
          id: 'itemCount',
          name: 'itemCount',
          label: '商品数量',
          type: FieldType.NUMBER,
          readonly: true,
          defaultValue: '${order.items.length}',
        },
      ],
    },
    {
      id: 'approval-section',
      title: '审批操作',
      order: 2,
      fields: [
        {
          id: 'approvalAction',
          name: 'approvalAction',
          label: '审批操作',
          type: FieldType.ENUM,
          required: true,
          options: [
            { value: 'approve', label: '通过' },
            { value: 'reject', label: '拒绝' },
          ],
        },
        {
          id: 'approvalComment',
          name: 'approvalComment',
          label: '审批意见',
          type: FieldType.TEXTAREA,
          required: true,
          placeholder: '请输入审批意见...',
          rows: 4,
          maxLength: 500,
        },
      ],
    },
  ],
  actions: [
    {
      id: 'submit',
      label: '提交审批',
      type: 'submit',
      style: 'primary',
      confirmation: '确认提交审批结果？',
    },
    {
      id: 'cancel',
      label: '取消',
      type: 'cancel',
      style: 'secondary',
    },
  ],
};

/**
 * 总监审批表单
 */
export const directorApprovalSchema: FormSchema = {
  id: 'director-approval-form',
  name: '总监审批表单',
  version: '1.0',
  sections: [
    {
      id: 'order-info',
      title: '订单信息',
      order: 1,
      fields: [
        {
          id: 'orderNumber',
          name: 'orderNumber',
          label: '订单号',
          type: FieldType.TEXT,
          readonly: true,
          defaultValue: '${order.orderNumber}',
        },
        {
          id: 'customerName',
          name: 'customerName',
          label: '客户名称',
          type: FieldType.TEXT,
          readonly: true,
          defaultValue: '${order.customer.name}',
        },
        {
          id: 'totalAmount',
          name: 'totalAmount',
          label: '订单金额',
          type: FieldType.NUMBER,
          readonly: true,
          defaultValue: '${order.totalAmount}',
          unit: '元',
        },
        {
          id: 'deptApproval',
          name: 'deptApproval',
          label: '部门经理审批意见',
          type: FieldType.TEXTAREA,
          readonly: true,
        },
        {
          id: 'approvalHistory',
          name: 'approvalHistory',
          label: '审批历史',
          type: FieldType.TABLE,
          columns: [
            { key: 'approver', label: '审批人', type: FieldType.TEXT },
            { key: 'action', label: '操作', type: FieldType.TEXT },
            { key: 'comment', label: '意见', type: FieldType.TEXT },
            { key: 'timestamp', label: '时间', type: FieldType.DATE },
          ],
        },
      ],
    },
    {
      id: 'approval-section',
      title: '审批操作',
      order: 2,
      fields: [
        {
          id: 'approvalAction',
          name: 'approvalAction',
          label: '审批操作',
          type: FieldType.ENUM,
          required: true,
          options: [
            { value: 'approve', label: '通过' },
            { value: 'reject', label: '拒绝' },
          ],
        },
        {
          id: 'approvalComment',
          name: 'approvalComment',
          label: '审批意见',
          type: FieldType.TEXTAREA,
          required: true,
          placeholder: '请输入审批意见...',
          rows: 4,
          maxLength: 500,
        },
      ],
    },
  ],
  actions: [
    {
      id: 'submit',
      label: '提交审批',
      type: 'submit',
      style: 'primary',
      confirmation: '确认提交审批结果？',
    },
    {
      id: 'cancel',
      label: '取消',
      type: 'cancel',
      style: 'secondary',
    },
  ],
};

/**
 * VP/总经理审批表单
 */
export const vpApprovalSchema: FormSchema = {
  id: 'vp-approval-form',
  name: 'VP/总经理审批表单',
  version: '1.0',
  sections: [
    {
      id: 'order-info',
      title: '订单信息',
      order: 1,
      fields: [
        {
          id: 'orderNumber',
          name: 'orderNumber',
          label: '订单号',
          type: FieldType.TEXT,
          readonly: true,
          defaultValue: '${order.orderNumber}',
        },
        {
          id: 'customerName',
          name: 'customerName',
          label: '客户名称',
          type: FieldType.TEXT,
          readonly: true,
          defaultValue: '${order.customer.name}',
        },
        {
          id: 'totalAmount',
          name: 'totalAmount',
          label: '订单金额',
          type: FieldType.NUMBER,
          readonly: true,
          defaultValue: '${order.totalAmount}',
          unit: '元',
        },
        {
          id: 'customerCredit',
          name: 'customerCredit',
          label: '客户信用评级',
          type: FieldType.TEXT,
          readonly: true,
          defaultValue: '${order.customer.creditRating}',
        },
        {
          id: 'approvalHistory',
          name: 'approvalHistory',
          label: '审批历史',
          type: FieldType.TABLE,
          columns: [
            { key: 'approver', label: '审批人', type: FieldType.TEXT },
            { key: 'level', label: '级别', type: FieldType.TEXT },
            { key: 'action', label: '操作', type: FieldType.TEXT },
            { key: 'comment', label: '意见', type: FieldType.TEXT },
            { key: 'timestamp', label: '时间', type: FieldType.DATE },
          ],
        },
      ],
    },
    {
      id: 'approval-section',
      title: '审批操作',
      order: 2,
      fields: [
        {
          id: 'approvalAction',
          name: 'approvalAction',
          label: '审批操作',
          type: FieldType.ENUM,
          required: true,
          options: [
            { value: 'approve', label: '通过' },
            { value: 'reject', label: '拒绝' },
          ],
        },
        {
          id: 'approvalComment',
          name: 'approvalComment',
          label: '审批意见',
          type: FieldType.TEXTAREA,
          required: true,
          placeholder: '请输入审批意见...',
          rows: 4,
          maxLength: 500,
        },
        {
          id: 'vipApproval',
          name: 'vipApproval',
          label: '特殊审批标记',
          type: FieldType.BOOLEAN,
          checkboxStyle: 'switch',
          conditionalDisplay: {
            dependsOn: 'totalAmount',
            operator: 'greaterThan',
            value: 500000,
          },
        },
      ],
    },
  ],
  actions: [
    {
      id: 'submit',
      label: '提交审批',
      type: 'submit',
      style: 'primary',
      confirmation: '确认提交审批结果？',
    },
    {
      id: 'cancel',
      label: '取消',
      type: 'cancel',
      style: 'secondary',
    },
  ],
};

/**
 * 表单模式仓库
 */
export const formSchemaRepository: Record<string, FormSchema> = {
  'dept-manager-approval-form': deptManagerApprovalSchema,
  'director-approval-form': directorApprovalSchema,
  'vp-approval-form': vpApprovalSchema,
};

/**
 * 根据表单Key获取模式
 */
export function getFormSchema(formKey: string): FormSchema | null {
  return formSchemaRepository[formKey] || null;
}
