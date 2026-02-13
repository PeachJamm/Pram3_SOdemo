// =====================================================
// Base Repository
// 通用数据访问层
// =====================================================

import { DatabaseConnection } from '../connection';

export interface RepositoryOptions {
  db: DatabaseConnection;
}

export abstract class BaseRepository<T> {
  protected db: DatabaseConnection;
  protected tableName: string;

  constructor(options: RepositoryOptions, tableName: string) {
    this.db = options.db;
    this.tableName = tableName;
  }

  // 查询所有
  async findAll(): Promise<T[]> {
    return this.db.query<T>(`SELECT * FROM ${this.tableName} WHERE is_active = 1`);
  }

  // 根据ID查询
  async findById(id: string): Promise<T | null> {
    return this.db.queryOne<T>(
      `SELECT * FROM ${this.tableName} WHERE id = ? AND is_active = 1`,
      [id]
    );
  }

  // 根据条件查询
  async findByField<K extends keyof T>(field: K, value: T[K]): Promise<T[]> {
    return this.db.query<T>(
      `SELECT * FROM ${this.tableName} WHERE ${String(field)} = ? AND is_active = 1`,
      [value]
    );
  }

  // 搜索（模糊匹配）
  async search(field: keyof T, keyword: string): Promise<T[]> {
    return this.db.query<T>(
      `SELECT * FROM ${this.tableName} WHERE ${String(field)} LIKE ? AND is_active = 1 LIMIT 20`,
      [`%${keyword}%`]
    );
  }

  // 创建
  async create(data: Partial<T>): Promise<string> {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(',');
    const values = Object.values(data);

    const result = await this.db.execute(
      `INSERT INTO ${this.tableName} (${fields.join(',')}) VALUES (${placeholders})`,
      values
    );

    return result.insertId || '';
  }

  // 更新
  async update(id: string, data: Partial<T>): Promise<boolean> {
    const fields = Object.keys(data);
    const setClause = fields.map(f => `${f} = ?`).join(',');
    const values = [...Object.values(data), id];

    const result = await this.db.execute(
      `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // 软删除
  async delete(id: string): Promise<boolean> {
    const result = await this.db.execute(
      `UPDATE ${this.tableName} SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}
