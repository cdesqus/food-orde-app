import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export enum UserRole {
    ADMIN = 'admin',
    FINANCE = 'finance',
    MERCHANT = 'merchant',
    CUSTOMER = 'customer'
}

class User extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    public password!: string;
    public role!: UserRole;
    public balance!: number;
    public isVerified!: boolean;
    public status!: string; // 'active', 'suspended', 'banned'

    // Customer specific
    public dorm?: string;
    public room?: string;

    // Merchant specific
    public openTime?: string;
    public closeTime?: string;
    public image?: string; // Merchant logo/image

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM(...Object.values(UserRole)),
        defaultValue: UserRole.CUSTOMER,
    },
    balance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active',
    },
    // Customer Fields
    dorm: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    room: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Merchant Fields
    openTime: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    closeTime: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    sequelize,
    tableName: 'users',
});

export default User;
