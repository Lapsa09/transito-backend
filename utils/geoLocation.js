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

const geoLocateTable = async (table, name) => {
  for (const i in table.filter(
    (row) => row.latitud == null && row.longitud == null
  )) {
    const busca = table.find(
      (row) =>
        row.direccion_full === table[i].direccion_full &&
        row.latitud != null &&
        row.longitud != null
    );
    if (!busca) {
      const { latitud, longitud } = await geoLocation(table[i].direccion_full);

      await pool.query(
        `update ${name}.operativos set latitud=$1, longitud=$2 where direccion_full=$3`,
        [latitud, longitud, table[i].direccion_full]
      );
    } else {
      await pool.query(
        `update ${name}.operativos set latitud=$1, longitud=$2 where direccion_full=$3`,
        [busca.latitud, busca.longitud, busca.direccion_full]
      );
    }
  }
};

module.exports = { geoLocation, geoLocateTable };
