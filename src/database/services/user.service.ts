// =====================================================
// User Service
// 用户服务 - 权限查询
// =====================================================

import { DatabaseConnection } from '../connection';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

export type PermissionLevel = 'VIEW' | 'EDIT' | 'APPROVE';

export class UserService {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * 根据ID获取用户信息
   */
  async getUserById(userId: string): Promise<User | null> {
    const users = await this.db.query(
      `SELECT id, username, email, full_name, role, permissions, is_active
       FROM users
       WHERE id = ? AND is_active = 1`,
      [userId]
    );

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      permissions: JSON.parse(user.permissions || '[]'),
      isActive: user.is_active === 1,
    };
  }

  /**
   * 根据用户名获取用户信息
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const users = await this.db.query(
      `SELECT id, username, email, full_name, role, permissions, is_active
       FROM users
       WHERE username = ? AND is_active = 1`,
      [username]
    );

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      permissions: JSON.parse(user.permissions || '[]'),
      isActive: user.is_active === 1,
    };
  }

  /**
   * 判定用户权限级别
   * @param user 用户信息
   * @param taskAssignee 任务分配人（Camunda assignee）
   * @param taskType 任务类型（如order-validation, sales-manager-approval等）
   * @param orderCreatorId 订单创建人ID
   */
  determinePermissionLevel(
    user: User,
    taskAssignee: string | null,
    taskType: string,
    orderCreatorId?: string
  ): PermissionLevel {
    // 1. ADMIN 拥有所有权限
    if (user.role === 'ADMIN') {
      return 'APPROVE';
    }

    // 2. 检查是否是当前任务的审批人（assignee匹配）
    if (taskAssignee && taskAssignee === user.username) {
      return 'APPROVE';
    }

    // 3. 检查是否是订单创建者且任务在创建/编辑阶段
    if (orderCreatorId === user.id) {
      // 创建者只能编辑自己的订单
      if (taskType === 'order-creation' || taskType === 'order-edit') {
        return 'EDIT';
      }
    }

    // 4. 根据角色判断
    if (user.role === 'SALES_REP') {
      // 销售代表只能在创建阶段编辑
      if (taskType === 'order-validation') {
        // 如果是验证任务，销售代表可以查看但只能由验证人编辑
        return 'VIEW';
      }
    }

    // 5. 默认只读
    return 'VIEW';
  }

  /**
   * 检查用户是否有特定权限
   */
  hasPermission(user: User, permission: string): boolean {
    return user.permissions.includes(permission);
  }

  /**
   * 获取所有审批人列表
   */
  async getApprovers(): Promise<User[]> {
    const users = await this.db.query(
      `SELECT id, username, email, full_name, role, permissions
       FROM users
       WHERE role IN ('SALES_MANAGER', 'FINANCE', 'DIRECTOR', 'ADMIN')
       AND is_active = 1`
    );

    return users.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      permissions: JSON.parse(user.permissions || '[]'),
      isActive: true,
    }));
  }
}
