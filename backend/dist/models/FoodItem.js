"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
class FoodItem extends sequelize_1.Model {
}
FoodItem.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    merchantId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User_1.default,
            key: 'id'
        }
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    image: {
        type: sequelize_1.DataTypes.STRING, // URL or base64 placeholder
        allowNull: true,
    },
    category: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'General',
    },
    isAvailable: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    type: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'food',
    }
}, {
    sequelize: database_1.default,
    tableName: 'food_items',
});
// Relationships
User_1.default.hasMany(FoodItem, { foreignKey: 'merchantId', as: 'foods' });
FoodItem.belongsTo(User_1.default, { foreignKey: 'merchantId', as: 'merchant' });
exports.default = FoodItem;
