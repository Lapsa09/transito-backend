const pool = require("../../pool");
const router = require("express").Router();
const { fetchWaze } = require("../../middleware");
const { groupByDay, promedio } = require("../../utils");

router.get("/", async (req, res) => {
  try {
    const reportes = await pool.query(
      "select d.id,d.fecha,h.horario,c.calles,r.id_trafico,r.id as id_rec,r.tiempo,r.tiempo_hist,r.velocidad,r.velocidad_hist from waze.reporte re left join waze.dia d on d.id=re.id_dia left join waze.recorrido r on re.id=r.id_reporte inner join waze.horarios h on re.id_horario=h.id inner join waze.calles c on r.id_calles=c.id order by d.fecha desc,r.id_calles asc,h.horario asc"
    );
    const promedios = await pool.query(
      "select r.id_calles,h.horario,c.calles,case when avg(r.velocidad_hist)-avg(r.velocidad) >1 then ceil(avg(r.id_trafico)) else floor(avg(r.id_trafico)) end as nivel_trafico,avg(r.tiempo) as tiempo,avg(r.tiempo_hist) as tiempo_hist,avg(r.velocidad) as velocidad,avg(r.velocidad_hist) as velocidad_hist from waze.reporte re left join waze.dia d on d.id=re.id_dia left join waze.recorrido r on re.id=r.id_reporte inner join waze.horarios h on re.id_horario=h.id inner join waze.calles c on r.id_calles=c.id where extract(day from now() - d.fecha) <=15 group by h.horario,c.calles,r.id_calles order by r.id_calles asc,h.horario asc"
    );
    const response = groupByDay(reportes.rows);
    res.json({ res: response[0], promedio: promedio(promedios.rows) });
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.post("/", fetchWaze, async (req, res) => {
  try {
    const { calles, fecha, hora } = req.body;

    const repetido = await pool.query(
      "select * from waze.reporte where id_dia=$1 and id_horario=$2",
      [fecha, hora]
    );

    if (repetido.rowCount === 0) {
      const {
        rows: [{ id: id_reporte }],
      } = await pool.query(
        "insert into waze.reporte(id_dia,id_horario) values($1,$2) returning id",
        [fecha, hora]
      );
      for (const calle of calles) {
        await pool.query(
          "insert into waze.recorrido(id_calles,id_reporte,tiempo,tiempo_hist,velocidad,velocidad_hist,id_trafico) values ($1,$2,$3,$4,$5,$6,$7)",
          [
            calle.calle,
            id_reporte,
            calle.tiempo,
            calle.tiempo_hist,
            calle.velocidad,
            calle.velocidad_hist,
            calle.trafico,
          ]
        );
      }
    } else {
      for (const calle of calles)
        await pool.query(
          "update waze.recorrido set id_calles=$1, tiempo=$2, tiempo_hist=$3, velocidad=$4, velocidad_hist=$5, id_trafico=$6 where id_reporte=$7",
          [
            calle.calle,
            calle.tiempo,
            calle.tiempo_hist,
            calle.velocidad,
            calle.velocidad_hist,
            calle.trafico,
            repetido.rows[0].id,
          ]
        );
    }
    res.json("Success");
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/dates", async (req, res) => {
  try {
    const dias = await pool.query(
      "select extract(month from fecha)as mes,json_agg(json_build_object('id',id,'fecha',fecha)) as fechas from waze.dia group by mes order by mes asc"
    );
    res.json(dias.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const reportes = await pool.query(
      "select d.id,d.fecha,h.horario,c.calles,r.id_trafico,r.id as id_rec,r.tiempo,r.tiempo_hist,r.velocidad,r.velocidad_hist from waze.reporte re left join waze.dia d on d.id=re.id_dia left join waze.recorrido r on re.id=r.id_reporte inner join waze.horarios h on re.id_horario=h.id inner join waze.calles c on r.id_calles=c.id where d.id=$1 order by d.fecha desc,r.id_calles asc,h.horario asc",
      [id]
    );
    const response = groupByDay(reportes.rows);
    res.json(response[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
