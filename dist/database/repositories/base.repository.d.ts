import { DatabaseConnection } from '../connection';
export interface RepositoryOptions {
    db: DatabaseConnection;
}
export declare abstract class BaseRepository<T> {
    protected db: DatabaseConnection;
    protected tableName: string;
    constructor(options: RepositoryOptions, tableName: string);
    findAll(): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    findByField<K extends keyof T>(field: K, value: T[K]): Promise<T[]>;
    search(field: keyof T, keyword: string): Promise<T[]>;
    create(data: Partial<T>): Promise<string>;
    update(id: string, data: Partial<T>): Promise<boolean>;
    delete(id: string): Promise<boolean>;
}
//# sourceMappingURL=base.repository.d.ts.map