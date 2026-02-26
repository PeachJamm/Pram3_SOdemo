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
export declare class UserService {
    private db;
    constructor(db: DatabaseConnection);
    /**
     * 根据ID获取用户信息
     */
    getUserById(userId: string): Promise<User | null>;
    /**
     * 根据用户名获取用户信息
     */
    getUserByUsername(username: string): Promise<User | null>;
    /**
     * 判定用户权限级别
     * @param user 用户信息
     * @param taskAssignee 任务分配人（Camunda assignee）
     * @param taskType 任务类型（如order-validation, sales-manager-approval等）
     * @param orderCreatorId 订单创建人ID
     */
    determinePermissionLevel(user: User, taskAssignee: string | null, taskType: string, orderCreatorId?: string): PermissionLevel;
    /**
     * 检查用户是否有特定权限
     */
    hasPermission(user: User, permission: string): boolean;
    /**
     * 获取所有审批人列表
     */
    getApprovers(): Promise<User[]>;
}
//# sourceMappingURL=user.service.d.ts.map