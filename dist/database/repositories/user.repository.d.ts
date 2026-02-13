import { BaseRepository, RepositoryOptions } from './base.repository';
export interface User {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    full_name: string;
    role: string;
    permissions: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface UserWithPermissions extends Omit<User, 'permissions'> {
    permissions: string[];
}
export declare class UserRepository extends BaseRepository<User> {
    constructor(options: RepositoryOptions);
    findByUsername(username: string): Promise<User | null>;
    validateUser(username: string, password: string): Promise<User | null>;
    getUserPermissions(userId: string): Promise<string[]>;
    hasPermission(userId: string, permission: string): Promise<boolean>;
    hasOverridePermission(userId: string): Promise<boolean>;
    findAllActive(): Promise<Pick<User, 'id' | 'username' | 'full_name' | 'role'>[]>;
    findByRole(role: string): Promise<User[]>;
}
//# sourceMappingURL=user.repository.d.ts.map