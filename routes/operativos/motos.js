const router = require("express").Router();
const { operativoMotos } = require("../../middleware/operativo");
const { getMonth, getWeek } = require("../../utils/dateFormat");
const pool = require("../../pool");

router.get("/motivos", async (req, res) => {
  try {
    const motivos = await pool.query("select * from motos.motivos");

    res.json(motivos.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const operativos = await pool.query(
      "select mo.id, o.fecha, o.hora,o.qth as direccion,z.barrio as zona,z.cp,o.legajo_a_cargo, o.legajo_planilla, o.turno,o.seguridad,mo.dominio,mo.licencia,li.tipo as tipo_licencia, array_agg(mot.motivo) as motivos,mo.acta,mo.resolucion,zi.barrio as zona_infractor,mo.fechacarga,mo.lpcarga from motos.registros mo inner join motos.operativos o on o.id_op=mo.id_operativo left join vicente_lopez z on o.id_zona=z.id_barrio left join tipo_licencias li on mo.id_licencia=li.id_tipo left join motos.moto_motivo momo on mo.id=momo.id_registro left join motivos mot on momo.id_motivo=mot.id_motivo left join barrios zi on mo.id_zona_infractor=zi.id_barrio group by mo.id,o.fecha, o.hora,o.qth,z.barrio,z.cp,o.legajo_a_cargo, o.legajo_planilla, o.turno,o.seguridad,mo.dominio,mo.licencia,li.tipo,mo.acta,mo.resolucion,zi.barrio,mo.fechacarga,mo.lpcarga order by mo.id asc"
    );
    res.json(operativos.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.post("/", operativoMotos, async (req, res) => {
  try {
    const {
      fecha,
      dominio,
      licencia,
      acta,
      motivos,
      resolucion,
      lpcarga,
      tipo_licencia,
      zona_infractor,
      zona,
      direccion,
      id_operativo,
    } = req.body;

    const repetido = await pool.query(
      "select dominio,id_operativo from motos.registros where id_operativo=$1 and dominio=$2",
      [id_operativo, dominio]
    );
    if (repetido.rows.length === 0) {
      const id_v = await pool.query(
        "insert into motos.registros(dominio,licencia,acta,resolucion,fechacarga,lpcarga,mes,semana,direccion_full,id_licencia,id_zona_infractor,id_operativo) values ($1,$2,$3,$4,now(),$5,$6,$7,$8,$9,$10,$11) returning id",
        [
          dominio,
          parseInt(licencia) || null,
          parseInt(acta) || null,
          resolucion || "PREVENCION",
          lpcarga,
          getMonth(fecha),
          getWeek(fecha),
          `${direccion}, ${zona.cp}, Vicente Lopez, Buenos Aires, Argentina`,
          tipo_licencia?.id_tipo || null,
          zona_infractor.id_barrio,
          id_operativo,
        ]
      );
      if (motivos.length > 0) {
        for (const motivo in motivos) {
          await pool.query(
            "insert into motos.moto_motivo(id_registro,id_motivo) values($1,$2)",
            [id_v.rows[0].id, motivos[motivo].id_motivo]
          );
        }
      }
      res.json("Success");
    } else {
      res.status(401).json("El dominio ingresado ya fue cargado el mismo dia");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

module.exports = router;
