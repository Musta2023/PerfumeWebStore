import express from 'express';
import { protectRoute, adminRoute } from '../middlewares/authMiddleware.js';
import {
	getAllCustomers,
	getCustomerById,
	updateCustomer,
	getCustomerStats,
} from '../controllers/customerController.js';

const router = express.Router();

// Admin only routes
router.get('/', protectRoute, adminRoute, getAllCustomers);
router.get('/stats/summary', protectRoute, adminRoute, getCustomerStats);
router.get('/:id', protectRoute, adminRoute, getCustomerById);
router.patch('/:id', protectRoute, adminRoute, updateCustomer);

export default router;
