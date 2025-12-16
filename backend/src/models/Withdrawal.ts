import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class Withdrawal extends Model {
    public id!: number;
    public merchantId!: number;
    public amount!: number;
    public status!: string; // 'pending', 'approved', 'rejected'
}

Withdrawal.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    merchantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    }
}, {
    sequelize,
    tableName: 'withdrawals',
});

User.hasMany(Withdrawal, { foreignKey: 'merchantId', as: 'withdrawals' });
Withdrawal.belongsTo(User, { foreignKey: 'merchantId', as: 'merchant' });

export default Withdrawal;
