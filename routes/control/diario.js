const router = require("express").Router();
const pool = require("../../pool");
const { operativoDiario } = require("../../middleware");
const { timeFormat, getMonth } = require("../../utils");

router.get("/", async (req, res) => {
  try {
    const controles = await pool.query(
      "select c.id,o.fecha,c.hora,c.direccion,l.barrio,c.dominio,o.legajo_planilla,c.acta,c.resolucion,o.turno,c.fechacarga,c.lpcarga,c.mes,m.motivo,c.otro_motivo from control_diario.control c inner join control_diario.operativos o on o.id_op=c.id_operativo left join barrios l on c.id_localidad=l.id_barrio left join public.motivos m on c.id_motivo=m.id_motivo order by c.id asc"
    );
    res.json(controles.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/", operativoDiario, async (req, res) => {
  const {
    hora,
    direccion,
    dominio,
    acta,
    resolucion,
    lpcarga,
    motivo,
    otroMotivo,
    localidad,
    fecha,
    id_operativo,
  } = req.body;

  try {
    const repetido = await pool.query(
      "select dominio,id_operativo from control_diario.control where id_operativo=$1 and dominio=$2",
      [id_operativo, dominio]
    );

    if (repetido.rows.length === 0) {
      await pool.query(
        "insert into control_diario.control(hora, direccion, dominio, acta, resolucion, fechacarga, lpcarga, mes, id_motivo, otro_motivo, id_localidad,id_operativo) values($1, $2, $3, $4, $5, now(), $6, $7, $8, $9, $10, $11)",
        [
          timeFormat(hora),
          direccion,
          dominio,
          acta,
          resolucion,
          lpcarga,
          getMonth(fecha),
          motivo,
          otroMotivo,
          localidad.id_barrio,
          id_operativo,
        ]
      );
      res.send("Success");
    } else {
      res.status(401).json("El dominio ingresado ya fue cargado el mismo dia");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
