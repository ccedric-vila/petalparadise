const express = require('express');
const router = express.Router();
const ManageReviewController = require('../controllers/ManageReviewController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');


router.get('/managereview', auth, admin, ManageReviewController.getAllReviews);
router.delete('/managereview/:id', auth, admin, ManageReviewController.deleteReviewById);


router.get('/reviews/download/pdf', auth, admin, ManageReviewController.downloadReviewsPDF);


module.exports = router;
