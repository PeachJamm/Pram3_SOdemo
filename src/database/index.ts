// =====================================================
// Database Module - 统一导出
// =====================================================

// 连接
export { DatabaseConnection, DatabaseConfig, QueryResult, db } from './connection';

// Repositories
export { BaseRepository, RepositoryOptions } from './repositories/base.repository';
export { 
  CustomerRepository, 
  Customer, 
  CustomerWithPriceList 
} from './repositories/customer.repository';
export { 
  ProductRepository, 
  Product, 
  ProductWithPrice 
} from './repositories/product.repository';
export { 
  UserRepository, 
  User, 
  UserWithPermissions 
} from './repositories/user.repository';

// Services
export { 
  CustomerService, 
  CustomerSelectOption, 
  CustomerFullInfo 
} from './services/customer.service';
export { 
  ProductService, 
  ProductSelectOption, 
  ProductForOrder 
} from './services/product.service';
export { 
  OrderService, 
  OrderItemInput, 
  OrderItemDetail, 
  OrderCalculationResult 
} from './services/order.service';
