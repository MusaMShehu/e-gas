const Payment = require('../models/Payment');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all payments
// @route   GET /api/v1/payments
// @route   GET /api/v1/users/:userId/payments
// @access  Private
exports.getPayments = asyncHandler(async (req, res, next) => {
  if (req.params.userId) {
    const payments = await Payment.find({ user: req.params.userId })
      .populate('user', 'firstName lastName email phone')
      .populate('order')
      .populate('subscription');

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single payment
// @route   GET /api/v1/payments/:id
// @access  Private
exports.getPayment = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('user', 'firstName lastName email phone')
    .populate('order')
    .populate('subscription');

  if (!payment) {
    return next(
      new ErrorResponse(`No payment with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is payment owner or admin
  if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this payment`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Create payment
// @route   POST /api/v1/payments
// @access  Private
exports.createPayment = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // For wallet top-up, update user balance
  if (req.body.type === 'credit' && req.body.method === 'wallet') {
    const user = await User.findById(req.user.id);
    user.walletBalance += req.body.amount;
    await user.save();
  }

  const payment = await Payment.create(req.body);

  res.status(201).json({
    success: true,
    data: payment
  });
});

// @desc    Process payment callback
// @route   POST /api/v1/payments/callback
// @access  Public
exports.processPaymentCallback = asyncHandler(async (req, res, next) => {
  // This would handle payment gateway callbacks
  // Verify the payment with the payment gateway
  // Update payment status and related order/subscription

  res.status(200).json({
    success: true,
    data: 'Payment callback processed'
  });
});

// @desc    Get payment statistics
// @route   GET /api/v1/payments/stats
// @access  Private/Admin
exports.getPaymentStats = asyncHandler(async (req, res, next) => {
  const stats = await Payment.aggregate([
    {
      $match: { createdAt: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) } }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: stats
  });
});