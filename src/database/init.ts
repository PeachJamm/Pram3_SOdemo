// =====================================================
// Database Initialization Script
// 初始化数据库并插入Seed数据
// =====================================================

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseConnection } from './connection';

export async function initializeDatabase(dbPath: string = './pram3.db'): Promise<void> {
  const db = new DatabaseConnection({
    type: 'sqlite',
    sqlite: { filename: dbPath },
  });

  try {
    console.log('[DB Init] Connecting to database...');
    await db.connect();

    // 1. 执行Schema
    console.log('[DB Init] Creating tables...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // 分割SQL语句并执行
    const statements = schema
      .replace(/\r\n/g, '\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        if (s.length === 0) return false;
        // 只保留包含实际SQL代码的语句（不只是注释）
        const lines = s.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        return lines.some(l => !l.startsWith('--'));
      });
    
    for (const statement of statements) {
      const sql = statement + ';';
      await db.execute(sql);
    }

    // 2. 插入Seed数据
    console.log('[DB Init] Inserting seed data...');
    const seedFiles = [
      '01_users.sql',
      '02_products.sql',
      '03_price_lists.sql',
      '04_customers.sql',
    ];

    for (const seedFile of seedFiles) {
      const seedPath = path.join(__dirname, 'seeds', seedFile);
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf-8');
        const seedStatements = seedSql.split(';').filter(s => s.trim());
        
        for (const statement of seedStatements) {
          if (statement.trim()) {
            try {
              await db.execute(statement);
            } catch (err) {
              console.warn(`[DB Init] Warning: ${err}`);
            }
          }
        }
        console.log(`[DB Init] Loaded: ${seedFile}`);
      }
    }

    console.log('[DB Init] Database initialized successfully!');
  } catch (error) {
    console.error('[DB Init] Failed to initialize database:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
