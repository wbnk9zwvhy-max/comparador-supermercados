
/* búsqueda: como en las webs de los supermercados, pero agrupando por tipo de producto */
/* equivalencias entre tiendas (tablas al final de scripts/categorias.py): «gulas» encuentra las «Delicias del mar de surimi» de Mercadona
   y «ternera para guisar» los «Tacos de vacuno para guisar»; cada palabra se busca también por su sinónimo */
function conceptosDe(C, texto) {
  const n = norm(texto);
  return C.eq.frases.filter(([rx]) => rx.test(n)).map(([, c]) => c);
}
function buscar(C, q) {
  const qt = consulta(q).map(alts => {
    const m = new Set(alts);
    for (const a of alts) if (C.eq.pal[a]) m.add(C.eq.pal[a]);
    return [...m];
  });
  if (!qt.length) return null;
  const qc = conceptosDe(C, q);
  const res = [];
  for (const p of C.P) {
    const T = C.T[p.t];
    let ok = true;
    for (const w of qt) { if (!p.busca.some(b => empieza(b, w)) && !T.canonL.some(c => empieza(c, w))) { ok = false; break; } }
    const porConcepto = qc.length > 0 && qc.every(c => T.canon.has(c));
    if (!ok && !porConcepto) continue;
    const ot = T.orden;
    const prefijo = qt.every((w, i) => igual(ot[i], w));
    const contiene = prefijo || qt.every(w => ot.some(o => igual(o, w)) || T.canon.has(C.eq.pal[w[0]] || w[0]));
    const extra = Math.max(0, ot.length - qt.length);
    let nivel = prefijo ? (extra === 0 ? 0 : 1) : contiene ? 2 : 3;
    if (porConcepto && nivel > 1) nivel = 1; // otro nombre para lo mismo: cuenta como «empieza así»
    res.push({ p, nivel, extra, porConcepto });
  }
  return { qt, qc, res };
}

