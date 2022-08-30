const pool = require("../pool");

module.exports = async (req, res, next) => {
  try {
    const { recibo, importe_servicio, importe_recibo } = req.body;

    const recibos = await pool.query(
      "select * from sueldos.servicios where recibo=$1 order by fecha_recibo desc",
      [recibo]
    );

    if (recibos.rowCount === 0) {
      req.body.acopio = importe_recibo - importe_servicio;
      next();
    }

    const {
      rows: [{ acopio }],
    } = recibos;

    if (importe_servicio > acopio) {
      res
        .status(401)
        .json({ data: "Este recibo no cuenta con suficiente saldo a favor" });
    } else {
      req.body.acopio = acopio - importe_servicio;
      next();
    }
  } catch (error) {
    res.status(500).json({ data: "Server error" });
  }
};
