import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class FoodItem extends Model {
    public id!: number;
    public merchantId!: number;
    public name!: string;
    public description!: string;
    public price!: number;
    public image!: string;
    public category!: string;
    public isAvailable!: boolean;
    public type!: string; // 'food' | 'drink'
}

FoodItem.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    merchantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    image: {
        type: DataTypes.STRING, // URL or base64 placeholder
        allowNull: true,
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'General',
    },
    isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'food',
    }
}, {
    sequelize,
    tableName: 'food_items',
});

// Relationships
User.hasMany(FoodItem, { foreignKey: 'merchantId', as: 'foods' });
FoodItem.belongsTo(User, { foreignKey: 'merchantId', as: 'merchant' });

export default FoodItem;
