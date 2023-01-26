const router = require("express").Router();

router.use("/diario", require("./diario"));
router.use("/paseo", require("./paseo"));

module.exports = router;
