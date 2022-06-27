const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 3001;

const app = express();

app.use(express.json());
app.use(cors());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use("/", require("./routes/index"));
app.use("/operativos/autos", require("./routes/operativos/autos"));
app.use("/operativos/motos", require("./routes/operativos/motos"));
app.use("/operativos/camiones", require("./routes/operativos/camiones"));
app.use("/control/diario", require("./routes/control/diario"));
app.use("/control/paseo", require("./routes/control/paseo"));
app.use("/sueldos", require("./routes/sueldos/index"));
app.use("/auth", require("./routes/jwtAuth"));

app.listen(port);
