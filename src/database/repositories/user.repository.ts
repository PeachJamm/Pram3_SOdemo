// =====================================================
// User Repository
// 用户数据访问层
// =====================================================

import { BaseRepository, RepositoryOptions } from './base.repository';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  permissions: string; // JSON string
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithPermissions extends Omit<User, 'permissions'> {
  permissions: string[];
}

export class UserRepository extends BaseRepository<User> {
  constructor(options: RepositoryOptions) {
    super(options, 'users');
  }

  // 根据用户名查找
  async findByUsername(username: string): Promise<User | null> {
    return this.db.queryOne(
      `SELECT * FROM users WHERE username = ? AND is_active = 1`,
      [username]
    );
  }

  // 验证用户密码（简化版，实际应使用bcrypt等）
  async validateUser(username: string, password: string): Promise<User | null> {
    // 注意：这里简化处理，实际应该比较密码hash
    const user = await this.findByUsername(username);
    if (user && user.password_hash === password) {
      return user;
    }
    return null;
  }

  // 获取用户权限列表
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.findById(userId);
    if (!user || !user.permissions) return [];
    try {
      return JSON.parse(user.permissions);
    } catch {
      return [];
    }
  }

  // 检查用户是否有特定权限
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  // 检查用户是否有Override权限
  async hasOverridePermission(userId: string): Promise<boolean> {
    return this.hasPermission(userId, 'ORDER_OVERRIDE');
  }

  // 获取所有活跃用户（用于下拉选择）
  async findAllActive(): Promise<Pick<User, 'id' | 'username' | 'full_name' | 'role'>[]> {
    return this.db.query(
      `SELECT id, username, full_name, role 
       FROM users 
       WHERE is_active = 1 
       ORDER BY full_name`
    );
  }

  // 根据角色查找用户
  async findByRole(role: string): Promise<User[]> {
    return this.db.query(
      `SELECT * FROM users WHERE role = ? AND is_active = 1`,
      [role]
    );
  }
}
