import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false, // Set to console.log to see SQL queries
    pool: {
        max: 20, // Increased for concurrency
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected Successfully.');

        // Import Models to Init
        await import('../models/User');
        await import('../models/FoodItem');
        await import('../models/Order');
        await import('../models/Withdrawal');

        // In production, use migrations. For this setup, we'll sync.
        await sequelize.sync({ alter: true });
        console.log('Database Synced.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

export default sequelize;
