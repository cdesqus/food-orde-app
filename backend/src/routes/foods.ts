import { Router } from 'express';
import { getFoods, createFood } from '../controllers/foodController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public: Get all foods (or filter by merchant)
router.get('/', getFoods);

// Protected: Merchant add food
router.post('/', authenticateToken, createFood);

export default router;
