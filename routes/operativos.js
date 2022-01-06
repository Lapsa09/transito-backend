const router = require("express").Router();
const pool = require("../pool");
require("luxon");

const VICENTE_LOPEZ = [
  "CARAPACHAY",
  "VILLA ADELINA",
  "MUNRO",
  "VILLA MARTELLI",
  "FLORIDA",
  "FLORIDA ESTE",
  "FLORIDA OESTE",
  "OLIVOS",
  "VICENTE LOPEZ",
  "LA LUCILA",
];

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

router.get("/zonas/vl", async (req, res) => {
  try {
    const zonas = await pool.query("select * from vicente_lopez");
    res.json(zonas.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", async (req, res) => {
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

    await pool.query(
      "insert into operativos.registros(fecha,hora,direccion,legajo_a_cargo,legajo_planilla,turno,seguridad,dominio,licencia,acta,motivo,graduacion_alcoholica,resolucion,fechacarga,lpcarga,mes,semana,es_del,resultado,cp,direccion_full,latitud,longitud,id_licencia,id_zona,id_zona_infractor) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)",
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
        motivo,
        graduacion_alcoholica,
        resolucion,
        DateTime.now(),
        lpcarga,
        DateTime.fromISO(fecha).month,
        DateTime.fromISO(fecha).week,
        es_del,
        resultado,
        cp,
        `${direccion}, ${cp}, Vicente Lopez, Buenos Aires, Argentina`,
        latitud,
        longitud,
        tipo_licencia,
        zona,
        zona_infractor,
      ]
    );
    res.json("Success");
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
