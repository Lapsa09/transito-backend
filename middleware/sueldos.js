const pool = require("../pool");

const sueldos = async (req, res, next) => {
  try {
    const { importe_recibo, operarios, medio_pago, id_cliente } = req.body;

    req.body.importe_servicio = operarios.reduce((a, b) => a + b.a_cobrar, 0);

    const { importe_servicio } = req.body;

    const query = await pool.query(
      "select sum(coalesce(importe_recibo,0)-importe_servicio) as acopio from sueldos.servicios where id_cliente=$1",
      [id_cliente]
    );

    const [{ acopio }] = query.rows;

    if (medio_pago === "recibo") {
      if (importe_recibo < importe_servicio) {
        res.status(401).json("El importe del recibo no es suficiente");
      }
    } else {
      if (acopio < importe_recibo) {
        res.status(401).json("No tiene suficiente dinero a favor");
      }
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
};

module.exports = { sueldos };
