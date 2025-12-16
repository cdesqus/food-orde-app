import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import FoodItem from './FoodItem';

// Order Status Enum
export enum OrderStatus {
    PENDING = 'pending',
    COOKING = 'cooking',
    DELIVERED_TO_SHELTER = 'delivered_to_shelter',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

class Order extends Model {
    public id!: number;
    public customerId!: number;
    public merchantId!: number;
    public total!: number;
    public status!: OrderStatus;
    public deliveryLocation!: string;
    public rejectionReason?: string;
    public proofImage?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Order.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    merchantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM(...Object.values(OrderStatus)),
        defaultValue: OrderStatus.PENDING,
    },
    deliveryLocation: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    rejectionReason: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    proofImage: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    sequelize,
    tableName: 'orders',
});

// Relationships
User.hasMany(Order, { foreignKey: 'customerId', as: 'customerOrders' });
User.hasMany(Order, { foreignKey: 'merchantId', as: 'merchantOrders' });
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
Order.belongsTo(User, { foreignKey: 'merchantId', as: 'merchant' });

// Order Item (Pivot Table / Detail)
class OrderItem extends Model {
    public id!: number;
    public orderId!: number;
    public foodId!: number;
    public quantity!: number;
    public price!: number; // Price at time of order
}

OrderItem.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    orderId: {
        type: DataTypes.INTEGER,
        references: { model: Order, key: 'id' }
    },
    foodId: {
        type: DataTypes.INTEGER,
        references: { model: FoodItem, key: 'id' }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    }
}, {
    sequelize,
    tableName: 'order_items',
});

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(FoodItem, { foreignKey: 'foodId', as: 'food' });

export { Order, OrderItem };
