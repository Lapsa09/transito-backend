require("dotenv").config();
const pool = require("../pool");
const { spawn } = require("child_process");

const radicacion = (req, res, next) => {
  const { dominio, extranjero } = req.body;

  const pythonProcess = spawn("python", [process.env.DNRPA_ROUTE, dominio]);

  pythonProcess.stdout.on("data", async (data) => {
    const decodedData = data.toString();

    const _data = JSON.parse(decodedData.replace(/'/g, '"'));

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
        req.body.localidadInfractor = { id_barrio, barrio: "CABA" };
      } else {
        const res = await pool.query("select * from barrios where barrio=$1", [
          localidad,
        ]);
        if (res.rowCount === 0) {
          const id_barrio = 44;
          req.body.localidadInfractor = { id_barrio, barrio: "Buenos Aires" };
        } else {
          const [{ id_barrio, barrio }] = res.rows;
          req.body.localidadInfractor = { id_barrio, barrio };
        }
      }
    }
    data = null;
    next();
  });

  pythonProcess.stderr.on("data", (data) => {
    if (extranjero) {
      req.body.localidadInfractor = { id_barrio: 411, barrio: "EXTRANJERO" };
      next();
    }
    console.log(data.toString());
    res.status(500).json("Server error");
  });
};

module.exports = { radicacion };
