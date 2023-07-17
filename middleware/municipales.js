const pool = require("../pool");

const es_del = async (req, res, next) => {
  const { zona_infractor, es_del } = req.body;
  try {
    const allZonas = await pool.query("select * from barrios");
    const zonasVL = await pool.query("select * from vicente_lopez");
    const zona = allZonas.rows.find(
      (zona) => zona.id_barrio === zona_infractor.id_barrio
    );
    const zonas = zonasVL.rows.map((zona) => zona.barrio);
    if (zonas.includes(zona.barrio)) req.body.es_del = "VILO";
    else req.body.es_del = "FUERA DEL MUNICIPIO";
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
};

const alcoholemia = (req, res, next) => {
  if (+req.graduacion_alcoholica === 0 || !req.graduacion_alcoholica)
    req.body.resultado = "NEGATIVA";
  else if (
    +req.graduacion_alcoholica > 0.05 &&
    +req.graduacion_alcoholica < 0.5
  )
    req.body.resultado = "NO PUNITIVA";
  else req.body.resultado = "PUNITIVA";

  next();
};

module.exports = { es_del, alcoholemia };
