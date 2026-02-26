// =====================================================
// App Component
// 主应用组件 - 路由配置
// =====================================================

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import SOListPage from './pages/SOListPage';
import SODetailPage from './pages/SODetailPage';
import SOCreatePage from './pages/SOCreatePage';

// 路由守卫组件
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/so-list"
          element={
            <PrivateRoute>
              <SOListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/so/:id"
          element={
            <PrivateRoute>
              <SODetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/so-create"
          element={
            <PrivateRoute>
              <SOCreatePage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/so-list" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
