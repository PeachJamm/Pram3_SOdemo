// =====================================================
// Process Flow Component
// 流程图组件 - 横向显示在Header，支持左右滚动提示
// =====================================================

import { useState, useRef, useEffect } from 'react';

interface ProcessStep {
  id: string;
  name: string;
  type: 'USERTASK' | 'DMN' | 'START' | 'END';
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
}

interface ProcessFlowProps {
  steps: ProcessStep[];
  currentStepId: string;
}

export function ProcessFlow({ steps, currentStepId }: ProcessFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 检查是否可以滚动
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [steps]);

  // 滚动到当前步骤
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const currentIndex = steps.findIndex((s) => s.id === currentStepId);
    if (currentIndex >= 0) {
      const stepWidth = 140; // 每个步骤约140px
      const scrollPosition = Math.max(0, (currentIndex - 1) * stepWidth);
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [currentStepId, steps]);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'USERTASK':
        return '👤';
      case 'DMN':
        return '🧠';
      case 'START':
        return '▶️';
      case 'END':
        return '🏁';
      default:
        return '•';
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: '#52c41a', border: '#52c41a', text: '#fff' };
      case 'CURRENT':
        return { bg: '#fa8c16', border: '#fa8c16', text: '#fff' };
      default:
        return { bg: '#f0f0f0', border: '#d9d9d9', text: '#999' };
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div style={styles.container}>
      {/* 左箭头提示 */}
      {canScrollLeft && (
        <div
          style={styles.arrowLeft}
          onMouseEnter={() => handleScroll('left')}
          title="向左查看更多"
        >
          ‹
        </div>
      )}

      {/* 流程步骤 */}
      <div ref={containerRef} style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const colors = getStepColor(step.status);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} style={styles.stepWrapper}>
              <div style={styles.step}>
                <div
                  style={{
                    ...styles.node,
                    background: colors.bg,
                    borderColor: colors.border,
                    boxShadow:
                      step.status === 'CURRENT'
                        ? '0 0 0 3px rgba(250, 140, 22, 0.3)'
                        : 'none',
                  }}
                >
                  <span style={{ ...styles.icon, color: colors.text }}>
                    {getStepIcon(step.type)}
                  </span>
                </div>
                <span
                  style={{
                    ...styles.label,
                    color: step.status === 'PENDING' ? '#999' : '#333',
                    fontWeight: step.status === 'CURRENT' ? 600 : 400,
                  }}
                >
                  {step.name}
                </span>
              </div>

              {/* 连接线 */}
              {!isLast && (
                <div
                  style={{
                    ...styles.connector,
                    background:
                      step.status === 'COMPLETED' ? '#52c41a' : '#e8e8e8',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 右箭头提示 */}
      {canScrollRight && (
        <div
          style={styles.arrowRight}
          onMouseEnter={() => handleScroll('right')}
          title="向右查看更多"
        >
          ›
        </div>
      )}
    </div>
  );
}

// 从表单组件解析流程步骤
export function parseStepsFromForm(components: any[]): ProcessStep[] {
  const steps: ProcessStep[] = [];

  // 添加开始节点
  steps.push({
    id: 'start',
    name: '开始',
    type: 'START',
    status: 'COMPLETED',
  });

  // 查找流程导航组件
  const navComponent = components.find(
    (c) => c.id === 'Field_process_nav' || c.label?.includes('流程进度')
  );

  if (navComponent?.text) {
    // 解析文本中的步骤
    const lines = navComponent.text.split('\n');
    let currentFound = false;

    for (const line of lines) {
      const match = line.match(/\d+\.\s*([✅🟡⏳])\s*\*?(.+?)\*?\s*(?:←\s*当前)?/);
      if (match) {
        const [, status, name] = match;
        let stepStatus: ProcessStep['status'] = 'PENDING';

        if (status === '✅') {
          stepStatus = 'COMPLETED';
        } else if (status === '🟡' || line.includes('当前')) {
          stepStatus = 'CURRENT';
          currentFound = true;
        } else if (currentFound) {
          stepStatus = 'PENDING';
        }

        steps.push({
          id: `step-${steps.length}`,
          name: name.trim(),
          type: name.includes('DMN') || name.includes('路由') ? 'DMN' : 'USERTASK',
          status: stepStatus,
        });
      }
    }
  }

  // 如果没有解析到步骤，使用默认步骤
  if (steps.length === 1) {
    steps.push(
      { id: 'create', name: '订单创建', type: 'USERTASK', status: 'COMPLETED' },
      { id: 'validate', name: '订单验证', type: 'USERTASK', status: 'CURRENT' },
      { id: 'route', name: '审批路由', type: 'DMN', status: 'PENDING' },
      { id: 'approve', name: '审批', type: 'USERTASK', status: 'PENDING' },
      { id: 'complete', name: '完成', type: 'END', status: 'PENDING' }
    );
  }

  return steps;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 40px',
    position: 'relative',
    flex: 1,
    maxWidth: '600px',
  },
  stepsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    overflowX: 'auto',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE

    padding: '8px 0',
  },
  stepWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    width: '80px',
  },
  node: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid',
    transition: 'all 0.3s',
    flexShrink: 0,
  },
  icon: {
    fontSize: '14px',
  },
  label: {
    fontSize: '11px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '70px',
  },
  connector: {
    width: '40px',
    height: '2px',
    margin: '0 4px',
    marginTop: '-20px',
  },
  arrowLeft: {
    position: 'absolute',
    left: '8px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '20px',
    cursor: 'default',
    userSelect: 'none',
    zIndex: 10,
  },
  arrowRight: {
    position: 'absolute',
    right: '8px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '20px',
    cursor: 'default',
    userSelect: 'none',
    zIndex: 10,
  },
};
