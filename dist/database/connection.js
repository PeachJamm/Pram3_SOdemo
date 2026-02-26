"use strict";
// =====================================================
// Database Connection
// 支持 SQLite (开发) 和 MySQL (生产)
// =====================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.DatabaseConnection = void 0;
const sqlite3 = __importStar(require("sqlite3"));
// 数据库连接类
class DatabaseConnection {
    constructor(config) {
        this.db = null;
        this.config = config;
    }
    // 连接数据库
    async connect() {
        if (this.config.type === 'sqlite') {
            const filename = this.config.sqlite?.filename || './pram3.db';
            this.db = new sqlite3.Database(filename, (err) => {
                if (err) {
                    console.error('Failed to connect to SQLite:', err);
                }
                else {
                    console.log(`[DB] Connected to SQLite: ${filename}`);
                }
            });
        }
        // MySQL 实现可以在这里扩展
    }
    // 执行查询
    async query(sql, params = []) {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('[DB] Query error:', err);
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    // 执行插入/更新/删除
    async execute(sql, params = []) {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error('[DB] Execute error:', err);
                    reject(err);
                }
                else {
                    resolve({
                        affectedRows: this.changes,
                        insertId: this.lastID?.toString(),
                    });
                }
            });
        });
    }
    // 获取单条记录
    async queryOne(sql, params = []) {
        const results = await this.query(sql, params);
        return results.length > 0 ? results[0] : null;
    }
    // 开始事务
    async beginTransaction() {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return new Promise((resolve, reject) => {
            this.db.run('BEGIN TRANSACTION', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    // 提交事务
    async commit() {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return new Promise((resolve, reject) => {
            this.db.run('COMMIT', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    // 回滚事务
    async rollback() {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return new Promise((resolve, reject) => {
            this.db.run('ROLLBACK', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    // 关闭连接
    async close() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        }
    }
}
exports.DatabaseConnection = DatabaseConnection;
// 导出默认实例
exports.db = new DatabaseConnection({
    type: 'sqlite',
    sqlite: { filename: './pram3.db' },
});
//# sourceMappingURL=connection.js.map