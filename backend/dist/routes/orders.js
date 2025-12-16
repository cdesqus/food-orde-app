"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken); // Protect all order routes
router.post('/', orderController_1.createOrder);
router.get('/', orderController_1.getMyOrders);
router.put('/:id/status', orderController_1.updateOrderStatus);
exports.default = router;
