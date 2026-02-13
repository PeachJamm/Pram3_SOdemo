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
export interface QueryResult<T = any> {
    data: T[];
    affectedRows?: number;
    insertId?: string;
}
export declare class DatabaseConnection {
    private db;
    private config;
    constructor(config: DatabaseConfig);
    connect(): Promise<void>;
    query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    execute(sql: string, params?: any[]): Promise<{
        affectedRows: number;
        insertId?: string;
    }>;
    queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
    close(): Promise<void>;
}
export declare const db: DatabaseConnection;
//# sourceMappingURL=connection.d.ts.map