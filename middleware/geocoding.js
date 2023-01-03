const pool = require("../pool");
const { geoLocation } = require("../utils/geoLocation");
require("dotenv").config();

const geocodeAutos = async (req, res, next) => {
  const { direccion } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      "select r.latitud, r.longitud from operativos.operativos o join operativos.registros r on r.id_operativo=o.id_op where o.qth=$1 limit 1",
      [direccion]
    );

    if (rowCount === 0) {
      const { latitud, longitud } = await geoLocation(direccion);
      req.body.latitud = latitud;
      req.body.longitud = longitud;
    } else {
      const [{ latitud, longitud }] = rows;

      req.body.latitud = latitud;
      req.body.longitud = longitud;
    }
    next();
  } catch (error) {
    console.log(error);
    next();
  }
};

const geocodeMotos = async (req, res, next) => {
  const { direccion } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      "select r.latitud, r.longitud from motos.operativos o join motos.registros r on r.id_operativo=o.id_op where o.qth=$1 limit 1",
      [direccion]
    );

    if (rowCount === 0) {
      const { latitud, longitud } = await geoLocation(direccion);
      req.body.latitud = latitud;
      req.body.longitud = longitud;
    } else {
      const [{ latitud, longitud }] = rows;

      req.body.latitud = latitud;
      req.body.longitud = longitud;
    }
    next();
  } catch (error) {
    console.log(error);
    next();
  }
};

const geocodeCamiones = async (req, res, next) => {
  const { direccion } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      "select r.latitud, r.longitud from camiones.operativos o join camiones.registros r on r.id_operativo=o.id_op where o.qth=$1 limit 1",
      [direccion]
    );

    if (rowCount === 0) {
      const { latitud, longitud } = await geoLocation(direccion);
      req.body.latitud = latitud;
      req.body.longitud = longitud;
    } else {
      const [{ latitud, longitud }] = rows;

      req.body.latitud = latitud;
      req.body.longitud = longitud;
    }
    next();
  } catch (error) {
    console.log(error);
    next();
  }
};

module.exports = { geocodeAutos, geocodeMotos, geocodeCamiones };
