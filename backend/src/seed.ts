import sequelize from './config/database';
import User, { UserRole } from './models/User';
import FoodItem from './models/FoodItem';
import bcrypt from 'bcrypt';

const seed = async () => {
    try {
        await sequelize.authenticate();
        // Force sync (DROP TABLES!)
        await sequelize.sync({ force: true });
        console.log('Database Cleared & Synced.');

        const password = await bcrypt.hash('123', 10);

        // 1. Create Users
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@food.com',
            password,
            role: UserRole.ADMIN,
            isVerified: true
        });

        const merchant = await User.create({
            name: 'Neon Burger',
            email: 'burger@food.com',
            password,
            role: UserRole.MERCHANT,
            isVerified: true,
            openTime: '10:00',
            closeTime: '22:00',
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500'
        });

        const customer = await User.create({
            name: 'John Doe',
            email: 'john@food.com',
            password,
            role: UserRole.CUSTOMER,
            balance: 500000,
            isVerified: true,
            dorm: 'Block A',
            room: '101'
        });

        // 2. Create Foods
        await FoodItem.create({
            merchantId: merchant.id,
            name: 'Cyber Burger',
            description: 'Glowing neon sauce',
            price: 25000,
            image: 'https://source.unsplash.com/random/500x500/?burger',
            category: 'Fast Food',
            type: 'food'
        });

        await FoodItem.create({
            merchantId: merchant.id,
            name: 'Binary Fries',
            description: 'Crispy 1s and 0s',
            price: 15000,
            image: 'https://source.unsplash.com/random/500x500/?fries',
            category: 'Sides',
            type: 'food'
        });

        console.log('Database Seeded Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
