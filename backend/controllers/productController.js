import Product from '../models/productModel.js';
import { redis } from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';

export const getAllproducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({ products });
    } catch (error) {
        console.log("error in getAllproducts controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        let cached = await redis.get("featured_products");
        if (cached) {
            try {
                const arr = JSON.parse(cached);
                const valid = Array.isArray(arr) && arr.every((p) => p && p.createdBy);
                if (valid) {
                    return res.status(200).json(arr);
                }
            } catch {}
        }
        const featuredProducts = await Product.find({ isFeatured: true, createdBy: { $exists: true } }).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts));
        return res.status(200).json(featuredProducts);
    } catch (error) {
        console.log("error in getFeaturedProducts controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;
        if (!name || !description || price == null || !image) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        let uploadedUrl = "";
        if (image) {
            const upload = await cloudinary.uploader.upload(image, { folder: "products" });
            uploadedUrl = upload?.secure_url || "";
        }
        const product = await Product.create({
            name,
            description,
            price,
            category,
            image: uploadedUrl,
            createdBy: req.userId,
        });
        await updateCacheAfterProductChange();
        res.status(201).json({ product, message: "Product created successfully" });
    } catch (error) {
        console.log("error in createProduct controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (product.image) {
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Image deleted from cloudinary");
            } catch (error) {
                console.log("error deleting image from cloudinary", error.message);
            }
        }
        await Product.findByIdAndDelete(req.params.productId);
        await updateCacheAfterProductChange();
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.log("error in deleteProduct controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            { $match: { createdBy: { $exists: true } } },
            { $sample: { size: 3 } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    price: 1,
                    image: 1,
                },
            },
        ]);
        res.status(200).json({ products });
    } catch (error) {
        console.log("error in getRecommendedProducts controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProductByCategory = async (req, res) => {
    const { categoryName } = req.params;
    try {
        const products = await Product.find({ category: categoryName, createdBy: { $exists: true } });
        if (!products || products.length === 0) {
            return res.status(404).json({ message: `No products found in category: ${categoryName}` });
        }
        res.status(200).json({ products });
    } catch (error) {
        console.log("error in getProductBycategory controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        product.isFeatured = !product.isFeatured;
        const updated = await product.save();
        await updateCacheAfterProductChange();
        res.json(updated);
    } catch (error) {
        console.log("error in toggleFeaturedProduct controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateCacheAfterProductChange = async () => {
    try {
        const featuredProducts = await Product.find({ isFeatured: true, createdBy: { $exists: true } }).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("error in updateCacheAfterProductChange", error.message);
    }
};

