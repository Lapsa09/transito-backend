const router = require("express").Router();
const pool = require("../../pool");

router.get("/operarios", async (req, res) => {
  try {
    const operarios = await pool.query("select * from radio.operario_servicio");

    res.json(operarios.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/moviles", async (req, res) => {
  try {
    const moviles = await pool.query("select * from radio.movil");

    res.json(moviles.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/operarios", async (req, res) => {
  try {
    const {
      legajo,
      nombre,
      qth,
      estado,
      movil,
      novedades,
      ht,
      puntaje,
      asistencia,
    } = req.body;

    const data = await pool.query(
      "insert into radio.operario_servicio(legajo,nombre,qth,estado,movil,novedades,puntaje,asistencia) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",
      [legajo, nombre, qth, estado, movil, novedades, ht, puntaje, asistencia]
    );
    res.json(data.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/moviles", async (req, res) => {
  try {
    const { movil, estado, novedades } = req.body;

    const data = await pool.query(
      "insert into radio.movil(movil,estado,novedades) values($1,$2,$3) returning *",
      [movil, estado, novedades]
    );

    res.json(data.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.put("/operarios", async (req, res) => {
  try {
    const {
      legajo,
      nombre,
      qth,
      estado,
      movil,
      novedades,
      ht,
      puntaje,
      asistencia,
      id,
    } = req.body;

    const data = await pool.query(
      "update radio.operario_servicio set legajo=$1 nombre=$2 qth=$3 estado=$4 movil=$5 novedades=$6 ht=$7 puntaje=$8 asistencia=$9 where id=$10 returning *",
      [
        legajo,
        nombre,
        qth,
        estado,
        movil,
        novedades,
        ht,
        puntaje,
        asistencia,
        id,
      ]
    );
    res.json(data.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.put("/moviles", async (req, res) => {
  try {
    const { movil, estado, novedades } = req.body;

    const data = await pool.query(
      "update radio.movil set estado=$1 novedades=$2 where movil=$3 returning *",
      [estado, novedades, movil]
    );

    res.json(data.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
