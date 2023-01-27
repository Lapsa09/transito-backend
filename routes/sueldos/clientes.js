const router = require("express").Router();
const pool = require("../../pool");
const { sueldos } = require("../../middleware");
const { sorting, timeFormat } = require("../../utils");

router.get("/", async (req, res) => {
  try {
    const { _sort, _order, q = "", _start, _end } = req.query;
    const clientes = await pool.query(
      "SELECT C.ID_CLIENTE, UPPER(C.CLIENTE) AS CLIENTE, JSON_AGG(JSON_BUILD_OBJECT('mes',JSONB_BUILD_OBJECT('id', EXTRACT(MONTH FROM S.FECHA_SERVICIO), 'name', TO_CHAR(S.FECHA_SERVICIO,'MONTH')), 'año',EXTRACT(YEAR FROM S.FECHA_SERVICIO), 'servicios',SERVICIOS)) HISTORIAL, SUM(S.IMPORTE_RECIBO)::INTEGER AS A_DEUDOR, SUM(COALESCE(S.IMPORTE_RECIBO,0) - S.IMPORTE_SERVICIO)::INTEGER AS A_FAVOR FROM SUELDOS.CLIENTES C INNER JOIN SUELDOS.SERVICIOS S ON C.ID_CLIENTE = S.ID_CLIENTE LEFT JOIN (SELECT C.ID_CLIENTE,extract(month from s.fecha_servicio) as mes, JSON_AGG(JSON_BUILD_OBJECT('id', S.ID_SERVICIO, 'recibo', S.RECIBO, 'fecha_recibo', S.FECHA_RECIBO, 'importe_recibo', S.IMPORTE_RECIBO, 'fecha_servicio', S.FECHA_SERVICIO, 'importe_servicio', S.IMPORTE_SERVICIO, 'memo', S.MEMO, 'operarios', OPERARIOS)) SERVICIOS FROM SUELDOS.SERVICIOS S JOIN SUELDOS.CLIENTES C ON C.ID_CLIENTE = S.ID_CLIENTE LEFT JOIN (SELECT ID_SERVICIO, JSON_AGG(JSON_BUILD_OBJECT('id_servicio', O.ID_SERVICIO, 'legajo', O.LEGAJO, 'nombre', OP.NOMBRE, 'a_cobrar', O.A_COBRAR, 'hora_inicio', O.HORA_INICIO, 'hora_fin', O.HORA_FIN, 'cancelado', O.CANCELADO)) OPERARIOS FROM SUELDOS.OPERARIOS OP LEFT JOIN SUELDOS.OPERARIOS_SERVICIOS O ON OP.LEGAJO = O.legajo GROUP BY ID_SERVICIO) OS ON OS.ID_SERVICIO = S.ID_SERVICIO GROUP BY 1,2) SC ON SC.ID_CLIENTE = C.ID_CLIENTE and sc.mes=extract(month from s.fecha_servicio) GROUP BY 1"
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    const response = clientes.rows
      .sort((a, b) => sorting(a, b, _order, _sort))
      .map((cliente) => ({
        ...cliente,
        id: cliente.id_cliente,
      }))
      .filter((row) => row.cliente.includes(q.toUpperCase()));

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
    const res = await pool.query(
      "insert into sueldos.clientes(cliente) values($1) returning id_cliente as id, cliente",
      [cliente]
    );
    res.json(res.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
