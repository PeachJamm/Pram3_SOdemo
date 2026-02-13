// =====================================================
// Order Service
// 订单业务逻辑层 - 集成客户和产品自动加载
// =====================================================

import { DatabaseConnection } from '../connection';
import { CustomerService } from './customer.service';
import { ProductService } from './product.service';

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

export class OrderService {
  private customerService: CustomerService;
  private productService: ProductService;
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
    this.customerService = new CustomerService(db);
    this.productService = new ProductService(db);
  }

  // 创建订单草稿 - 自动加载客户信息和产品价格
  async createOrderDraft(
    customerId: string, 
    items: OrderItemInput[]
  ): Promise<OrderCalculationResult | null> {
    // 1. 获取客户信息（自动加载价格表）
    const customerInfo = await this.customerService.getCustomerForOrder(customerId);
    if (!customerInfo) {
      throw new Error('Customer not found');
    }

    const { customer, priceListId, priceListCode } = customerInfo;

    // 2. 获取产品价格并计算
    const orderItems: OrderItemDetail[] = [];
    let subtotal = 0;

    for (const item of items) {
      const productWithPrice = await this.productService.getProductWithPrice(
        item.productId, 
        priceListId
      );
      
      if (!productWithPrice) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const lineTotal = this.productService.calculateLineTotal(
        productWithPrice.unit_price,
        item.quantity,
        0 // 默认无折扣，后续DMN计算
      );

      orderItems.push({
        productId: item.productId,
        productCode: productWithPrice.product_code,
        productName: productWithPrice.name,
        quantity: item.quantity,
        unitPrice: productWithPrice.unit_price,
        originalUnitPrice: productWithPrice.unit_price, // 后续可添加原价对比
        discountPercent: 0,
        lineTotal,
      });

      subtotal += lineTotal;
    }

    // 3. 计算税费和总计
    const taxRate = 0.06; // 6%税率
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const grandTotal = subtotal + taxAmount;

    return {
      customerId: customer.id,
      customerName: customer.name,
      priceListId,
      priceListCode,
      items: orderItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: 0,
      taxAmount,
      grandTotal,
    };
  }

  // 获取订单创建所需的基础数据
  async getOrderCreateData(): Promise<{
    customers: { id: string; name: string; code: string; tier: string }[];
    products: { id: string; name: string; code: string; category: string }[];
  }> {
    const [customers, products] = await Promise.all([
      this.customerService.getCustomerSelectList(),
      this.productService.getProductSelectList(),
    ]);

    return {
      customers: customers.map(c => ({
        id: c.id,
        name: c.name,
        code: c.customer_code,
        tier: c.tier,
      })),
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        code: p.product_code,
        category: p.category,
      })),
    };
  }

  // 保存订单到数据库
  async saveOrder(orderData: OrderCalculationResult, createdBy: string): Promise<string> {
    const orderId = `order-${Date.now()}`;
    const orderNumber = `SO-${Date.now()}`;

    // 插入订单主表
    await this.db.execute(
      `INSERT INTO sales_orders (id, order_number, customer_id, price_list_id, 
        total_amount, tax_amount, grand_total, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        orderNumber,
        orderData.customerId,
        orderData.priceListId,
        orderData.subtotal,
        orderData.taxAmount,
        orderData.grandTotal,
        'DRAFT',
        createdBy,
      ]
    );

    // 插入订单明细
    for (const item of orderData.items) {
      await this.db.execute(
        `INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity,
          unit_price, original_unit_price, discount_percent, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          orderId,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.originalUnitPrice,
          item.discountPercent,
          item.lineTotal,
        ]
      );
    }

    return orderId;
  }

  // 查询订单列表
  async queryOrders(params: {
    status?: string;
    customerId?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{
    orders: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let whereConditions: string[] = [];
    let whereParams: any[] = [];

    if (params.status) {
      whereConditions.push('o.status = ?');
      whereParams.push(params.status);
    }
    if (params.customerId) {
      whereConditions.push('o.customer_id = ?');
      whereParams.push(params.customerId);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // 查询总数
    const countResult = await this.db.query(
      `SELECT COUNT(*) as total FROM sales_orders o ${whereClause}`,
      whereParams
    );
    const total = countResult[0]?.total || 0;

    // 查询订单列表
    const orders = await this.db.query(
      `SELECT o.id, o.order_number, o.customer_id, o.total_amount, o.grand_total, 
              o.status, o.created_at, o.created_by, o.process_instance_key,
              c.name as customer_name, c.tier as customer_tier
       FROM sales_orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, pageSize, offset]
    );

    return {
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        customerId: order.customer_id,
        customerName: order.customer_name,
        customerTier: order.customer_tier,
        totalAmount: order.total_amount,
        grandTotal: order.grand_total,
        status: order.status,
        createdAt: order.created_at,
        createdBy: order.created_by,
        processInstanceKey: order.process_instance_key,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取订单详情
  async getOrderById(orderId: string): Promise<any | null> {
    const orders = await this.db.query(
      `SELECT o.id, o.order_number, o.customer_id, o.total_amount, o.grand_total,
              o.discount_amount, o.tax_amount, o.status, o.created_at, o.updated_at,
              o.created_by, o.process_instance_key, o.price_list_id,
              c.name as customer_name, c.tier as customer_tier, c.email as customer_email,
              c.phone as customer_phone, c.address as customer_address
       FROM sales_orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    // 查询订单明细
    const items = await this.db.query(
      `SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price, 
              oi.original_unit_price, oi.discount_percent, oi.line_total,
              p.name as product_name, p.product_code
       FROM sales_order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.sales_order_id = ?`,
      [orderId]
    );

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customerName: order.customer_name,
      customerTier: order.customer_tier,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      priceListId: order.price_list_id,
      totalAmount: order.total_amount,
      discountAmount: order.discount_amount,
      taxAmount: order.tax_amount,
      grandTotal: order.grand_total,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      createdBy: order.created_by,
      processInstanceKey: order.process_instance_key,
      items: items.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productCode: item.product_code,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        originalUnitPrice: item.original_unit_price,
        discountPercent: item.discount_percent,
        lineTotal: item.line_total,
      })),
    };
  }
}
