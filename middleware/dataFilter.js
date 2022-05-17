const pool = require("../pool");
const arrayFormat = require("../utils/arrayFormat");

const filterByDate = async (req, res, next) => {
  const { filterDate } = req.body;
  if (!filterDate || filterDate === undefined) next();
  else
    try {
      const fechas = await pool.query(
        "select fecha from nuevo_control.operativos group by fecha"
      );
      const data = await pool.query(
        `select z.zona,count(case o.turno when 'MAÑANA' then 1 else null end) as mañana,
          count(case o.turno when 'TARDE' then 1 else null end) as tarde,
          count(*) as total
          from nuevo_control.registros r
          inner join nuevo_control.operativos o on o.id_op=r.id_operativo
          left join nuevo_control.zonas z on z.id_zona=r.id_zona where o.fecha=$1 group by z.zona order by z.zona desc`,
        [filterDate]
      );
      res.json({ data: data.rows, fechas: fechas.rows });
    } catch (error) {
      console.log(error);
      res.status(500).json("Server error");
    }
};

const filterByWeekDay = async (req, res, next) => {
  const { filterWD } = req.body;
  if ((filterWD == false || filterWD === undefined) && filterWD !== 0) next();
  else
    try {
      const data = await pool.query(
        `select z.zona,count(case o.turno when 'MAÑANA' then 1 else null end) as mañana,
        count(case o.turno when 'TARDE' then 1 else null end) as tarde,
        count(*) as total
        from nuevo_control.registros r
        inner join nuevo_control.operativos o on o.id_op=r.id_operativo
        left join nuevo_control.zonas z on z.id_zona=r.id_zona where extract(dow from o.fecha) =ANY($1::int[]) group by z.zona order by z.zona desc`,
        [typeof filterWD == "string" ? [1, 2, 3, 4, 5] : [filterWD]]
      );
      res.json({ data: data.rows });
    } catch (error) {
      console.log(error);
      res.status(500).json("Server error");
    }
};

module.exports = { filterByDate, filterByWeekDay };
