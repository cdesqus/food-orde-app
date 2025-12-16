"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyOrders = exports.updateOrderStatus = exports.createOrder = void 0;
const zod_1 = require("zod");
const Order_1 = require("../models/Order");
const FoodItem_1 = __importDefault(require("../models/FoodItem"));
const User_1 = __importDefault(require("../models/User"));
const database_1 = __importDefault(require("../config/database"));
const socket_1 = require("../socket");
// Validation Schemas
const createOrderSchema = zod_1.z.object({
    merchantId: zod_1.z.number(),
    items: zod_1.z.array(zod_1.z.object({
        foodId: zod_1.z.number(),
        quantity: zod_1.z.number().min(1),
    })),
    deliveryLocation: zod_1.z.string(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(Order_1.OrderStatus),
    rejectionReason: zod_1.z.string().optional(),
});
const createOrder = async (req, res) => {
    const t = await database_1.default.transaction();
    try {
        const { merchantId, items, deliveryLocation } = createOrderSchema.parse(req.body);
        const customerId = req.user.id;
        // 1. Calculate Total & Validate Items
        let totalBase = 0;
        const orderItemsData = [];
        for (const item of items) {
            const food = await FoodItem_1.default.findByPk(item.foodId);
            if (!food)
                throw new Error(`Food item ${item.foodId} not found`);
            if (food.merchantId !== merchantId)
                throw new Error('Items must be from the same merchant');
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
        const order = await Order_1.Order.create({
            customerId,
            merchantId,
            total,
            deliveryLocation,
            status: Order_1.OrderStatus.PENDING
        }, { transaction: t });
        // 3. Create Order Items
        for (const itemData of orderItemsData) {
            await Order_1.OrderItem.create({
                orderId: order.id,
                ...itemData
            }, { transaction: t });
        }
        await t.commit();
        // 4. Real-time Notification
        const io = (0, socket_1.getIO)();
        // Notify Merchant
        io.to(`user_${merchantId}`).emit('order:new', {
            orderId: order.id,
            total,
            message: 'New Order Received!'
        });
        res.status(201).json({ message: 'Order placed successfully', orderId: order.id });
    }
    catch (error) {
        await t.rollback();
        res.status(400).json({ message: 'Order placement failed', error: error.message || error });
    }
};
exports.createOrder = createOrder;
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = updateStatusSchema.parse(req.body);
        const userId = req.user.id;
        const order = await Order_1.Order.findByPk(id);
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        // Verify ownership (Merchant or Admin/Finance related logic could go here)
        // Ideally check if req.user.id === order.merchantId
        order.status = status;
        if (rejectionReason)
            order.rejectionReason = rejectionReason;
        await order.save();
        // Real-time Notification to Customer
        const io = (0, socket_1.getIO)();
        io.to(`user_${order.customerId}`).emit('order:status_update', {
            orderId: order.id,
            status: order.status,
            message: `Order status updated to ${status}`
        });
        res.json({ message: 'Status updated', order });
    }
    catch (error) {
        res.status(400).json({ message: 'Update failed', error: error.message || error });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const whereClause = role === 'merchant' ? { merchantId: userId } : { customerId: userId };
        const orders = await Order_1.Order.findAll({
            where: whereClause,
            include: [
                { model: Order_1.OrderItem, as: 'items', include: ['food'] },
                { model: User_1.default, as: 'customer', attributes: ['name', 'dorm', 'room'] },
                { model: User_1.default, as: 'merchant', attributes: ['name', 'image'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};
exports.getMyOrders = getMyOrders;
