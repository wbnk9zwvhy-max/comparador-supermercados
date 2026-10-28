function gastoEnvio(s, subtotal) {
  const e = AJ.envios[s];
  if (!e || !e.activo) return null;
  return e.umbral && subtotal >= e.umbral ? e.costeSobre : e.coste;
}
const r2 = x => Math.round(x * 100) / 100;

/* Reparte la lista entre supermercados. Con envío a domicilio cuenta los gastos de envío de cada súper usado,
   sus umbrales de envío gratis o rebajado y sus pedidos mínimos, y mueve productos entre súper si sale a cuenta. */
function planificar(C, items, activas, maxTiendas, envio) {
  const vivos = items.map(it => ({ it, p: C.porClave.get(it.k) })).filter(x => x.p);
  if (!vivos.length) return null;
  const opciones = vivos.map(({ it, p }) => {
    const por = {};
    for (let s = 0; s < C.tiendas.length; s++) por[s] = equivalente(C, p, s, it.q);
    return { it, p, por };
  });
  const evaluar = (conj, eleccion) => {
    const sub = {};
    let productos = 0, faltan = [];
    eleccion.forEach((s, i) => {
      if (s == null) { faltan.push(opciones[i]); return; }
      const c = opciones[i].por[s].coste;
      sub[s] = (sub[s] || 0) + c; productos += c;
    });
    let gastos = 0, penal = 0;
    const envios = {}, cortos = [];
    if (envio) for (const s of Object.keys(sub).map(Number)) {
      const g = gastoEnvio(s, sub[s]);
      envios[s] = g; gastos += g;
      const min = AJ.envios[s].minimo || 0;
      if (sub[s] < min) { cortos.push(s); penal += 1000 + (min - sub[s]); }
    }
    // los sustitutos cuentan un poco más para que solo se elijan si ahorran de verdad
    let ajuste = 0;
    eleccion.forEach((s, i) => { if (s != null && opciones[i].por[s].como === "sustituto") ajuste += 0.15 + 0.05 * opciones[i].por[s].coste; });
    return { conj, eleccion, sub, productos: r2(productos), envios, gastos: r2(gastos), total: r2(productos + gastos), faltan, cortos,
      coste: faltan.length * 1e5 + productos + gastos + penal + ajuste };
  };
  // búsqueda local desde varios puntos de partida: cada producto en su súper más barato y toda la compra en cada súper;
  // mueve productos uno a uno y vacía súper enteros cuando ahorrar su envío compensa
  const mejorar = (conj, eleccion) => {
    let actual = evaluar(conj, eleccion);
    for (let vuelta = 0; vuelta < 12; vuelta++) {
      let mejoro = false;
      for (let i = 0; i < opciones.length; i++) for (const s of conj) {
        if (s === eleccion[i] || !opciones[i].por[s]) continue;
        const prueba = eleccion.slice(); prueba[i] = s;
        const r = evaluar(conj, prueba);
        if (r.coste < actual.coste - 0.001) { eleccion = prueba; actual = r; mejoro = true; }
      }
      if (envio) for (const quitar of conj) {
        if (!eleccion.includes(quitar)) continue;
        const resto = conj.filter(s => s !== quitar);
        if (!resto.length) continue;
        const prueba = eleccion.map((s, i) => {
          if (s !== quitar) return s;
          let m = null, ms = null;
          for (const t of resto) { const e = opciones[i].por[t]; if (e && (!m || e.coste < m.coste)) { m = e; ms = t; } }
          return ms == null ? s : ms;
        });
        const r = evaluar(conj, prueba);
        if (r.coste < actual.coste - 0.001) { eleccion = prueba; actual = r; mejoro = true; }
      }
      if (!mejoro) break;
    }
    return actual;
  };
  const resolver = conj => {
    const voraz = opciones.map(o => {
      let mejor = null, ms = null;
      for (const s of conj) { const e = o.por[s]; if (e && (!mejor || e.coste < mejor.coste)) { mejor = e; ms = s; } }
      return ms;
    });
    let actual = mejorar(conj, voraz);
    if (conj.length > 1) for (const t of conj) {
      const todo = opciones.map((o, i) => o.por[t] ? t : voraz[i]);
      const r = mejorar(conj, todo);
      if (r.coste < actual.coste - 0.001) actual = r;
    }
    actual.asign = opciones.map((o, i) => ({ o, s: actual.eleccion[i], e: actual.eleccion[i] == null ? null : o.por[actual.eleccion[i]] }));
    // una tienda que se queda sin productos no se usa (ni paga envío)
    actual.usadas = conj.filter(s => actual.sub[s] != null);
    actual.sustitutos = actual.asign.filter(a => a.e && a.e.como === "sustituto").length;
    return actual;
  };
  const posibles = [...activas].filter(s => !envio || (AJ.envios[s] && AJ.envios[s].activo));
  const subconjuntos = [];
  (function rec(i, act) {
    if (act.length) subconjuntos.push(act);
    for (let j = i; j < posibles.length; j++) rec(j + 1, [...act, posibles[j]]);
  })(0, []);
  const todos = subconjuntos.map(resolver);
  const orden = (a, b) => a.faltan.length - b.faltan.length || a.cortos.length - b.cortos.length || a.coste - b.coste;
  const mejorDe = lista => lista.length ? [...lista].sort(orden)[0] : null;
  // el mejor plan usando como mucho k supermercados (k = 1…4): nunca sale más caro al permitir más
  const porMax = {};
  for (let k = 1; k <= C.tiendas.length; k++) porMax[k] = mejorDe(todos.filter(r => r.usadas.length <= k && r.usadas.length > 0));
  const plan = porMax[Math.min(maxTiendas, C.tiendas.length)] || null;
  const mejor = mejorDe(todos.filter(r => r.usadas.length > 0));
  const unaTienda = Array.from({ length: C.tiendas.length }, (_, s) => ({ ...resolver([s]), sinEnvio: envio && !(AJ.envios[s] && AJ.envios[s].activo) }));
  const mejorUna = mejorDe(unaTienda.filter(r => activas.has(r.conj[0]) && !r.sinEnvio));
  return { plan, porMax, mejor, unaTienda, mejorUna, n: vivos.length, envio };
}

