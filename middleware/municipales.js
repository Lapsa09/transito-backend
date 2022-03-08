const pool = require("../pool");

const es_del = async (req, res, next) => {
  try {
    const allZonas = await pool.query("select * from barrios");
    const zonasVL = await pool.query("select * from vicente_lopez");
    const zona = allZonas.find(
      (zona) => zona.id_barrio === req.zona_infractor.id_barrio
    );
    const zonas = zonasVL.map((zona) => zona.barrio);
    if (zonas.includes(zona.barrio)) req.es_del = "VILO";
    else req.es_del = "FUERA DEL MUNICIPIO";
    next();
  } catch (error) {
    res.status(500).json("Server error");
  }
};

const alcoholemia = (req, res, next) => {
  if (req.graduacion_alcoholica == 0 || !req.graduacion_alcoholica)
    req.resultado = "NEGATIVA";
  else if (req.graduacion_alcoholica > 0.05 && req.graduacion_alcoholica < 0.5)
    req.resultado = "NO PUNITIVA";
  else req.resultado = "PUNITIVA";

  next();
};

module.exports = { es_del, alcoholemia };
