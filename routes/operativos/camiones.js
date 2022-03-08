const router = require("express").Router();
const { DateTime } = require("luxon");
const { geocode } = require("../../middleware/geocoding");
const pool = require("../../pool");

router.get("/", async (req, res) => {
  try {
    const operativos = pool.query(
      "select ca.fecha,ca.hora,ca.turno,ca.legajo,ca.direccion,loc.barrio as localidad,ca.cp,ca.dominio,ca.origen,ori.barrio as localidad_origen,ca.destino,dest.barrio as localidad_destino,ca.licencia,ca.remito,ca.carga,ca.resolucion,ca.acta,ca.motivo,ca.hora_carga,ca.legajo_carga,ca.id from camiones.camiones ca left join barrios loc on ca.id_localidad=loc.id_barrio left join barrios ori on ca.id_origen=ori.id_barrio left join barrios dest on ca.id_destino=dest.id_barrio order by ca.id asc"
    );
    res.json((await operativos).rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", geocode, async (req, res) => {
  try {
    const {
      fecha,
      hora,
      turno,
      legajo,
      direccion,
      localidad,
      cp,
      dominio,
      origen,
      localidad_origen,
      destino,
      localidad_destino,
      licencia,
      remito,
      carga,
      resolucion,
      acta,
      motivo,
      legajo_carga,
    } = req.body;

    const repetido = await pool.query(
      "select * from camiones.camiones where fecha=$1 and dominio=$2",
      [DateTime.fromISO(fecha).toLocaleString(), dominio]
    );

    if (repetido.rows.length === 0) {
      await pool.query(
        "insert into camiones.camiones(fecha,hora,turno,legajo,direccion,id_localidad,cp,dominio,origen,id_origen,destino,id_destino,licencia,remito,carga,resolucion,acta,motivo,hora_carga,legajo_carga) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)",
        [
          fecha,
          hora,
          turno,
          legajo,
          direccion,
          localidad,
          cp,
          dominio,
          origen,
          localidad_origen.id_barrio,
          destino,
          localidad_destino.id_barrio,
          licencia,
          remito,
          carga,
          resolucion,
          acta,
          motivo,
          DateTime.now(DateTime.TIME_24_SIMPLE),
          legajo_carga,
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
