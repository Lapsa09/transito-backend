const pool = require("../pool");
module.exports = async (req, res, next) => {
  try {
    const { zona } = req.body;
    const barrio = await pool.query(
      "select * from vicente_lopez where id_barrio=$1",
      [zona]
    );

    req.body.cp = barrio.rows[0].cp;
    next();
  } catch (error) {
    res.status(500).json("Server error");
  }
};
