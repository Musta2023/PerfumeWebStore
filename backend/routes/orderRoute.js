import express from 'express';
import { protectRoute, adminRoute } from '../middlewares/authMiddleware.js';
import {
	getAllOrders,
	getOrderById,
	updateOrderStatus,
	getOrderStats,
	getMyOrders,
} from '../controllers/orderController.js';

const router = express.Router();

// Customer routes
router.get('/my', protectRoute, getMyOrders);

// Admin only routes
router.get('/', protectRoute, adminRoute, getAllOrders);
router.get('/stats/summary', protectRoute, adminRoute, getOrderStats);
router.get('/:id', protectRoute, adminRoute, getOrderById);
router.patch('/:id', protectRoute, adminRoute, updateOrderStatus);

export default router;
