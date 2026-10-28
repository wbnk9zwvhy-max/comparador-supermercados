/* intención: ¿qué quiere decir quien busca «pavo»? Se puntúa cada categoría por cuántos productos
   encajan y lo bien que encajan (el producto se llama así frente a solo mencionarlo) y en cuántos súper está. */
// el tipo de producto se llama exactamente así (10), empieza así (5), lo contiene (1,5) o solo lo menciona el nombre (0,3)
const PESO_NIVEL = [10, 5, 1.5, 0.3];
// quien busca «salmón» o «pollo» casi nunca piensa en comida para gatos o en potitos, salvo que lo diga
const PRIOR_SECCION = { "Mascotas": 0.08, "Bebé": 0.2, "Higiene y belleza": 0.5, "Carne": 1.3, "Pescado y marisco": 1.3, "Fruta y verdura": 1.3 };
const PIDE_ESPECIAL = /^(perr|gat|mascot|cachorr|bebe|infantil|papill|potit|panal)/;
function intencion(C, r) {
  if (!r || !r.res.length) return [];
  const especial = r.qt.some(w => PIDE_ESPECIAL.test(w[0]));
  const m = new Map();
  for (const x of r.res) {
    if (x.p.cat < 0) continue;
    if (!m.has(x.p.cat)) m.set(x.p.cat, { c: x.p.cat, puntos: 0, n: 0, tiendas: new Set(), tipos: new Map() });
    const e = m.get(x.p.cat);
    const t = e.tipos.get(x.p.t) || { w: 0, n: 0, nivel: x.nivel };
    // el nombre empieza por lo buscado («Limones malla») pesa más que si solo lo es tras quitar la marca («Fanta de limón»)
    const inicio = igual(stem(norm(x.p.n).split(" ")[0]), r.qt[0]);
    const w = PESO_NIVEL[x.nivel] * (x.p.gr ? 0.3 : 1) * (x.nivel <= 1 ? (inicio ? 1.5 : 0.6) : 1);
    t.w = Math.max(t.w, w); t.n++; t.nivel = Math.min(t.nivel, x.nivel);
    e.tipos.set(x.p.t, t);
    e.n++; e.tiendas.add(x.p.s);
  }
  // cuenta tipos de producto, no envases: veinte refrescos de limón no pesan más que «Limón» la fruta
  // lo que solo empieza así («patatas fritas lisas») o lo menciona («refresco de limón») suma con rendimientos decrecientes
  for (const e of m.values()) {
    let empiezan = 0, menciones = 0;
    for (const t of e.tipos.values()) {
      const v = t.w * (1 + Math.log2(t.n));
      if (t.nivel === 0) e.puntos += v; else if (t.nivel === 1) empiezan += v; else menciones += v;
    }
    e.puntos += 6 * Math.sqrt(empiezan) + 3 * Math.sqrt(menciones);
  }
  const prior = c => { const f = PRIOR_SECCION[C.secciones[C.cats[c].sec]] || 1; return especial && f < 1 ? 1 : f; };
  const lista = [...m.values()].map(e => ({ ...e, puntos: e.puntos * (0.4 + 0.15 * e.tiendas.size) * prior(e.c) }))
    .sort((a, b) => b.puntos - a.puntos);
  const total = lista.reduce((a, e) => a + e.puntos, 0) || 1;
  return lista.filter((e, i) => i === 0 || (e.puntos / total >= 0.04 && e.n >= 2)).slice(0, 8);
}

