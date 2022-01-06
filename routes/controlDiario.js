const router = require("express").Router();
const { DateTime } = require("luxon");
const pool = require("../pool");

router.get("/", async (req, res) => {
  try {
    const controles = await pool.query(
      "select c.id,c.fecha,c.hora,c.direccion,l.barrio,c.dominio,c.lp,c.acta,c.resolucion,c.turno,c.fechacarga,c.lpcarga,c.mes,m.motivo,c.otro_motivo from control_diario.control c left join public.barrios l on c.id_localidad=l.id_barrio left join public.motivos m on c.id_motivo=m.id_motivo order by c.id asc"
    );
    res.json(controles.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/paseo", async (req, res) => {
  try {
    const controles = await pool.query(
      "select c.id,c.fecha,c.hora,c.direccion,l.barrio,c.dominio,c.lp,c.acta,c.resolucion,c.turno,c.fechacarga,c.lpcarga,c.motivo,c.mes from nuevo_control.registros c left join public.barrios l on c.id_localidad=l.id_barrio order by c.id asc"
    );
    res.json(controles.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", async (req, res) => {
  const {
    fecha,
    hora,
    direccion,
    dominio,
    lp,
    acta,
    resolucion,
    turno,
    lpcarga,
    motivo,
    otroMotivo,
    localidadInfractor,
  } = req.body;

  try {
    const repetido = await pool.query(
      "select * from control_diario.control where fecha=$1 and dominio=$2",
      [fecha, dominio]
    );
    if (repetido.rows.length === 0) {
      await pool.query(
        "insert into control_diario.control(fecha, hora, direccion, dominio, lp, acta, resolucion, turno, fechacarga, lpcarga, mes, id_motivo, otro_motivo, id_localidad) values($1, $2, $3, $4, $5, $6, $7, $8, now(), $9, $10, $11, $12, $13)",
        [
          DateTime.fromISO(fecha).toLocaleString(),
          DateTime.fromISO(hora).toLocaleString(DateTime.TIME_24_SIMPLE),
          direccion,
          dominio,
          lp,
          acta,
          resolucion,
          turno,
          lpcarga,
          DateTime.fromISO(fecha).month,
          motivo,
          otroMotivo,
          localidadInfractor,
        ]
      );
      res.send("Success");
    } else {
      res.status(401).json("El dominio ingresado ya fue cargado el mismo dia");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/paseo", async (req, res) => {
  const {
    fecha,
    hora,
    direccion,
    dominio,
    lp,
    acta,
    resolucion,
    turno,
    lpcarga,
    motivo,
    localidadInfractor,
  } = req.body;

  try {
    const repetido = await pool.query(
      "select * from nuevo_control.registros where fecha=$1 and dominio=$2",
      [DateTime.fromISO(fecha).toLocaleString(), dominio]
    );
    if (repetido.rows.length === 0) {
      await pool.query(
        "insert into nuevo_control.registros(fecha, hora, direccion, motivo, dominio, lp, acta, resolucion, turno, fechacarga, lpcarga, mes, id_localidad) values($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10, $11, $12)",
        [
          DateTime.fromISO(fecha).toLocaleString(),
          DateTime.fromISO(hora).toLocaleString(DateTime.TIME_24_SIMPLE),
          direccion,
          motivo,
          dominio,
          lp,
          acta,
          resolucion,
          turno,
          lpcarga,
          DateTime.fromISO(fecha).month,
          localidadInfractor,
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
