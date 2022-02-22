const router = require("express").Router();
const { DateTime } = require("luxon");
const { geocode } = require("../../middleware/geocoding");
const getCP = require("../../middleware/getCP");
const pool = require("../../pool");

router.get("/", async (req, res) => {
  try {
    const operativos = await pool.query(
      "select r.fecha,r.hora,r.direccion,z.barrio,z.cp,r.legajo_a_cargo,r.legajo_planilla,r.turno,r.seguridad,r.dominio,r.licencia,l.tipo as tipo_licencia,l.vehiculo as tipo_vehiculo,zi.barrio as zona_infractor,r.acta,r.motivo,r.graduacion_alcoholica,r.resolucion,r.fechacarga,r.lpcarga,r.mes,r.semana,r.es_del,r.resultado,r.id from operativos.registros r left join public.tipo_licencias l on r.id_licencia=l.id_tipo left join vicente_lopez z on r.id_zona=z.id_barrio left join public.barrios zi on r.id_zona_infractor=zi.id_barrio order by r.id asc"
    );
    res.json(operativos.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", geocode, getCP, async (req, res) => {
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
      motivo,
      graduacion_alcoholica,
      resolucion,
      lpcarga,
      es_del,
      resultado,
      cp,
      latitud,
      longitud,
      tipo_licencia,
      zona,
      zona_infractor,
    } = req.body;

    const repetido = await pool.query(
      "select * from operativos.registros where fecha=$1 and dominio=$2",
      [DateTime.fromISO(fecha).toLocaleString(), dominio]
    );

    if (repetido.rows.length === 0) {
      await pool.query(
        "insert into operativos.registros(fecha,hora,direccion,legajo_a_cargo,legajo_planilla,turno,seguridad,dominio,licencia,acta,motivo,graduacion_alcoholica,resolucion,fechacarga,lpcarga,mes,semana,es_del,resultado,direccion_full,latitud,longitud,id_licencia,id_zona,id_zona_infractor) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)",
        [
          DateTime.fromISO(fecha, {
            zone: "America/Argentina/Buenos_Aires",
          }).toLocaleString(),
          DateTime.fromISO(hora, {
            zone: "America/Argentina/Buenos_Aires",
          }).toLocaleString(DateTime.TIME_24_SIMPLE),
          direccion,
          parseInt(legajo_a_cargo),
          parseInt(legajo_planilla),
          turno,
          seguridad,
          dominio,
          parseInt(licencia),
          acta,
          motivo,
          parseInt(graduacion_alcoholica),
          resolucion,
          lpcarga,
          DateTime.fromISO(fecha).month,
          DateTime.fromISO(fecha).week,
          es_del,
          resultado,
          `${direccion}, ${cp}, Vicente Lopez, Buenos Aires, Argentina`,
          latitud,
          longitud,
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
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
