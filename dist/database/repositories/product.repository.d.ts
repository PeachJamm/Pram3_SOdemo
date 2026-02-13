import { BaseRepository, RepositoryOptions } from './base.repository';
export interface Product {
    id: string;
    product_code: string;
    name: string;
    description: string;
    category: string;
    unit_of_measure: string;
    cost_price: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface ProductWithPrice extends Product {
    unit_price: number;
    price_list_id: string;
    price_list_code: string;
}
export declare class ProductRepository extends BaseRepository<Product> {
    constructor(options: RepositoryOptions);
    findAllForSelect(): Promise<Pick<Product, 'id' | 'product_code' | 'name' | 'category'>[]>;
    searchProducts(keyword: string): Promise<Product[]>;
    findByPriceList(priceListId: string): Promise<ProductWithPrice[]>;
    getProductPrice(productId: string, priceListId: string): Promise<number | null>;
    getCategories(): Promise<string[]>;
    findByCode(productCode: string): Promise<Product | null>;
}
//# sourceMappingURL=product.repository.d.ts.map