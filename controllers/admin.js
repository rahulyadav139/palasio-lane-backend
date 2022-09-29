const User = require('../models/user');
const Order = require('../models/order');
const Product = require('../models/product');
const Razorpay = require('razorpay');
const bcryptjs = require('bcryptjs');

exports.postCart = async (req, res, next) => {
  const userId = req.userId;
  const { prodId } = req.body;

  try {
    const { cart } = await User.findById(userId, { cart: 1 }).populate({
      path: 'cart',
      populate: {
        path: 'product',
        select: 'inStock',
      },
    });

    const prodIndex = cart.findIndex(
      el => el.product._id.toString() === prodId
    );

    let updatedCart;

    if (prodIndex >= 0) {
      if (cart[prodIndex].product.inStock <= cart[prodIndex].quantity) {
        return res
          .status(403)
          .send({ message: 'All in-stock products are added to the cart!' });
      }

      updatedCart = [...cart];

      updatedCart[prodIndex].quantity += 1;
    } else {
      updatedCart = [...cart, { product: prodId, quantity: 1 }];
    }

    await User.findOneAndUpdate({ _id: userId }, { cart: updatedCart });

    res.send({ message: 'cart updated successfully!' });
  } catch (err) {
    res.send(err);
  }
};

exports.postDecreaseQuantity = async (req, res) => {
  const userId = req.userId;
  const { prodId } = req.body;

  try {
    const { cart } = await User.findById(userId, { cart: 1 });

    const prodIndex = cart.findIndex(
      el => el.product._id.toString() === prodId
    );

    let updatedCart;

    if (cart[prodIndex].quantity === 1) {
      updatedCart = cart.filter(el => el.product._id.toString() !== prodId);
    } else {
      updatedCart = [...cart];

      updatedCart[prodIndex].quantity -= 1;
    }

    await User.findOneAndUpdate({ _id: userId }, { cart: updatedCart });

    res.send({ message: 'cart updated successfully!' });
  } catch (err) {
    res.send(err);
  }
};

exports.postRemoveProduct = async (req, res) => {
  const userId = req.userId;
  const { prodId } = req.body;

  try {
    const { cart } = await User.findById(userId, { cart: 1 });

    const updatedCart = cart.filter(el => el.product._id.toString() !== prodId);

    await User.findOneAndUpdate({ _id: userId }, { cart: updatedCart });

    res.send({ message: 'cart updated successfully!' });
  } catch (err) {
    res.send(err);
  }
};

exports.getCartTest = async (req, res, next) => {
  const userId = req.userId;

  try {
    const { cart } = await User.findById(userId, { cart: 1 }).populate({
      path: 'cart',
      populate: {
        path: 'product',
        select: ['title', 'brand', 'discount', 'price', 'imageUrl', 'inStock'],
      },
    });

    res.send(cart);
  } catch (err) {
    res.send(err);
  }
};

exports.postAddToWishlist = async (req, res) => {
  const userId = req.userId;
  const { prodId } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { $push: { wishlist: prodId } });
    res.send({ message: 'wishlist updated successfully!' });
  } catch (err) {
    res.send(err);
  }
};

exports.getWishlistTest = async (req, res, next) => {
  const userId = req.userId;

  try {
    const { wishlist } = await User.findById(userId, { wishlist: 1 }).populate({
      path: 'wishlist',
      select: ['title', 'brand', 'discount', 'price', 'imageUrl', 'inStock'],
    });

    res.send(wishlist);
  } catch (err) {
    res.send(err);
  }
};

exports.postRemoveFromWishlist = async (req, res) => {
  const userId = req.userId;
  const { prodId } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { $pull: { wishlist: prodId } });
    res.send({ message: 'wishlist updated successfully!' });
  } catch (err) {
    res.send(err);
  }
};

exports.postManageAddress = async (req, res) => {
  const userId = req.userId;

  const { addressData } = req.body;

  const { address, landmark, pin, state, district } = addressData;

  try {
    if (addressData._id) {
      await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'addresses.$[id].address': address,
            'addresses.$[id].landmark': landmark,
            'addresses.$[id].pin': pin,
            'addresses.$[id].state': state,
            'addresses.$[id].district': district,
          },
        },
        {
          arrayFilters: [{ 'id._id': addressData._id }],
        }
      );
    } else {
      const { addresses } = await User.findByIdAndUpdate(userId, {
        $push: { addresses: { address, landmark, pin, state, district } },
      });
    }

    const { addresses } = await User.findById(userId).select('addresses');

    return res.send({
      message: addressData._id
        ? 'address updated successfully!'
        : 'new address added successfully!',
      addresses,
    });
  } catch (err) {
    res.send(err);
  }
};

