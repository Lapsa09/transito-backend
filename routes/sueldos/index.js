const router = require("express").Router();
const pool = require("../../pool");
const { setArrayId } = require("../../utils/groupResponses");
const { sorting } = require("../../utils/arrayFormat");
const { dateFormat, timeFormat } = require("../../utils/dateFormat");
const sueldos = require("../../middleware/sueldos");

router.get("/operarios", async (req, res) => {
  try {
    const { _sort, _order, q, m, y, _start, _end } = req.query;
    const operarios = await pool.query(
      "select o.legajo,o.nombre as inspector,jsonb_build_object('id',extract(month from s.fecha_servicio),'name',to_char(s.fecha_servicio,'MONTH')) as mes,extract(year from s.fecha_servicio) as año,json_agg(json_build_object('memo',s.memo,'recibo',s.recibo,'fecha_recibo',s.fecha_recibo,'fecha_servicio',s.fecha_servicio,'a_cobrar',os.a_cobrar)) as servicios from sueldos.operarios_servicios os inner join sueldos.operarios o on o.legajo=os.legajo inner join sueldos.servicios s on s.id_servicio=os.id_servicio group by o.legajo,o.nombre,jsonb_build_object('id',extract(month from s.fecha_servicio),'name',to_char(s.fecha_servicio,'MONTH')),extract(year from s.fecha_servicio) order by o.legajo"
    );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    const response = operarios.rows
      .map((record) => ({
        ...record,
        total: record.servicios.reduce((a, b) => a + b.a_cobrar, 0),
      }))
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
    res.json(setArrayId(response).slice(_start, _end));
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/clientes", async (req, res) => {
  try {
    const { _sort, _order, m, y, q, año, cliente, mes, _start, _end } =
      req.query;
    const clientes = await pool.query(
      "select c.id_cliente, jsonb_build_object('id',extract(month from s.fecha_recibo),'name',to_char(s.fecha_recibo,'MONTH')) as mes, extract(year from s.fecha_recibo) as año, upper(c.cliente) as cliente, json_agg(json_build_object('id',s.id_servicio,'recibo',s.recibo,'fecha_recibo',s.fecha_recibo,'importe_recibo', s.importe_recibo,'fecha_servicio', s.fecha_servicio,'importe_servicio', s.importe_servicio,'memo',s.memo,'operarios',operarios)) as servicios, sum(s.importe_recibo)::INTEGER as a_deudor,sum(coalesce(s.importe_recibo,0)-s.importe_servicio)::INTEGER as a_favor from sueldos.clientes c inner join sueldos.servicios s on c.id_cliente=s.id_cliente left join(select id_servicio, json_agg(json_build_object('id_servicio',o.id_servicio,'legajo',o.legajo,'nombre',op.nombre,'a_cobrar',o.a_cobrar,'hora_inicio',o.hora_inicio,'hora_fin',o.hora_fin,'cancelado',o.cancelado)) operarios from sueldos.operarios op left join sueldos.operarios_servicios o on op.legajo = o.legajo group by id_servicio) os on os.id_servicio=s.id_servicio group by c.id_cliente,jsonb_build_object('id',extract(month from s.fecha_recibo),'name',to_char(s.fecha_recibo,'MONTH')),extract(year from s.fecha_recibo) order by año desc"
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    const response = clientes.rows
      .map((record) => ({
        ...record,
        servicios: record.servicios.map((servicio) => ({
          ...servicio,
          acopio: servicio.importe_recibo - servicio.importe_servicio,
        })),
      }))
      .sort((a, b) => sorting(a, b, _order, _sort))
      .filter((row) => (!!q ? row.cliente.includes(q.toUpperCase()) : row))
      .filter((row) => (!!m ? row.mes.id == m : row))
      .filter((row) => (!!y ? row.año == y : row))
      .filter((row) => (!!año ? row.año == año : row))
      .filter((row) =>
        !!cliente ? row.cliente.includes(cliente.toUpperCase()) : row
      )
      .filter((row) => (!!mes ? row.mes.id == mes : row));

    res.set("X-Total-Count", response.length);
    res.json(setArrayId(response).slice(_start, _end));
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/filters/months", async (req, res) => {
  const meses = await pool.query(
    "select extract(month from s.fecha_recibo) as id,to_char(s.fecha_recibo,'MONTH') as name from sueldos.servicios s group by 1,2 order by 1 asc"
  );

  res.header("Access-Control-Expose-Headers", "X-Total-Count");
  res.set("X-Total-Count", meses.length);

  res.json(meses.rows);
});

router.get("/filters/years", async (req, res) => {
  const años = await pool.query(
    "select extract(year from s.fecha_recibo) as id,extract(year from s.fecha_recibo) as name from sueldos.servicios s group by 1,2 order by 1 desc"
  );

  res.header("Access-Control-Expose-Headers", "X-Total-Count");
  res.set("X-Total-Count", años.length);

  res.json(años.rows);
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
    const { _sort, _order, d, _start, _end } = req.query;
    const servicios = await pool.query(
      "select s.id_servicio as id,c.cliente,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.acopio,s.memo,json_agg(json_build_object('id_servicio',o.id_servicio,'legajo',o.legajo,'nombre',op.nombre,'a_cobrar',o.a_cobrar,'hora_inicio',o.hora_inicio,'hora_fin',o.hora_fin,'cancelado',o.cancelado)) as operarios from sueldos.servicios s left join sueldos.operarios_servicios o on o.id_servicio=s.id_servicio left join sueldos.clientes c on c.id_cliente=s.id_cliente left join sueldos.operarios op on o.legajo=op.legajo where date_part('day',s.fecha_servicio - now()) between 1 and 15 group by s.id_servicio,c.cliente,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.acopio,s.memo order by s.fecha_servicio asc"
    );

    const result = servicios.rows
      .map((servicio) => ({
        ...servicio,
        acopio: servicio.importe_recibo - servicio.importe_servicio,
      }))
      .sort((a, b) => sorting(a, b, _order, _sort))
      .filter((row) =>
        !!d ? row.fecha_servicio.toLocaleDateString() === dateFormat(d) : row
      );
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", result.length);

    res.json(result.slice(_start, _end));
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/liqui", async (req, res) => {
  const { _sort, _order, y, m, _start, _end } = req.query;

  try {
    const servicios = await pool.query(
      "select concat(to_char(s.fecha_recibo, 'month'), extract(year from s.fecha_recibo)) as id, jsonb_build_object('id', extract(month from s.fecha_recibo), 'name', to_char(s.fecha_recibo, 'MONTH')) as mes, extract(year from s.fecha_recibo) as año, json_agg(json_build_object('id_servicio', s.id_servicio, 'cliente', c.cliente, 'recibo', s.recibo, 'fecha_recibo', s.fecha_recibo, 'importe_recibo', s.importe_recibo, 'fecha_servicio', s.fecha_servicio, 'importe_servicio', s.importe_servicio, 'memo', s.memo, 'operarios', operarios)) as servicios from sueldos.clientes c join sueldos.servicios s on c.id_cliente = s.id_cliente left join (select id_servicio, json_agg(json_build_object('id_servicio', o.id_servicio, 'legajo', o.legajo, 'nombre', op.nombre, 'a_cobrar', o.a_cobrar, 'hora_inicio', o.hora_inicio, 'hora_fin', o.hora_fin, 'cancelado', o.cancelado)) operarios from sueldos.operarios op left join sueldos.operarios_servicios o on op.legajo = o.legajo group by id_servicio) os on os.id_servicio = s.id_servicio group by 1,2,3 order by año desc, 2 asc"
    );

    const result = servicios.rows
      .sort((a, b) => sorting(a, b, _order, _sort))
      .filter((row) => (!!y ? row.año == y : row))
      .filter((row) => (!!m ? row.mes.id == m : row));
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", result.length);

    res.json(result.slice(_start, _end));
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
      "select id_servicio as id, recibo,fecha_recibo,importe_recibo,id_cliente from sueldos.servicios where id_cliente=$1 and acopio>0",
      [id]
    );

    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", list.rows.length);

    res.json(list.rows);
  }
});

router.get("/acopio/:id", async (req, res) => {
  const { id } = req.params;

  const response = await pool.query(
    "select sum(importe_recibo-importe_servicio) as acopio from sueldos.servicios where id_cliente=$1",
    [id]
  );

  res.json({ ...response.rows[0], id });
});

router.get("/clientes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "select s.id_servicio as id,s.id_cliente,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.acopio,s.memo,s.feriado,json_agg(json_build_object('legajo',o.legajo,'nombre',op.nombre,'a_cobrar',o.a_cobrar,'hora_inicio',o.hora_inicio,'hora_fin',o.hora_fin))as operarios from sueldos.servicios s left join sueldos.operarios_servicios o on o.id_servicio=s.id_servicio right join sueldos.operarios op on o.legajo=op.legajo where o.legajo is not null and s.id_servicio=$1 group by s.id_servicio,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.acopio,s.memo,s.feriado order by s.id_servicio asc",
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/clientes", sueldos, async (req, res) => {
  try {
    const {
      id_cliente,
      memo,
      fecha_servicio,
      feriado,
      operarios,
      recibo,
      fecha_recibo,
      importe_recibo,
      importe_servicio,
      medio_pago,
    } = req.body;

    const servicio = await pool.query(
      "insert into sueldos.servicios (id_cliente,memo,recibo,fecha_recibo,importe_recibo,fecha_servicio,importe_servicio,feriado) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id_servicio",
      [
        id_cliente,
        memo,
        medio_pago === "recibo" ? recibo : "",
        medio_pago === "recibo" ? fecha_recibo : "",
        medio_pago === "recibo" ? importe_recibo : "",
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

    res.json({ data: servicio });
  } catch (error) {
    console.log(error);
    res.status(500).json({ data: "Server error" });
  }
});

router.post("/clientes/list", async (req, res) => {
  try {
    const { cliente } = req.body;
    await pool.query("insert into sueldos.clientes(cliente) values($1)", [
      cliente,
    ]);
    res.json({ data: cliente });
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

router.put("/clientes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_cliente,
      memo,
      fecha_servicio,
      feriado,
      operarios,
      recibo,
      fecha_recibo,
      importe_recibo,
      importe_servicio,
    } = req.body;

    const servicio = await pool.query(
      "update sueldos.servicios set id_cliente=$1,memo=$2,recibo=$3,fecha_recibo=$4,importe_recibo=$5,fecha_servicio=$6,importe_servicio=$7,feriado=$8,acopio=$9 where id_servicio=$10 returning id_cliente as id_servicio as id,*",
      [
        id_cliente,
        memo,
        recibo,
        fecha_recibo,
        importe_recibo,
        fecha_servicio,
        importe_servicio,
        feriado,
        importe_recibo - importe_servicio,
        id,
      ]
    );

    for (const operario in operarios) {
      await pool.query(
        "update sueldos.operarios_servicios set legajo=$1,a_cobrar=$2,hora_inicio=$3,hora_fin=$4 where id_servicio=$5",
        [
          operario.legajo,
          operario.a_cobrar,
          operario.hora_inicio,
          operario.hora_fin,
          id,
        ]
      );
    }

    res.json({ data: servicio.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ data: "Server error" });
  }
});

router.put("/operario/cliente/:id", async (req, res) => {
  try {
    const { cancelado, legajo } = req.body;
    const { id } = req.params;

    const op = await pool.query(
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
    res.status(500).json({ data: "Server error" });
  }
});

module.exports = router;
