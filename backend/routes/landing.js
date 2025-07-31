const express = require('express');
const router = express.Router();
const LandingController = require('../controllers/LandingController');

// Public landing route to get products showcase (no auth)
router.get('/landing', LandingController.getLandingData);

// Public route to get featured products (no auth)
router.get('/featured', LandingController.getFeaturedProducts);

// Public route to get products by category (no auth)
router.get('/category/:category', LandingController.getProductsByCategory);

// Public route to get products by usage type (no auth)
router.get('/usage/:usageType', LandingController.getProductsByUsageType);

// Public route to get product details (no auth)
router.get('/product/:productId', LandingController.getProductDetails);

module.exports = router;