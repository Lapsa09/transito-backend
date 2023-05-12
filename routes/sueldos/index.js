const router = require("express").Router();
const pool = require("../../pool");
const { getMonth } = require("../../utils");

router.use("/operarios", require("./operarios"));
router.use("/clientes", require("./clientes"));
router.use("/servicios", require("./servicios"));

router.get("/filters/months", async (req, res) => {
  const meses = await pool.query(
    "select extract(month from s.fecha_servicio) as id,to_char(s.fecha_servicio,'MONTH') as name from sueldos.servicios s group by 1,2 order by 1 asc"
  );

  res.header("Access-Control-Expose-Headers", "X-Total-Count");
  res.set("X-Total-Count", meses.length);

  res.json(meses.rows);
});

router.get("/filters/years", async (req, res) => {
  const años = await pool.query(
    "select extract(year from s.fecha_servicio) as id,extract(year from s.fecha_servicio) as name from sueldos.servicios s group by 1,2 order by 1 desc"
  );

  res.header("Access-Control-Expose-Headers", "X-Total-Count");
  res.set("X-Total-Count", años.length);

  res.json(años.rows);
});

router.get("/recibos/:id", async (req, res) => {
  const { id } = req.params;
  if (id === "none") {
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", 0);
    res.json([]);
  } else {
    const list = await pool.query(
      "select id_servicio as id, recibo,fecha_recibo,importe_recibo,id_cliente from sueldos.servicios where id_cliente=$1 and acopio>0",
      [id]
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", list.rows.length);

    res.json(list.rows);
  }
});

router.get("/memos/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  if (id === "none") {
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", 0);
    res.json([]);
  } else {
    const list = await pool.query(
      "select memo,fecha_servicio from sueldos.servicios where id_servicio=$1",
      [id]
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", list.rowCount);
    res.json(list.rows);
  }
});

router.get("/acopio/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await pool.query(
      "select sum(coalesce(importe_recibo,0)-importe_servicio) as acopio from sueldos.servicios where id_cliente=$1",
      [id]
    );

    res.json({ ...response.rows[0], id });
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/precios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await pool.query(
      "select * from sueldos.precios where id=$1",
      [id]
    );

    res.json(response.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.put("/precios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { precio } = req.body;
    const response = await pool.query(
      "update sueldos.precios set precio=$1 where id=$2 returning *",
      [precio, id]
    );

    res.json(response.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.put("/memos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { memo } = req.body;

    const _servicio = await pool.query(
      "select id_cliente, fecha_servicio from sueldos.servicios where id_servicio=$1",
      [id]
    );

    const [servicio] = _servicio.rows;

    await pool.query(
      "update sueldos.servicios set memo=$1 where id_cliente=$2 and extract(month from fecha_servicio)=$3",
      [memo, servicio.id_cliente, getMonth(servicio.fecha_servicio)]
    );

    res.json({ ...servicio, id: servicio.id_cliente });
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
