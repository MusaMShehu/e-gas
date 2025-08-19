const SupportTicket = require('../models/SupportTicket');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all support tickets
// @route   GET /api/v1/support
// @route   GET /api/v1/users/:userId/support
// @access  Private
exports.getTickets = asyncHandler(async (req, res, next) => {
  if (req.params.userId) {
    const tickets = await SupportTicket.find({ user: req.params.userId })
      .populate('user', 'firstName lastName email phone')
      .populate('responses.user', 'firstName lastName role');

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single support ticket
// @route   GET /api/v1/support/:id
// @access  Private
exports.getTicket = asyncHandler(async (req, res, next) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('user', 'firstName lastName email phone')
    .populate('responses.user', 'firstName lastName role');

  if (!ticket) {
    return next(
      new ErrorResponse(`No ticket with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is ticket owner or admin
  if (ticket.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this ticket`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Create support ticket
// @route   POST /api/v1/support
// @access  Private
exports.createTicket = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  const ticket = await SupportTicket.create(req.body);

  res.status(201).json({
    success: true,
    data: ticket
  });
});

// @desc    Add response to ticket
// @route   PUT /api/v1/support/:id/response
// @access  Private
exports.addResponse = asyncHandler(async (req, res, next) => {
  let ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    return next(
      new ErrorResponse(`No ticket with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is ticket owner or admin
  if (
    ticket.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this ticket`,
        401
      )
    );
  }

  // Update ticket status if admin is responding
  if (req.user.role === 'admin' && ticket.status === 'open') {
    ticket.status = 'in-progress';
  }

  // Add response
  ticket.responses.push({
    user: req.user.id,
    message: req.body.message
  });

  await ticket.save();

  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Update ticket status
// @route   PUT /api/v1/support/:id/status
// @access  Private/Admin
exports.updateTicketStatus = asyncHandler(async (req, res, next) => {
  let ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    return next(
      new ErrorResponse(`No ticket with the id of ${req.params.id}`, 404)
    );
  }

  ticket.status = req.body.status;
  await ticket.save();

  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Get ticket statistics
// @route   GET /api/v1/support/stats
// @access  Private/Admin
exports.getTicketStats = asyncHandler(async (req, res, next) => {
  const stats = await SupportTicket.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        open: {
          $sum: {
            $cond: [{ $eq: ['$status', 'open'] }, 1, 0]
          }
        },
        inProgress: {
          $sum: {
            $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0]
          }
        },
        resolved: {
          $sum: {
            $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
          }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: stats
  });
});