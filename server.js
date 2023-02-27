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

const setCache = (req, res, next) => {
  const period = 60 * 5;

  if (req.method == "GET") {
    res.set("Cache-control", `public, max-age=${period}`);
  } else {
    res.set("Cache-control", `no-store`);
  }
  next();
};
app.use(setCache);

app.use("/", require("./routes"));

app.listen(port);
