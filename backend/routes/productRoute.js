import express from 'express';
import { protectRoute, adminRoute} from '../middlewares/authMiddleware.js';
import { getAllproducts,
        createProduct,
        deleteProduct,
        getFeaturedProducts,
        getRecommendedProducts,
        getProductByCategory,
        toggleFeaturedProduct
}from '../controllers/productController.js';

const router = express.Router();
// Optional: public list or admin-only list
router.get("/All", protectRoute, adminRoute, getAllproducts);
router.get("/", protectRoute, adminRoute, getAllproducts);

// Featured products (public)
router.get("/getFeatured", getFeaturedProducts); // legacy
router.get("/featured", getFeaturedProducts);

// Admin operations
router.post("/createProduct", protectRoute, adminRoute, createProduct);
router.patch("/updateProduct/:productId", protectRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:productId", protectRoute, adminRoute, deleteProduct);

// Public
router.get("/category/:categoryName", getProductByCategory);
router.get("/recommendations", getRecommendedProducts);

export default router;  
