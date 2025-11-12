import User from '../models/userModel.js';
import Order from '../models/orderModel.js';
import AuditLog from '../models/auditLogModel.js';

// GET /api/customers - List all customers with filters and pagination
export const getAllCustomers = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			search,
			role = 'customer',
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = req.query;

		const query = { role }; // Default to customers only, not admins

		// Search by name or email
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
			];
		}

		const skip = (parseInt(page) - 1) * parseInt(limit);
		const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

		const [customers, total] = await Promise.all([
			User.find(query)
				.sort(sortObj)
				.skip(skip)
				.limit(parseInt(limit))
				.select('-password')
				.lean(),
			User.countDocuments(query),
		]);

		// Enrich with order count and total spent
		const customerIds = customers.map((c) => c._id);
		const orderStats = await Order.aggregate([
			{ $match: { user: { $in: customerIds }, status: 'paid' } },
			{
				$group: {
					_id: '$user',
					orderCount: { $sum: 1 },
					totalSpent: { $sum: '$totalAmount' },
				},
			},
		]);

		const statsMap = new Map(orderStats.map((s) => [s._id.toString(), s]));

		const enrichedCustomers = customers.map((c) => {
			const stats = statsMap.get(c._id.toString()) || { orderCount: 0, totalSpent: 0 };
			return {
				...c,
				orderCount: stats.orderCount,
				totalSpent: stats.totalSpent,
			};
		});

		res.json({
			customers: enrichedCustomers,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit)),
			},
		});
	} catch (error) {
		console.error('Error in getAllCustomers:', error);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// GET /api/customers/:id - Get single customer details
export const getCustomerById = async (req, res) => {
	try {
		const customer = await User.findById(req.params.id).select('-password').lean();

		if (!customer) {
			return res.status(404).json({ message: 'Customer not found' });
		}

		// Get order history
		const orders = await Order.find({ user: req.params.id })
			.sort({ createdAt: -1 })
			.limit(50)
			.populate('products.product', 'name image price')
			.lean();

		// Calculate stats
		const paidOrders = orders.filter((o) => o.status === 'paid');
		const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

		res.json({
			...customer,
			orders,
			stats: {
				totalOrders: orders.length,
				paidOrders: paidOrders.length,
				totalSpent,
			},
		});
	} catch (error) {
		console.error('Error in getCustomerById:', error);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// PATCH /api/customers/:id - Update customer profile (admin)
export const updateCustomer = async (req, res) => {
	try {
		const { name, email, role } = req.body;
		const customerId = req.params.id;

		const customer = await User.findById(customerId);
		if (!customer) {
			return res.status(404).json({ message: 'Customer not found' });
		}

		const changes = {};
		if (name && name !== customer.name) {
			changes.name = { old: customer.name, new: name };
			customer.name = name;
		}
		if (email && email !== customer.email) {
			// Check if email already exists
			const emailExists = await User.findOne({ email, _id: { $ne: customerId } });
			if (emailExists) {
				return res.status(400).json({ message: 'Email already in use' });
			}
			changes.email = { old: customer.email, new: email };
			customer.email = email;
		}
		if (role && ['customer', 'admin'].includes(role) && role !== customer.role) {
			changes.role = { old: customer.role, new: role };
			customer.role = role;
		}

		await customer.save();

		// Log audit trail
		if (Object.keys(changes).length > 0) {
			await AuditLog.create({
				actor: req.userId,
				actorEmail: req.user.email,
				action: 'update',
				entity: 'customer',
				entityId: customerId,
				changes,
			});
		}

		res.json({ message: 'Customer updated', customer: { ...customer.toObject(), password: undefined } });
	} catch (error) {
		console.error('Error in updateCustomer:', error);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// GET /api/customers/stats/summary - Customer statistics
export const getCustomerStats = async (req, res) => {
	try {
		const [totalCustomers, customersWithOrders, topCustomers] = await Promise.all([
			User.countDocuments({ role: 'customer' }),
			Order.distinct('user'),
			Order.aggregate([
				{ $match: { status: 'paid' } },
				{
					$group: {
						_id: '$user',
						orderCount: { $sum: 1 },
						totalSpent: { $sum: '$totalAmount' },
					},
				},
				{ $sort: { totalSpent: -1 } },
				{ $limit: 10 },
				{
					$lookup: {
						from: 'users',
						localField: '_id',
						foreignField: '_id',
						as: 'customer',
					},
				},
				{ $unwind: '$customer' },
				{
					$project: {
						_id: 1,
						name: '$customer.name',
						email: '$customer.email',
						orderCount: 1,
						totalSpent: 1,
					},
				},
			]),
		]);

		res.json({
			totalCustomers,
			customersWithOrders: customersWithOrders.length,
			topCustomers,
		});
	} catch (error) {
		console.error('Error in getCustomerStats:', error);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};
