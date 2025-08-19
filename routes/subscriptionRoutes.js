const express = require('express');
const {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  processSubscriptions
} = require('../controllers/subscriptionController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getSubscriptions)
  .post(protect, createSubscription);

router
  .route('/:id')
  .get(protect, getSubscription)
  .put(protect, updateSubscription);

router
  .route('/:id/cancel')
  .put(protect, cancelSubscription);

router
  .route('/process')
  .get(protect, authorize('admin'), processSubscriptions);

module.exports = router;