const mongoose = require('mongoose');

const notifySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['popup', 'text', 'message'],
      default: 'text',
    },
    text: {
      type: String,
      required: [true, 'Notification must have a content in it.'],
    },
    image: String,
    target: {
      type: String,
      enum: ['iphone', 'android'],
    },
  },
  {
    timestamps: true,
  }
);

const Notify = mongoose.model('Notify', notifySchema);

module.exports = Notify;
