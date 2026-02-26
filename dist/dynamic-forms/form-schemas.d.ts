/**
 * 琛ㄥ崟瀛楁绫诲瀷
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
 * 鍩虹瀛楁閰嶇疆
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
 * 瀛楁楠岃瘉瑙勫垯
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
 * 鏉′欢鏄剧ず瑙勫垯
 */
export interface ConditionalRule {
    dependsOn: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: unknown;
}
/**
 * 鏂囨湰瀛楁
 */
export interface TextField extends BaseField {
    type: FieldType.TEXT | FieldType.TEXTAREA;
    maxLength?: number;
    rows?: number;
}
/**
 * 鏁板瓧瀛楁
 */
export interface NumberField extends BaseField {
    type: FieldType.NUMBER;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
}
/**
 * 鏋氫妇瀛楁锛堜笅鎷夐€夋嫨锛? */
export interface EnumField extends BaseField {
    type: FieldType.ENUM;
    options: EnumOption[];
}
/**
 * 鏋氫妇閫夐」
 */
export interface EnumOption {
    value: string;
    label: string;
    disabled?: boolean;
}
/**
 * 鏃ユ湡瀛楁
 */
export interface DateField extends BaseField {
    type: FieldType.DATE;
    dateFormat?: string;
    minDate?: string;
    maxDate?: string;
}
/**
 * 甯冨皵瀛楁
 */
export interface BooleanField extends BaseField {
    type: FieldType.BOOLEAN;
    checkboxStyle?: 'switch' | 'checkbox';
}
/**
 * 琛ㄦ牸瀛楁
 */
export interface TableField extends BaseField {
    type: FieldType.TABLE;
    columns: TableColumn[];
    editable?: boolean;
    pagination?: boolean;
    pageSize?: number;
}
/**
 * 琛ㄦ牸鍒楅厤缃? */
export interface TableColumn {
    key: string;
    label: string;
    type: FieldType;
    width?: string;
    align?: 'left' | 'center' | 'right';
}
/**
 * 璁㈠崟淇℃伅鍙瀛楁缁? */
export interface OrderInfoSection {
    type: 'section';
    title: string;
    fields: ReadonlyField[];
}
/**
 * 鍙瀛楁
 */
export interface ReadonlyField {
    id: string;
    label: string;
    value: string | number;
}
/**
 * 琛ㄥ崟妯″紡锛堢粍鍚堝绉嶅瓧娈碉級
 */
export interface FormSchema {
    id: string;
    name: string;
    version: string;
    sections: FormSection[];
    actions: FormAction[];
}
/**
 * 琛ㄥ崟鍖哄潡
 */
export interface FormSection {
    id: string;
    title: string;
    description?: string;
    fields: (TextField | NumberField | EnumField | DateField | BooleanField | TableField)[];
    order: number;
}
/**
 * 琛ㄥ崟鍔ㄤ綔鎸夐挳
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
 * 閮ㄩ棬缁忕悊瀹℃壒琛ㄥ崟
 */
export declare const deptManagerApprovalSchema: FormSchema;
/**
 * 鎬荤洃瀹℃壒琛ㄥ崟
 */
export declare const directorApprovalSchema: FormSchema;
/**
 * VP/鎬荤粡鐞嗗鎵硅〃鍗? */
export declare const vpApprovalSchema: FormSchema;
/**
 * 琛ㄥ崟妯″紡浠撳簱
 */
export declare const formSchemaRepository: Record<string, FormSchema>;
/**
 * 鏍规嵁琛ㄥ崟Key鑾峰彇妯″紡
 */
export declare function getFormSchema(formKey: string): FormSchema | null;
//# sourceMappingURL=form-schemas.d.ts.map