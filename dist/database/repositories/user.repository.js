"use strict";
// =====================================================
// User Repository
// 用户数据访问层
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const base_repository_1 = require("./base.repository");
class UserRepository extends base_repository_1.BaseRepository {
    constructor(options) {
        super(options, 'users');
    }
    // 根据用户名查找
    async findByUsername(username) {
        return this.db.queryOne(`SELECT * FROM users WHERE username = ? AND is_active = 1`, [username]);
    }
    // 验证用户密码（简化版，实际应使用bcrypt等）
    async validateUser(username, password) {
        // 注意：这里简化处理，实际应该比较密码hash
        const user = await this.findByUsername(username);
        if (user && user.password_hash === password) {
            return user;
        }
        return null;
    }
    // 获取用户权限列表
    async getUserPermissions(userId) {
        const user = await this.findById(userId);
        if (!user || !user.permissions)
            return [];
        try {
            return JSON.parse(user.permissions);
        }
        catch {
            return [];
        }
    }
    // 检查用户是否有特定权限
    async hasPermission(userId, permission) {
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes(permission);
    }
    // 检查用户是否有Override权限
    async hasOverridePermission(userId) {
        return this.hasPermission(userId, 'ORDER_OVERRIDE');
    }
    // 获取所有活跃用户（用于下拉选择）
    async findAllActive() {
        return this.db.query(`SELECT id, username, full_name, role 
       FROM users 
       WHERE is_active = 1 
       ORDER BY full_name`);
    }
    // 根据角色查找用户
    async findByRole(role) {
        return this.db.query(`SELECT * FROM users WHERE role = ? AND is_active = 1`, [role]);
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map