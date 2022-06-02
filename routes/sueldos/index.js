const router = require("express").Router();
const pool = require("../../pool");
const {
  groupByInspector,
  setArrayId,
  groupByServicio,
  groupByMemo,
} = require("../../utils/groupResponses");
const { sorting } = require("../../utils/arrayFormat");

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
      "select * from sueldos.clientes order by cliente asc"
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", clientes.rows.length);
    res.json(
      clientes.rows.map((row, index) => ({
        id: index,
        id_cliente: row.id_cliente,
        cliente: row.cliente?.toUpperCase(),
      }))
    );
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/clientes/list", (req, res) => {
  console.log(req.body);
  res.send("Ok");
});

router.get("/operarios/list", async (req, res) => {
  try {
    const operarios = await pool.query(
      "select * from sueldos.operarios order by nombre asc"
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", operarios.rows.length);
    res.json(
      operarios.rows.map((row, index) => ({
        id: index,
        ...row,
      }))
    );
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/servicios", async (req, res) => {
  try {
    const { _sort, _order, _start, _end } = req.query;
    const servicios = await pool.query(
      "select s.id_servicio,s.recibo,s.fecha_recibo,s.importe_recibo,s.importe_servicio,s.acopio,s.memo,o.legajo,op.nombre,o.a_cobrar from sueldos.servicios s left join sueldos.operarios_servicios o on o.id_servicio=s.id_servicio right join sueldos.operarios op on o.legajo=op.legajo where o.legajo is not null order by s.id_servicio asc"
    );
    const response = groupByMemo(servicios.rows).sort((a, b) =>
      sorting(a, b, _order, _sort)
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", response.length);
    res.json(response.slice(_start, _end));
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/clientes", (req, res) => {
  console.log(req.body);
  res.send("Success");
});

module.exports = router;
