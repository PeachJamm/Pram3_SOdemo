// =====================================================
// Auth Store - Zustand
// 用户认证状态管理
// =====================================================

import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: (user: User) => {
    set({ user, isAuthenticated: true });
    localStorage.setItem('pram3_user', JSON.stringify(user));
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('pram3_user');
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    return user.permissions.includes(permission);
  },
}));

// 初始化：从localStorage恢复用户
const savedUser = localStorage.getItem('pram3_user');
if (savedUser) {
  try {
    const user = JSON.parse(savedUser);
    useAuthStore.setState({ user, isAuthenticated: true });
  } catch {
    localStorage.removeItem('pram3_user');
  }
}
