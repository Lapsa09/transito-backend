const router = require("express").Router();
const pool = require("../../pool");
const {
  operativoPaseo,
  filterByDate,
  filterByWeekDay,
  radicacion,
} = require("../../middleware");
const { timeFormat, getMonth } = require("../../utils");

router.get("/", async (req, res) => {
  try {
    const controles = await pool.query(
      "select c.id,o.fecha,c.hora,z.zona,l.barrio,c.dominio,o.lp,c.acta,c.resolucion,o.turno,c.fechacarga,c.lpcarga,o.motivo,c.mes from nuevo_control.registros c inner join nuevo_control.operativos o on o.id_op=c.id_operativo left join barrios l on c.id_localidad=l.id_barrio left join nuevo_control.zonas z on z.id_zona=c.id_zona order by c.id desc"
    );
    res.json(controles.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/zonas", async (req, res) => {
  try {
    const zonas = await pool.query("select * from nuevo_control.zonas");
    res.json(zonas.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/", operativoPaseo, radicacion, async (req, res) => {
  const {
    fecha,
    hora,
    direccion,
    dominio,
    acta,
    resolucion,
    lpcarga,
    localidadInfractor,
    operativo,
  } = req.body;

  try {
    const repetido = await pool.query(
      "select dominio,id_operativo from nuevo_control.registros where id_operativo=$1 and dominio=$2",
      [operativo, dominio]
    );
    if (repetido.rows.length === 0) {
      const registro = await pool.query(
        "with new_row as ( insert into nuevo_control.registros(hora, id_zona, dominio, acta, resolucion, fechacarga, lpcarga, mes, id_localidad, id_operativo) values($1, $2, $3, $4, $5, now(), $6, $7, $8, $9) returning * ) select * from new_row join nuevo_control.zonas z on z.id_zona=new_row.id_zona join barrios l on l.id_barrio=new_row.id_localidad join nuevo_control.operativos o on o.id_op=new_row.id_operativo",
        [
          timeFormat(hora),
          direccion,
          dominio,
          acta,
          resolucion,
          lpcarga,
          getMonth(fecha),
          localidadInfractor,
          operativo,
        ]
      );
      res.json(registro.rows[0]);
    } else {
      res.status(401).json("El dominio ingresado ya fue cargado el mismo dia");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/data", filterByDate, filterByWeekDay, async (req, res) => {
  try {
    const fechas = await pool.query(
      "select fecha from nuevo_control.operativos group by fecha"
    );

    const data = await pool.query(
      `select z.zona,count(case o.turno when 'MAÑANA' then 1 else null end) as mañana, count(case o.turno when 'TARDE' then 1 else null end) as tarde, count(*) as total from nuevo_control.registros r inner join nuevo_control.operativos o on o.id_op=r.id_operativo left join nuevo_control.zonas z on z.id_zona=r.id_zona group by z.zona order by z.zona desc`
    );
    res.json({ data: data.rows, fechas: fechas.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
