import { Router } from 'express';
import { createOrder, updateOrderStatus, getMyOrders } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken); // Protect all order routes

router.post('/', createOrder);
router.get('/', getMyOrders);
router.put('/:id/status', updateOrderStatus);

export default router;
