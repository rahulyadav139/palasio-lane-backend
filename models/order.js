const mongoose = require('mongoose');
const Product = require('./product');

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    productDetails: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        priceAtPurchased: Number,
        discountAtPurchased: Number,
        quantity: Number,
      },
    ],
    priceBreakout: {
      price: Number,
      quantity: Number,
      discount: Number,
      couponDiscount: Number,
      tax: Number,
      deliveryCharges: Number,
      orderValue: Number,
    },
    deliveryAddress: {},
    expectedShippingDate: String,
    paymentStatus: String,
    transactionId: String,
    razorPayOrderId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
