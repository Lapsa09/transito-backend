const axios = require("axios");
require("dotenv").config();

const geocoding = async (direccion) => {
  const { data } = await axios.get(
    `http://dev.virtualearth.net/REST/v1/Locations/${direccion}?o=json&key=${process.env.MAPS_KEY}`
  );
  const {
    coords: { latitude, longitude },
  } = data.resourceSets[0].resources[0].point;

  return { latitude, longitude };
};

module.exports = { geocoding };
