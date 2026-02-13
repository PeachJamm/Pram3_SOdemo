import { Product, ProductWithPrice } from '../repositories/product.repository';
import { DatabaseConnection } from '../connection';
export interface ProductSelectOption {
    id: string;
    product_code: string;
    name: string;
    category: string;
    unit_price?: number;
    displayText: string;
}
export interface ProductForOrder extends ProductWithPrice {
    line_total?: number;
    quantity?: number;
}
export declare class ProductService {
    private repository;
    constructor(db: DatabaseConnection);
    getProductSelectList(): Promise<ProductSelectOption[]>;
    searchProducts(keyword: string): Promise<ProductSelectOption[]>;
    getProductsByPriceList(priceListId: string): Promise<ProductSelectOption[]>;
    getProductWithPrice(productId: string, priceListId: string): Promise<ProductForOrder | null>;
    calculateLineTotal(unitPrice: number, quantity: number, discountPercent?: number): number;
    getCategories(): Promise<string[]>;
    getProductsByCategory(category: string): Promise<Product[]>;
}
//# sourceMappingURL=product.service.d.ts.map