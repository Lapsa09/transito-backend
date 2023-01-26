const arrayFormat = (array) => {
  return array.join(",");
};
const sorting = (a, b, order, sort) => {
  if (order === "ASC") {
    if (a[sort] < b[sort]) return -1;
    if (a[sort] > b[sort]) return 1;
    return 0;
  } else {
    if (a[sort] < b[sort]) return 1;
    if (a[sort] > b[sort]) return -1;
    return 0;
  }
};

module.exports = { arrayFormat, sorting };
