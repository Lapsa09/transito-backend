const {
  getMonthName,
  getYear,
  getMonthJS,
  dateFormatJS,
} = require("./dateFormat");

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
    const busca = acc.find((a) => a.memo === row.memo);
    if (busca) {
      busca.operarios ??= [];
      busca.operarios.push({
        id: +row.id,
        cliente: row.cliente,
        memo: row.memo,
        fecha_servicio: row.fecha_servicio,
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
        fecha_servicio: row.fecha_servicio,
        cliente: row.cliente,
      };
      obj.operarios = [
        {
          id: +row.id,
          cliente: row.cliente,
          memo: row.memo,
          fecha_servicio: row.fecha_servicio,
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

const setArrayId = (array) =>
  array.map((item, index) => ({ ...item, id: index }));

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

const getSingleService = (data) => {
  const res = {
    id: data[0].id_servicio,
    recibo: data[0].recibo,
    fecha_recibo: data[0].fecha_recibo,
    importe_recibo: data[0].importe_recibo,
    fecha_servicio: data[0].fecha_servicio,
    importe_servicio: data[0].importe_servicio,
    acopio: data[0].acopio,
    memo: data[0].memo,
    operarios: [],
  };

  data.forEach(({ legajo, nombre, a_cobrar, hora_inicio, hora_fin }) => {
    res.operarios.push({ legajo, nombre, a_cobrar, hora_inicio, hora_fin });
  });

  return res;
};

const groupByDate = (data) => {
  const res = [];

  data.forEach((item) => {
    const busca = res.find(
      (row) =>
        row.fecha_servicio.toLocaleString() ===
        item.fecha_servicio.toLocaleString()
    );

    if (busca != null) {
      busca.servicios.push({
        ...item,
      });
    } else {
      res.push({
        fecha_servicio: item.fecha_servicio,
        servicios: [{ ...item }],
      });
    }
  });
  return setArrayId(res);
};

module.exports = {
  groupByInspector,
  setArrayId,
  groupByServicio,
  groupByMemo,
  groupByDay,
  promedio,
  getSingleService,
  groupByDate,
};
