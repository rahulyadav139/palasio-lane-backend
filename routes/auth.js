const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/auth');

router.put('/signup', authControllers.putSignup);

router.post('/login', authControllers.postLogin);

router.get('/token', authControllers.getCheckToken);

router.post('/check-reset-token', authControllers.postCheckPasswordToken);

router.post('/send-reset-token', authControllers.postSendResetPasswordToken);

router.post('/reset-password', authControllers.postResetPassword);

module.exports = router;
