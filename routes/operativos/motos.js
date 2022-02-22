const router = require("express").Router();
const { DateTime } = require("luxon");
const { geocode } = require("../../middleware/geocoding");
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
      "select mo.id, mo.fecha, mo.hora,mo.direccion,z.barrio as zona,mo.cp,mo.legajo_a_cargo, mo.legajo_planilla, mo.turno,mo.seguridad,mo.dominio,mo.licencia,li.tipo as tipo_licencia,mot1.motivo as motivo1,mot2.motivo as motivo2,mot3.motivo as motivo3,mot4.motivo as motivo4,mot5.motivo as motivo5,mo.acta,mo.resolucion,zi.barrio as zona_infractor,mo.fechacarga,mo.lpcarga from motos.registros mo left join barrios z on mo.id_zona=z.id_barrio left join tipo_licencias li on mo.id_licencia=li.id_tipo left join motivos mot1 on mo.id_motivo1=mot1.id_motivo left join motivos mot2 on mo.id_motivo2=mot2.id_motivo left join motivos mot3 on mo.id_motivo3=mot3.id_motivo left join motivos mot4 on mo.id_motivo4=mot4.id_motivo left join motivos mot5 on mo.id_motivo5=mot5.id_motivo left join barrios zi on mo.id_zona_infractor=zi.id_barrio order by mo.id asc"
    );
    res.json(operativos.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", geocode, async (req, res) => {
  try {
    const {
      fecha,
      hora,
      direccion,
      legajo_a_cargo,
      legajo_planilla,
      turno,
      seguridad,
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
      zona,
      zona_infractor,
    } = req.body;

    const vl = await pool.query(
      "select cp from vicente_lopez where barrio=(select barrio from barrios where id_barrio=$1)",
      [zona]
    );

    const repetido = await pool.query(
      "select * from motos.registros where fecha=$1 and dominio=$2",
      [DateTime.fromISO(fecha).toLocaleString(), dominio]
    );
    if (repetido.rows.length === 0) {
      await pool.query(
        "insert into motos.registros(fecha,hora,direccion,legajo_a_cargo,legajo_planilla,turno,seguridad,dominio,licencia,acta,motivo1,motivo2,motivo3,motivo4,motivo5,resolucion,fechacarga,lpcarga,mes,semana,cp,direccion_full,id_licencia,id_zona,id_zona_infractor) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)",
        [
          fecha,
          hora,
          direccion,
          legajo_a_cargo,
          legajo_planilla,
          turno,
          seguridad,
          dominio,
          licencia,
          acta,
          motivo1,
          motivo2,
          motivo3,
          motivo4,
          motivo5,
          resolucion,
          DateTime.now(),
          lpcarga,
          DateTime.fromISO(fecha).month,
          DateTime.fromISO(fecha).week,
          vl.rows[0],
          `${direccion}, ${cp}, Vicente Lopez, Buenos Aires, Argentina`,
          tipo_licencia,
          zona,
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
