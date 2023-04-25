const arrayFormat = (array) => {
  return array.join(",");
};
const sorting = (a, b, order, sort) => {
  if (order === "ASC") {
    if (a[sort] < b[sort]) return order === "ASC" ? -1 : 1;
    if (a[sort] > b[sort]) return order === "ASC" ? 1 : -1;
    return 0;
  }
};

module.exports = { arrayFormat, sorting };
