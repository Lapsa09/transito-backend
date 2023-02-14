const router = require("express").Router();
const pool = require("../../pool");
const {
  sorting,
  dateFormatJS,
  dateFormat,
  groupByMemo,
  groupByServicio,
  timeFormat,
} = require("../../utils");

router.get("/", async (req, res) => {
  try {
    const { _sort, _order, d, _start, _end, m, y, q = "", no_memo } = req.query;
    const servicios = await pool.query(
      "select s.id_servicio as id,upper(c.cliente) as cliente,s.fecha_servicio,s.memo,o.legajo,op.nombre,o.a_cobrar,o.hora_inicio,o.hora_fin,o.cancelado from sueldos.servicios s left join sueldos.operarios_servicios o on s.id_servicio=o.id_servicio left join sueldos.clientes c on s.id_cliente=c.id_cliente left join sueldos.operarios op on o.legajo=op.legajo order by s.fecha_servicio asc"
    );
    const result = servicios.rows
      .sort((a, b) => sorting(a, b, _order, _sort))
      .filter((row) =>
        !!d ? dateFormatJS(row.fecha_servicio) === dateFormat(d) : row
      )
      .filter((row) => (!!m ? row.fecha_servicio.getMonth() + 1 == m : row))
      .filter((row) => (!!y ? row.fecha_servicio.getFullYear() == y : row))
      .filter((row) =>
        !!q
          ? row.cliente?.toUpperCase().includes(q.toUpperCase()) ||
            row.memo?.includes(q)
          : row
      )
      .filter((row) => (no_memo ? !row.memo : row));
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.set("X-Total-Count", groupByMemo(result).length);

    res.json(groupByMemo(result).slice(_start, _end));
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/liqui", async (req, res) => {
  const { _sort, _order, y, m, _start, _end } = req.query;

  try {
    const servicios = await pool.query(
      "select concat(to_char(s.fecha_servicio, 'month'), extract(year from s.fecha_servicio)) as id,jsonb_build_object('id', extract(month from s.fecha_servicio), 'name', to_char(s.fecha_servicio, 'MONTH')) as mes, extract(year from s.fecha_servicio) as año, c.*,s.*,o.*,os.* from sueldos.operarios_servicios os join sueldos.operarios o on o.legajo = os.legajo join sueldos.servicios s on s.id_servicio = os.id_servicio join sueldos.clientes c on c.id_cliente = s.id_cliente order by s.memo asc"
    );

    const result = groupByServicio(servicios.rows)
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

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "select s.id_servicio as id,s.id_cliente,s.recibo,s.fecha_recibo,s.importe_recibo,s.fecha_servicio,s.importe_servicio,s.memo,s.feriado,json_agg(json_build_object('legajo',o.legajo,'nombre',op.nombre,'a_cobrar',o.a_cobrar,'hora_inicio',o.hora_inicio,'hora_fin',o.hora_fin))as operarios from sueldos.servicios s left join sueldos.operarios_servicios o on s.id_servicio=o.id_servicio left join sueldos.operarios op on o.legajo=op.legajo where s.id_servicio=$1 group by 1,2,3,4,5,6,7,8,9",
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.put("/:id", async (req, res) => {
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
      "update sueldos.servicios set id_cliente=$1,memo=$2,recibo=$3,fecha_recibo=$4,importe_recibo=$5,fecha_servicio=$6,importe_servicio=$7,feriado=$8 where id_servicio=$9 returning id_servicio as id,*",
      [
        id_cliente,
        memo,
        recibo,
        fecha_recibo,
        importe_recibo,
        fecha_servicio,
        importe_servicio,
        feriado,
        id,
      ]
    );

    for (const i in operarios) {
      await pool.query(
        "update sueldos.operarios_servicios set legajo=$1,a_cobrar=$2,hora_inicio=$3,hora_fin=$4 where id_servicio=$5",
        [
          operarios[i].legajo,
          operarios[i].a_cobrar,
          timeFormat(operarios[i].hora_inicio),
          timeFormat(operarios[i].hora_fin),
          id,
        ]
      );
    }

    res.json(servicio.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
