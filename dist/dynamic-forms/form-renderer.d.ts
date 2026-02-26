/**
 * 娓叉煋涓婁笅鏂? */
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
 * 娓叉煋缁撴灉
 */
export interface RenderResult {
    html: string;
    scripts: string[];
    styles: string[];
}
/**
 * 鍔ㄦ€佽〃鍗曟覆鏌撳櫒
 */
export declare class FormRenderer {
    private context;
    constructor(context: RenderContext);
    /**
     * 娓叉煋琛ㄥ崟
     */
    render(formKey: string): RenderResult;
    /**
     * 娓叉煋琛ㄥ崟鍖哄潡
     */
    private renderSection;
    /**
     * 娓叉煋瀛楁
     */
    private renderField;
    /**
     * 娓叉煋鏂囨湰瀛楁
     */
    private renderTextField;
    /**
     * 娓叉煋澶氳鏂囨湰瀛楁
     */
    private renderTextareaField;
    /**
     * 娓叉煋鏁板瓧瀛楁
     */
    private renderNumberField;
    /**
     * 娓叉煋鏋氫妇瀛楁
     */
    private renderEnumField;
    /**
     * 娓叉煋鏃ユ湡瀛楁
     */
    private renderDateField;
    /**
     * 娓叉煋甯冨皵瀛楁
     */
    private renderBooleanField;
    /**
     * 娓叉煋琛ㄦ牸瀛楁
     */
    private renderTableField;
    /**
     * 娓叉煋鎿嶄綔鎸夐挳
     */
    private renderActions;
    /**
     * 鑾峰彇瀛楁鍊?   */
    private getFieldValue;
    /**
     * 鍒ゆ柇瀛楁鏄惁鍙
     */
    private isFieldVisible;
    /**
     * 娓叉煋閿欒淇℃伅
     */
    private renderError;
}
/**
 * 鏍规嵁琛ㄥ崟Key鍜屼笂涓嬫枃娓叉煋琛ㄥ崟
 */
export declare function renderForm(formKey: string, orderData: Record<string, unknown>, formData: Record<string, unknown>): RenderResult;
//# sourceMappingURL=form-renderer.d.ts.map