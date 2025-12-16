import { Request, Response } from 'express';
import FoodItem from '../models/FoodItem';
import User from '../models/User';
import { z } from 'zod';

const createFoodSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    image: z.string().optional(),
    category: z.string(),
    type: z.enum(['food', 'drink']).optional(),
    isAvailable: z.boolean().optional()
});

export const getFoods = async (req: Request, res: Response) => {
    try {
        const { merchantId } = req.query;
        const where = merchantId ? { merchantId } : {};

        const foods = await FoodItem.findAll({
            where,
            include: [{ model: User, as: 'merchant', attributes: ['id', 'name', 'image', 'openTime', 'closeTime'] }]
        });
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching foods', error });
    }
};

export const createFood = async (req: Request | any, res: Response) => {
    try {
        // Ensure user is merchant
        if (req.user.role !== 'merchant') {
            return res.status(403).json({ message: 'Only merchants can add food' });
        }

        const data = createFoodSchema.parse(req.body);

        const food = await FoodItem.create({
            ...data,
            merchantId: req.user.id
        });

        res.status(201).json(food);
    } catch (error) {
        res.status(400).json({ message: 'Error creating food', error });
    }
};
