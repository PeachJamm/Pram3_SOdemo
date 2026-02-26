// =====================================================
// SO Detail Page
// 销售订单审批页面
// =====================================================

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { formApi } from '../services/api';
import { FormRenderer } from '../components/FormRenderer';
import type { FormComponent } from '../types';

interface ProcessStep {
  id: string;
  name: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
  type: 'usertask' | 'dmn' | 'gateway' | 'service' | 'start' | 'end';
  assignee?: string;
  completedAt?: string;
}

interface ApprovalHistory {
  id: string;
  stepName: string;
  approverName: string;
  action: string;
  comment?: string;
  createdAt: string;
}

interface OrderDetailData {
  orderId: string;
  processInstanceKey: string;
  taskCount: number;
  tasks: Array<{
    taskId: string;
    taskName: string;
    taskDefinitionId: string;
    assignee: string | null;
    variables: Record<string, any>;
  }>;
  nonUserTaskInfo?: {
    taskName: string;
    processStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELED';
    variables: Record<string, any>;
  };
  processFlow: {
    processStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELED';
    currentStepId: string;
    steps: ProcessStep[];
  };
  approvalHistory: ApprovalHistory[];
}

function SODetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  
  const [orderData, setOrderData] = useState<OrderDetailData | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && id) {
      loadPageData();
    }
  }, [user, id]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const taskResult = await formApi.getTaskByOrderId(id!, user!.id);
      
      if (!taskResult.success) {
        throw new Error(taskResult.error || '获取订单详情失败');
      }
      
      const data = taskResult.data as OrderDetailData;
      setOrderData(data);
      
      if (data.taskCount > 0 && data.tasks.length > 0) {
        const task = data.tasks[0];
        const renderResult = await formApi.renderForm(task.taskDefinitionId, user!.id);
        
        if (renderResult.success && renderResult.data) {
          setFormData(renderResult.data);
          
          const initialValues: Record<string, any> = {};
          extractFormValues(renderResult.data.components, initialValues);
          if (task.variables) {
            Object.assign(initialValues, task.variables);
          }
          setFormValues(initialValues);
        }
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const extractFormValues = (components: FormComponent[], values: Record<string, any>) => {
    for (const component of components) {
      if (component.key && component.value !== undefined) {
        values[component.key] = component.value;
      }
      if (component.components) {
        extractFormValues(component.components, values);
      }
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!formData || !user || !orderData) return;

    try {
      setSubmitting(true);
      
      const task = orderData.tasks[0];
      const response = await formApi.submitForm(
        task.taskDefinitionId,
        user.id,
        formValues
      );
      
      const result = response.data || response;
      
      if (result.success === true || (result.success !== false && !result.error)) {
        alert('✅ 提交成功！');
        await loadPageData();
      } else {
        alert(`❌ 提交失败: ${result.error || '未知错误'}`);
      }
    } catch (error: any) {
      alert(`❌ 提交失败: ${error.message || '网络错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 获取步骤图标
  const getStepIcon = (step: ProcessStep) => {
    if (step.type === 'dmn') return '🧮';
    if (step.type === 'gateway') return '🔀';
    if (step.status === 'COMPLETED') return '✓';
    if (step.status === 'CURRENT') return '●';
    return '○';
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>加载中...</p>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div style={styles.loading}>
        <div>❌ {error || '加载失败'}</div>
        <Link to="/so-list" style={styles.backLink}>返回列表</Link>
      </div>
    );
  }

  const { taskCount, tasks, nonUserTaskInfo, processFlow, approvalHistory } = orderData;
  const hasForm = taskCount > 0 && formData;
  const currentTask = tasks[0] || nonUserTaskInfo;
  const variables = currentTask?.variables || {};

  // 找到当前步骤索引
  const currentStepIndex = processFlow.steps.findIndex(s => s.status === 'CURRENT');
  const progress = currentStepIndex >= 0 
    ? ((currentStepIndex) / (processFlow.steps.length - 1)) * 100 
    : 100;

  return (
    <div style={styles.container}>
      {/* ====== 顶部 Header：精简版 ====== */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <Link to="/so-list" style={styles.backBtn}>← 返回</Link>
            <span style={styles.divider}>|</span>
            <span style={styles.orderNumber}>{variables.orderNumber || id}</span>
            <span style={processFlow.processStatus === 'COMPLETED' ? styles.statusBadgeCompleted : styles.statusBadgeActive}>
              {processFlow.processStatus === 'COMPLETED' ? '已完成' : '进行中'}
            </span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.metaItem}>客户: {variables.customerName || '-'}</span>
            <span style={styles.metaItem}>金额: ¥{variables.totalAmount?.toLocaleString() || '0'}</span>
          </div>
        </div>
        
        {/* 进度条 */}
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${progress}%`}} />
        </div>
        <div style={styles.progressSteps}>
          {processFlow.steps.map((step, index) => (
            <div key={step.id} style={styles.progressStep}>
              <span style={{
                ...styles.stepDot,
                ...(step.status === 'COMPLETED' ? styles.stepDotCompleted : {}),
                ...(step.status === 'CURRENT' ? styles.stepDotCurrent : {}),
              }}>
                {getStepIcon(step)}
              </span>
              <span style={{
                ...styles.stepLabel,
                ...(step.status === 'CURRENT' ? styles.stepLabelCurrent : {}),
              }}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div style={styles.mainLayout}>
        {/* 左侧：流程详情 - Sticky */}
        <aside style={styles.sidebar}>
          <div style={styles.sectionTitle}>🧭 流程详情</div>
          <div style={styles.stepsList}>
            {processFlow.steps.map((step) => (
              <div key={step.id} style={{
                ...styles.stepItem,
                ...(step.status === 'CURRENT' ? styles.stepItemCurrent : {}),
                ...(step.status === 'COMPLETED' ? styles.stepItemCompleted : {}),
                ...(step.type === 'dmn' ? styles.stepItemDmn : {}),
                ...(step.type === 'gateway' ? styles.stepItemGateway : {}),
              }}>
                <span style={{
                  ...styles.stepIcon,
                  ...(step.status === 'CURRENT' ? styles.stepIconCurrent : {}),
                  ...(step.status === 'COMPLETED' ? styles.stepIconCompleted : {}),
                }}>{getStepIcon(step)}</span>
                <div style={styles.stepContent}>
                  <div style={{
                    ...styles.stepName,
                    ...(step.status === 'CURRENT' ? styles.stepNameCurrent : {}),
                  }}>
                    {step.name}
                    {step.type === 'dmn' && <span style={styles.tagDmn}>DMN</span>}
                    {step.type === 'gateway' && <span style={styles.tagGateway}>网关</span>}
                  </div>
                  {step.assignee && <div style={styles.stepAssignee}>{step.assignee}</div>}
                </div>
              </div>
            ))}
          </div>

          <div style={{...styles.sectionTitle, marginTop: '20px'}}>📜 审批历史</div>
          <div style={styles.historyList}>
            {approvalHistory.length === 0 ? (
              <div style={styles.emptyText}>暂无审批记录</div>
            ) : (
              approvalHistory.map((record, index) => (
                <div key={record.id} style={styles.historyItem}>
                  <div style={styles.historyDot} />
                  {index < approvalHistory.length - 1 && <div style={styles.historyLine} />}
                  <div style={styles.historyContent}>
                    <div style={styles.historyAction}>
                      {record.stepName}
                      <span style={{
                        ...styles.historyBadge,
                        ...(record.action === 'APPROVE' ? styles.badgeApprove : {}),
                        ...(record.action === 'REJECT' ? styles.badgeReject : {}),
                      }}>
                        {record.action}
                      </span>
                    </div>
                    <div style={styles.historyMeta}>
                      {record.approverName} · {new Date(record.createdAt).toLocaleString()}
                    </div>
                    {record.comment && (
                      <div style={styles.historyComment}>{record.comment}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* 右侧：表单内容 */}
        <main style={styles.mainContent}>
          {hasForm ? (
            <div style={styles.formCard}>
              <FormRenderer
                components={formData.components}
                permissionLevel={formData.permissionLevel}
                values={formValues}
                onChange={handleFieldChange}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </div>
          ) : nonUserTaskInfo ? (
            <div style={styles.statusCard}>
              <div style={styles.statusIcon}>⏳</div>
              <h2 style={styles.statusTitle}>{nonUserTaskInfo.taskName}</h2>
              <p style={styles.statusDesc}>当前流程状态: {nonUserTaskInfo.processStatus}</p>
            </div>
          ) : (
            <div style={styles.emptyCard}>暂无需要处理的任务</div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #714b67',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  backLink: {
    color: '#714b67',
    textDecoration: 'none',
    fontSize: '14px',
    marginTop: '16px',
    display: 'inline-block',
  },
  
  // ====== 精简 Header ======
  header: {
    background: 'linear-gradient(135deg, #714b67 0%, #5a3a52 100%)',
    color: 'white',
    padding: '12px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    fontSize: '13px',
    opacity: 0.9,
  },
  backBtn: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '13px',
    opacity: 0.9,
  },
  divider: {
    opacity: 0.4,
  },
  orderNumber: {
    fontSize: '15px',
    fontWeight: 600,
  },
  metaItem: {
    fontSize: '12px',
  },
  statusBadgeCompleted: {
    background: '#52c41a',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: 500,
  },
  statusBadgeActive: {
    background: '#1890ff',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: 500,
  },
  
  // 进度条
  progressBar: {
    height: '3px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '2px',
    margin: '10px auto 8px',
    maxWidth: '1400px',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    background: '#52c41a',
    borderRadius: '2px',
    transition: 'width 0.5s ease',
  },
  progressSteps: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  },
  stepDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 'bold',
    border: '1px solid rgba(255,255,255,0.3)',
  },
  stepDotCompleted: {
    background: '#52c41a',
    borderColor: '#52c41a',
  },
  stepDotCurrent: {
    background: '#faad14',
    borderColor: '#faad14',
    boxShadow: '0 0 8px rgba(250,173,20,0.6)',
  },
  stepLabel: {
    fontSize: '10px',
    opacity: 0.7,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    opacity: 1,
    fontWeight: 600,
  },
  
  // ====== 主布局 ======
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '20px',
    padding: '16px',
    maxWidth: '1400px',
    margin: '0 auto',
    alignItems: 'flex-start',
  },
  
  // 左侧边栏 - Sticky
  sidebar: {
    background: 'white',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: '100px',
    maxHeight: 'calc(100vh - 120px)',
    overflow: 'auto',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '12px',
    paddingBottom: '6px',
    borderBottom: '2px solid #714b67',
  },
  
  // 步骤列表 - 绿色高亮当前步骤
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '10px',
    borderRadius: '6px',
    background: '#f8f8f8',
    border: '1px solid transparent',
    transition: 'all 0.2s',
  },
  // 当前步骤 - 绿色高亮
  stepItemCurrent: {
    background: '#f6ffed',
    borderColor: '#52c41a',
    boxShadow: '0 0 0 2px #52c41a20',
  },
  stepItemCompleted: {
    background: '#f0f0f0',
    borderColor: '#d9d9d9',
  },
  stepItemDmn: {
    background: '#fff7e6',
    borderLeft: '3px solid #8B4513',
  },
  stepItemGateway: {
    background: '#f0f5ff',
    borderLeft: '3px solid #597ef7',
  },
  stepIcon: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: '#d9d9d9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: '#666',
    flexShrink: 0,
    marginTop: '2px',
  },
  // 当前步骤图标 - 绿色
  stepIconCurrent: {
    background: '#52c41a',
    color: 'white',
    fontWeight: 'bold',
  },
  stepIconCompleted: {
    background: '#52c41a',
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
  },
  // 当前步骤名称
  stepNameCurrent: {
    color: '#52c41a',
    fontWeight: 600,
  },
  stepAssignee: {
    fontSize: '10px',
    color: '#666',
    marginTop: '2px',
  },
  tagDmn: {
    fontSize: '9px',
    padding: '1px 4px',
    background: '#8B4513',
    color: 'white',
    borderRadius: '3px',
  },
  tagGateway: {
    fontSize: '9px',
    padding: '1px 4px',
    background: '#597ef7',
    color: 'white',
    borderRadius: '3px',
  },
  
  // 历史记录
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  historyItem: {
    display: 'flex',
    gap: '8px',
    position: 'relative',
    paddingBottom: '12px',
  },
  historyDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#714b67',
    marginTop: '4px',
    flexShrink: 0,
  },
  historyLine: {
    position: 'absolute',
    left: '2px',
    top: '10px',
    bottom: '0',
    width: '2px',
    background: '#e8e8e8',
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  historyBadge: {
    fontSize: '9px',
    padding: '1px 6px',
    borderRadius: '3px',
    background: '#f0f0f0',
    color: '#666',
  },
  badgeApprove: {
    background: '#f6ffed',
    color: '#52c41a',
  },
  badgeReject: {
    background: '#fff2f0',
    color: '#ff4d4f',
  },
  historyMeta: {
    fontSize: '10px',
    color: '#999',
    marginTop: '2px',
  },
  historyComment: {
    fontSize: '10px',
    color: '#666',
    marginTop: '4px',
    padding: '6px',
    background: '#f5f5f5',
    borderRadius: '4px',
  },
  emptyText: {
    fontSize: '11px',
    color: '#999',
    textAlign: 'center',
    padding: '12px',
  },
  
  // ====== 主内容区 ======
  mainContent: {
    minHeight: '600px',
  },
  formCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  
  // 状态卡片
  statusCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '50px 40px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  statusIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  statusTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '8px',
  },
  statusDesc: {
    fontSize: '14px',
    color: '#666',
  },
  emptyCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '50px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
  },
};

export default SODetailPage;
