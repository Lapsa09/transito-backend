const router = require("express").Router();
const { operativoCamiones } = require("../../middleware/operativo");
const { dateFormat, timeFormat } = require("../../utils/dateFormat");
const pool = require("../../pool");

router.get("/", async (req, res) => {
  try {
    const operativos = await pool.query(
      "select o.fecha,ca.hora,o.turno,o.legajo,o.direccion,loc.barrio as localidad,loc.cp,ca.dominio,ca.origen,ori.barrio as localidad_origen,ca.destino,dest.barrio as localidad_destino,ca.licencia,ca.remito,ca.carga,ca.resolucion,ca.acta,m.motivo,ca.hora_carga,ca.legajo_carga,ca.id from camiones.registros ca inner join camiones.operativos o on ca.id_operativo=o.id_op left join vicente_lopez loc on o.id_localidad=loc.id_barrio left join barrios ori on ca.id_localidad_origen=ori.id_barrio left join barrios dest on ca.id_localidad_destino=dest.id_barrio left join motivos m on m.id_motivo=ca.id_motivo order by ca.id asc"
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
      fecha,
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
      id_operativo,
      latitud = "",
      longitud = "",
      direccion,
      zona,
    } = req.body;

    const repetido = await pool.query(
      "select ca.dominio,o.fecha from camiones.registros ca inner join camiones.operativos o on o.id_op=ca.id_operativo where o.fecha=$1 and ca.dominio=$2",
      [dateFormat(fecha), dominio]
    );

    if (repetido.rows.length === 0) {
      await pool.query(
        "insert into camiones.registros(hora,dominio,origen,id_localidad_origen,destino,id_localidad_destino,licencia,remito,carga,resolucion,acta,id_motivo,hora_carga,legajo_carga,id_operativo,latitud,longitud,direccion_full) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),$13,$14,$15,$16,$17)",
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
          id_operativo,
          latitud,
          longitud,
          `${direccion}, ${zona.cp}, Vicente Lopez, Buenos Aires, Argentina`,
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
