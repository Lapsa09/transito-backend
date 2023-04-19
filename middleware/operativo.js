const pool = require("../pool");
const { sqlDateFormat, sqlTimeFormat } = require("../utils");

const operativoAlcoholemia = async (req, res, next) => {
  const {
    fecha,
    direccion,
    turno,
    legajo_a_cargo,
    legajo_planilla,
    zona,
    seguridad,
    hora,
  } = req.body;

  try {
    const op = await pool.query(
      "select id_op from operativos.operativos where fecha=$1 and qth=$2 and turno=$3 and legajo_a_cargo=$4 and legajo_planilla=$5 and id_localidad=$6 and seguridad=$7 and hora=$8 and direccion_full=$9",
      [
        sqlDateFormat(fecha),
        direccion,
        turno,
        legajo_a_cargo,
        legajo_planilla,
        zona.id_barrio,
        seguridad,
        sqlTimeFormat(hora),
        `${direccion}, ${zona.cp}, Vicente Lopez, Buenos Aires, Argentina`,
      ]
    );

    if (op.rowCount === 0) {
      const id_op = await pool.query(
        "insert into operativos.operativos(fecha,qth,turno,legajo_a_cargo,legajo_planilla,id_localidad,seguridad,hora,direccion_full) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id_op",
        [
          sqlDateFormat(fecha),
          direccion,
          turno,
          legajo_a_cargo,
          legajo_planilla,
          zona.id_barrio,
          seguridad,
          sqlTimeFormat(hora),
          `${direccion}, ${zona.cp}, Vicente Lopez, Buenos Aires, Argentina`,
        ]
      );

      req.body.operativo = id_op.rows[0].id_op;
      next();
    } else {
      req.body.operativo = op.rows[0].id_op;
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
};

const operativoCamiones = async (req, res, next) => {
  const { fecha, turno, legajo, direccion, zona } = req.body;

  try {
    const op = await pool.query(
      "select id_op from camiones.operativos where fecha=$1 and turno=$2 and legajo=$3 and direccion=$4 and id_localidad=$5 and direccion_full=$6",
      [
        sqlDateFormat(fecha),
        turno,
        legajo,
        direccion,
        zona.id_barrio,
        `${direccion}, ${zona.cp}, Vicente Lopez, Buenos Aires, Argentina`,
      ]
    );

    if (op.rowCount === 0) {
      const id_op = await pool.query(
        "insert into camiones.operativos(fecha,turno,legajo,direccion,id_localidad,direccion_full) values($1,$2,$3,$4,$5,$6) returning id_op",
        [
          sqlDateFormat(fecha),
          turno,
          legajo,
          direccion,
          zona.id_barrio,
          `${direccion}, ${zona.cp}, Vicente Lopez, Buenos Aires, Argentina`,
        ]
      );

      req.body.operativo = id_op.rows[0].id_op;
      next();
    } else {
      req.body.operativo = op.rows[0].id_op;
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
};

const operativoDiario = async (req, res, next) => {
  const { fecha, turno, lp } = req.body;

  try {
    const op = await pool.query(
      "select id_op from control_diario.operativos where fecha=$1 and turno=$2 and legajo_planilla=$3",
      [sqlDateFormat(fecha), turno, lp]
    );

    if (op.rows.length === 0) {
      const id_op = await pool.query(
        "insert into control_diario.operativos(fecha,turno,legajo_planilla) values($1,$2,$3) returning id_op",
        [sqlDateFormat(fecha), turno, lp]
      );

      req.body.id_operativo = id_op.rows[0].id_op;
      next();
    } else {
      req.body.id_operativo = op.rows[0].id_op;
      next();
    }
  } catch (error) {
    console.log(error);
    res.statud(500).json("Server error");
  }
};

const operativoPaseo = async (req, res, next) => {
  const { fecha, turno, lp, motivo } = req.body;

  const op = await pool.query(
    "select id_op from nuevo_control.operativos where fecha=$1 and turno=$2 and lp=$3 and motivo=$4",
    [sqlDateFormat(fecha), turno, lp, motivo]
  );

  if (op.rowCount === 0) {
    const id_op = await pool.query(
      "insert into nuevo_control.operativos(fecha,turno,lp,motivo) values($1,$2,$3,$4) returning id_op",
      [sqlDateFormat(fecha), turno, lp, motivo]
    );

    req.body.operativo = id_op.rows[0].id_op;
    next();
  } else {
    req.body.operativo = op.rows[0].id_op;
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

  try {
    const op = await pool.query(
      "select id_op from motos.operativos where fecha=$1 and hora=$2 and qth=$3 and legajo_a_cargo=$4 and legajo_planilla=$5 and turno=$6 and seguridad=$7 and id_zona=$8 and direccion_full=$9",
      [
        sqlDateFormat(fecha),
        sqlTimeFormat(hora),
        direccion,
        legajo_a_cargo,
        legajo_planilla,
        turno,
        seguridad,
        zona.id_barrio,
        `${direccion}, ${zona.cp}, Vicente Lopez, Buenos Aires, Argentina`,
      ]
    );

    if (op.rows.length === 0) {
      const id_op = await pool.query(
        "insert into motos.operativos(fecha,hora,qth,legajo_a_cargo,legajo_planilla,turno,seguridad,id_zona,direccion_full) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id_op",
        [
          sqlDateFormat(fecha),
          sqlTimeFormat(hora),
          direccion,
          legajo_a_cargo,
          legajo_planilla,
          turno,
          seguridad,
          zona.id_barrio,
          `${direccion}, ${zona.cp}, Vicente Lopez, Buenos Aires, Argentina`,
        ]
      );

      req.body.operativo = id_op.rows[0].id_op;
      next();
    } else {
      req.body.operativo = op.rows[0].id_op;
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
};

module.exports = {
  operativoAlcoholemia,
  operativoDiario,
  operativoPaseo,
  operativoCamiones,
  operativoMotos,
};
