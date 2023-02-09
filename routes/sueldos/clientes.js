const router = require("express").Router();
const pool = require("../../pool");
const { sueldos } = require("../../middleware");
const { sorting, timeFormat, groupByCliente } = require("../../utils");

router.get("/", async (req, res) => {
  try {
    const { _sort, _order, q = "", _start, _end } = req.query;
    const clientes = await pool.query(
      "select s.id_cliente,c.cliente,s.id_servicio,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.memo,o.legajo,op.nombre,o.a_cobrar,o.hora_inicio,o.hora_fin,o.cancelado from sueldos.servicios s left join sueldos.clientes c on s.id_cliente=c.id_cliente left join sueldos.operarios_servicios o on s.id_servicio=o.id_servicio left join sueldos.operarios op on o.legajo=op.legajo order by 1 asc,3 asc,7 asc"
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    const response = groupByCliente(clientes.rows)
      .sort((a, b) => sorting(a, b, _order, _sort))
      .map((cliente) => ({
        ...cliente,
        id: cliente.id_cliente,
      }))
      .filter((row) => row.cliente?.toUpperCase().includes(q.toUpperCase()));

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
    const clientes = await pool.query(
      "select * from sueldos.clientes order by id_cliente asc"
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", clientes.rows.length);
    res.json(
      clientes.rows
        .map((row) => ({
          id: row.id_cliente,
          name: row.cliente?.toUpperCase(),
        }))
        .filter((row) => row.name?.toUpperCase().includes(q.toUpperCase()))
    );
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/", sueldos, async (req, res) => {
  try {
    const {
      id_cliente,
      memo,
      fecha_servicio,
      operarios,
      recibo,
      fecha_recibo,
      importe_recibo,
      importe_servicio,
      feriado,
    } = req.body;

    const servicio = await pool.query(
      "insert into sueldos.servicios (id_cliente,memo,recibo,fecha_recibo,importe_recibo,fecha_servicio,importe_servicio,feriado) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id_servicio as id,*",
      [
        id_cliente,
        memo,
        recibo || null,
        fecha_recibo || null,
        importe_recibo || null,
        fecha_servicio,
        importe_servicio,
        feriado,
      ]
    );
    const [{ id_servicio }] = servicio.rows;

    for (const o in operarios) {
      await pool.query(
        "insert into sueldos.operarios_servicios (legajo,id_servicio,a_cobrar,hora_inicio,hora_fin,cancelado) values ($1,$2,$3,$4,$5,false)",
        [
          operarios[o].legajo,
          id_servicio,
          operarios[o].a_cobrar,
          timeFormat(operarios[o].hora_inicio),
          timeFormat(operarios[o].hora_fin),
        ]
      );
    }

    res.json(servicio.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/list", async (req, res) => {
  try {
    const { cliente } = req.body;
    const response = await pool.query(
      "insert into sueldos.clientes(cliente) values($1) returning id_cliente as id, cliente",
      [cliente]
    );
    res.json(response.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
