import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import AuditLog from '../models/auditLogModel.js';

// GET /api/orders/my - List orders for the authenticated customer
export const getMyOrders = async (req, res) => {
	try {
		const orders = await Order.find({ user: req.userId })
			.sort({ createdAt: -1 })
			.populate('products.product', 'name image price')
			.lean();

		return res.json({ orders });
	} catch (error) {
		console.error('Error in getMyOrders:', error);
		return res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// GET /api/orders - List all orders (admin only) with filters and pagination
export const getAllOrders = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			status,
			customer,
			search,
			sortBy = 'createdAt',
			sortOrder = 'desc',
			startDate,
			endDate,
		} = req.query;

		const query = {};

		// Filter by status
		if (status && status !== 'all') {
			query.status = status;
		}

		// Filter by customer
		if (customer) {
			query.user = customer;
		}

		// Date range filter
		if (startDate || endDate) {
			query.createdAt = {};
			if (startDate) query.createdAt.$gte = new Date(startDate);
			if (endDate) {
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);
				query.createdAt.$lte = end;
			}
		}

		// Search by session ID or order ID
		if (search) {
			query.$or = [
				{ stripeSessionId: { $regex: search, $options: 'i' } },
				{ _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
			].filter(Boolean);
		}

		const skip = (parseInt(page) - 1) * parseInt(limit);
		const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

		const [orders, total] = await Promise.all([
			Order.find(query)
				.sort(sortObj)
				.skip(skip)
				.limit(parseInt(limit))
				.populate('user', 'name email')
				.populate('products.product', 'name image price')
				.lean(),
			Order.countDocuments(query),
		]);

		res.json({
			orders,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit)),
			},
		});
	} catch (error) {
		console.error('Error in getAllOrders:', error);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// GET /api/orders/:id - Get single order details
export const getOrderById = async (req, res) => {
	try {
		const order = await Order.findById(req.params.id)
			.populate('user', 'name email')
			.populate('products.product', 'name image price category')
			.lean();

		if (!order) {
			return res.status(404).json({ message: 'Order not found' });
		}

		res.json(order);
	} catch (error) {
		console.error('Error in getOrderById:', error);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// PATCH /api/orders/:id - Update order status
export const updateOrderStatus = async (req, res) => {
	try {
		const { status } = req.body;
		const orderId = req.params.id;

		const validStatuses = ['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
		}

		const order = await Order.findById(orderId);
		if (!order) {
			return res.status(404).json({ message: 'Order not found' });
		}

		const oldStatus = order.status;
		order.status = status;
		await order.save();

		// Log audit trail
		await AuditLog.create({
			actor: req.userId,
			actorEmail: req.user.email,
			action: 'status_change',
			entity: 'order',
			entityId: orderId,
			changes: {
				status: { old: oldStatus, new: status },
			},
			metadata: { orderId, customer: order.user },
		});

		res.json({ message: 'Order status updated', order });
	} catch (error) {
		console.error('Error in updateOrderStatus:', error);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// GET /api/orders/stats/summary - Order statistics for dashboard
export const getOrderStats = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const query = {};

		if (startDate || endDate) {
			query.createdAt = {};
			if (startDate) query.createdAt.$gte = new Date(startDate);
			if (endDate) {
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);
				query.createdAt.$lte = end;
			}
		}

		const [statusBreakdown, totalStats] = await Promise.all([
			Order.aggregate([
				{ $match: query },
				{
					$group: {
						_id: '$status',
						count: { $sum: 1 },
						revenue: { $sum: '$totalAmount' },
					},
				},
			]),
			Order.aggregate([
				{ $match: query },
				{
					$group: {
						_id: null,
						totalOrders: { $sum: 1 },
						totalRevenue: { $sum: '$totalAmount' },
						avgOrderValue: { $avg: '$totalAmount' },
					},
				},
			]),
		]);

		const stats = totalStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
		const byStatus = {};
		statusBreakdown.forEach((s) => {
			byStatus[s._id] = { count: s.count, revenue: s.revenue };
		});

		res.json({
			...stats,
			byStatus,
		});
	} catch (error) {
		console.error('Error in getOrderStats:', error);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};
