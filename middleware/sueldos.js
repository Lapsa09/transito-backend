const pool = require("../pool");

const sueldos = async (req, res, next) => {
  try {
    const {
      recibo,
      importe_recibo,
      operarios,
      medio_pago,
      id_cliente,
      fecha_recibo,
    } = req.body;

    if (medio_pago === "recibo") {
      await pool.query(
        "insert into sueldos.recibos(recibo,importe_recibo,fecha_recibo,id_cliente) values($1,$2,$3,$4)",
        [recibo, importe_recibo, fecha_recibo, id_cliente]
      );
    }

    const recibos = await pool.query(
      "select importe_recibo from sueldos.recibos where id_cliente=$1 and acopio>0",
      [id_cliente]
    );

    const _operarios = [];

    if (recibos.rowCount !== 0) {
      for (const operario of operarios) {
        const _operario = { ...operario };
        for (const recibo of recibos.rows) {
          if (operario.a_cobrar <= recibo.acopio) {
            _operario.recibo = recibo.recibo;
            await pool.query(
              "update sueldos.recibos set acopio=$1 where recibo=$2",
              [recibo.acopio - operario.a_cobrar, recibo.recibo]
            );
            _operarios.push(_operario);
            break;
          } else {
            _operario.recibo = recibo.recibo;
            _operario.a_cobrar -= recibo.acopio;
            await pool.query(
              "update sueldos.recibos set acopio=$1 where recibo=$2",
              [0, recibo.recibo]
            );
            _operarios.push(_operario);
          }
        }
      }
    }
    req.body.importe_servicio = operarios.reduce((a, b) => a + b.a_cobrar, 0);
    req.body.operarios = _operarios;

    next();
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
};

module.exports = { sueldos };
