const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const User = require('../models/user');

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email });

  if (!user) {
    res.status(404).send({ message: 'User not found!' });
    return;
  }

  const isMatched = await bcryptjs.compare(password, user.password);

  if (!isMatched) {
    res.status(401).send({ message: 'Invalid password!' });
    return;
  }

  const token = jwt.sign(
    { user: user.fullName, id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: 30 * 60 }
  );

  res.send({
    message: 'You have successfully logged in!',
    token,
    wishlist: user.wishlist,
    cart: user.cart,
    addresses: user.addresses,
    fullName: user.fullName,
    email: user.email,
  });
};

exports.putSignup = async (req, res, next) => {
  const { email, password, fullName } = req.body;

  const isUser = await User.findOne({ email: email });

  if (isUser) {
    res
      .status(409)
      .send({ message: 'User is already registered with same email!' });
    return;
  }

  const encryptedPassword = await bcryptjs.hash(password, 12);

  const user = new User({
    email: email,
    password: encryptedPassword,
    fullName: fullName,
  });

  user.save();

  const token = jwt.sign(
    { user: user.fullName, id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: 30 * 60 }
  );

  res.send({
    message: 'Congratulation! you have successfully created an account.',
    token,
    fullName: user.fullName,
    email: user.email,
  });
};

exports.getCheckToken = async (req, res) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decodedToken.id;

    const { fullName, email, addresses, wishlist, cart } = await User.findById(
      userId
    );

    res.send({ fullName, email, addresses, wishlist, cart, token });
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.postCheckPasswordToken = async (req, res) => {
  const { passwordToken } = req.body;

  try {
    const user = await User.findOne({
      resetToken: passwordToken,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(404).send({ message: 'Invalid token!' });
    }

    res.send({ message: 'User found', userId: user._id });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

exports.postResetPassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    const encodedPassword = await bcryptjs.hash(newPassword, 5);
    await User.findByIdAndUpdate(userId, {
      $set: {
        password: encodedPassword,
        resetToken: '',
        resetTokenExpires: '',
      },
    });

    res.send({ message: 'Password reset successfully!' });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

exports.postSendResetPasswordToken = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).send({ message: 'Invalid email address!' });
    }

    const buffer = crypto.randomBytes(16);

    const token = buffer.toString('hex');

    const emailToSend = {
      to: email,
      from: 'palasio.inc@gmail.com',
      subject: 'Reset Password',
      html: `<p>Hello,</p><p>Here is the link to reset password.</p><a href='${process.env.SERVER_URL}/reset-password/${token}' target='_blank'>click here</a><p>This token will expire after 1 hr.</p>`,
    };

    const response = await transporter.sendMail(emailToSend);

    const timeNow = new Date();

    user.resetToken = token;
    user.resetTokenExpires = new Date(timeNow.getTime() + 3600000);

    user.save();

    res.send({ message: 'mail sent successfully!' });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
};
