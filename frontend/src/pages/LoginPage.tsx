// =====================================================
// Login Page
// 登录页 - 选择用户角色
// =====================================================

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

// 预定义测试用户
const TEST_USERS: User[] = [
  {
    id: 'user-001',
    username: 'sales01',
    fullName: '张三',
    role: 'SALES_REP',
    permissions: ['SO_CREATE', 'SO_EDIT', 'SO_SUBMIT'],
  },
  {
    id: 'user-003',
    username: 'salesmgr01',
    fullName: '李四',
    role: 'SALES_MANAGER',
    permissions: ['SO_VIEW', 'SO_APPROVE_LEVEL_1', 'SO_ROLLBACK'],
  },
  {
    id: 'user-004',
    username: 'finance01',
    fullName: '王五',
    role: 'FINANCE',
    permissions: ['SO_VIEW', 'SO_APPROVE_LEVEL_2', 'SO_ROLLBACK'],
  },
  {
    id: 'user-005',
    username: 'director01',
    fullName: '赵六',
    role: 'DIRECTOR',
    permissions: ['SO_VIEW', 'SO_APPROVE_LEVEL_3', 'SO_ROLLBACK', 'SO_OVERRIDE'],
  },
  {
    id: 'user-006',
    username: 'cs01',
    fullName: '客服小张',
    role: 'CUSTOMER_SERVICE',
    permissions: ['SO_VIEW'],
  },
  {
    id: 'user-002',
    username: 'admin01',
    fullName: '管理员',
    role: 'ADMIN',
    permissions: ['SO_VIEW', 'SO_CREATE', 'SO_EDIT', 'SO_APPROVE_ALL', 'SO_OVERRIDE'],
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = (user: User) => {
    login(user);
    navigate('/so-list');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>PRAM3 ERP</h1>
        <p style={styles.subtitle}>销售订单管理系统</p>
        
        <div style={styles.userList}>
          <p style={styles.hint}>请选择登录角色：</p>
          {TEST_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => handleLogin(user)}
              style={styles.userButton}
            >
              <div style={styles.userInfo}>
                <span style={styles.userName}>{user.fullName}</span>
                <span style={styles.userRole}>{getRoleLabel(user.role)}</span>
              </div>
              <div style={styles.permissions}>
                {getPermissionBadge(user.role)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 角色标签
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SALES_REP: '销售代表',
    SALES_MANAGER: '销售经理',
    FINANCE: '财务',
    DIRECTOR: '总监',
    CUSTOMER_SERVICE: '客服',
    ADMIN: '管理员',
  };
  return labels[role] || role;
}

// 权限徽章
function getPermissionBadge(role: string): string {
  const badges: Record<string, string> = {
    SALES_REP: 'EDIT',
    SALES_MANAGER: 'APPROVE',
    FINANCE: 'APPROVE',
    DIRECTOR: 'APPROVE',
    CUSTOMER_SERVICE: 'VIEW',
    ADMIN: 'ALL',
  };
  return badges[role] || 'VIEW';
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth: '400px',
    width: '100%',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    margin: '0 0 30px 0',
    textAlign: 'center',
    color: '#666',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  hint: {
    margin: '0 0 16px 0',
    color: '#999',
    fontSize: '14px',
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
  },
  userRole: {
    fontSize: '12px',
    color: '#999',
  },
  permissions: {
    padding: '4px 12px',
    borderRadius: '12px',
    background: '#f0f0f0',
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
  },
};

export default LoginPage;
