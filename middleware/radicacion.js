const pool = require("../pool");
const spawn = require("child_process").spawn;

module.exports = (req, res, next) => {
  try {
    const { dominio } = req.body;

    const pythonProcess = spawn("python", ["../py/dnrpa.py", dominio]);

    var _data;

    pythonProcess.stdout.on("data", async (data) => {
      const decodedData = data.toString();

      _data = JSON.parse(decodedData.replace(/'/g, '"'));

      const { provincia, localidad } = _data;

      if (provincia !== "BUENOS AIRES" && provincia !== "CAPITAL FEDERAL") {
        const res = await pool.query(
          "select id_barrio from barrios where barrio=$1",
          [provincia]
        );
        const [{ id_barrio }] = res.rows;
        req.body.localidadInfractor = id_barrio;
      } else {
        if (localidad === "CAPITAL FEDERAL") {
          const id_barrio = 51;
          req.body.localidadInfractor = id_barrio;
        } else {
          const res = await pool.query(
            "select id_barrio from barrios where barrio=$1",
            [localidad]
          );
          if (res.rowCount === 0) {
            const id_barrio = 44;
            req.body.localidadInfractor = id_barrio;
          } else {
            const [{ id_barrio }] = res.rows;
            req.body.localidadInfractor = id_barrio;
          }
        }
      }
      data = null;
      next();
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
};
