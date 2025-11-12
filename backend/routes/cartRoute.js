import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import { getCartProducts,
         addToCart,
         removeAllFromCart,
         updateQuantity,
         applyCoupon,
         removeCoupon
} from "../controllers/cartController.js";  

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, addToCart);
router.delete("/", protectRoute, removeAllFromCart);
router.put("/:id", protectRoute, updateQuantity);

// Coupon actions on cart
router.post("/apply-coupon", protectRoute, applyCoupon);
router.post("/remove-coupon", protectRoute, removeCoupon);

export default router;
