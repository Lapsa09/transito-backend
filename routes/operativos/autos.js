const router = require("express").Router();
const pool = require("../../pool");
const {
  alcoholemia,
  es_del,
  operativoAlcoholemia,
} = require("../../middleware");
const { getMonth, getWeek, geoLocation } = require("../../utils");

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
  es_del,
  alcoholemia,
  operativoAlcoholemia,
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
        zona,
        latitud,
        longitud,
        tipo_licencia,
        zona_infractor,
        operativo,
      } = req.body;

      const repetido = await pool.query(
        "select dominio,id_operativo from operativos.registros where id_operativo=$1 and dominio=$2",
        [operativo, dominio]
      );
      if (repetido.rows.length === 0) {
        const nuevo = await pool.query(
          "with new_row as(insert into operativos.registros(dominio,licencia,acta,id_motivo,graduacion_alcoholica,resolucion,fechacarga,lpcarga,mes,semana,es_del,resultado,direccion_full,latitud,longitud,id_licencia,id_zona_infractor,id_operativo) values ($1,$2,$3,$4,$5,$6,now(),$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) returning *) select nr.*,o.fecha,o.hora,o.qth,z.barrio,z.cp,o.legajo_a_cargo,o.legajo_planilla,o.turno,o.seguridad,l.tipo as tipo_licencia,l.vehiculo as tipo_vehiculo,zi.barrio as zona_infractor,m.motivo from new_row nr inner join operativos.operativos o on o.id_op=nr.id_operativo left join tipo_licencias l on nr.id_licencia=l.id_tipo left join vicente_lopez z on o.id_localidad=z.id_barrio left join barrios zi on nr.id_zona_infractor=zi.id_barrio left join motivos m on m.id_motivo=nr.id_motivo",
          [
            dominio,
            parseInt(licencia) || null,
            acta,
            motivo?.id_motivo,
            parseFloat(graduacion_alcoholica) || null,
            resolucion || "PREVENCION",
            lpcarga,
            getMonth(fecha),
            getWeek(fecha),
            es_del,
            resultado,
            `${direccion}, ${zona.cp}, Vicente Lopez, Buenos Aires, Argentina`,
            latitud,
            longitud,
            tipo_licencia?.id_tipo,
            zona_infractor.id_barrio,
            operativo,
          ]
        );
        const [registro] = nuevo.rows;
        res.json(registro);
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

router.post("/geocoding", async (req, res) => {
  try {
    const autos = await pool.query(
      "select direccion_full, latitud, longitud from operativos.operativos"
    );

    const geoEmpty = autos.rows.filter(
      (row) => row.latitud == null && row.longitud == null
    );

    for (const i in geoEmpty) {
      const actual = geoEmpty[i];
      const busca = autos.rows.find(
        (row) =>
          row.direccion_full === actual.direccion_full &&
          row.latitud != null &&
          row.longitud != null
      );
      if (!busca) {
        const { latitud, longitud } = await geoLocation(actual.direccion_full);

        await pool.query(
          "update operativos.operativos set latitud=$1, longitud=$2 where direccion_full=$3",
          [latitud, longitud, actual.direccion_full]
        );
      } else {
        await pool.query(
          "update operativos.operativos set latitud=$1, longitud=$2 where direccion_full=$3",
          [busca.latitud, busca.longitud, busca.direccion_full]
        );
      }
    }
    res.json("Success");
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
