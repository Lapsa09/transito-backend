const { DateTime } = require("luxon");

const dateFormat = (fecha) =>
  DateTime.fromISO(fecha, {
    zone: "America/Argentina/Buenos_Aires",
  }).toLocaleString();

const timeFormat = (hora) =>
  DateTime.fromISO(hora, {
    zone: "America/Argentina/Buenos_Aires",
  }).toLocaleString(DateTime.TIME_24_SIMPLE);

const getMonth = (fecha) => DateTime.fromISO(fecha).month;

const getWeek = (fecha) => DateTime.fromISO(fecha).weekNumber;

const getMonthName = (fecha) =>
  DateTime.fromJSDate(fecha).monthLong.toLocaleUpperCase();

module.exports = { dateFormat, timeFormat, getMonth, getWeek, getMonthName };
