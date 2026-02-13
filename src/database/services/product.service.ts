// =====================================================
// Product Service
// 产品业务逻辑层 - 支持按价格表加载
// =====================================================

import { ProductRepository, Product, ProductWithPrice } from '../repositories/product.repository';
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

export class ProductService {
  private repository: ProductRepository;

  constructor(db: DatabaseConnection) {
    this.repository = new ProductRepository({ db });
  }

  // 获取产品选择列表（基础信息）
  async getProductSelectList(): Promise<ProductSelectOption[]> {
    const products = await this.repository.findAllForSelect();
    return products.map(p => ({
      ...p,
      displayText: `${p.name} (${p.product_code}) - ${p.category}`,
    }));
  }

  // 搜索产品
  async searchProducts(keyword: string): Promise<ProductSelectOption[]> {
    if (!keyword || keyword.length < 2) {
      return [];
    }
    const products = await this.repository.searchProducts(keyword);
    return products.map(p => ({
      id: p.id,
      product_code: p.product_code,
      name: p.name,
      category: p.category,
      displayText: `${p.name} (${p.product_code}) - ${p.category}`,
    }));
  }

  // 获取指定价格表的产品列表（含价格）- 关键功能
  async getProductsByPriceList(priceListId: string): Promise<ProductSelectOption[]> {
    const products = await this.repository.findByPriceList(priceListId);
    return products.map(p => ({
      id: p.id,
      product_code: p.product_code,
      name: p.name,
      category: p.category,
      unit_price: p.unit_price,
      displayText: `${p.name} (${p.product_code}) - ¥${p.unit_price}`,
    }));
  }

  // 获取产品详细信息（含指定价格表价格）
  async getProductWithPrice(
    productId: string, 
    priceListId: string
  ): Promise<ProductForOrder | null> {
    const product = await this.repository.findById(productId);
    if (!product) return null;

    const unitPrice = await this.repository.getProductPrice(productId, priceListId);
    
    return {
      ...product,
      unit_price: unitPrice || 0,
      price_list_id: priceListId,
      price_list_code: '', // 需要额外查询
    };
  }

  // 计算订单行金额
  calculateLineTotal(unitPrice: number, quantity: number, discountPercent: number = 0): number {
    const subtotal = unitPrice * quantity;
    const discount = subtotal * (discountPercent / 100);
    return Math.round((subtotal - discount) * 100) / 100;
  }

  // 获取产品类别
  async getCategories(): Promise<string[]> {
    return this.repository.getCategories();
  }

  // 按类别获取产品
  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.repository.findByField('category', category);
  }
}
