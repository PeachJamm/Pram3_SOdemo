"use strict";
// =====================================================
// Form Renderer Service
// 表单渲染服务 - 权限过滤和表单处理
// =====================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormRendererService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class FormRendererService {
    constructor() {
        // 使用项目根目录，兼容开发和生产环境
        const projectRoot = process.cwd();
        this.formsBasePath = path.join(projectRoot, 'src', 'camunda', 'forms');
    }
    /**
     * 加载表单定义（从Camunda部署的文件或本地文件）
     * 实际项目中应该从Camunda API获取，这里简化从本地读取
     */
    async loadFormSchema(formKey) {
        const formPath = path.join(this.formsBasePath, `${formKey}.form`);
        if (!fs.existsSync(formPath)) {
            console.error(`[FormRenderer] Form not found: ${formKey}`);
            return null;
        }
        try {
            const formContent = fs.readFileSync(formPath, 'utf-8');
            const formSchema = JSON.parse(formContent);
            return formSchema;
        }
        catch (error) {
            console.error(`[FormRenderer] Failed to load form: ${formKey}`, error);
            return null;
        }
    }
    /**
     * 根据权限级别渲染表单
     * @param formSchema 表单定义
     * @param permissionLevel 用户权限级别
     * @param variables 流程变量（用于填充表单值）
     * @param taskInfo 任务信息
     */
    renderForm(formSchema, permissionLevel, variables = {}, taskInfo) {
        // 递归处理组件，应用权限过滤
        const processedComponents = this.processComponents(formSchema.components, permissionLevel, variables);
        return {
            formId: formSchema.id,
            formName: formSchema.name,
            permissionLevel,
            components: processedComponents,
            variables,
            taskInfo,
        };
    }
    /**
     * 递归处理组件列表
     */
    processComponents(components, permissionLevel, variables) {
        const result = [];
        for (const component of components) {
            const processed = this.processComponent(component, permissionLevel, variables);
            if (processed) {
                result.push(processed);
            }
        }
        return result;
    }
    /**
     * 处理单个组件
     * 返回 null 表示该组件应该被移除（无权限查看）
     */
    processComponent(component, permissionLevel, variables) {
        // 1. 检查字段级权限配置
        const fieldPermission = component.properties?.permission?.[permissionLevel];
        if (fieldPermission) {
            // 如果该权限级别不可见，直接返回null（移除该组件）
            if (fieldPermission.visible === false) {
                return null;
            }
            // 应用readonly设置
            component = {
                ...component,
                readonly: fieldPermission.readonly,
            };
        }
        else {
            // 如果没有配置权限，使用默认规则
            component = this.applyDefaultPermission(component, permissionLevel);
        }
        // 2. 替换变量占位符（如 {{orderNumber}}）
        if (component.text) {
            component.text = this.replaceVariables(component.text, variables);
        }
        if (component.content) {
            component.content = this.replaceVariables(component.content, variables);
        }
        // 3. 填充表单值
        if (component.key && variables[component.key] !== undefined) {
            component.value = variables[component.key];
        }
        // 4. 递归处理子组件（group类型）
        if (component.components && component.components.length > 0) {
            component.components = this.processComponents(component.components, permissionLevel, variables);
            // 如果子组件全部被移除，且当前组件是group，考虑是否保留
            if (component.components.length === 0 && component.type === 'group') {
                // 保留空组，可能用于布局
            }
        }
        return component;
    }
    /**
     * 应用默认权限规则
     * 当字段没有配置permission属性时使用
     */
    applyDefaultPermission(component, permissionLevel) {
        // 默认规则：
        // - VIEW: 所有字段只读
        // - EDIT: 输入字段可编辑，其他只读
        // - APPROVE: 业务字段只读，审批字段可编辑
        const inputTypes = ['textfield', 'textarea', 'number', 'select', 'radio', 'checkbox'];
        const isInputField = inputTypes.includes(component.type);
        const isApprovalField = component.key?.includes('approval') ||
            component.key?.includes('decision') ||
            component.key?.includes('comment');
        switch (permissionLevel) {
            case 'VIEW':
                return { ...component, readonly: true };
            case 'EDIT':
                if (isApprovalField) {
                    // 编辑模式下隐藏审批字段
                    return { ...component, _hidden: true };
                }
                return {
                    ...component,
                    readonly: !isInputField || component.type === 'html' || component.type === 'text'
                };
            case 'APPROVE':
                if (isApprovalField) {
                    // 审批字段可编辑
                    return { ...component, readonly: false };
                }
                // 业务字段只读
                return { ...component, readonly: true };
            default:
                return component;
        }
    }
    /**
     * 替换变量占位符
     * 支持 {{variableName}} 和 {{variableName.property}} 格式
     */
    replaceVariables(text, variables) {
        if (!text)
            return text;
        return text.replace(/\{\{(\w+)(?:\.(\w+))?\}\}/g, (match, key, subKey) => {
            const value = variables[key];
            if (value === undefined || value === null) {
                return match; // 保留原占位符
            }
            if (subKey && typeof value === 'object') {
                return value[subKey] !== undefined ? String(value[subKey]) : match;
            }
            return String(value);
        });
    }
    /**
     * 获取表单字段列表（用于前端动态渲染）
     */
    extractFormFields(formSchema) {
        const fields = [];
        const extract = (components) => {
            for (const component of components) {
                if (component.key) {
                    fields.push({
                        key: component.key,
                        label: component.label,
                        type: component.type,
                        required: component.validate?.required === true,
                    });
                }
                if (component.components) {
                    extract(component.components);
                }
            }
        };
        extract(formSchema.components);
        return fields;
    }
}
exports.FormRendererService = FormRendererService;
//# sourceMappingURL=form-renderer.service.js.map