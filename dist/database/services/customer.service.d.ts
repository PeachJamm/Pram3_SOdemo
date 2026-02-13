import { Customer, CustomerWithPriceList } from '../repositories/customer.repository';
import { DatabaseConnection } from '../connection';
export interface CustomerSelectOption {
    id: string;
    customer_code: string;
    name: string;
    tier: string;
    displayText: string;
}
export interface CustomerFullInfo extends CustomerWithPriceList {
    price_list_info?: {
        id: string;
        code: string;
        name: string;
    };
}
export declare class CustomerService {
    private repository;
    constructor(db: DatabaseConnection);
    getCustomerSelectList(): Promise<CustomerSelectOption[]>;
    searchCustomers(keyword: string): Promise<CustomerSelectOption[]>;
    getCustomerFullInfo(customerId: string): Promise<CustomerFullInfo | null>;
    getCustomerForOrder(customerId: string): Promise<{
        customer: Customer;
        priceListId: string;
        priceListCode: string;
    } | null>;
    getCustomerStats(): Promise<{
        tier: string;
        count: number;
        percentage: number;
    }[]>;
}
//# sourceMappingURL=customer.service.d.ts.map