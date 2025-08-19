const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  frequency: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly'],
    default: 'monthly'
  },
  nextDelivery: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  },
  isAutoRenew: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Update next delivery date when frequency changes
subscriptionSchema.pre('save', function(next) {
  if (this.isModified('frequency') || this.isNew) {
    const date = new Date();
    if (this.frequency === 'weekly') {
      date.setDate(date.getDate() + 7);
    } else if (this.frequency === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (this.frequency === 'quarterly') {
      date.setMonth(date.getMonth() + 3);
    }
    this.nextDelivery = date;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);