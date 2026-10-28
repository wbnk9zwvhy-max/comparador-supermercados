function comparar(C, r, q, opciones = {}) {
  if (!r) return null;
  const { qt, res } = r;
  const catPieza = opciones.cat >= 0 && C.cats[opciones.cat] && C.cats[opciones.cat].clave === "ch_pieza";
  const vale = x => x.p.up != null && (opciones.grandes || catPieza || !x.p.gr);
  // núcleo: productos cuyo tipo empieza por lo buscado; si no hay, los que contienen todas las palabras
  let nucleo = res.filter(x => x.nivel <= 1 && vale(x));
  if (new Set(nucleo.map(x => x.p.s)).size < 2) nucleo = res.filter(x => x.nivel <= 2 && vale(x));
  if (!nucleo.length) return null; // búsqueda de marca: no hay un tipo de producto que comparar
  const ocultos = catPieza || opciones.grandes ? 0 : res.filter(x => x.nivel <= 2 && x.p.gr && x.p.up != null).length;
  // unidad y sección dominantes: la combinación presente en más supermercados
  const combos = new Map();
  for (const x of nucleo) {
    const k = x.p.u + "|" + x.p.sec;
    if (!combos.has(k)) combos.set(k, { n: 0, tiendas: new Set() });
    const c = combos.get(k); c.n++; c.tiendas.add(x.p.s);
  }
  const [clave] = [...combos.entries()].sort((a, b) => b[1].tiendas.size - a[1].tiendas.size || b[1].n - a[1].n)[0];
  const [u, sec] = clave.split("|").map(Number);
  nucleo = nucleo.filter(x => x.p.u === u && x.p.sec === sec);
  if (new Set(nucleo.map(x => x.p.s)).size < 2) return { solo: true, ocultos };
  const filas = [];
  for (let s = 0; s < C.tiendas.length; s++) {
    const enTienda = res.filter(x => x.p.s === s && vale(x) && x.p.u === u && x.p.sec === sec);
    let cand = enTienda.filter(x => x.nivel <= 1), aprox = false;
    if (!cand.length) cand = enTienda.filter(x => x.nivel <= 2);
    if (!cand.length) { cand = enTienda; aprox = true; }
    if (!cand.length) continue;
    const mejor = cand.reduce((a, b) => mejorQue(b.p, a.p) ? b : a).p;
    filas.push({ s, p: mejor, aprox, n: cand.length });
  }
  filas.sort((a, b) => (AJ.saludable ? b.p.sa - a.p.sa : 0) || upEf(a.p) - upEf(b.p));
  // afinar: la siguiente palabra del tipo de producto (entera, semidesnatada, sin lactosa…)
  const sig = new Map();
  for (const x of nucleo) {
    if (x.nivel > 1) continue;
    const vis = C.T[x.p.t].vis;
    let w = vis[qt.length];
    if (w === "sin" && vis[qt.length + 1]) w = w + " " + vis[qt.length + 1]; // «sin lactosa», no «sin»
    if (w && w.length > 1 && !/^\d/.test(w)) sig.set(w, (sig.get(w) || 0) + 1);
  }
  const refinar = [...sig.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
  const exacto = nucleo.find(x => x.nivel === 0);
  const texto = (q || "").trim();
  const titulo = exacto ? C.T[exacto.p.t].etq : texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  return { u, filas, refinar, titulo, total: nucleo.length, ocultos };
}

