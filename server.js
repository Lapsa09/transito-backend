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

app.use("/", require("./routes"));

app.listen(port);
