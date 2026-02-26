"use strict";
// =====================================================
// PRAM3 ERP Frontend - Dynamic Form Renderer
// 鍔ㄦ€佽〃鍗曟覆鏌撳紩鎿?// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormRenderer = void 0;
exports.renderForm = renderForm;
const form_schemas_1 = require("./form-schemas");
/**
 * 鍔ㄦ€佽〃鍗曟覆鏌撳櫒
 */
class FormRenderer {
    constructor(context) {
        this.context = context;
    }
    /**
     * 娓叉煋琛ㄥ崟
     */
    render(formKey) {
        const schema = (0, form_schemas_1.getFormSchema)(formKey);
        if (!schema) {
            return this.renderError('琛ㄥ崟妯″紡涓嶅瓨鍦? ' + formKey);
        }
        let html = '<form id="dynamic-form" data-form-id="' + schema.id + '" data-form-version="' + schema.version + '">' +
            '<input type="hidden" name="formKey" value="' + schema.id + '" />' +
            '<input type="hidden" name="formVersion" value="' + schema.version + '" />' +
            '<div class="form-header">' +
            '<h2>' + schema.name + '</h2>' +
            '<p class="form-description">璇峰～鍐欎互涓嬩俊鎭畬鎴愬鎵?/p>' +
            '</div>';
        // 鎸夐『搴忔覆鏌撴墍鏈夊尯鍧?    const sortedSections = [...schema.sections].sort((a, b) => a.order - b.order);
        for (const section of sortedSections) {
            html += this.renderSection(section);
        }
        // 娓叉煋鎿嶄綔鎸夐挳
        html += this.renderActions(schema.actions);
        html += '</form>';
        html += '<script>' +
            'document.addEventListener("DOMContentLoaded", function() {' +
            'const form = document.getElementById("dynamic-form");' +
            'const formRenderer = new DynamicFormRenderer(form);' +
            'formRenderer.init();' +
            '});' +
            '</script>';
        return {
            html: html,
            scripts: ['/static/scripts/dynamic-form-validator.js', '/static/scripts/dynamic-form-handler.js'],
            styles: ['/static/styles/dynamic-forms.css'],
        };
    }
    /**
     * 娓叉煋琛ㄥ崟鍖哄潡
     */
    renderSection(section) {
        let html = '<div class="form-section" data-section-id="' + section.id + '">' +
            '<h3 class="section-title">' + section.title + '</h3>';
        if (section.description) {
            html += '<p class="section-description">' + section.description + '</p>';
        }
        for (const field of section.fields) {
            html += this.renderField(field);
        }
        html += '</div>';
        return html;
    }
    /**
     * 娓叉煋瀛楁
     */
    renderField(field) {
        const value = this.getFieldValue(field.id);
        const isVisible = this.isFieldVisible(field);
        if (!isVisible) {
            return '<div class="field-hidden" data-field-id="' + field.id + '"></div>';
        }
        let html = '<div class="form-field" data-field-id="' + field.id + '" data-field-type="' + field.type + '">' +
            '<label for="' + field.id + '" class="field-label">' +
            field.label +
            (field.required ? '<span class="required-mark">*</span>' : '') +
            '</label>';
        switch (field.type) {
            case form_schemas_1.FieldType.TEXT:
                html += this.renderTextField(field, value);
                break;
            case form_schemas_1.FieldType.TEXTAREA:
                html += this.renderTextareaField(field, value);
                break;
            case form_schemas_1.FieldType.NUMBER:
                html += this.renderNumberField(field, value);
                break;
            case form_schemas_1.FieldType.ENUM:
                html += this.renderEnumField(field, value);
                break;
            case form_schemas_1.FieldType.DATE:
                html += this.renderDateField(field, value);
                break;
            case form_schemas_1.FieldType.BOOLEAN:
                html += this.renderBooleanField(field, value);
                break;
            case form_schemas_1.FieldType.TABLE:
                html += this.renderTableField(field, value);
                break;
        }
        html += '</div>';
        return html;
    }
    /**
     * 娓叉煋鏂囨湰瀛楁
     */
    renderTextField(field, value) {
        const readonlyAttr = field.readonly ? 'readonly' : '';
        const requiredAttr = field.required ? 'required' : '';
        const maxLengthAttr = field.maxLength ? 'maxlength="' + field.maxLength + '"' : '';
        const defaultValue = value || field.defaultValue || '';
        return '<input type="text" id="' + field.id + '" name="' + field.name + '" ' +
            'class="form-input" placeholder="' + (field.placeholder || '') + '" ' +
            'value="' + defaultValue + '" ' + readonlyAttr + ' ' + requiredAttr + ' ' + maxLengthAttr + ' />';
    }
    /**
     * 娓叉煋澶氳鏂囨湰瀛楁
     */
    renderTextareaField(field, value) {
        const readonlyAttr = field.readonly ? 'readonly' : '';
        const requiredAttr = field.required ? 'required' : '';
        const maxLengthAttr = field.maxLength ? 'maxlength="' + field.maxLength + '"' : '';
        const rows = field.rows || 3;
        const defaultValue = value || field.defaultValue || '';
        return '<textarea id="' + field.id + '" name="' + field.name + '" ' +
            'class="form-textarea" placeholder="' + (field.placeholder || '') + '" ' +
            'rows="' + rows + '" ' + readonlyAttr + ' ' + requiredAttr + ' ' + maxLengthAttr + '>' + defaultValue + '</textarea>';
    }
    /**
     * 娓叉煋鏁板瓧瀛楁
     */
    renderNumberField(field, value) {
        const unit = field.unit ? '<span class="input-unit">' + field.unit + '</span>' : '';
        const minAttr = field.min !== undefined ? 'min="' + field.min + '"' : '';
        const maxAttr = field.max !== undefined ? 'max="' + field.max + '"' : '';
        const stepAttr = field.step ? 'step="' + field.step + '"' : '';
        const readonlyAttr = field.readonly ? 'readonly' : '';
        const requiredAttr = field.required ? 'required' : '';
        const defaultValue = value || field.defaultValue || '';
        return '<div class="input-group"><input type="number" id="' + field.id + '" name="' + field.name + '" ' +
            'class="form-input" ' + minAttr + ' ' + maxAttr + ' ' + stepAttr + ' ' +
            'value="' + defaultValue + '" ' + readonlyAttr + ' ' + requiredAttr + ' />' + unit + '</div>';
    }
    /**
     * 娓叉煋鏋氫妇瀛楁
     */
    renderEnumField(field, value) {
        let options = '<option value="">璇烽€夋嫨</option>';
        for (const opt of field.options) {
            options += '<option value="' + opt.value + '"' + (opt.disabled ? 'disabled' : '') + '>' + opt.label + '</option>';
        }
        const requiredAttr = field.required ? 'required' : '';
        return '<select id="' + field.id + '" name="' + field.name + '" class="form-select" ' + requiredAttr + '>' + options + '</select>';
    }
    /**
     * 娓叉煋鏃ユ湡瀛楁
     */
    renderDateField(field, value) {
        const minAttr = field.minDate ? 'min="' + field.minDate + '"' : '';
        const maxAttr = field.maxDate ? 'max="' + field.maxDate + '"' : '';
        const readonlyAttr = field.readonly ? 'readonly' : '';
        const requiredAttr = field.required ? 'required' : '';
        const defaultValue = value || field.defaultValue || '';
        return '<input type="date" id="' + field.id + '" name="' + field.name + '" ' +
            'class="form-input" ' + minAttr + ' ' + maxAttr + ' ' +
            'value="' + defaultValue + '" ' + readonlyAttr + ' ' + requiredAttr + ' />';
    }
    /**
     * 娓叉煋甯冨皵瀛楁
     */
    renderBooleanField(field, value) {
        const isChecked = value === true || value === 'true';
        const readonlyAttr = field.readonly ? 'readonly' : '';
        const style = field.checkboxStyle === 'switch' ? 'switch' : 'checkbox';
        return '<div class="checkbox-wrapper"><input type="checkbox" id="' + field.id + '" ' +
            'name="' + field.name + '" class="' + style + '" ' + (isChecked ? 'checked' : '') + ' ' + readonlyAttr + ' />' +
            '<label for="' + field.id + '">' + field.label + '</label></div>';
    }
    /**
     * 娓叉煋琛ㄦ牸瀛楁
     */
    renderTableField(field, value) {
        let columns = '';
        for (const col of field.columns) {
            columns += '<th style="width: ' + (col.width || 'auto') + '; text-align: ' + (col.align || 'left') + ';">' + col.label + '</th>';
        }
        let rows = '';
        const tableData = Array.isArray(value) ? value : [];
        if (tableData.length > 0) {
            for (const row of tableData) {
                rows += '<tr>';
                for (const col of field.columns) {
                    const rowData = row;
                    rows += '<td>' + (rowData[col.key] || '') + '</td>';
                }
                rows += '</tr>';
            }
        }
        else {
            rows = '<tr><td colspan="' + field.columns.length + '">鏆傛棤鏁版嵁</td></tr>';
        }
        return '<div class="table-wrapper"><table class="form-table"><thead><tr>' + columns + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }
    /**
     * 娓叉煋鎿嶄綔鎸夐挳
     */
    renderActions(actions) {
        let buttons = '';
        for (const action of actions) {
            const confirmationAttr = action.confirmation
                ? 'onclick="return confirm(\'' + action.confirmation + '\')"'
                : '';
            buttons += '<button type="button" class="btn btn-' + action.style + '" ' +
                'data-action="' + action.id + '" data-action-type="' + action.type + '" ' + confirmationAttr + '>' +
                action.label + '</button>';
        }
        return '<div class="form-actions">' + buttons + '</div>';
    }
    /**
     * 鑾峰彇瀛楁鍊?   */
    getFieldValue(fieldId) {
        return this.context.formData[fieldId] ?? this.context.orderData[fieldId];
    }
    /**
     * 鍒ゆ柇瀛楁鏄惁鍙
     */
    isFieldVisible(field) {
        if (!field.conditionalDisplay) {
            return true;
        }
        const rule = field.conditionalDisplay;
        const dependentValue = this.getFieldValue(rule.dependsOn);
        switch (rule.operator) {
            case 'equals':
                return dependentValue === rule.value;
            case 'notEquals':
                return dependentValue !== rule.value;
            case 'contains':
                return String(dependentValue).includes(String(rule.value));
            case 'greaterThan':
                return Number(dependentValue) > Number(rule.value);
            case 'lessThan':
                return Number(dependentValue) < Number(rule.value);
            default:
                return true;
        }
    }
    /**
     * 娓叉煋閿欒淇℃伅
     */
    renderError(message) {
        return {
            html: '<div class="form-error"><p>' + message + '</p></div>',
            scripts: [],
            styles: [],
        };
    }
}
exports.FormRenderer = FormRenderer;
/**
 * 鏍规嵁琛ㄥ崟Key鍜屼笂涓嬫枃娓叉煋琛ㄥ崟
 */
function renderForm(formKey, orderData, formData) {
    const renderer = new FormRenderer({
        orderData: orderData,
        formData: formData,
        userInfo: {
            id: 'current-user',
            name: '褰撳墠鐢ㄦ埛',
            role: 'approver',
        },
    });
    return renderer.render(formKey);
}
//# sourceMappingURL=form-renderer.js.map