const express = require('express');
const {
  getPayments,
  getPayment,
  createPayment,
  processPaymentCallback,
  getPaymentStats
} = require('../controllers/paymentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getPayments)
  .post(protect, createPayment);

router
  .route('/:id')
  .get(protect, getPayment);

router
  .route('/callback')
  .post(processPaymentCallback);

router
  .route('/stats')
  .get(protect, authorize('admin'), getPaymentStats);

module.exports = router;