"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
class Withdrawal extends sequelize_1.Model {
}
Withdrawal.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    merchantId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: User_1.default, key: 'id' }
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    }
}, {
    sequelize: database_1.default,
    tableName: 'withdrawals',
});
User_1.default.hasMany(Withdrawal, { foreignKey: 'merchantId', as: 'withdrawals' });
Withdrawal.belongsTo(User_1.default, { foreignKey: 'merchantId', as: 'merchant' });
exports.default = Withdrawal;
