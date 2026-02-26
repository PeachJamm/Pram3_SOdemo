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
        if (!components)
            return result;
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
        // 检查条件显示
        if (component.conditional) {
            const shouldShow = this.evaluateConditional(component.conditional, variables);
            if (!shouldShow) {
                return null;
            }
        }
        // 复制组件，避免修改原始数据
        const processed = { ...component };
        // 应用权限规则
        const permission = component.properties?.permission;
        if (permission && permission[permissionLevel]) {
            const permConfig = permission[permissionLevel];
            // 检查是否可见
            if (permConfig.visible === false) {
                return null;
            }
            // 应用readonly属性
            processed.readonly = permConfig.readonly;
        }
        else {
            // 使用默认权限规则
            this.applyDefaultPermission(processed, permissionLevel);
        }
        // 递归处理子组件
        if (component.components && component.components.length > 0) {
            processed.components = this.processComponents(component.components, permissionLevel, variables);
            // 如果容器组件的所有子组件都被移除了，且容器本身没有key（不是输入组件），则移除容器
            if (processed.components.length === 0 && !component.key) {
                return null;
            }
        }
        // 替换变量占位符（在 label、text 等字段中）
        if (processed.label) {
            processed.label = this.replaceVariables(processed.label, variables);
        }
        if (processed.text) {
            processed.text = this.replaceVariables(processed.text, variables);
        }
        if (processed.content) {
            processed.content = this.replaceVariables(processed.content, variables);
        }
        // 填充表单值
        if (component.key && variables[component.key] !== undefined) {
            processed.value = variables[component.key];
        }
        return processed;
    }
    /**
     * 应用默认权限规则
     * 当字段没有配置permission属性时使用
     */
    applyDefaultPermission(component, permissionLevel) {
        // 对于没有明确权限配置的字段，使用保守策略
        switch (permissionLevel) {
            case 'VIEW':
                // VIEW权限：所有字段只读
                component.readonly = true;
                break;
            case 'EDIT':
                // EDIT权限：根据组件类型判断
                // 审批相关字段默认只读
                if (component.key?.includes('approval') ||
                    component.key?.includes('comment') ||
                    component.key?.includes('decision')) {
                    component.readonly = true;
                }
                else {
                    component.readonly = false;
                }
                break;
            case 'APPROVE':
                // APPROVE权限：审批字段可编辑，其他业务字段只读
                if (component.key?.includes('approval') ||
                    component.key?.includes('comment') ||
                    component.key?.includes('decision')) {
                    component.readonly = false;
                }
                else {
                    component.readonly = true;
                }
                break;
        }
    }
    /**
     * 评估条件显示规则
     */
    evaluateConditional(conditional, variables) {
        if (!conditional || !conditional.when) {
            return true;
        }
        const { when, eq, show } = conditional;
        const value = variables[when];
        const matches = eq !== undefined ? value === eq : !!value;
        return show === false ? !matches : matches;
    }
    /**
     * 替换变量占位符
     * 支持 {{variableName}} 和 {{variableName.property}} 格式
     */
    replaceVariables(text, variables) {
        return text.replace(/\{\{(\w+)(?:\.(\w+))?\}\}/g, (match, varName, propName) => {
            const value = variables[varName];
            if (value === undefined || value === null) {
                return match;
            }
            if (propName) {
                const propValue = value[propName];
                return propValue !== undefined ? String(propValue) : match;
            }
            return String(value);
        });
    }
    /**
     * 获取表单字段列表（用于前端动态渲染）
     */
    extractFormFields(formSchema) {
        const fields = [];
        const extractFromComponents = (components) => {
            if (!components)
                return;
            for (const comp of components) {
                if (comp.key && comp.type !== 'button') {
                    fields.push({
                        key: comp.key,
                        label: comp.label,
                        type: comp.type,
                        required: comp.validate?.required,
                    });
                }
                // 递归处理子组件
                if (comp.components) {
                    extractFromComponents(comp.components);
                }
            }
        };
        extractFromComponents(formSchema.components);
        return fields;
    }
}
exports.FormRendererService = FormRendererService;
//# sourceMappingURL=form-renderer.service.js.map