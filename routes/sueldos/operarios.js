const router = require("express").Router();
const pool = require("../../pool");
const { sorting } = require("../../utils");

router.get("/", async (req, res) => {
  try {
    const { _sort, _order, q = "", m, y, _start, _end } = req.query;
    const operarios = await pool.query(
      "select o.legajo,o.nombre as inspector,jsonb_build_object('id',extract(month from s.fecha_servicio),'name',to_char(s.fecha_servicio,'MONTH')) as mes,extract(year from s.fecha_servicio) as año,json_agg(json_build_object('memo',s.memo,'recibo',s.recibo,'fecha_recibo',s.fecha_recibo,'fecha_servicio',s.fecha_servicio,'a_cobrar',os.a_cobrar)) as servicios from sueldos.operarios_servicios os inner join sueldos.operarios o on o.legajo=os.legajo inner join sueldos.servicios s on s.id_servicio=os.id_servicio group by 1,2,3,4 order by 1"
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    const response = operarios.rows
      .map((record) => ({
        ...record,
        total: record.servicios.reduce((a, b) => a + b.a_cobrar, 0),
        id: record.legajo + record.mes.name + record.año,
      }))
      .sort((a, b) => sorting(a, b, _order, _sort))
      .filter(
        (row) =>
          row.legajo.toString().includes(q) ||
          row.inspector.includes(q.toUpperCase())
      )
      .filter((row) => (!!m ? row.mes.id == m : row))
      .filter((row) => (!!y ? row.año == y : row));
    res.set("X-Total-Count", response.length);
    res.json(response.slice(_start, _end));
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/list", async (req, res) => {
  const { q = "" } = req.query;
  try {
    const operarios = await pool.query(
      "select * from sueldos.operarios order by nombre asc"
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", operarios.rows.length);
    res.json(
      operarios.rows
        .map((row) => ({
          id: row.legajo,
          name: row.nombre,
        }))
        .filter((row) => row.id.toString().includes(q) || row.name.includes(q))
    );
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/list", async (req, res) => {
  try {
    const { id, name } = req.body;
    await pool.query(
      "insert into sueldos.operarios(legajo,nombre) values($1,$2)",
      [id, name]
    );
    res.send("Ok");
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.put("/cliente/:id", async (req, res) => {
  try {
    const { cancelado, legajo } = req.body;
    const { id } = req.params;

    await pool.query(
      "update sueldos.operarios_servicios set cancelado=$1 where id_servicio=$2 and legajo=$3",
      [cancelado, id, legajo]
    );

    const servicios = await pool.query(
      "update sueldos.servicios set importe_servicio=(select sum(a_cobrar) from sueldos.operarios_servicios where id_servicio=$1 and cancelado=false) where id_servicio=$1 returning id_servicio as id,*",
      [id]
    );
    res.json(servicios.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
