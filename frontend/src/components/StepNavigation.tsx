// =====================================================
// Step Navigation Component
// 快捷导航组件 - 浮动在操作区域上方的Flow形式
// 预留Chatbot对话扩展接口
// =====================================================

import { useState } from 'react';

interface Step {
  id: string;
  name: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
}

interface StepNavigationProps {
  steps: Step[];
  onStepClick: (stepId: string, status: 'COMPLETED' | 'CURRENT') => void;
}

// Chatbot接口预留
interface ChatbotMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
}

export function StepNavigation({ steps, onStepClick }: StepNavigationProps) {
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessage[]>([
    {
      type: 'bot',
      content: '您好！我是您的智能助手，可以帮您了解当前流程状态。请问有什么可以帮您？',
      timestamp: new Date().toISOString(),
    },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '✓';
      case 'CURRENT':
        return '⏳';
      case 'PENDING':
        return '○';
      default:
        return '•';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#52c41a';
      case 'CURRENT':
        return '#fa8c16';
      case 'PENDING':
        return '#d9d9d9';
      default:
        return '#999';
    }
  };

  const completedSteps = steps.filter((s) => s.status === 'COMPLETED');
  const currentStep = steps.find((s) => s.status === 'CURRENT');
  const pendingSteps = steps.filter((s) => s.status === 'PENDING');

  return (
    <div style={styles.container}>
      {/* 浮动流程导航 */}
      <div style={styles.flowPanel}>
        <div style={styles.flowHeader}>
          <span style={styles.flowTitle}>🧭 流程导航</span>
          <button
            style={styles.chatbotToggle}
            onClick={() => setShowChatbot(!showChatbot)}
            title="智能助手"
          >
            🤖
          </button>
        </div>

        <div style={styles.flowContent}>
          {/* 已完成步骤 - 可点击查看 */}
          {completedSteps.length > 0 && (
            <div style={styles.stepGroup}>
              <div style={styles.groupLabel}>已完成</div>
              <div style={styles.stepList}>
                {completedSteps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => onStepClick(step.id, 'COMPLETED')}
                    style={styles.stepButton}
                  >
                    <span style={{ ...styles.statusIcon, color: getStatusColor(step.status) }}>
                      {getStatusIcon(step.status)}
                    </span>
                    <span style={styles.stepName}>{step.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 当前步骤 */}
          {currentStep && (
            <div style={styles.stepGroup}>
              <div style={styles.groupLabel}>当前</div>
              <div style={styles.currentStep}>
                <span style={{ ...styles.statusIcon, color: getStatusColor('CURRENT') }}>
                  {getStatusIcon('CURRENT')}
                </span>
                <span style={styles.currentStepName}>{currentStep.name}</span>
                <span style={styles.currentBadge}>处理中</span>
              </div>
            </div>
          )}

          {/* 待处理步骤 */}
          {pendingSteps.length > 0 && (
            <div style={styles.stepGroup}>
              <div style={styles.groupLabel}>待处理</div>
              <div style={styles.stepList}>
                {pendingSteps.map((step) => (
                  <div key={step.id} style={styles.pendingStep}>
                    <span style={{ ...styles.statusIcon, color: getStatusColor(step.status) }}>
                      {getStatusIcon(step.status)}
                    </span>
                    <span style={styles.stepName}>{step.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 流程统计 */}
        <div style={styles.flowStats}>
          <span>进度: {completedSteps.length}/{steps.length}</span>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${(completedSteps.length / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Chatbot面板 - 可扩展 */}
      {showChatbot && (
        <div style={styles.chatbotPanel}>
          <div style={styles.chatbotHeader}>
            <span>🤖 智能助手</span>
            <button
              style={styles.closeBtn}
              onClick={() => setShowChatbot(false)}
            >
              ✕
            </button>
          </div>
          <div style={styles.chatbotMessages}>
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  ...(msg.type === 'user' ? styles.userMessage : styles.botMessage),
                }}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <div style={styles.chatbotInput}>
            <input
              type="text"
              placeholder="输入您的问题..."
              style={styles.input}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  // 预留：发送消息到Chatbot API
                  const content = (e.target as HTMLInputElement).value;
                  if (content.trim()) {
                    setChatMessages([
                      ...chatMessages,
                      { type: 'user', content, timestamp: new Date().toISOString() },
                    ]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <button style={styles.sendBtn}>发送</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
  },
  flowPanel: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #f0f0f0',
  },
  flowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  flowTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
  },
  chatbotToggle: {
    padding: '6px 10px',
    background: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  flowContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  stepGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  groupLabel: {
    fontSize: '12px',
    color: '#999',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  stepButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    background: '#f6ffed',
    border: '1px solid #d9f7be',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  stepName: {
    fontSize: '13px',
    color: '#333',
    flex: 1,
  },
  statusIcon: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  currentStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    background: '#fff7e6',
    border: '2px solid #ffd591',
    borderRadius: '8px',
  },
  currentStepName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    flex: 1,
  },
  currentBadge: {
    padding: '2px 8px',
    background: '#fa8c16',
    color: 'white',
    borderRadius: '10px',
    fontSize: '11px',
  },
  pendingStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    background: '#fafafa',
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    opacity: 0.7,
  },
  flowStats: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: '#666',
  },
  progressBar: {
    flex: 1,
    height: '6px',
    background: '#f0f0f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #52c41a, #95de64)',
    borderRadius: '3px',
    transition: 'width 0.3s',
  },
  // Chatbot样式
  chatbotPanel: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '12px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    border: '1px solid #e8e8e8',
    zIndex: 100,
    overflow: 'hidden',
  },
  chatbotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f6ffed',
    borderBottom: '1px solid #e8e8e8',
    fontSize: '14px',
    fontWeight: 500,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#999',
  },
  chatbotMessages: {
    padding: '16px',
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  message: {
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    background: '#1890ff',
    color: 'white',
  },
  botMessage: {
    alignSelf: 'flex-start',
    background: '#f5f5f5',
    color: '#333',
  },
  chatbotInput: {
    padding: '12px',
    borderTop: '1px solid #e8e8e8',
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '13px',
  },
  sendBtn: {
    padding: '8px 16px',
    background: '#52c41a',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
