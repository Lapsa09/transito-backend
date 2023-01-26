const router = require("express").Router();
const pool = require("../pool");
const { geoLocateTable } = require("../utils");

router.use("/operativos", require("./operativos"));
router.use("/control", require("./control"));
router.use("/sueldos", require("./sueldos"));
router.use("/auth", require("./jwtAuth"));
router.use("/waze", require("./waze"));

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

    const autosPromise = geoLocateTable(autos.rows, "operativos");
    const motosPromise = geoLocateTable(motos.rows, "motos");
    const camionesPromise = geoLocateTable(camiones.rows, "camiones");

    await autosPromise;
    await motosPromise;
    await camionesPromise;
    res.json("Success");
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
