import { DatabaseConnection } from '../connection';
export interface OrderItemInput {
    productId: string;
    quantity: number;
}
export interface OrderItemDetail {
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    originalUnitPrice: number;
    discountPercent: number;
    lineTotal: number;
}
export interface OrderCalculationResult {
    customerId: string;
    customerName: string;
    priceListId: string;
    priceListCode: string;
    items: OrderItemDetail[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
}
export declare class OrderService {
    private customerService;
    private productService;
    private db;
    constructor(db: DatabaseConnection);
    createOrderDraft(customerId: string, items: OrderItemInput[]): Promise<OrderCalculationResult | null>;
    getOrderCreateData(): Promise<{
        customers: {
            id: string;
            name: string;
            code: string;
            tier: string;
        }[];
        products: {
            id: string;
            name: string;
            code: string;
            category: string;
        }[];
    }>;
    saveOrder(orderData: OrderCalculationResult, createdBy: string): Promise<string>;
}
//# sourceMappingURL=order.service.d.ts.map