const router = require("express").Router();
const pool = require("../pool");
const { geoLocation } = require("../utils/geoLocation");

router.get("/api/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const enums = await pool.query(
      "select distinct e.enumlabel from pg_type t join pg_enum e on t.oid = e.enumtypid join pg_catalog.pg_namespace n ON n.oid = t.typnamespace where t.typname=$1",
      [type]
    );
    res.json(enums.rows);
  } catch (error) {
    res.status(400).send("Not found");
  }
});

router.get("/zonas", async (req, res) => {
  try {
    const zonas = await pool.query("select * from barrios");
    res.json(zonas.rows);
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

router.get("/motivos", async (req, res) => {
  try {
    const motivos = await pool.query("select * from motivos");
    res.json(motivos.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/licencias", async (req, res) => {
  try {
    const licencias = await pool.query("select * from tipo_licencias");
    res.json(licencias.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/geocoding", async (req, res) => {
  try {
    const autos = await pool.query(
      "select direccion_full, latitud, longitud from operativos.operativos"
    );
    const motos = await pool.query(
      "select direccion_full, latitud, longitud from motos.operativos"
    );
    const camiones = await pool.query(
      "select direccion_full, latitud, longitud from camiones.operativos"
    );

    for (const i in autos.rows.filter(
      (row) => row.latitud == null && row.longitud == null
    )) {
      const busca = autos.rows.find(
        (row) =>
          row.direccion_full === autos.rows[i].direccion_full &&
          row.latitud != null &&
          row.longitud != null
      );
      if (!busca) {
        const { latitud, longitud } = await geoLocation(
          autos.rows[i].direccion_full
        );

        await pool.query(
          "update operativos.operativos set latitud=$1, longitud=$2 where direccion_full=$3",
          [latitud, longitud, autos.rows[i].direccion_full]
        );
      } else {
        await pool.query(
          "update operativos.operativos set latitud=$1, longitud=$2 where direccion_full=$3",
          [busca.latitud, busca.longitud, busca.direccion_full]
        );
      }
    }
    for (const i in motos.rows.filter(
      (row) => row.latitud == null && row.longitud == null
    )) {
      const busca = motos.rows.find(
        (row) =>
          row.direccion_full === motos.rows[i].direccion_full &&
          row.latitud != null &&
          row.longitud != null
      );

      if (!busca) {
        const { latitud, longitud } = await geoLocation(
          autos.rows[i].direccion_full
        );

        await pool.query(
          "update motos.operativos set latitud=$1, longitud=$2 where direccion_full=$3",
          [latitud, longitud, autos.rows[i].direccion_full]
        );
      } else {
        await pool.query(
          "update motos.operativos set latitud=$1, longitud=$2 where direccion_full=$3",
          [busca.latitud, busca.longitud, busca.direccion_full]
        );
      }
    }
    for (const i in camiones.rows.filter(
      (row) => row.latitud == null && row.longitud == null
    )) {
      const busca = camiones.rows.find(
        (row) =>
          row.direccion_full === camiones.rows[i].direccion_full &&
          row.latitud != null &&
          row.longitud != null
      );

      if (!busca) {
        const { latitud, longitud } = await geoLocation(
          autos.rows[i].direccion_full
        );

        await pool.query(
          "update camiones.operativos set latitud=$1, longitud=$2 where direccion_full=$3",
          [latitud, longitud, autos.rows[i].direccion_full]
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
