/* ------------------------------------------------------------------ catálogo */
function preparar(d) {
  const P = d.productos.map((r, i) => ({
    i, s: r[0], id: r[1], n: r[2], b: r[3], p: r[4], a: r[5], up: r[6], u: r[7], q: r[8], sec: r[9], t: r[10], g: r[11],
    foto: r[12], url: r[13] ? d.urls[r[0]] + r[13] : null, busca: r[14].split(" "), k: r[0] + ":" + r[1],
    cat: r[15] ?? -1, gr: !!r[16], ch: r[17] || 0, pk: r[18] || 0, sa: r[19] || 0, mo: (d.motivos || [])[r[20]] || "",
    ig: r[21] ? r[21].split(" ") : [],
  }));
  const cats = (d.categorias || []).map(([nombre, sec, clave], i) => ({ i, nombre, sec, clave, tipos: [], n: 0 }));
  const T = d.tipos.map(([etq, sec, orden, vis, canon]) => {
    const cl = canon ? canon.split(" ") : [];
    return { etq, sec, orden: orden ? orden.split(" ") : [], vis: vis ? vis.split(" ") : [], prods: [], canon: new Set(cl), canonL: cl.filter(c => c[0] !== "#") };
  });
  const e = d.equivalencias || { frases: [], palabras: {}, ignorar: [] };
  const eq = { frases: e.frases.map(([src, c]) => [new RegExp(src), c]), pal: e.palabras, ign: new Set(e.ignorar) };
  const porClave = new Map(), porGrupo = new Map(), porTiendaSec = new Map();
  for (const p of P) {
    const ts = p.s * 100 + p.sec;
    if (!porTiendaSec.has(ts)) porTiendaSec.set(ts, []);
    porTiendaSec.get(ts).push(p);
    T[p.t].prods.push(p);
    porClave.set(p.k, p);
    if (cats[p.cat]) cats[p.cat].n++;
    if (p.g >= 0) { if (!porGrupo.has(p.g)) porGrupo.set(p.g, []); porGrupo.get(p.g).push(p); }
  }
  const tiposPorSec = d.secciones.map(() => []);
  T.forEach((t, ti) => {
    const tiendas = new Set(t.prods.map(p => p.s));
    t.tiendas = tiendas.size;
    const cc = new Map();
    for (const p of t.prods) cc.set(p.cat, (cc.get(p.cat) || 0) + 1);
    t.cat = [...cc.entries()].sort((a, b) => b[1] - a[1])[0][0];
    if (tiendas.size >= 2) { tiposPorSec[t.sec].push(ti); if (cats[t.cat]) cats[t.cat].tipos.push(ti); }
  });
  const orden = (a, b) => T[b].tiendas - T[a].tiendas || T[b].prods.length - T[a].prods.length;
  tiposPorSec.forEach(l => l.sort(orden));
  cats.forEach(c => c.tipos.sort(orden));
  const catsPorSec = d.secciones.map((_, s) => cats.filter(c => c.sec === s && c.n > 0));
  // súper con productos hoy (si uno no se pudo descargar, p. ej. DIA desde GitHub, no se ofrece en ningún sitio)
  const vivas = d.tiendas.map((_, s) => s).filter(s => P.some(p => p.s === s));
  return { ...d, P, T, cats, catsPorSec, porClave, porGrupo, porTiendaSec, tiposPorSec, eq, vivas };
}

