// =====================================================
// Form Renderer Component
// 表单渲染组件 - 根据权限动态渲染表单
// =====================================================

import { useCallback } from 'react';
import type { FormComponent, PermissionLevel } from '../types';

interface FormRendererProps {
  components: FormComponent[];
  permissionLevel: PermissionLevel;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export function FormRenderer({
  components,
  permissionLevel,
  values,
  onChange,
  onSubmit,
  submitting = false,
}: FormRendererProps) {
  // 渲染单个组件
  const renderComponent = useCallback(
    (component: FormComponent): React.ReactNode => {
      // 检查权限配置
      const fieldPermission = component.properties?.permission?.[permissionLevel];
      if (fieldPermission?.visible === false) {
        return null;
      }

      const readonly = fieldPermission?.readonly ?? component.readonly ?? false;

      switch (component.type) {
        case 'html':
          return (
            <div
              key={component.id}
              style={styles.htmlContent}
              dangerouslySetInnerHTML={{ __html: component.content || '' }}
            />
          );

        case 'text':
          return (
            <div key={component.id} style={styles.textField}>
              <div
                style={styles.markdownText}
                dangerouslySetInnerHTML={{
                  __html: formatText(component.text || '', values),
                }}
              />
            </div>
          );

        case 'textarea':
          return (
            <div key={component.id} style={styles.field}>
              {!component.readonly && (
                <label style={styles.label}>{component.label}</label>
              )}
              <textarea
                value={values[component.key!] || ''}
                onChange={(e) => !readonly && onChange(component.key!, e.target.value)}
                readOnly={readonly}
                style={{
                  ...styles.textarea,
                  ...(readonly ? styles.readonly : {}),
                  fontFamily: component.properties?.fontFamily || 'inherit',
                }}
                rows={component.rows || 4}
              />
            </div>
          );

        case 'radio':
          return (
            <div key={component.id} style={styles.field}>
              <label style={styles.label}>
                {component.label}
                {component.validate?.required && <span style={styles.required}>*</span>}
              </label>
              <div style={styles.radioGroup}>
                {component.values?.map((option) => (
                  <label key={option.value} style={styles.radioLabel}>
                    <input
                      type="radio"
                      name={component.key}
                      value={option.value}
                      checked={values[component.key!] === option.value}
                      onChange={() => !readonly && onChange(component.key!, option.value)}
                      disabled={readonly}
                      style={styles.radio}
                    />
                    <span style={readonly ? styles.disabledText : {}}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );

        case 'number':
          const prefix = component.appearance?.prefixAdorner;
          return (
            <div key={component.id} style={styles.field}>
              <label style={styles.label}>{component.label}</label>
              <div style={styles.numberInputWrapper}>
                {prefix && <span style={styles.prefix}>{prefix}</span>}
                <input
                  type="number"
                  value={values[component.key!] || 0}
                  onChange={(e) =>
                    !readonly && onChange(component.key!, Number(e.target.value))
                  }
                  readOnly={readonly}
                  style={{
                    ...styles.numberInput,
                    ...(readonly ? styles.readonly : {}),
                    paddingLeft: prefix ? '30px' : '10px',
                  }}
                />
              </div>
            </div>
          );

        case 'group':
          return (
            <div
              key={component.id}
              style={{
                ...styles.group,
                gridColumn: component.layout?.columns
                  ? `span ${component.layout.columns}`
                  : undefined,
              }}
            >
              {component.components?.map(renderComponent)}
            </div>
          );

        case 'button':
          // 检查条件显示
          if (component.conditional?.hide) {
            const condition = component.conditional.hide;
            // 简单条件判断：=key = 'value'
            const match = condition.match(/=(\w+)\s*=\s*(.+)/);
            if (match) {
              const [, key, expectedValue] = match;
              const actualValue = values[key];
              if (String(actualValue) === expectedValue.replace(/'/g, '')) {
                return null;
              }
            }
          }

          if (component.action === 'submit') {
            return (
              <button
                key={component.id}
                onClick={onSubmit}
                disabled={submitting}
                style={{
                  ...styles.submitBtn,
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? '提交中...' : component.label}
              </button>
            );
          }
          return null;

        default:
          return null;
      }
    },
    [components, permissionLevel, values, onChange, onSubmit, submitting]
  );

  return <div style={styles.form}>{components.map(renderComponent)}</div>;
}

// 格式化文本，替换变量
function formatText(text: string, values: Record<string, any>): string {
  return text
    .replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = values[key];
      return value !== undefined ? String(value) : match;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Markdown bold
    .replace(/\n/g, '<br/>');
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  required: {
    color: '#f5222d',
    marginLeft: '4px',
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical',
    transition: 'border-color 0.2s',
  },
  readonly: {
    background: '#f5f5f5',
    color: '#666',
    cursor: 'not-allowed',
    borderColor: '#d9d9d9',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
    background: '#fafafa',
    borderRadius: '6px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  radio: {
    cursor: 'pointer',
    width: '16px',
    height: '16px',
  },
  disabledText: {
    color: '#999',
  },
  numberInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  prefix: {
    position: 'absolute',
    left: '10px',
    color: '#666',
    fontSize: '14px',
  },
  numberInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '14px',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  htmlContent: {
    margin: '-20px -20px 20px -20px',
  },
  textField: {
    padding: '12px',
    background: '#fafafa',
    borderRadius: '6px',
  },
  markdownText: {
    lineHeight: 1.6,
    color: '#333',
  },
  submitBtn: {
    width: '100%',
    padding: '12px 24px',
    background: '#714b67',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 500,
    marginTop: '20px',
    transition: 'opacity 0.2s',
  },
};
