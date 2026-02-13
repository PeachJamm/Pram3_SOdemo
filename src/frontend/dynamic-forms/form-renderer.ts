// =====================================================
// PRAM3 ERP Frontend - Dynamic Form Renderer
// 动态表单渲染引擎
// =====================================================

import {
  FormSchema,
  FormSection,
  FormAction,
  FieldType,
  TextField,
  NumberField,
  EnumField,
  DateField,
  BooleanField,
  TableField,
  getFormSchema,
} from './form-schemas';

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
export class FormRenderer {
  private context: RenderContext;

  constructor(context: RenderContext) {
    this.context = context;
  }

  /**
   * 渲染表单
   */
  render(formKey: string): RenderResult {
    const schema = getFormSchema(formKey);
    if (!schema) {
      return this.renderError('表单模式不存在: ' + formKey);
    }

    let html = '<form id="dynamic-form" data-form-id="' + schema.id + '" data-form-version="' + schema.version + '">' +
      '<input type="hidden" name="formKey" value="' + schema.id + '" />' +
      '<input type="hidden" name="formVersion" value="' + schema.version + '" />' +
      '<div class="form-header">' +
      '<h2>' + schema.name + '</h2>' +
      '<p class="form-description">请填写以下信息完成审批</p>' +
      '</div>';
    
    // 按顺序渲染所有区块
    const sortedSections = [...schema.sections].sort((a, b) => a.order - b.order);
    
    for (const section of sortedSections) {
      html += this.renderSection(section);
    }

    // 渲染操作按钮
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
   * 渲染表单区块
   */
  private renderSection(section: FormSection): string {
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
   * 渲染字段
   */
  private renderField(field: TextField | NumberField | EnumField | DateField | BooleanField | TableField): string {
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
      case FieldType.TEXT:
        html += this.renderTextField(field as TextField, value);
        break;
      case FieldType.TEXTAREA:
        html += this.renderTextareaField(field as TextField, value);
        break;
      case FieldType.NUMBER:
        html += this.renderNumberField(field as NumberField, value);
        break;
      case FieldType.ENUM:
        html += this.renderEnumField(field as EnumField, value);
        break;
      case FieldType.DATE:
        html += this.renderDateField(field as DateField, value);
        break;
      case FieldType.BOOLEAN:
        html += this.renderBooleanField(field as BooleanField, value);
        break;
      case FieldType.TABLE:
        html += this.renderTableField(field as TableField, value);
        break;
    }

    html += '</div>';
    return html;
  }

  /**
   * 渲染文本字段
   */
  private renderTextField(field: TextField, value: unknown): string {
    const readonlyAttr = field.readonly ? 'readonly' : '';
    const requiredAttr = field.required ? 'required' : '';
    const maxLengthAttr = field.maxLength ? 'maxlength="' + field.maxLength + '"' : '';
    const defaultValue = value || field.defaultValue || '';
    
    return '<input type="text" id="' + field.id + '" name="' + field.name + '" ' +
      'class="form-input" placeholder="' + (field.placeholder || '') + '" ' +
      'value="' + defaultValue + '" ' + readonlyAttr + ' ' + requiredAttr + ' ' + maxLengthAttr + ' />';
  }

  /**
   * 渲染多行文本字段
   */
  private renderTextareaField(field: TextField, value: unknown): string {
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
   * 渲染数字字段
   */
  private renderNumberField(field: NumberField, value: unknown): string {
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
   * 渲染枚举字段
   */
  private renderEnumField(field: EnumField, value: unknown): string {
    let options = '<option value="">请选择</option>';
    for (const opt of field.options) {
      options += '<option value="' + opt.value + '"' + (opt.disabled ? 'disabled' : '') + '>' + opt.label + '</option>';
    }
    
    const requiredAttr = field.required ? 'required' : '';
    return '<select id="' + field.id + '" name="' + field.name + '" class="form-select" ' + requiredAttr + '>' + options + '</select>';
  }

  /**
   * 渲染日期字段
   */
  private renderDateField(field: DateField, value: unknown): string {
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
   * 渲染布尔字段
   */
  private renderBooleanField(field: BooleanField, value: unknown): string {
    const isChecked = value === true || value === 'true';
    const readonlyAttr = field.readonly ? 'readonly' : '';
    const style = field.checkboxStyle === 'switch' ? 'switch' : 'checkbox';
    
    return '<div class="checkbox-wrapper"><input type="checkbox" id="' + field.id + '" ' +
      'name="' + field.name + '" class="' + style + '" ' + (isChecked ? 'checked' : '') + ' ' + readonlyAttr + ' />' +
      '<label for="' + field.id + '">' + field.label + '</label></div>';
  }

  /**
   * 渲染表格字段
   */
  private renderTableField(field: TableField, value: unknown): string {
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
          const rowData = row as Record<string, unknown>;
          rows += '<td>' + (rowData[col.key] || '') + '</td>';
        }
        rows += '</tr>';
      }
    } else {
      rows = '<tr><td colspan="' + field.columns.length + '">暂无数据</td></tr>';
    }

    return '<div class="table-wrapper"><table class="form-table"><thead><tr>' + columns + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /**
   * 渲染操作按钮
   */
  private renderActions(actions: FormAction[]): string {
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
   * 获取字段值
   */
  private getFieldValue(fieldId: string): unknown {
    return this.context.formData[fieldId] ?? this.context.orderData[fieldId];
  }

  /**
   * 判断字段是否可见
   */
  private isFieldVisible(field: TextField | NumberField | EnumField | DateField | BooleanField | TableField): boolean {
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
   * 渲染错误信息
   */
  private renderError(message: string): RenderResult {
    return {
      html: '<div class="form-error"><p>' + message + '</p></div>',
      scripts: [],
      styles: [],
    };
  }
}

/**
 * 根据表单Key和上下文渲染表单
 */
export function renderForm(formKey: string, orderData: Record<string, unknown>, formData: Record<string, unknown>): RenderResult {
  const renderer = new FormRenderer({
    orderData: orderData,
    formData: formData,
    userInfo: {
      id: 'current-user',
      name: '当前用户',
      role: 'approver',
    },
  });

  return renderer.render(formKey);
}
