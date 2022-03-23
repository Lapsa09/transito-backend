const { DateTime } = require("luxon");
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

const operativoCamiones = async (req, res, next) => {
  const { fecha, turno, legajo, direccion, localidad } = req.body;

  const op = await pool.query(
    "select id_op from camiones.operativos where fecha=$1 and turno=$2 and legajo=$3 and direccion=$4 and localidad=$5",
    [
      DateTime.fromISO(fecha, {
        zone: "America/Argentina/Buenos_Aires",
      }).toLocaleString(),
      turno,
      legajo,
      direccion,
      localidad,
    ]
  );

  if (op.rows.length === 0) {
    const id_op = await pool.query(
      "insert into camiones.operativos(fecha,turno,legajo,direccion,localidad) values($1,$2,$3,$4,$5) returning id_op",
      [
        DateTime.fromISO(fecha, {
          zone: "America/Argentina/Buenos_Aires",
        }).toLocaleString(),
        turno,
        legajo,
        direccion,
        localidad,
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
  const { fecha, turno, lp } = req.body;

  const op = await pool.query(
    "select id_op from control_diario.operativos where fecha=$1 and turno=$2 and legajo_planilla=$3",
    [
      DateTime.fromISO(fecha, {
        zone: "America/Argentina/Buenos_Aires",
      }).toLocaleString(),
      turno,
      lp,
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
        lp,
      ]
    );

    req.body.id_operativo = id_op.rows[0];
    next();
  } else {
    req.body.id_operativo = op.rows[0];
    next();
  }
};

const operativoPaseo = async (req, res, next) => {
  const { fecha, turno, lp, motivo } = req.body;

  const op = await pool.query(
    "select id_op from nuevo_control.operativos where fecha=$1 and turno=$2 and lp=$3 and motivo=$4",
    [
      DateTime.fromISO(fecha, {
        zone: "America/Argentina/Buenos_Aires",
      }).toLocaleString(),
      turno,
      lp,
      motivo,
    ]
  );

  if (op.rows.length === 0) {
    const id_op = await pool.query(
      "insert into control_diario.operativos(fecha,turno,lp,motivo) values($1,$2,$3,$4) returning id_op",
      [
        DateTime.fromISO(fecha, {
          zone: "America/Argentina/Buenos_Aires",
        }).toLocaleString(),
        turno,
        lp,
        motivo,
      ]
    );

    req.body.id_operativo = id_op.rows[0];
    next();
  } else {
    req.body.id_operativo = op.rows[0];
    next();
  }
};

const operativoMotos = async (req, res, next) => {
  const {
    fecha,
    hora,
    direccion,
    legajo_a_cargo,
    legajo_planilla,
    turno,
    seguridad,
    zona,
  } = req.body;

  const op = await pool.query(
    "select id_op from motos.operativos where fecha=$1 and hora=$2 and direccion=$3 and legajo_a_cargo=4 and legajo_planilla=$5 and turno=$6 and seguridad=$7 and id_zona=$8",
    [
      DateTime.fromISO(fecha, {
        zone: "America/Argentina/Buenos_Aires",
      }).toLocaleString(),
      DateTime.fromISO(hora, {
        zone: "America/Argentina/Buenos_Aires",
      }).toLocaleString(DateTime.TIME_24_SIMPLE),
      direccion,
      legajo_a_cargo,
      legajo_planilla,
      turno,
      seguridad,
      zona,
    ]
  );

  if (op.rows.length === 0) {
    const id_op = await pool.query(
      "insert into motos.operativos(fecha,hora,direccion,legajo_a_cargo,legajo_planilla,turno,seguridad,id_zona) values($1,$2,$3,$4,$5,$6,$7,$8) returning id_op",
      [
        DateTime.fromISO(fecha, {
          zone: "America/Argentina/Buenos_Aires",
        }).toLocaleString(),
        DateTime.fromISO(hora, {
          zone: "America/Argentina/Buenos_Aires",
        }).toLocaleString(DateTime.TIME_24_SIMPLE),
        direccion,
        legajo_a_cargo,
        legajo_planilla,
        turno,
        seguridad,
        zona,
      ]
    );

    req.body.id_operativo = id_op.rows[0];
    next();
  } else {
    req.body.id_operativo = op.rows[0];
  }
};

module.exports = {
  operativoAlcoholemia,
  operativoDiario,
  operativoPaseo,
  operativoCamiones,
  operativoMotos,
};
