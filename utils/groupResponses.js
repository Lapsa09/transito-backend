const { getMonthName } = require("./dateFormat");
const groupByInspector = (data) => {
  const arr = [];
  data.forEach((d) => {
    const busca = arr.find(
      (a) =>
        a.inspector === `${d["legajo"]} ${d["nombre"]}` &&
        a.mes === getMonthName(d["fecha_recibo"])
    );
    if (busca) {
      busca.servicios.push({
        memo: d.memo,
        recibo: parseInt(d.recibo),
        fecha_recibo: d.fecha_recibo,
        a_cobrar: parseInt(d.a_cobrar),
      });
      busca.total = busca.servicios.reduce(
        (a, b) => a + parseInt(b["a_cobrar"]),
        0
      );
    } else {
      const obj = {};
      obj.inspector = `${d["legajo"]} ${d["nombre"]}`;
      obj.mes = getMonthName(d["fecha_recibo"]);
      obj.servicios = [
        {
          memo: d.memo,
          recibo: parseInt(d.recibo),
          fecha_recibo: d.fecha_recibo,
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

const groupByServicio = (data) => {
  const arr = [];
  data.forEach((d) => {
    const busca = arr.find((a) => a.cliente === d.cliente);
    if (busca) {
      busca.servicios.push({
        id: d.id_servicio,
        memo: d.memo,
        recibo: parseInt(d.recibo),
        fecha_recibo: d.fecha_recibo,
        importe_recibo: parseInt(d.importe_recibo),
        fecha_servicio: d.fecha_servicio,
        importe_servicio: parseInt(d.importe_servicio),
        acopio: parseInt(d.acopio),
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
      obj.cliente = d.cliente;
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

const setArrayId = (array) =>
  array.map((item, index) => ({ ...item, id: index }));

module.exports = { groupByInspector, setArrayId, groupByServicio, groupByMemo };
