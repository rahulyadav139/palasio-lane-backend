const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const dotEnv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cookieParser());

dotEnv.config();
app.use(helmet());
app.use(cors());

app.use(bodyParser.json());

app.use('/auth', authRoutes);

app.use(productRoutes);

app.use('/admin', adminRoutes);

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.aewhn.mongodb.net/${process.env.DB_COLLECTION}?retryWrites=true&w=majority`
  )
  .then(res => app.listen(process.env.PORT || 8080))
  .catch(err => console.log(err));
