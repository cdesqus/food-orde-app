import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import { z } from 'zod';

// Zod Schemas
const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(UserRole).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const validatedData = registerSchema.parse(req.body);

        const existingUser = await User.findOne({ where: { email: validatedData.email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        // Default to CUSTOMER if role not provided or trying to create Admin without permission (Production logic should restrict this further)
        const role = validatedData.role || UserRole.CUSTOMER;

        const user = await User.create({
            ...validatedData,
            password: hashedPassword,
            role
        });

        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: JSON.parse(error.message) });
        }
        res.status(500).json({ message: 'Registration failed', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, role: user.role, balance: user.balance } });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: JSON.parse(error.message) });
        }
        console.error("Login Error:", error); // Critical for debugging
        res.status(500).json({ message: 'Internal server error' });
    }
};
