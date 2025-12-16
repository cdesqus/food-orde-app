import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './socket';
import { connectDB } from './config/database';

import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import foodRoutes from './routes/foods';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const httpServer = createServer(app);

// Trust Proxy for Nginx (Rate Limiting check)
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

// Initialize Socket.io
initSocket(httpServer);

import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

// ... (previous imports)

// Middleware
app.use(helmet());
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate Limiting (DDoS Protection)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // In prod, restrict this to your domain e.g., ["https://eatz.app"]
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
// Prod logging: minimal. Dev: verbose.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/foods', foodRoutes);

// Basic Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
