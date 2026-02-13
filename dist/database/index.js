"use strict";
// =====================================================
// Database Module - 统一导出
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = exports.ProductService = exports.CustomerService = exports.UserRepository = exports.ProductRepository = exports.CustomerRepository = exports.BaseRepository = exports.db = exports.DatabaseConnection = void 0;
// 连接
var connection_1 = require("./connection");
Object.defineProperty(exports, "DatabaseConnection", { enumerable: true, get: function () { return connection_1.DatabaseConnection; } });
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return connection_1.db; } });
// Repositories
var base_repository_1 = require("./repositories/base.repository");
Object.defineProperty(exports, "BaseRepository", { enumerable: true, get: function () { return base_repository_1.BaseRepository; } });
var customer_repository_1 = require("./repositories/customer.repository");
Object.defineProperty(exports, "CustomerRepository", { enumerable: true, get: function () { return customer_repository_1.CustomerRepository; } });
var product_repository_1 = require("./repositories/product.repository");
Object.defineProperty(exports, "ProductRepository", { enumerable: true, get: function () { return product_repository_1.ProductRepository; } });
var user_repository_1 = require("./repositories/user.repository");
Object.defineProperty(exports, "UserRepository", { enumerable: true, get: function () { return user_repository_1.UserRepository; } });
// Services
var customer_service_1 = require("./services/customer.service");
Object.defineProperty(exports, "CustomerService", { enumerable: true, get: function () { return customer_service_1.CustomerService; } });
var product_service_1 = require("./services/product.service");
Object.defineProperty(exports, "ProductService", { enumerable: true, get: function () { return product_service_1.ProductService; } });
var order_service_1 = require("./services/order.service");
Object.defineProperty(exports, "OrderService", { enumerable: true, get: function () { return order_service_1.OrderService; } });
//# sourceMappingURL=index.js.map