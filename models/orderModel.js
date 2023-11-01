const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: [true, 'User id is required.'],
  },
  order_id: {
    type: Number,
    required: [true, 'Order id is required'],
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
