const router = require("express").Router();
const pool = require("../pool");

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

module.exports = router;
