const router = require("express").Router();
const { geocodeAutos } = require("../../middleware/geocoding");
const getCP = require("../../middleware/getCP");
const { alcoholemia, es_del } = require("../../middleware/municipales");
const { operativoAlcoholemia } = require("../../middleware/operativo");
const pool = require("../../pool");
const { getMonth, getWeek } = require("../../utils/dateFormat");

router.get("/", async (req, res) => {
  try {
    const operativos = await pool.query(
      "select o.fecha,o.hora,o.qth,z.barrio,z.cp,o.legajo_a_cargo,o.legajo_planilla,o.turno,o.seguridad,r.dominio,r.licencia,l.tipo as tipo_licencia,l.vehiculo as tipo_vehiculo,zi.barrio as zona_infractor,r.acta,m.motivo,r.graduacion_alcoholica,r.resolucion,r.fechacarga,r.lpcarga,r.mes,r.semana,r.es_del,r.resultado,r.id from operativos.registros r inner join operativos.operativos o on o.id_op=r.id_operativo left join tipo_licencias l on r.id_licencia=l.id_tipo left join vicente_lopez z on o.id_localidad=z.id_barrio left join barrios zi on r.id_zona_infractor=zi.id_barrio left join motivos m on m.id_motivo=r.id_motivo order by r.id asc"
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
  geocodeAutos,
  async (req, res) => {
    try {
      const {
        fecha,
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
        id_operativo,
      } = req.body;

      const repetido = await pool.query(
        "select dominio,id_operativo from operativos.registros where id_operativo=$1 and dominio=$2",
        [id_operativo, dominio]
      );
      if (repetido.rows.length === 0) {
        await pool.query(
          "insert into operativos.registros(dominio,licencia,acta,id_motivo,graduacion_alcoholica,resolucion,fechacarga,lpcarga,mes,semana,es_del,resultado,direccion_full,latitud,longitud,id_licencia,id_zona_infractor,id_operativo) values ($1,$2,$3,$4,$5,$6,now(),$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)",
          [
            dominio,
            parseInt(licencia) || null,
            acta || null,
            motivo,
            parseInt(graduacion_alcoholica) || null,
            resolucion,
            lpcarga,
            getMonth(fecha),
            getWeek(fecha),
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