exports.postOrder = async (req, res) => {
  const userId = req.userId;
  const date = new Date();
  date.setDate(date.getDate() + 2);
  const {
    orderDetails: {
      totalPrice: orderValue,
      discount,
      couponDiscount,
      tax,
      price,
      deliveryCharges,
      cartItemsQty: quantity,
    },
    deliveryAddress,
    transactionId,
    razorPayOrderId,
  } = req.body;

  try {
    const { cart } = await User.findById(userId)
      .select('cart')
      .populate({
        path: 'cart',
        populate: {
          path: 'product',
          select: ['inStock', 'price', 'discount'],
        },
      });

    const outOfStockProducts = cart.filter(
      cartItem => cartItem.quantity > cartItem.product.inStock
    );

    if (outOfStockProducts.length) {
      return res.status(404).send({ message: 'Some product is out of stock!' });
    }

    cart.forEach(cartItem => {
      Product.findByIdAndUpdate(cartItem.product._id, {
        inStock: cartItem.product.inStock - cartItem.quantity,
      })
        .then(product => product.save())
        .then(err => console.log(err));
    });

    const orderedProductDetails = cart.map(item => ({
      product: item.product._id,
      priceAtPurchased: item.product.price,
      discountAtPurchased: item.product.discount,
      quantity: item.quantity,
    }));

    const order = new Order({
      user: userId,
      productDetails: orderedProductDetails,
      priceBreakout: {
        price,
        quantity,
        discount,
        couponDiscount,
        tax,
        deliveryCharges,
        orderValue,
      },
      deliveryAddress,
      expectedShippingDate: date.toISOString(),
      paymentStatus: 'paid',
      transactionId,
      razorPayOrderId,
    });

    order.save();

    await User.findByIdAndUpdate(userId, { cart: [] });

    res.send({ message: 'new order is created successfully!' });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

exports.postCheckout = async (req, res) => {
  const userId = req.userId;

  const { orderValue } = req.body;

  try {
    const { cart } = await User.findById(userId)
      .select('cart')
      .populate({
        path: 'cart',
        populate: {
          path: 'product',
          select: 'inStock',
        },
      });

    const outOfStockProducts = cart.filter(
      cartItem => cartItem.quantity > cartItem.product.inStock
    );

    if (outOfStockProducts.length) {
      return res.status(404).send({ message: 'Some product is out of stock!' });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });

    const order = await instance.orders.create({
      amount: Math.floor(orderValue * 100),
      currency: 'INR',
      receipt: 'receipt#1',
    });

    res.send({ message: 'order id is created', orderId: order.id });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

exports.getOrder = async (req, res) => {
  const userId = req.userId;

  try {
    const orders = await Order.find({ user: userId }).populate({
      path: 'productDetails',
      populate: {
        path: 'product',
        select: ['imageUrl', 'title', 'brand'],
      },
    });

    res.send(orders);
  } catch (err) {
    res.send(err);
    console.log(err);
  }
};

exports.deleteAddress = async (req, res) => {
  const userId = req.userId;
  const { addressId } = req.params;

  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { addresses: { _id: addressId } },
    });

    const { addresses } = await User.findById(userId).select('addresses');

    res.send({ message: 'Address deleted successfully!', addresses });
  } catch (err) {
    res.send(err);
    console.log(err);
  }
};

exports.postChangePassword = async (req, res) => {
  const userId = req.userId;

  if (userId === '6253bd43ef5b16d5cd6f073b') {
    return res.status(403).send({
      message: 'This is a test account! You can not perform this operation.',
    });
  }

  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId).select('password');

    const isMatched = await bcryptjs.compare(oldPassword, user.password);

    if (!isMatched) {
      return res.status(401).send({ message: 'Incorrect password!' });
    }

    const encryptedPassword = await bcryptjs.hash(newPassword, 12);

    await user.updateOne({ password: encryptedPassword });

    res.send({ message: 'Password updated successfully!' });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

exports.deleteAccount = async (req, res) => {
  const userId = req.userId;

  if (userId === '6253bd43ef5b16d5cd6f073b') {
    return res.status(403).send({
      message: 'This is a test account! You can not perform this operation.',
    });
  }

  try {
    await User.findByIdAndDelete(userId);

    await Order.deleteMany({ user: userId });

    res.send({ message: 'Account deleted successfully!' });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

exports.postUpdateEmail = async (req, res) => {
  const userId = req.userId;
  const { updatedEmail } = req.body;

  if (userId === '6253bd43ef5b16d5cd6f073b') {
    return res.status(409).send({
      message: 'This is a test account! You can not perform this operation.',
    });
  }

  try {
    const doesExist = await User.findOne({ email: updatedEmail });

    if (doesExist) return res.sendStatus(403);

    await User.findByIdAndUpdate(userId, { email: updatedEmail });
    res.send({ message: 'Email updated successfully!' });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};
exports.postUpdateName = async (req, res) => {
  const userId = req.userId;
  const { updatedName } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { fullName: updatedName });
    res.send({ message: 'Name is updated successfully!' });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};
