import express from 'express';
import { orderController } from '../controllers/orderController';
import { authMiddleware } from '../utils/authMiddleware';

const router = express.Router();

// Order routes
router.post('/', authMiddleware, orderController.createOrder);
router.get('/', authMiddleware, orderController.getUserOrders);
router.get('/:orderId', authMiddleware, orderController.getOrderById);
router.patch('/:orderId/status', authMiddleware, orderController.updateOrderStatus);
router.post('/:orderId/payment', authMiddleware, orderController.processPayment);

export default router;
