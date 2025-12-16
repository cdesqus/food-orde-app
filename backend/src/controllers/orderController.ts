import { Request, Response } from 'express';
import { z } from 'zod';
import { Order, OrderItem, OrderStatus } from '../models/Order';
import FoodItem from '../models/FoodItem';
import User from '../models/User';
import sequelize from '../config/database';
import { getIO } from '../socket';

// Validation Schemas
const createOrderSchema = z.object({
    merchantId: z.number(),
    items: z.array(z.object({
        foodId: z.number(),
        quantity: z.number().min(1),
    })),
    deliveryLocation: z.string(),
});

const updateStatusSchema = z.object({
    status: z.nativeEnum(OrderStatus),
    rejectionReason: z.string().optional(),
});

export const createOrder = async (req: Request | any, res: Response) => {
    const t = await sequelize.transaction();

    try {
        const { merchantId, items, deliveryLocation } = createOrderSchema.parse(req.body);
        const customerId = req.user.id;

        // 1. Calculate Total & Validate Items
        let totalBase = 0;
        const orderItemsData = [];

        for (const item of items) {
            const food = await FoodItem.findByPk(item.foodId);
            if (!food) throw new Error(`Food item ${item.foodId} not found`);
            if (food.merchantId !== merchantId) throw new Error('Items must be from the same merchant');

            const price = Number(food.price);
            totalBase += price * item.quantity;

            orderItemsData.push({
                foodId: item.foodId,
                quantity: item.quantity,
                price: price
            });
        }

        // Platform Fee (15%)
        const handlingFee = Math.floor(totalBase * 0.15);
        const total = totalBase + handlingFee;

        // 2. Create Order
        const order = await Order.create({
            customerId,
            merchantId,
            total,
            deliveryLocation,
            status: OrderStatus.PENDING
        }, { transaction: t });

        // 3. Create Order Items
        for (const itemData of orderItemsData) {
            await OrderItem.create({
                orderId: order.id,
                ...itemData
            }, { transaction: t });
        }

        await t.commit();

        // 4. Real-time Notification
        const io = getIO();
        // Notify Merchant
        io.to(`user_${merchantId}`).emit('order:new', {
            orderId: order.id,
            total,
            message: 'New Order Received!'
        });

        res.status(201).json({ message: 'Order placed successfully', orderId: order.id });

    } catch (error: any) {
        await t.rollback();
        res.status(400).json({ message: 'Order placement failed', error: error.message || error });
    }
};

export const updateOrderStatus = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = updateStatusSchema.parse(req.body);
        const userId = req.user.id;

        const order = await Order.findByPk(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Verify ownership (Merchant or Admin/Finance related logic could go here)
        // Ideally check if req.user.id === order.merchantId

        order.status = status;
        if (rejectionReason) order.rejectionReason = rejectionReason;
        await order.save();

        // Real-time Notification to Customer
        const io = getIO();
        io.to(`user_${order.customerId}`).emit('order:status_update', {
            orderId: order.id,
            status: order.status,
            message: `Order status updated to ${status}`
        });

        res.json({ message: 'Status updated', order });
    } catch (error: any) {
        res.status(400).json({ message: 'Update failed', error: error.message || error });
    }
};

export const getMyOrders = async (req: Request | any, res: Response) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        const whereClause = role === 'merchant' ? { merchantId: userId } : { customerId: userId };

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: OrderItem, as: 'items', include: ['food'] },
                { model: User, as: 'customer', attributes: ['name', 'dorm', 'room'] },
                { model: User, as: 'merchant', attributes: ['name', 'image'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};
