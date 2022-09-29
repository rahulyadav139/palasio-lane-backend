const mongoose = require('mongoose');

const Product = require('../models/product');

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    addresses: [
      {
        address: String,
        landmark: String,
        pin: Number,
        state: String,
        district: String,
      },
    ],
    cart: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
      },
    ],
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    resetToken: { type: String, default: undefined },
    resetTokenExpires: { type: String, default: undefined },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
