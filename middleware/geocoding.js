const axios = require("axios");
require("dotenv").config();

const geocode = async (req, res, next) => {
  const { direccion } = req.body;
  try {
    const { data } = await axios.get(
      `http://dev.virtualearth.net/REST/v1/Locations/${direccion}?o=json&key=${process.env.MAPS_KEY}`
    );
    const {
      coordinates: [latitud, longitud],
    } = data.resourceSets[0].resources[0].point;
    req.body.latitud = latitud;
    req.body.longitud = longitud;
    next();
  } catch (error) {
    console.log(error);
    next();
  }
};

module.exports = { geocode };
