const {
  getMonthName,
  getYear,
  getMonthJS,
  dateFormatJS,
} = require("./dateFormat");

const groupByCliente = (data) => {
  return data.reduce((acc, row) => {
    let cliente = acc.find((c) => c.id_cliente === row.id_cliente);
    if (!cliente) {
      cliente = {
        id_cliente: row.id_cliente,
        cliente: row.cliente?.toUpperCase(),
        id: row.id_cliente,
        historial: [],
        a_deudor: 0,
        a_favor: 0,
      };
      acc.push(cliente);
    }
    let historia = cliente.historial.find(
      (h) =>
        h.id_cliente +
          getMonthJS(row.fecha_servicio) +
          getYear(row.fecha_servicio) ===
        h.id
    );
    if (!historia) {
      historia = {
        id_servicio: row.id_servicio,
        id_cliente: row.id_cliente,
        cliente: row.cliente,
        mes: {
          id: getMonthJS(row.fecha_servicio),
          name: getMonthName(row.fecha_servicio),
        },
        año: getYear(row.fecha_servicio),
        gastos: row.importe_servicio,
        acopio: row.importe_recibo - row.importe_servicio,
        id:
          row.id_cliente +
          getMonthJS(row.fecha_servicio) +
          getYear(row.fecha_servicio),
        servicios: [],
      };
      cliente.historial.push(historia);
    }
    historia.servicios.push({
      id_servicio: row.id_servicio,
      recibo: row.recibo,
      fecha_recibo: row.fecha_recibo,
      importe_recibo: row.importe_recibo,
      fecha_servicio: row.fecha_servicio,
      importe_servicio: row.importe_servicio,
      memo: row.memo,
      operarios: [
        {
          legajo: row.legajo,
          nombre: row.nombre,
          a_cobrar: row.a_cobrar,
          cancelado: row.cancelado,
        },
      ],
    });
    historia.gastos += row.importe_servicio;
    historia.acopio += row.importe_recibo - row.importe_servicio;
    cliente.a_deudor += row.importe_servicio;
    cliente.a_favor += row.importe_recibo - row.importe_servicio;
    return acc;
  }, []);
};

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

const groupByServicio = (data) => {
  const arr = data.reduce((acc, row) => {
    const busca = acc.find((a) => a.id === row.id);
    if (busca) {
      busca.servicios ??= [];
      busca.servicios.push({
        id_servicio: +row.id_servicio,
        memo: row.memo,
        recibo: +row.recibo,
        fecha_recibo: dateFormatJS(row.fecha_recibo),
        importe_recibo: +row.importe_recibo,
        importe_servicio: +row.importe_servicio,
        acopio: +row.acopio,
        legajo: +row.legajo,
        nombre: row.nombre,
        a_cobrar: +row.a_cobrar,
        cancelado: row.cancelado,
      });
      return acc;
    } else {
      const obj = {
        id: row.id,
        mes: row.mes,
        año: row.año,
      };
      obj.servicios = [
        {
          id_servicio: +row.id_servicio,
          memo: row.memo,
          recibo: +row.recibo,
          fecha_recibo: dateFormatJS(row.fecha_recibo),
          importe_recibo: +row.importe_recibo,
          importe_servicio: +row.importe_servicio,
          acopio: +row.acopio,
          legajo: +row.legajo,
          nombre: row.nombre,
          a_cobrar: +row.a_cobrar,
          cancelado: row.cancelado,
        },
      ];
      return acc.concat(obj);
    }
  }, []);

  return arr;
};

const groupByMemo = (data) => {
  const arr = data.reduce((acc, row) => {
    const busca = acc.find(
      (a) =>
        a.memo === row.memo &&
        a.fecha_servicio === dateFormatJS(row.fecha_servicio)
    );
    if (busca) {
      busca.operarios ??= [];
      busca.operarios.push({
        id: +row.id,
        cliente: row.cliente,
        memo: row.memo,
        fecha_servicio: dateFormatJS(row.fecha_servicio),
        legajo: +row.legajo,
        nombre: row.nombre,
        a_cobrar: +row.a_cobrar,
        cancelado: row.cancelado,
      });
      return acc;
    } else {
      const obj = {
        id: row.id,
        memo: row.memo,
        fecha_servicio: dateFormatJS(row.fecha_servicio),
        cliente: row.cliente,
      };
      obj.operarios = [
        {
          id: +row.id,
          cliente: row.cliente,
          memo: row.memo,
          fecha_servicio: dateFormatJS(row.fecha_servicio),
          legajo: +row.legajo,
          nombre: row.nombre,
          a_cobrar: +row.a_cobrar,
          cancelado: row.cancelado,
        },
      ];
      return acc.concat(obj);
    }
  }, []);

  return arr;
};

const groupByDay = (data) => {
  const array = [];

  data.forEach((d) => {
    const busca = array.find((a) => a.id === d.id);

    if (busca != null) {
      busca[d.horario] ??= [];
      busca[d.horario].push({
        id: d.id_rec,
        calles: d.calles,
        trafico: d.id_trafico,
        tiempo: d.tiempo,
        tiempo_hist: d.tiempo_hist,
        velocidad: d.velocidad,
        velocidad_hist: d.velocidad_hist,
      });
    } else {
      const obj = {
        id: d.id,
        fecha: d.fecha,
      };
      obj[d.horario] = [
        {
          id: d.id_rec,
          calles: d.calles,
          trafico: d.id_trafico,
          tiempo: d.tiempo,
          tiempo_hist: d.tiempo_hist,
          velocidad: d.velocidad,
          velocidad_hist: d.velocidad_hist,
        },
      ];
      array.push(obj);
    }
  });
  return array;
};

const promedio = (data) => {
  const res = {};
  data.forEach((d) => {
    res[d.horario] ??= [];
    res[d.horario].push({
      id: d.id_calles,
      calles: d.calles,
      trafico: Math.round(d.nivel_trafico),
      tiempo: Math.round(d.tiempo),
      tiempo_hist: Math.round(d.tiempo_hist),
      velocidad: Math.round(d.velocidad),
      velocidad_hist: Math.round(d.velocidad_hist),
    });
  });
  return res;
};

module.exports = {
  groupByInspector,
  groupByServicio,
  groupByMemo,
  groupByDay,
  promedio,
  groupByCliente,
};
