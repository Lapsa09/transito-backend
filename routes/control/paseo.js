const router = require("express").Router();
const { DateTime } = require("luxon");
const pool = require("../../pool");
const { operativoPaseo } = require("../../middleware/operativo");

router.get("/", async (req, res) => {
  try {
    const controles = await pool.query(
      "select c.id,o.fecha,c.hora,c.direccion,l.barrio,c.dominio,o.lp,c.acta,c.resolucion,o.turno,c.fechacarga,c.lpcarga,o.motivo,c.mes from nuevo_control.registros c inner join nuevo_control.operativos o on o.id_op=c.id_operativo left join barrios l on c.id_localidad=l.id_barrio order by c.id asc"
    );
    res.json(controles.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", operativoPaseo, async (req, res) => {
  const {
    fecha,
    hora,
    direccion,
    dominio,
    acta,
    resolucion,
    lpcarga,
    localidadInfractor,
    id_operativo,
  } = req.body;

  try {
    const repetido = await pool.query(
      "select v.dominio,o.fecha from nuevo_control.registros v inner join nuevo_control.operativos o on o.id_op=v.id_operativo where o.fecha=$1 and v.dominio=$2",
      [DateTime.fromISO(fecha).toLocaleString(), dominio]
    );
    if (repetido.rows.length === 0) {
      await pool.query(
        "insert into nuevo_control.registros(hora, direccion, dominio, acta, resolucion, fechacarga, lpcarga, mes, id_localidad, id_operativo) values($1, $2, $3, $4, $5, now(), $6, $7, $8, $9)",
        [
          DateTime.fromISO(hora, {
            zone: "America/Argentina/Buenos_Aires",
          }).toLocaleString(DateTime.TIME_24_SIMPLE),
          direccion,
          dominio,
          acta,
          resolucion,
          lpcarga,
          DateTime.fromISO(fecha).month,
          localidadInfractor.id_barrio,
          id_operativo,
        ]
      );
      res.send("success");
    } else {
      res.status(401).json("El dominio ingresado ya fue cargado el mismo dia");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
