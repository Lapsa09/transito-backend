const axios = require("axios");
require("dotenv").config();

const geocode = async (req, res, next) => {
  const { direccion } = req.body;
  try {
    const { data } = await axios.get(
      `http://dev.virtualearth.net/REST/v1/Locations/${direccion}?o=json&key=AvuivEvzj2yBL9SV6DEYVmLUYaSBIrk4EmUStjVrtvI60SXWhQ2R230YTFldTTJA`
    );
    const { coordinates } = data.resourceSets[0].resources[0].point;
    req.body.latitud = coordinates[0];
    req.body.longitud = coordinates[1];
    next();
  } catch (error) {
    res.status(500).json("Server error");
  }
};

module.exports = { geocode };
