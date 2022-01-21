const jwt = require("jsonwebtoken");
require("dotenv").config();

function jwtGenerator(user) {
  const payload = user;
  return jwt.sign(payload, process.env.jwtSecret);
}

module.exports = jwtGenerator;
