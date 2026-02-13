// =====================================================
// Product Repository
// 产品数据访问层
// =====================================================

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

export class ProductRepository extends BaseRepository<Product> {
  constructor(options: RepositoryOptions) {
    super(options, 'products');
  }

  // 获取产品列表（用于下拉选择）
  async findAllForSelect(): Promise<Pick<Product, 'id' | 'product_code' | 'name' | 'category'>[]> {
    return this.db.query(
      `SELECT id, product_code, name, category 
       FROM products 
       WHERE is_active = 1 
       ORDER BY category, name`
    );
  }

  // 搜索产品
  async searchProducts(keyword: string): Promise<Product[]> {
    return this.db.query(
      `SELECT * FROM products 
       WHERE is_active = 1 
       AND (name LIKE ? OR product_code LIKE ? OR category LIKE ?)
       LIMIT 20`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );
  }

  // 根据价格表获取产品列表（含价格）
  async findByPriceList(priceListId: string): Promise<ProductWithPrice[]> {
    return this.db.query(
      `SELECT p.*, pli.unit_price, pli.price_list_id, pl.price_list_code
       FROM products p
       JOIN price_list_items pli ON p.id = pli.product_id
       JOIN price_lists pl ON pli.price_list_id = pl.id
       WHERE pli.price_list_id = ? AND p.is_active = 1
       ORDER BY p.category, p.name`,
      [priceListId]
    );
  }

  // 获取产品在指定价格表中的价格
  async getProductPrice(productId: string, priceListId: string): Promise<number | null> {
    const result = await this.db.queryOne<{ unit_price: number }>(
      `SELECT unit_price FROM price_list_items 
       WHERE product_id = ? AND price_list_id = ?`,
      [productId, priceListId]
    );
    return result?.unit_price || null;
  }

  // 获取产品类别列表
  async getCategories(): Promise<string[]> {
    const results = await this.db.query<{ category: string }>(
      `SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category`
    );
    return results.map(r => r.category);
  }

  // 根据产品代码查询
  async findByCode(productCode: string): Promise<Product | null> {
    return this.db.queryOne(
      `SELECT * FROM products WHERE product_code = ? AND is_active = 1`,
      [productCode]
    );
  }
}
