const { DateTime } = require("luxon");

const dateFormat = (fecha) =>
  DateTime.fromISO(fecha, {
    zone: "America/Argentina/Buenos_Aires",
  }).toFormat("dd/MM/yyyy");

const sqlDateFormat = (fecha) =>
  DateTime.fromISO(fecha, {
    zone: "America/Argentina/Buenos_Aires",
  }).toSQLDate();

const sqlTimeFormat = (hora) =>
  DateTime.fromISO(hora, {
    zone: "America/Argentina/Buenos_Aires",
  }).toSQLTime();

const timeFormat = (hora) =>
  DateTime.fromISO(hora, {
    zone: "America/Argentina/Buenos_Aires",
  }).toLocaleString(DateTime.TIME_24_SIMPLE);

const dateFormatJS = (fecha) =>
  DateTime.fromJSDate(fecha).toFormat("dd/MM/yyyy");

const getMonth = (fecha) => DateTime.fromISO(fecha).month;

const getMonthJS = (fecha) => DateTime.fromJSDate(fecha).month;

const getWeek = (fecha) => DateTime.fromISO(fecha).weekNumber;

const getMonthName = (fecha) =>
  DateTime.fromJSDate(fecha).monthLong?.toUpperCase();

const getYear = (fecha) => DateTime.fromJSDate(fecha).year;

module.exports = {
  dateFormat,
  timeFormat,
  getMonth,
  getWeek,
  getMonthName,
  getYear,
  getMonthJS,
  dateFormatJS,
  sqlDateFormat,
  sqlTimeFormat,
};
