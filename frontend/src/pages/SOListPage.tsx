// =====================================================
// SO List Page
// 销售订单列表页
// =====================================================

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../services/api';
import type { SalesOrder } from '../types';

function SOListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const result = await orderApi.getOrders();
      if (result.success && result.data) {
        setOrders(result.data.orders || []);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      // 模拟数据用于演示
      setOrders([
        {
          id: 'order-001',
          orderNumber: 'SO-20240218001',
          customerId: 'cust-001',
          customerName: '上海创新集团',
          customerTier: 'VIP',
          totalAmount: 274752,
          grandTotal: 274752,
          status: 'PENDING',
          createdBy: 'sales01',
          createdAt: new Date().toISOString(),
          processInstanceKey: '2251799813689190',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      DRAFT: { text: '草稿', color: '#999' },
      PENDING: { text: '审批中', color: '#fa8c16' },
      APPROVED: { text: '已通过', color: '#52c41a' },
      REJECTED: { text: '已拒绝', color: '#f5222d' },
      CANCELLED: { text: '已取消', color: '#666' },
    };
    return labels[status] || { text: status, color: '#333' };
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      SALES_REP: '销售代表',
      SALES_MANAGER: '销售经理',
      FINANCE: '财务',
      DIRECTOR: '总监',
      CUSTOMER_SERVICE: '客服',
      ADMIN: '管理员',
    };
    return labels[role] || role;
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>PRAM3 ERP</h1>
          <span style={styles.divider}>|</span>
          <span style={styles.pageTitle}>销售订单</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>
            {user.fullName} ({getRoleLabel(user.role)})
          </span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            退出
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={styles.main}>
        {/* Actions */}
        <div style={styles.actions}>
          {user.role === 'SALES_REP' || user.role === 'ADMIN' ? (
            <Link to="/so-create" style={styles.createBtn}>
              + 创建订单
            </Link>
          ) : null}
        </div>

        {/* Order List */}
        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span style={styles.colOrderNo}>订单号</span>
              <span style={styles.colCustomer}>客户</span>
              <span style={styles.colAmount}>金额</span>
              <span style={styles.colStatus}>状态</span>
              <span style={styles.colAction}>操作</span>
            </div>
            {orders.map((order) => {
              const status = getStatusLabel(order.status);
              return (
                <div key={order.id} style={styles.tableRow}>
                  <span style={styles.colOrderNo}>{order.orderNumber}</span>
                  <span style={styles.colCustomer}>
                    {order.customerName}
                    <span style={styles.customerTier}>{order.customerTier}</span>
                  </span>
                  <span style={styles.colAmount}>
                    ¥{order.grandTotal.toLocaleString()}
                  </span>
                  <span style={{ ...styles.colStatus, color: status.color }}>
                    {status.text}
                  </span>
                  <span style={styles.colAction}>
                    <Link to={`/so/${order.id}`} style={styles.viewLink}>
                      查看
                    </Link>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: '64px',
    background: 'linear-gradient(135deg, #714b67 0%, #5a3a52 100%)',
    color: 'white',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
  },
  divider: {
    opacity: 0.5,
  },
  pageTitle: {
    fontSize: '16px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    fontSize: '14px',
    opacity: 0.9,
  },
  logoutBtn: {
    padding: '6px 16px',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    background: 'transparent',
    color: 'white',
    cursor: 'pointer',
  },
  main: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  actions: {
    marginBottom: '24px',
  },
  createBtn: {
    display: 'inline-block',
    padding: '10px 20px',
    background: '#714b67',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  table: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr',
    padding: '16px',
    borderBottom: '1px solid #eee',
    fontWeight: 600,
    color: '#666',
    fontSize: '14px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr',
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px',
    color: '#333',
  },
  colOrderNo: {
    fontFamily: 'monospace',
  },
  colCustomer: {
    display: 'flex',
    flexDirection: 'column',
  },
  customerTier: {
    fontSize: '12px',
    color: '#999',
  },
  colAmount: {
    fontWeight: 500,
  },
  colStatus: {
    fontWeight: 500,
  },
  colAction: {},
  viewLink: {
    color: '#714b67',
    textDecoration: 'none',
  },
};

export default SOListPage;
