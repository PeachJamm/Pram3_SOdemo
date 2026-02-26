import { PermissionLevel } from '../database/services/user.service';
/**
 * 表单字段权限配置
 */
interface FieldPermission {
    VIEW: {
        visible: boolean;
        readonly: boolean;
    };
    EDIT: {
        visible: boolean;
        readonly: boolean;
    };
    APPROVE: {
        visible: boolean;
        readonly: boolean;
    };
}
/**
 * 表单组件定义
 */
interface FormComponent {
    id: string;
    label: string;
    type: string;
    key?: string;
    readonly?: boolean;
    properties?: {
        permission?: FieldPermission;
        [key: string]: any;
    };
    components?: FormComponent[];
    conditional?: any;
    [key: string]: any;
}
/**
 * 表单Schema
 */
interface FormSchema {
    id: string;
    name: string;
    components: FormComponent[];
    properties?: {
        taskType?: string;
        assigneeSource?: string;
        supportedPermissions?: string[];
        [key: string]: any;
    };
}
/**
 * 渲染后的表单
 */
interface RenderedForm {
    formId: string;
    formName: string;
    permissionLevel: PermissionLevel;
    components: FormComponent[];
    variables: Record<string, any>;
    taskInfo: {
        taskId: string;
        taskType: string;
        assignee: string | null;
    };
}
export declare class FormRendererService {
    private formsBasePath;
    constructor();
    /**
     * 加载表单定义（从Camunda部署的文件或本地文件）
     * 实际项目中应该从Camunda API获取，这里简化从本地读取
     */
    loadFormSchema(formKey: string): Promise<FormSchema | null>;
    /**
     * 根据权限级别渲染表单
     * @param formSchema 表单定义
     * @param permissionLevel 用户权限级别
     * @param variables 流程变量（用于填充表单值）
     * @param taskInfo 任务信息
     */
    renderForm(formSchema: FormSchema, permissionLevel: PermissionLevel, variables: Record<string, any> | undefined, taskInfo: {
        taskId: string;
        taskType: string;
        assignee: string | null;
    }): RenderedForm;
    /**
     * 递归处理组件列表
     */
    private processComponents;
    /**
     * 处理单个组件
     * 返回 null 表示该组件应该被移除（无权限查看）
     */
    private processComponent;
    /**
     * 应用默认权限规则
     * 当字段没有配置permission属性时使用
     */
    private applyDefaultPermission;
    /**
     * 评估条件显示规则
     */
    private evaluateConditional;
    /**
     * 替换变量占位符
     * 支持 {{variableName}} 和 {{variableName.property}} 格式
     */
    private replaceVariables;
    /**
     * 获取表单字段列表（用于前端动态渲染）
     */
    extractFormFields(formSchema: FormSchema): Array<{
        key: string;
        label: string;
        type: string;
        required?: boolean;
    }>;
}
export {};
//# sourceMappingURL=form-renderer.service.d.ts.map