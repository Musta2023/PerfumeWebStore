import express from 'express';
import { protectRoute, adminRoute } from '../middlewares/authMiddleware.js';
import { getCoupon, validateCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/couponController.js'; 

const router = express.Router();

// Customer endpoints
router.get("/", protectRoute, getCoupon);
router.post("/validate", protectRoute, validateCoupon);

// Admin endpoints
router.get("/admin", protectRoute, adminRoute, listCoupons);
router.post("/admin", protectRoute, adminRoute, createCoupon);
router.patch("/admin/:id", protectRoute, adminRoute, updateCoupon);
router.delete("/admin/:id", protectRoute, adminRoute, deleteCoupon);

export default router;
