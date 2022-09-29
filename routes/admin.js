const express = require('express');

const isAuth = require('../middleware/is-auth');
const adminController = require('../controllers/admin');

const router = express.Router();

router.post('/cart/add-to-cart', isAuth, adminController.postCart);

router.post(
  '/cart/decrease-quantity',
  isAuth,
  adminController.postDecreaseQuantity
);

router.post('/cart/remove-product', isAuth, adminController.postRemoveProduct);

router.get('/cart/get-items', isAuth, adminController.getCartTest);

router.post(
  '/wishlist/add-new-product',
  isAuth,
  adminController.postAddToWishlist
);

router.get('/wishlist/get-items', isAuth, adminController.getWishlistTest);

router.post(
  '/wishlist/remove-product',
  isAuth,
  adminController.postRemoveFromWishlist
);

router.post('/manage-address', isAuth, adminController.postManageAddress);

router.post('/order', isAuth, adminController.postOrder);

router.get('/order', isAuth, adminController.getOrder);

router.post('/checkout', isAuth, adminController.postCheckout);

router.delete(
  '/delete-address/:addressId',
  isAuth,
  adminController.deleteAddress
);

router.post('/change-password', isAuth, adminController.postChangePassword);

router.delete('/delete-account', isAuth, adminController.deleteAccount);

router.post('/update-email', isAuth, adminController.postUpdateEmail);

router.post('/update-name', isAuth, adminController.postUpdateName);

module.exports = router;
