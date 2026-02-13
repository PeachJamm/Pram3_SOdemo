"use strict";
// =====================================================
// Base Repository
// 通用数据访问层
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(options, tableName) {
        this.db = options.db;
        this.tableName = tableName;
    }
    // 查询所有
    async findAll() {
        return this.db.query(`SELECT * FROM ${this.tableName} WHERE is_active = 1`);
    }
    // 根据ID查询
    async findById(id) {
        return this.db.queryOne(`SELECT * FROM ${this.tableName} WHERE id = ? AND is_active = 1`, [id]);
    }
    // 根据条件查询
    async findByField(field, value) {
        return this.db.query(`SELECT * FROM ${this.tableName} WHERE ${String(field)} = ? AND is_active = 1`, [value]);
    }
    // 搜索（模糊匹配）
    async search(field, keyword) {
        return this.db.query(`SELECT * FROM ${this.tableName} WHERE ${String(field)} LIKE ? AND is_active = 1 LIMIT 20`, [`%${keyword}%`]);
    }
    // 创建
    async create(data) {
        const fields = Object.keys(data);
        const placeholders = fields.map(() => '?').join(',');
        const values = Object.values(data);
        const result = await this.db.execute(`INSERT INTO ${this.tableName} (${fields.join(',')}) VALUES (${placeholders})`, values);
        return result.insertId || '';
    }
    // 更新
    async update(id, data) {
        const fields = Object.keys(data);
        const setClause = fields.map(f => `${f} = ?`).join(',');
        const values = [...Object.values(data), id];
        const result = await this.db.execute(`UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
        return result.affectedRows > 0;
    }
    // 软删除
    async delete(id) {
        const result = await this.db.execute(`UPDATE ${this.tableName} SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map