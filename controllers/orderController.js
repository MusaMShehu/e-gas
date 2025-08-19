const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all orders
// @route   GET /api/v1/orders
// @route   GET /api/v1/users/:userId/orders
// @access  Private
exports.getOrders = asyncHandler(async (req, res, next) => {
  if (req.params.userId) {
    const orders = await Order.find({ user: req.params.userId })
      .populate('products.product')
      .populate('user', 'firstName lastName email phone');

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('products.product')
    .populate('user', 'firstName lastName email phone');

  if (!order) {
    return next(
      new ErrorResponse(`No order with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is order owner or admin
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this order`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Create order
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check if products exist and calculate total amount
  let totalAmount = 0;
  const products = [];

  for (const item of req.body.products) {
    const product = await Product.findById(item.product);

    if (!product) {
      return next(
        new ErrorResponse(`No product with the id of ${item.product}`, 404)
      );
    }

    if (product.stock < item.quantity) {
      return next(
        new ErrorResponse(
          `Not enough stock for product ${product.name}. Available: ${product.stock}`,
          400
        )
      );
    }

    totalAmount += product.price * item.quantity;

    products.push({
      product: item.product,
      quantity: item.quantity,
      price: product.price
    });
  }

  // Add delivery fee if express delivery
  if (req.body.deliveryOption === 'express') {
    req.body.deliveryFee = 1500;
    totalAmount += 1500;
  }

  req.body.products = products;
  req.body.totalAmount = totalAmount;

  const order = await Order.create(req.body);

  // Update product stock
  for (const item of req.body.products) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity }
    });
  }

  res.status(201).json({
    success: true,
    data: order
  });
});

// @desc    Update order
// @route   PUT /api/v1/orders/:id
// @access  Private/Admin
exports.updateOrder = asyncHandler(async (req, res, next) => {
  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`No order with the id of ${req.params.id}`, 404)
    );
  }

  // Only admin can update orders
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this order`,
        401
      )
    );
  }

  order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Delete order
// @route   DELETE /api/v1/orders/:id
// @access  Private/Admin
exports.deleteOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`No order with the id of ${req.params.id}`, 404)
    );
  }

  // Only admin can delete orders
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this order`,
        401
      )
    );
  }

  await order.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get order statistics
// @route   GET /api/v1/orders/stats
// @access  Private/Admin
exports.getOrderStats = asyncHandler(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $match: { createdAt: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) } }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" }
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