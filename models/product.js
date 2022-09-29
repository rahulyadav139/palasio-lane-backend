const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  inStock: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  exclusive: {
    type: Boolean,
    required: true,
  },
  car: {
    manufacturer: String,
    model: String,
  },
  description: [String],
  warranty: {
    type: String,
    required: true,
  },
  shipping: {
    type: String,
    required: true,
  },
  tags: [String],
  rating: Number,
});

module.exports = mongoose.model('Product', productSchema);
