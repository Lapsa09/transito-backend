const router = require("express").Router();
const pool = require("../../pool");

router.get("/operarios", async (req, res) => {
  try {
    const operarios = await pool.query(
      "select o.id, o.legajo,o.nombre,o.ht,o.qth,o.puntaje,o.asistencia,o.movil,o.novedades,e.estado from radio.operario_servicio o join radio.estado_movil e on o.estado=e.id_estado"
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", operarios.rowCount);

    res.json(operarios.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/moviles", async (req, res) => {
  try {
    const moviles = await pool.query(
      "select m.movil as id, m.movil,m.novedades,e.estado from radio.movil m join radio.estado_movil e on m.estado=e.id_estado"
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", moviles.rowCount);

    res.json(moviles.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/moviles/estado", async (req, res) => {
  try {
    const data = await pool.query(
      "select id_estado as id, estado from radio.estado_movil"
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", data.rowCount);

    res.json(data.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/operarios/estado", async (req, res) => {
  try {
    const data = await pool.query(
      "select id_estado as id,estado from radio.estado_operario"
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", data.rowCount);
    res.json(data.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/operarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const data = await pool.query(
      "select * from radio.operario_servicio where id=$1",
      [id]
    );

    res.json(data.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/moviles/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const data = await pool.query(
      "select movil as id, * from radio.movil where movil=$1",
      [id]
    );

    res.json(data.rows[0]);
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
      "insert into radio.operario_servicio(legajo,nombre,qth,estado,movil,novedades,ht,puntaje,asistencia) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",
      [legajo, nombre, qth, estado, movil, novedades, ht, puntaje, asistencia]
    );

    res.json({ ...data.rows[0], estado });
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

    res.json({ ...data.rows[0], estado });
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.put("/operarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
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
      "update radio.operario_servicio set legajo=$1, nombre=$2, qth=$3, estado=$4, movil=$5, novedades=$6, ht=$7, puntaje=$8, asistencia=$9 where id=$10 returning *",
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

router.put("/moviles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, novedades } = req.body;

    const data = await pool.query(
      "update radio.movil set estado=$1 novedades=$2 where movil=$3 returning *",
      [estado, novedades, id]
    );

    res.json(data.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
