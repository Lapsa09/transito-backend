const pool = require("../pool");
const getCP = async (req, res, next) => {
  try {
    const { zona } = req.body;
    const {
      rows: [barrio],
    } = await pool.query("select * from vicente_lopez where id_barrio=$1", [
      zona,
    ]);

    req.body.cp = barrio.cp;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
};

module.exports = { getCP };
