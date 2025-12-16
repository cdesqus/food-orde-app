"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItem = exports.Order = exports.OrderStatus = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
const FoodItem_1 = __importDefault(require("./FoodItem"));
// Order Status Enum
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["COOKING"] = "cooking";
    OrderStatus["DELIVERED_TO_SHELTER"] = "delivered_to_shelter";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
class Order extends sequelize_1.Model {
}
exports.Order = Order;
Order.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    customerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: User_1.default, key: 'id' }
    },
    merchantId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: User_1.default, key: 'id' }
    },
    total: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(OrderStatus)),
        defaultValue: OrderStatus.PENDING,
    },
    deliveryLocation: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    rejectionReason: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    proofImage: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    }
}, {
    sequelize: database_1.default,
    tableName: 'orders',
});
// Relationships
User_1.default.hasMany(Order, { foreignKey: 'customerId', as: 'customerOrders' });
User_1.default.hasMany(Order, { foreignKey: 'merchantId', as: 'merchantOrders' });
Order.belongsTo(User_1.default, { foreignKey: 'customerId', as: 'customer' });
Order.belongsTo(User_1.default, { foreignKey: 'merchantId', as: 'merchant' });
// Order Item (Pivot Table / Detail)
class OrderItem extends sequelize_1.Model {
}
exports.OrderItem = OrderItem;
OrderItem.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    orderId: {
        type: sequelize_1.DataTypes.INTEGER,
        references: { model: Order, key: 'id' }
    },
    foodId: {
        type: sequelize_1.DataTypes.INTEGER,
        references: { model: FoodItem_1.default, key: 'id' }
    },
    quantity: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    }
}, {
    sequelize: database_1.default,
    tableName: 'order_items',
});
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(FoodItem_1.default, { foreignKey: 'foodId', as: 'food' });
