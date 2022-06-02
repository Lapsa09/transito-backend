const { getMonthName, getYear, getMonthJS } = require("./dateFormat");
const groupByInspector = (data) => {
  const arr = [];
  data.forEach((d) => {
    const busca = arr.find(
      (a) =>
        a.legajo === d.legajo &&
        a.mes.id === getMonthJS(d.fecha_servicio) &&
        a.año === getYear(d.fecha_servicio)
    );
    if (busca) {
      busca.servicios.push({
        memo: d.memo,
        recibo: parseInt(d.recibo),
        fecha_recibo: d.fecha_recibo,
        fecha_servicio: d.fecha_servicio,
        a_cobrar: parseInt(d.a_cobrar),
      });
      busca.total = busca.servicios.reduce(
        (a, b) => a + parseInt(b["a_cobrar"]),
        0
      );
    } else {
      const obj = {};
      obj.legajo = d.legajo;
      obj.inspector = d.nombre;
      obj.mes = {
        id: getMonthJS(d.fecha_servicio),
        name: getMonthName(d.fecha_servicio),
      };
      obj.año = getYear(d.fecha_servicio);
      obj.servicios = [
        {
          memo: d.memo,
          recibo: parseInt(d.recibo),
          fecha_recibo: d.fecha_recibo,
          fecha_servicio: d.fecha_servicio,
          a_cobrar: parseInt(d.a_cobrar),
        },
      ];
      obj.total = obj.servicios.reduce(
        (a, b) => a + parseInt(b["a_cobrar"]),
        0
      );
      arr.push(obj);
    }
  });
  return arr;
};

const groupByServicio = (data, servicios) => {
  const arr = [];
  data.forEach((d) => {
    const busca = arr.find(
      (a) =>
        a.cliente === d.cliente.toUpperCase() &&
        a.mes.id === getMonthJS(d.fecha_servicio) &&
        a.año === getYear(d.fecha_servicio)
    );
    if (busca) {
      busca.servicios.push({
        id: d.id_servicio,
        memo: parseInt(d.memo),
        recibo: parseInt(d.recibo),
        fecha_recibo: d.fecha_recibo,
        importe_recibo: parseInt(d.importe_recibo),
        fecha_servicio: d.fecha_servicio,
        importe_servicio: parseInt(d.importe_servicio),
        acopio: parseInt(d.acopio),
        operarios: getOperarios(d.id_servicio, servicios),
      });
      busca.a_deudor = busca.servicios.reduce(
        (a, b) => a + parseInt(b.importe_servicio),
        0
      );
      busca.a_favor = busca.servicios.reduce(
        (a, b) => a + parseInt(b.acopio),
        0
      );
    } else {
      const obj = {};
      obj.id = d.id_cliente;
      obj.cliente = d.cliente.toUpperCase();
      obj.mes = {
        id: getMonthJS(d.fecha_servicio),
        name: getMonthName(d.fecha_servicio),
      };
      obj.año = getYear(d.fecha_servicio);
      obj.servicios = [
        {
          id: d.id_servicio,
          memo: d.memo,
          recibo: parseInt(d.recibo),
          fecha_recibo: d.fecha_recibo,
          importe_recibo: parseInt(d.importe_recibo),
          fecha_servicio: d.fecha_servicio,
          importe_servicio: parseInt(d.importe_servicio),
          acopio: parseInt(d.acopio),
          operarios: getOperarios(d.id_servicio, servicios),
        },
      ];
      obj.a_deudor = obj.servicios.reduce(
        (a, b) => a + parseInt(b.importe_servicio),
        0
      );
      obj.a_favor = obj.servicios.reduce((a, b) => a + parseInt(b.acopio), 0);
      arr.push(obj);
    }
  });
  return arr;
};

const groupByMemo = (data) => {
  const arr = [];

  data.forEach((d) => {
    const busca = arr.find((a) => a.memo === d.memo);
    if (busca) {
      busca.operarios.push({
        legajo: d.legajo,
        a_cobrar: d.a_cobrar,
        nombre: d.nombre,
      });
    } else {
      const obj = {
        id: d.id_servicio,
        recibo: parseInt(d.recibo),
        fecha_recibo: d.fecha_recibo,
        importe_recibo: parseInt(d.importe_recibo),
        importe_servicio: parseInt(d.importe_servicio),
        memo: d.memo,
        acopio: parseInt(d.acopio),
      };
      obj.operarios = [
        { legajo: d.legajo, a_cobrar: parseInt(d.a_cobrar), nombre: d.nombre },
      ];
      arr.push(obj);
    }
  });
  return arr;
};

const getOperarios = (id, data) => {
  const busca = data.filter((d) => id === d.id_servicio);

  return busca.map((row) => ({
    legajo: row.legajo,
    a_cobrar: row.a_cobrar,
    nombre: row.nombre,
  }));
};

const setArrayId = (array) =>
  array.map((item, index) => ({ ...item, id: index }));

module.exports = { groupByInspector, setArrayId, groupByServicio, groupByMemo };
