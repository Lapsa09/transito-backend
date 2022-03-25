const router = require("express").Router();
const { DateTime } = require("luxon");
const { geocode } = require("../../middleware/geocoding");
const getCP = require("../../middleware/getCP");
const { alcoholemia, es_del } = require("../../middleware/municipales");
const { operativoAlcoholemia } = require("../../middleware/operativo");
const pool = require("../../pool");

router.get("/", async (req, res) => {
  try {
    const operativos = await pool.query(
      "select o.fecha,r.hora,o.qth,z.barrio,z.cp,o.legajo_a_cargo,o.legajo_planilla,o.turno,o.seguridad,r.dominio,r.licencia,l.tipo as tipo_licencia,l.vehiculo as tipo_vehiculo,zi.barrio as zona_infractor,r.acta,r.motivo,r.graduacion_alcoholica,r.resolucion,r.fechacarga,r.lpcarga,r.mes,r.semana,r.es_del,r.resultado,r.id from operativos.registros r inner join operativos.operativos o on o.id_op=r.id_operativo left join tipo_licencias l on r.id_licencia=l.id_tipo left join vicente_lopez z on o.id_localidad=z.id_barrio left join barrios zi on r.id_zona_infractor=zi.id_barrio order by r.id asc"
    );
    res.json(operativos.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.post(
  "/",
  getCP,
  es_del,
  alcoholemia,
  operativoAlcoholemia,
  async (req, res) => {
    try {
      const {
        fecha,
        hora,
        direccion,
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
        zona_infractor,
      } = req.body;

      const repetido = await pool.query(
        "select v.dominio,o.fecha from operativos.registros v inner join operativos.operativos o on o.id_op=v.id_operativo where o.fecha=$1 and v.dominio=$2",
        [DateTime.fromISO(fecha).toLocaleString(), dominio]
      );

      if (repetido.rows.length === 0) {
        await pool.query(
          "insert into operativos.registros(hora,dominio,licencia,acta,motivo,graduacion_alcoholica,resolucion,fechacarga,lpcarga,mes,semana,es_del,resultado,direccion_full,latitud,longitud,id_licencia,id_zona_infractor,id_operativo) values ($1,$2,$3,$4,$5,$6,$7,now(),$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)",
          [
            DateTime.fromISO(hora, {
              zone: "America/Argentina/Buenos_Aires",
            }).toLocaleString(DateTime.TIME_24_SIMPLE),
            dominio,
            parseInt(licencia) || null,
            acta,
            motivo,
            parseInt(graduacion_alcoholica) || null,
            resolucion,
            lpcarga,
            DateTime.fromISO(fecha).month,
            DateTime.fromISO(fecha).weekNumber,
            es_del,
            resultado,
            `${direccion}, ${cp}, Vicente Lopez, Buenos Aires, Argentina`,
            latitud,
            longitud,
            tipo_licencia,
            zona_infractor.id_barrio,
            id_operativo,
          ]
        );
        res.json("Success");
      } else {
        res
          .status(401)
          .json("El dominio ingresado ya fue cargado el mismo dia");
      }
    } catch (error) {
      console.log(error);
      res.status(500).json("Server error");
    }
  }
);

module.exports = router;
