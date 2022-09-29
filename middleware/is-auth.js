const jwt = require('jsonwebtoken');

const isAuth = async (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decodedToken.id;

    req.userId = userId;

    next();
  } catch (err) {
    res.status(400).send(err);
  }
};

module.exports = isAuth;
