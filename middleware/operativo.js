const pool = require("../pool");

const operativoAlcoholemia = async (req, res, next) => {
  const {
    fecha,
    direccion,
    turno,
    legajo_a_cargo,
    legajo_planilla,
    zona,
    seguridad,
  } = req.body;

  const op = await pool.query(
    "select id_op from operativos.operativos where fecha=$1 and qth=$2 and turno=$3 and legajo_a_cargo=$4 and legajo_planilla=$5 and id_localidad=$6 and seguridad=$7",
    [
      DateTime.fromISO(fecha, {
        zone: "America/Argentina/Buenos_Aires",
      }).toLocaleString(),
      direccion,
      turno,
      legajo_a_cargo,
      legajo_planilla,
      zona,
      seguridad,
    ]
  );

  if (op.rows.length === 0) {
    const id_op = await pool.query(
      "insert into operativos.operativos(fecha,qth,turno,legajo_a_cargo,legajo_planilla,id_localidad,seguridad) values($1,$2,$3,$4,$5,$6,$7) returning id_op",
      [
        DateTime.fromISO(fecha, {
          zone: "America/Argentina/Buenos_Aires",
        }).toLocaleString(),
        direccion,
        turno,
        legajo_a_cargo,
        legajo_planilla,
        zona,
        seguridad,
      ]
    );

    req.body.id_operativo = id_op.rows[0];
    next();
  } else {
    req.body.id_operativo = op.rows[0];
    next();
  }
};

const operativoDiario = async (req, res, next) => {
  const { fecha, turno, legajo_planilla } = req.body;

  const op = await pool.query(
    "select id_op from control_diario.operativos where fecha=$1 and turno=$2 and legajo_planilla=$3",
    [
      DateTime.fromISO(fecha, {
        zone: "America/Argentina/Buenos_Aires",
      }).toLocaleString(),
      turno,
      legajo_planilla,
    ]
  );

  if (op.rows.length === 0) {
    const id_op = await pool.query(
      "insert into control_diario.operativos(fecha,turno,legajo_planilla) values($1,$2,$3) returning id_op",
      [
        DateTime.fromISO(fecha, {
          zone: "America/Argentina/Buenos_Aires",
        }).toLocaleString(),
        turno,
        legajo_planilla,
      ]
    );

    req.body.id_operativo = id_op.rows[0];
    next();
  } else {
    req.body.id_operativo = op.rows[0];
    next();
  }
};

module.exports = { operativoAlcoholemia, operativoDiario };
