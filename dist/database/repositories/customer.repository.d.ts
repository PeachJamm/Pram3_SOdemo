import { BaseRepository, RepositoryOptions } from './base.repository';
export interface Customer {
    id: string;
    customer_code: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    tier: 'STANDARD' | 'GOLD' | 'ENTERPRISE' | 'VIP';
    customer_type: string;
    price_list_id: string;
    credit_limit: number;
    order_history_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface CustomerWithPriceList extends Customer {
    price_list_code: string;
    price_list_name: string;
}
export declare class CustomerRepository extends BaseRepository<Customer> {
    constructor(options: RepositoryOptions);
    findAllForSelect(): Promise<Pick<Customer, 'id' | 'customer_code' | 'name' | 'tier'>[]>;
    searchCustomers(keyword: string): Promise<Customer[]>;
    findByIdWithPriceList(id: string): Promise<CustomerWithPriceList | null>;
    findByCode(customerCode: string): Promise<Customer | null>;
    getTierDistribution(): Promise<{
        tier: string;
        count: number;
    }[]>;
}
//# sourceMappingURL=customer.repository.d.ts.map