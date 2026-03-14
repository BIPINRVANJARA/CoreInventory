const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');

router.get('/summary', authMiddleware, paymentController.getPaymentSummary);
router.post('/:receiptId', authMiddleware, paymentController.recordPayment);


module.exports = router;
