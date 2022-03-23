const router = require("express").Router();
const { DateTime } = require("luxon");
const { geocode } = require("../../middleware/geocoding");
const getCP = require("../../middleware/getCP");
const { operativoMotos } = require("../../middleware/operativo");
const pool = require("../../pool");

router.get("/motivos", async (req, res) => {
  try {
    const motivos = await pool.query("select * from motos.motivos");

    res.json(motivos.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const operativos = await pool.query(
      "select mo.id, o.fecha, o.hora,o.qth as direccion,z.barrio as zona,z.cp,o.legajo_a_cargo, o.legajo_planilla, o.turno,o.seguridad,mo.dominio,mo.licencia,li.tipo as tipo_licencia, array_agg(mot.motivo) as motivos,mo.acta,mo.resolucion,zi.barrio as zona_infractor,mo.fechacarga,mo.lpcarga from motos.registros mo inner join motos.operativos o on o.id_op=mo.id_operativo left join vicente_lopez z on o.id_zona=z.id_barrio left join tipo_licencias li on mo.id_licencia=li.id_tipo left join motos.moto_motivo momo on mo.id=momo.id_registro left join motivos mot on momo.id_motivo=mot.id_motivo left join barrios zi on mo.id_zona_infractor=zi.id_barrio group by mo.id,o.fecha, o.hora,o.qth,z.barrio,z.cp,o.legajo_a_cargo, o.legajo_planilla, o.turno,o.seguridad,mo.dominio,mo.licencia,li.tipo,mo.acta,mo.resolucion,zi.barrio,mo.fechacarga,mo.lpcarga order by mo.id asc"
    );
    res.json(operativos.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.post("/", getCP, geocode, operativoMotos, async (req, res) => {
  try {
    const {
      fecha,
      dominio,
      licencia,
      acta,
      motivo1,
      motivo2,
      motivo3,
      motivo4,
      motivo5,
      resolucion,
      lpcarga,
      tipo_licencia,
      zona_infractor,
      cp,
      direccion,
    } = req.body;

    const repetido = await pool.query(
      "select r.dominio,o.fecha from motos.registros r inner join motos.operativos o on o.id=op=r.id_operativo where o.fecha=$1 and r.dominio=$2",
      [DateTime.fromISO(fecha).toLocaleString(), dominio]
    );
    if (repetido.rows.length === 0) {
      await pool.query(
        "insert into motos.registros(dominio,licencia,acta,motivo1,motivo2,motivo3,motivo4,motivo5,resolucion,fechacarga,lpcarga,mes,semana,cp,direccion_full,id_licencia,id_zona_infractor) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),$10,$11,$12,$13,$14,$15)",
        [
          dominio,
          licencia,
          acta,
          motivo1,
          motivo2,
          motivo3,
          motivo4,
          motivo5,
          resolucion,
          lpcarga,
          DateTime.fromISO(fecha).month,
          DateTime.fromISO(fecha).week,
          `${direccion}, ${cp}, Vicente Lopez, Buenos Aires, Argentina`,
          tipo_licencia,
          zona_infractor.id_barrio,
        ]
      );
      res.json("Success");
    } else {
      res.status(401).json("El dominio ingresado ya fue cargado el mismo dia");
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
