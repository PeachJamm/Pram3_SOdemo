/**
 * 渲染上下文
 */
export interface RenderContext {
    orderData: Record<string, unknown>;
    formData: Record<string, unknown>;
    userInfo: {
        id: string;
        name: string;
        role: string;
    };
}
/**
 * 渲染结果
 */
export interface RenderResult {
    html: string;
    scripts: string[];
    styles: string[];
}
/**
 * 动态表单渲染器
 */
export declare class FormRenderer {
    private context;
    constructor(context: RenderContext);
    /**
     * 渲染表单
     */
    render(formKey: string): RenderResult;
    /**
     * 渲染表单区块
     */
    private renderSection;
    /**
     * 渲染字段
     */
    private renderField;
    /**
     * 渲染文本字段
     */
    private renderTextField;
    /**
     * 渲染多行文本字段
     */
    private renderTextareaField;
    /**
     * 渲染数字字段
     */
    private renderNumberField;
    /**
     * 渲染枚举字段
     */
    private renderEnumField;
    /**
     * 渲染日期字段
     */
    private renderDateField;
    /**
     * 渲染布尔字段
     */
    private renderBooleanField;
    /**
     * 渲染表格字段
     */
    private renderTableField;
    /**
     * 渲染操作按钮
     */
    private renderActions;
    /**
     * 获取字段值
     */
    private getFieldValue;
    /**
     * 判断字段是否可见
     */
    private isFieldVisible;
    /**
     * 渲染错误信息
     */
    private renderError;
}
/**
 * 根据表单Key和上下文渲染表单
 */
export declare function renderForm(formKey: string, orderData: Record<string, unknown>, formData: Record<string, unknown>): RenderResult;
//# sourceMappingURL=form-renderer.d.ts.map