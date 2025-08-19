const express = require('express');
const {
  getTickets,
  getTicket,
  createTicket,
  addResponse,
  updateTicketStatus,
  getTicketStats
} = require('../controllers/supportController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getTickets)
  .post(protect, createTicket);

router
  .route('/:id')
  .get(protect, getTicket);

router
  .route('/:id/response')
  .put(protect, addResponse);

router
  .route('/:id/status')
  .put(protect, authorize('admin'), updateTicketStatus);

router
  .route('/stats')
  .get(protect, authorize('admin'), getTicketStats);

module.exports = router;