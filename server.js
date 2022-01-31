require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const https = require("https");
const key = fs.readFileSync(process.env.CERTLOCATION);
const cert = fs.readFileSync(process.env.KEYLOCATION);
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
app.use("/operativos", require("./routes/operativos"));
app.use("/control", require("./routes/controlDiario"));
app.use("/auth", require("./routes/jwtAuth"));

const httpsServer = https.createServer(
  { key, cert, rejectUnauthorized: false },
  app
);

httpsServer.listen(port);
