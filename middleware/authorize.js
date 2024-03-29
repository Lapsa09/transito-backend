const jwt = require("jsonwebtoken");
require("dotenv").config();

const authorize = (req, res, next) => {
  const token = req.header("jwt_token");

  if (!token) {
    return res.status(403).json("Acceso denegado");
  }

  try {
    const verify = jwt.verify(token, process.env.jwtSecret);

    req.user = verify.user;
    next();
  } catch (err) {
    res.status(401).json("Token invalido");
  }
};

module.exports = { authorize };
