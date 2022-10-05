const { default: axios } = require("axios");
const { DateTime } = require("luxon");
const pool = require("../pool");

const calles = {
  "Laprida - Maipu a B. Parera": 1,
  "Laprida - B.Parera a Maipu": 2,
  "Acassuso  -  Libertador a B. Parera ": 3,
  "Acassuso -  Maipu a B. Parera ": 4,
  "Malaver - B. Parera a Maipu": 5,
  "San Lorenzo - B. Parera a Maipu": 6,
  "Villate  -  Maipu a B. Parera ": 7,
  "Roca -  Maipu a B. Parera ": 8,
  "Melo - B. Parera a Maipu": 9,
};

const horas = (h) => {
  if (h >= 8 && h < 11) return 1;
  if (h >= 11 && h < 16) return 2;
  if (h >= 16) return 3;
};

const seconds_to_mins = (secs) => {
  return Math.round(secs / 60);
};

const seconds_to_hrs = (secs) => {
  return seconds_to_mins(secs) / 60;
};

const meters_to_kms = (mts) => {
  return Math.round(mts / 1000);
};

const get_speed = (secs, mts) => {
  return Math.round(meters_to_kms(mts) / seconds_to_hrs(secs));
};

module.exports = async (req, res, next) => {
  try {
    const {
      data: { routes },
    } = await axios.get(process.env.WAZE_API);

    req.body.calles = routes
      .filter((r) => Object.keys(calles).includes(r.name))
      .map((r) => ({
        calle: calles[r.name],
        tiempo: seconds_to_mins(r.time),
        tiempo_hist: seconds_to_mins(r.historicTime),
        velocidad: get_speed(r.time, r.length),
        velocidad_hist: get_speed(r.historicTime, r.length),
        trafico: r.jamLevel + 1,
      }));
    req.body.hora = horas(DateTime.now().setLocale("es-AR").hour);
    const repetido = await pool.query("select * from waze.dia where fecha=$1", [
      DateTime.now().toFormat("MM/dd/yyyy"),
    ]);
    if (repetido.rowCount > 0) req.body.fecha = repetido.rows[0].id;
    else {
      const id = await pool.query(
        "insert into waze.dia (fecha) values ($1) returning id",
        [DateTime.now().toFormat("MM/dd/yyyy")]
      );
      req.body.fecha = id.rows[0].id;
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
};
