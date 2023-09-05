const router = require("express").Router();
const pool = require("../../pool");
const { operativoCamiones } = require("../../middleware");
const { timeFormat, geoLocation } = require("../../utils");

router.get("/", async (req, res) => {
  try {
    const operativos = await pool.query(
      "select o.fecha,ca.hora,o.turno,o.legajo,o.direccion,loc.barrio as localidad,loc.cp,ca.dominio,ca.origen,ori.barrio as localidad_origen,ca.destino,dest.barrio as localidad_destino,ca.licencia,ca.remito,ca.carga,ca.resolucion,ca.acta,m.motivo,ca.hora_carga,ca.lpcarga,ca.id from camiones.registros ca inner join camiones.operativos o on ca.id_operativo=o.id_op left join vicente_lopez loc on o.id_localidad=loc.id_barrio left join barrios ori on ca.id_localidad_origen=ori.id_barrio left join barrios dest on ca.id_localidad_destino=dest.id_barrio left join motivos m on m.id_motivo=ca.id_motivo order by ca.id asc"
    );
    res.json(operativos.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/", operativoCamiones, async (req, res) => {
  try {
    const {
      hora,
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
      lpcarga,
      operativo,
      latitud = null,
      longitud = null,
      direccion,
      zona,
    } = req.body;

    const repetido = await pool.query(
      "select dominio, id_operativo from camiones.registros where id_operativo=$1 and dominio=$2",
      [operativo, dominio]
    );

    if (repetido.rows.length === 0) {
      const nuevo = await pool.query(
        "with new_row as(insert into camiones.registros(hora,dominio,origen,id_localidad_origen,destino,id_localidad_destino,licencia,remito,carga,resolucion,acta,id_motivo,hora_carga,lpcarga,id_operativo,latitud,longitud,direccion_full) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),$13,$14,$15,$16,$17) returning *) select nr.id, nr.hora, nr.dominio, nr.origen, nr.id_localidad_origen, nr.destino, nr.id_localidad_destino, nr.licencia, nr.remito, nr.carga, nr.resolucion, nr.acta, nr.id_motivo, nr.hora_carga, nr.lpcarga, nr.id_operativo, nr.latitud, nr.longitud, nr.direccion_full, o.fecha, o.turno, o.legajo, o.direccion, loc.barrio as localidad, loc.cp, ori.barrio as localidad_origen, dest.barrio as localidad_destino, m.motivo from new_row nr inner join camiones.operativos o on nr.id_operativo=o.id_op left join vicente_lopez loc on o.id_localidad=loc.id_barrio left join barrios ori on nr.id_localidad_origen=ori.id_barrio left join barrios dest on nr.id_localidad_destino=dest.id_barrio left join motivos m on m.id_motivo=nr.id_motivo",
        [
          timeFormat(hora),
          dominio,
          origen,
          localidad_origen.id_barrio,
          destino,
          localidad_destino.id_barrio,
          licencia,
          remito,
          carga,
          resolucion || "PREVENCION",
          acta,
          motivo?.id_motivo || null,
          lpcarga,
          operativo,
          latitud,
          longitud,
          `${direccion}, ${zona.cp}, Vicente Lopez, Buenos Aires, Argentina`,
        ]
      );
      const [registro] = nuevo.rows;
      res.json(registro);
    } else {
      res.status(401).json("El dominio ingresado ya fue cargado el mismo dia");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/geocoding", async (req, res) => {
  try {
    const camiones = await pool.query(
      "select direccion_full, latitud, longitud from camiones.operativos"
    );

    const geoEmpty = camiones.rows.filter(
      (row) => row.latitud == null && row.longitud == null
    );

    for (const i in geoEmpty) {
      const actual = geoEmpty[i];
      const busca = camiones.rows.find(
        (row) =>
          row.direccion_full === actual.direccion_full &&
          row.latitud != null &&
          row.longitud != null
      );
      if (!busca) {
        const { latitud, longitud } = await geoLocation(actual.direccion_full);

        await pool.query(
          "update camiones.operativos set latitud=$1, longitud=$2 where direccion_full=$3",
          [latitud, longitud, actual.direccion_full]
        );
      } else {
        await pool.query(
          "update camiones.operativos set latitud=$1, longitud=$2 where direccion_full=$3",
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
