const express = require('express');

const productController = require('../controllers/product');

const router = express.Router();

router.get('/products', productController.getProducts);

router.put('/add-new-product', productController.putNewProduct);

router.get('/product/:prodId', productController.getSingleProduct);

router.get('/search-products', productController.getSearchedProducts);

module.exports = router;
