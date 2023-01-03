const axios = require("axios");
require("dotenv").config();

const geoLocation = async (direccion) => {
  const { data } = await axios.get(
    `http://dev.virtualearth.net/REST/v1/Locations/${direccion}?o=json&key=${process.env.MAPS_KEY}`
  );
  const {
    coordinates: [latitud, longitud],
  } = data.resourceSets[0].resources[0].point;

  return { latitud, longitud };
};

module.exports = { geoLocation };
