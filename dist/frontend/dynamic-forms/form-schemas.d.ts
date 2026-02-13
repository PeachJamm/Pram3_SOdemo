/**
 * 表单字段类型
 */
export declare enum FieldType {
    TEXT = "text",
    TEXTAREA = "textarea",
    NUMBER = "number",
    ENUM = "enum",
    DATE = "date",
    BOOLEAN = "boolean",
    FILE = "file",
    TABLE = "table"
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
/**
 * 部门经理审批表单
 */
export declare const deptManagerApprovalSchema: FormSchema;
/**
 * 总监审批表单
 */
export declare const directorApprovalSchema: FormSchema;
/**
 * VP/总经理审批表单
 */
export declare const vpApprovalSchema: FormSchema;
/**
 * 表单模式仓库
 */
export declare const formSchemaRepository: Record<string, FormSchema>;
/**
 * 根据表单Key获取模式
 */
export declare function getFormSchema(formKey: string): FormSchema | null;
//# sourceMappingURL=form-schemas.d.ts.map