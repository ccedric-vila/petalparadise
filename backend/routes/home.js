const express = require('express');
const router = express.Router();
const HomeController = require('../controllers/HomeController');


router.get('/home', HomeController.getHomeData);

router.get('/reviews/:productId', HomeController.getProductReviews);

module.exports = router;