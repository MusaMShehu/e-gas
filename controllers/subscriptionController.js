const Subscription = require('../models/Subscription');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all subscriptions
// @route   GET /api/v1/subscriptions
// @route   GET /api/v1/users/:userId/subscriptions
// @access  Private
exports.getSubscriptions = asyncHandler(async (req, res, next) => {
  if (req.params.userId) {
    const subscriptions = await Subscription.find({ user: req.params.userId })
      .populate('product')
      .populate('plan')
      .populate('user', 'firstName lastName email phone');

    return res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single subscription
// @route   GET /api/v1/subscriptions/:id
// @access  Private
exports.getSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await Subscription.findById(req.params.id)
    .populate('product')
    .populate('plan')
    .populate('user', 'firstName lastName email phone');

  if (!subscription) {
    return next(
      new ErrorResponse(`No subscription with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is subscription owner or admin
  if (
    subscription.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this subscription`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: subscription
  });
});

// @desc    Create subscription
// @route   POST /api/v1/subscriptions
// @access  Private
exports.createSubscription = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check if product exists
  const product = await Product.findById(req.body.product);

  if (!product) {
    return next(
      new ErrorResponse(`No product with the id of ${req.body.product}`, 404)
    );
  }

  // Check if user already has an active subscription for this product
  const existingSubscription = await Subscription.findOne({
    user: req.user.id,
    product: req.body.product,
    status: 'active'
  });

  if (existingSubscription) {
    return next(
      new ErrorResponse(
        `User already has an active subscription for this product`,
        400
      )
    );
  }

  const subscription = await Subscription.create(req.body);

  res.status(201).json({
    success: true,
    data: subscription
  });
});

// @desc    Update subscription
// @route   PUT /api/v1/subscriptions/:id
// @access  Private
exports.updateSubscription = asyncHandler(async (req, res, next) => {
  let subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return next(
      new ErrorResponse(`No subscription with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is subscription owner or admin
  if (
    subscription.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this subscription`,
        401
      )
    );
  }

  subscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: subscription
  });
});

// @desc    Cancel subscription
// @route   PUT /api/v1/subscriptions/:id/cancel
// @access  Private
exports.cancelSubscription = asyncHandler(async (req, res, next) => {
  let subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return next(
      new ErrorResponse(`No subscription with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is subscription owner or admin
  if (
    subscription.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to cancel this subscription`,
        401
      )
    );
  }

  subscription.status = 'cancelled';
  await subscription.save();

  res.status(200).json({
    success: true,
    data: subscription
  });
});

// @desc    Process subscription deliveries
// @route   GET /api/v1/subscriptions/process
// @access  Private/Admin
exports.processSubscriptions = asyncHandler(async (req, res, next) => {
  // Get all active subscriptions with next delivery date <= today
  const subscriptions = await Subscription.find({
    status: 'active',
    nextDelivery: { $lte: new Date() }
  }).populate('product');

  if (subscriptions.length === 0) {
    return res.status(200).json({
      success: true,
      data: 'No subscriptions to process'
    });
  }

  const results = [];

  for (const subscription of subscriptions) {
    // Create order for subscription
    const order = await Order.create({
      user: subscription.user,
      products: [
        {
          product: subscription.product._id,
          quantity: 1,
          price: subscription.price
        }
      ],
      deliveryAddress: req.user.address,
      deliveryOption: 'standard',
      totalAmount: subscription.price,
      paymentMethod: 'wallet',
      paymentStatus: 'completed',
      orderStatus: 'processing',
      subscription: subscription._id
    });

    // Update next delivery date
    const nextDelivery = new Date();
    if (subscription.frequency === 'weekly') {
      nextDelivery.setDate(nextDelivery.getDate() + 7);
    } else if (subscription.frequency === 'monthly') {
      nextDelivery.setMonth(nextDelivery.getMonth() + 1);
    } else if (subscription.frequency === 'quarterly') {
      nextDelivery.setMonth(nextDelivery.getMonth() + 3);
    }

    subscription.nextDelivery = nextDelivery;
    await subscription.save();

    results.push({
      subscription: subscription._id,
      order: order._id
    });
  }

  res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});