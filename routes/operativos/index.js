const router = require("express").Router();

router.use("/autos", require("./autos"));
router.use("/motos", require("./motos"));
router.use("/camiones", require("./camiones"));

module.exports = router;
