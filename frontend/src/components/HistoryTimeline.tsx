// =====================================================
// History Timeline Component
// 历史时间轴组件 - 显示操作历史
// =====================================================

interface HistoryRecord {
  id: string;
  timestamp: string;
  type: 'USER_ACTION' | 'SYSTEM_DECISION' | 'PROCESS_EVENT';
  actor: string;
  action: string;
  details?: string;
  comment?: string;
}

interface HistoryTimelineProps {
  records: HistoryRecord[];
}

export function HistoryTimeline({ records }: HistoryTimelineProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'USER_ACTION':
        return '👤';
      case 'SYSTEM_DECISION':
        return '🧠';
      case 'PROCESS_EVENT':
        return '⚙️';
      default:
        return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'USER_ACTION':
        return '#1890ff';
      case 'SYSTEM_DECISION':
        return '#722ed1';
      case 'PROCESS_EVENT':
        return '#52c41a';
      default:
        return '#999';
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📜 操作历史</h3>
      <div style={styles.timeline}>
        {records.map((record, index) => {
          const { time, date } = formatTime(record.timestamp);
          const isLast = index === records.length - 1;

          return (
            <div key={record.id} style={styles.record}>
              {/* 时间 */}
              <div style={styles.timeColumn}>
                <div style={styles.time}>{time}</div>
                <div style={styles.date}>{date}</div>
              </div>

              {/* 连接线 */}
              <div style={styles.connector}>
                <div
                  style={{
                    ...styles.dot,
                    background: getTypeColor(record.type),
                  }}
                />
                {!isLast && <div style={styles.line} />}
              </div>

              {/* 内容 */}
              <div style={styles.content}>
                <div style={styles.header}>
                  <span style={styles.actor}>{record.actor}</span>
                  <span
                    style={{
                      ...styles.typeBadge,
                      background: `${getTypeColor(record.type)}20`,
                      color: getTypeColor(record.type),
                    }}
                  >
                    {getTypeIcon(record.type)} {getTypeLabel(record.type)}
                  </span>
                </div>
                <div style={styles.action}>{record.action}</div>
                {record.details && (
                  <div style={styles.details}>{record.details}</div>
                )}
                {record.comment && (
                  <div style={styles.comment}>"{record.comment}"</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    USER_ACTION: '人工操作',
    SYSTEM_DECISION: '系统决策',
    PROCESS_EVENT: '流程事件',
  };
  return labels[type] || type;
}

// 模拟历史数据生成器
export function generateMockHistory(formName: string): HistoryRecord[] {
  const now = new Date();
  const records: HistoryRecord[] = [
    {
      id: 'h1',
      timestamp: new Date(now.getTime() - 3600000).toISOString(),
      type: 'USER_ACTION',
      actor: 'sales01',
      action: '创建销售订单',
      details: '客户: 上海创新集团, 金额: ¥274,752',
    },
    {
      id: 'h2',
      timestamp: new Date(now.getTime() - 3000000).toISOString(),
      type: 'USER_ACTION',
      actor: 'sales01',
      action: '提交审批',
    },
    {
      id: 'h3',
      timestamp: new Date(now.getTime() - 2400000).toISOString(),
      type: 'SYSTEM_DECISION',
      actor: 'SYSTEM',
      action: 'DMN决策: 确定审批级别',
      details: '审批级别: DIRECTOR (总监审批)',
    },
  ];

  if (formName.includes('验证')) {
    records.push({
      id: 'h4',
      timestamp: new Date(now.getTime() - 100000).toISOString(),
      type: 'USER_ACTION',
      actor: 'salesmgr01',
      action: '订单验证',
      comment: '信息完整，进入审批流程',
    });
  }

  return records;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  record: {
    display: 'flex',
    gap: '12px',
    paddingBottom: '20px',
  },
  timeColumn: {
    width: '60px',
    flexShrink: 0,
    textAlign: 'right',
  },
  time: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
  },
  date: {
    fontSize: '11px',
    color: '#999',
  },
  connector: {
    width: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  line: {
    width: '2px',
    flex: 1,
    background: '#e8e8e8',
    marginTop: '4px',
  },
  content: {
    flex: 1,
    paddingTop: '2px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  actor: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
  },
  typeBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
  },
  action: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '4px',
  },
  details: {
    fontSize: '12px',
    color: '#666',
    background: '#f5f5f5',
    padding: '6px 10px',
    borderRadius: '4px',
    marginTop: '6px',
  },
  comment: {
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic',
    marginTop: '6px',
    paddingLeft: '8px',
    borderLeft: '2px solid #d9d9d9',
  },
};
