const router = require("express").Router();
const pool = require("../../pool");

const calculatePoints = (legajo) => {
  let puntos =
    legajo.interaccion_publico +
    legajo.destacado +
    legajo.jerarquicos +
    legajo.errores +
    legajo.llamados_atencion +
    legajo.asistencia;
  let correccion = legajo.llamados_atencion * legajo.asistencia;

  if (correccion === 0) puntos = 0;

  let porc_indiv = puntos / 60;

  return { ...legajo, puntos, porc_indiv };
};

const calculateIncome = (legajos, monto) => {
  const total = legajos
    .map(calculatePoints)
    .reduce((a, b) => a + b.porc_indiv, 0);

  return legajos.map((legajo) => ({
    ...legajo,
    porc_total: legajo.porc_indiv / total,
    a_percibir: (legajo.porc_indiv / total) * monto,
  }));
};

router.post("/", async (req, res) => {
  try {
    const { legajos, id_mes } = req.body;

    const op = await pool.query("select * from mensual where id=$1", [id_mes]);

    const [{ monto, id }] = op.rows;

    const calculados = calculateIncome(legajos, monto);

    for (const calculado in calculados) {
      await pool.query(
        "insert into puntajes (interaccion_publico,jerarquicos,errores_actas,destacado,llamados_atencion,asistencia,a_percibir,legajo,id_mes) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          calculado.interaccion_publico,
          calculado.jerarquicos,
          calculado.errores,
          calculado.destacado,
          calculado.llamados_atencion,
          calculado.asistencia,
          calculado.a_percibir,
          calculado.legajo,
          id,
        ]
      );
    }
    res.json("Ok");
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      interaccion_publico,
      jerarquicos,
      errores_actas,
      destacado,
      llamados_atencion,
      asistencia,
    } = req.body;

    const mes = await pool.query(
      "update puntaje set interaccion_publico=$1,jerarquicos=$2,errores_actas=$3,destacado=$4,llamados_atencion=$5,asistencia=$6 where id=$7 returning id_mes",
      [
        interaccion_publico,
        jerarquicos,
        errores_actas,
        destacado,
        llamados_atencion,
        asistencia,
        id,
      ]
    );

    const [{ id_mes }] = mes.rows;

    const MONTO = await pool.query("select monto from mensual where id=$1", [
      id_mes,
    ]);

    const [{ monto }] = MONTO.rows;

    const lista = await pool.query(
      "select id,interaccion_publico,jerarquicos,errores_actas,destacado,llamados_atencion,asistencia from puntajes where id_mes=$1",
      [id_mes]
    );

    const calculados = calculateIncome(lista.rows, monto);

    for (const calculado in calculados) {
      await pool.query("update puntajes set a_percibir=$1 where id=$2", [
        calculado.a_percibir,
        calculado.id,
      ]);
    }

    res.json("Ok");
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});
