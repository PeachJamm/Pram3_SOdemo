// =====================================================
// Database Connection
// 支持 SQLite (开发) 和 MySQL (生产)
// =====================================================

import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';

// 数据库配置
export interface DatabaseConfig {
  type: 'sqlite' | 'mysql';
  sqlite?: {
    filename: string;
  };
  mysql?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
}

// 查询结果类型
export interface QueryResult<T = any> {
  data: T[];
  affectedRows?: number;
  insertId?: string;
}

// 数据库连接类
export class DatabaseConnection {
  private db: sqlite3.Database | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  // 连接数据库
  async connect(): Promise<void> {
    if (this.config.type === 'sqlite') {
      const filename = this.config.sqlite?.filename || './pram3.db';
      this.db = new sqlite3.Database(filename, (err) => {
        if (err) {
          console.error('Failed to connect to SQLite:', err);
        } else {
          console.log(`[DB] Connected to SQLite: ${filename}`);
        }
      });
    }
    // MySQL 实现可以在这里扩展
  }

  // 执行查询
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    return new Promise((resolve, reject) => {
      (this.db as sqlite3.Database).all(sql, params, (err, rows) => {
        if (err) {
          console.error('[DB] Query error:', err);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  // 执行插入/更新/删除
  async execute(sql: string, params: any[] = []): Promise<{ affectedRows: number; insertId?: string }> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    return new Promise((resolve, reject) => {
      (this.db as sqlite3.Database).run(sql, params, function(err) {
        if (err) {
          console.error('[DB] Execute error:', err);
          reject(err);
        } else {
          resolve({
            affectedRows: this.changes,
            insertId: this.lastID?.toString(),
          });
        }
      });
    });
  }

  // 获取单条记录
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  // 开始事务
  async beginTransaction(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return new Promise((resolve, reject) => {
      (this.db as sqlite3.Database).run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // 提交事务
  async commit(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return new Promise((resolve, reject) => {
      (this.db as sqlite3.Database).run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // 回滚事务
  async rollback(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return new Promise((resolve, reject) => {
      (this.db as sqlite3.Database).run('ROLLBACK', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // 关闭连接
  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        (this.db as sqlite3.Database).close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

// 导出默认实例
export const db = new DatabaseConnection({
  type: 'sqlite',
  sqlite: { filename: './pram3.db' },
});
