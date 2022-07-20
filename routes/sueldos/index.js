const router = require("express").Router();
const pool = require("../../pool");
const {
  groupByInspector,
  setArrayId,
  groupByServicio,
} = require("../../utils/groupResponses");
const { sorting } = require("../../utils/arrayFormat");
const { dateFormat } = require("../../utils/dateFormat");

router.get("/operarios", async (req, res) => {
  try {
    const { _sort, _order, q, m, y } = req.query;
    const operarios = await pool.query(
      "select os.memo,os.recibo,os.a_cobrar,o.*,s.fecha_recibo,s.fecha_servicio from sueldos.operarios_servicios os inner join sueldos.operarios o on o.legajo=os.legajo inner join sueldos.servicios s on s.id_servicio=os.id_servicio"
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    const response = groupByInspector(operarios.rows)
      .sort((a, b) => sorting(a, b, _order, _sort))
      .filter((row) =>
        q
          ? row.legajo.toString().includes(q) ||
            row.inspector.includes(q.toUpperCase())
          : row
      )
      .filter((row) => (!!m ? row.mes.id == m : row))
      .filter((row) => (!!y ? row.año == y : row));
    res.set("X-Total-Count", response.length);
    res.json(setArrayId(response));
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/clientes", async (req, res) => {
  try {
    const { _sort, _order, m, y, q } = req.query;
    const clientes = await pool.query(
      "select s.id_servicio,c.id_cliente,c.cliente,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.acopio,s.memo from sueldos.clientes c inner join sueldos.servicios s on c.id_cliente=s.id_cliente order by s.id_servicio asc"
    );
    const servicios = await pool.query(
      "select s.id_servicio,s.recibo,s.fecha_recibo,s.importe_recibo,s.importe_servicio,s.acopio,s.memo,o.legajo,op.nombre,o.a_cobrar from sueldos.servicios s left join sueldos.operarios_servicios o on o.id_servicio=s.id_servicio right join sueldos.operarios op on o.legajo=op.legajo where o.legajo is not null order by s.id_servicio asc"
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    const response = groupByServicio(clientes.rows, servicios.rows)
      .sort((a, b) => sorting(a, b, _order, _sort))
      .filter((row) => (!!q ? row.cliente.includes(q.toUpperCase()) : row))
      .filter((row) => (!!m ? row.mes.id == m : row))
      .filter((row) => (!!y ? row.año == y : row));
    res.set("X-Total-Count", response.length);
    res.json(setArrayId(response));
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/clientes/list", async (req, res) => {
  try {
    const clientes = await pool.query(
      "select * from sueldos.clientes order by id_cliente asc"
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", clientes.rows.length);
    res.json(
      clientes.rows.map((row) => ({
        id: row.id_cliente,
        name: row.cliente?.toUpperCase(),
      }))
    );
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/operarios/list", async (req, res) => {
  try {
    const operarios = await pool.query(
      "select * from sueldos.operarios order by nombre asc"
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", operarios.rows.length);
    res.json(
      operarios.rows.map((row) => ({
        id: row.legajo,
        name: row.nombre,
      }))
    );
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/servicios", async (req, res) => {
  try {
    const { _sort, _order, d } = req.query;
    const servicios = await pool.query(
      "select s.id_servicio as id,c.cliente,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.acopio,s.memo,json_agg(json_build_object('legajo',o.legajo,'nombre',op.nombre,'a_cobrar',o.a_cobrar,'hora_inicio',o.hora_inicio,'hora_fin',o.hora_fin)) as operarios from sueldos.servicios s left join sueldos.operarios_servicios o on o.id_servicio=s.id_servicio left join sueldos.clientes c on c.id_cliente=s.id_cliente left join sueldos.operarios op on o.legajo=op.legajo group by s.id_servicio,c.cliente,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.acopio,s.memo order by s.fecha_servicio asc"
    );

    const result = servicios.rows
      .sort((a, b) => sorting(a, b, _order, _sort))
      .filter((row) =>
        !!d ? row.fecha_servicio.toLocaleDateString() === dateFormat(d) : row
      );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", result.length);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/recibos/:id", async (req, res) => {
  const { id } = req.params;
  if (id === "none") {
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", 0);
    res.json([]);
  } else {
    const list = await pool.query(
      "select id_servicio as id, recibo,fecha_recibo,importe_recibo,id_cliente from sueldos.servicios where id_cliente=$1",
      [id]
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", list.rows.length);

    res.json(list.rows);
  }
});

router.get("/clientes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "select s.id_servicio as id,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.acopio,s.memo,s.feriado,json_agg(json_build_object('legajo',o.legajo,'nombre',op.nombre,'a_cobrar',o.a_cobrar,'hora_inicio',o.hora_inicio,'hora_fin',o.hora_fin))as operarios from sueldos.servicios s left join sueldos.operarios_servicios o on o.id_servicio=s.id_servicio right join sueldos.operarios op on o.legajo=op.legajo where o.legajo is not null and s.id_servicio=$1 group by s.id_servicio,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.acopio,s.memo,s.feriado order by s.id_servicio asc",
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/clientes", (req, res) => {
  console.log(req.body);
  res.json({ data: req.body });
});

router.post("/clientes/list", async (req, res) => {
  try {
    const { cliente } = req.body;
    await pool.query("insert into sueldos.clientes(cliente) values($1)", [
      cliente,
    ]);
    res.send("Ok");
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/operarios/list", async (req, res) => {
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

router.put("/clientes/:id", (req, res) => {
  console.log(req.body);
  res.json({ data: req.body });
});

module.exports = router;