
/* búsqueda: como en las webs de los supermercados, pero agrupando por tipo de producto */
/* equivalencias entre tiendas (tablas al final de scripts/categorias.py): «gulas» encuentra las «Delicias del mar de surimi» de Mercadona
   y «ternera para guisar» los «Tacos de vacuno para guisar»; cada palabra se busca también por su sinónimo */
// cada concepto con las palabras de la búsqueda que forman su frase («patatas» en «tortilla de patatas»)
function conceptosDe(C, texto) {
  const n = norm(texto), out = [];
  for (const [rx, c] of C.eq.frases) { const m = n.match(rx); if (m) out.push({ c, cubre: tokens(m[0]) }); }
  return out;
}
/* sin nada que tenga todas las palabras se quitan las últimas, que suelen ser lo accesorio:
   «pulpo a la gallega» → «pulpo», «pizza congelada» → «pizza» (r.sin dice qué se ha quitado) */
function buscar(C, q) {
  const r = buscarTodas(C, q);
  if (!r || r.res.length) return r;
  const palabras = norm(q).split(" ").filter(w => w && !CONECTORES.has(w));
  for (let n = palabras.length - 1; n >= 1; n--) {
    const r2 = buscarTodas(C, palabras.slice(0, n).join(" "));
    if (r2 && r2.res.length) return { ...r2, sin: palabras.slice(n) };
  }
  return r;
}
function buscarTodas(C, q) {
  const qt = consulta(q).map(alts => {
    const m = new Set(alts);
    for (const a of alts) if (C.eq.pal[a]) m.add(C.eq.pal[a]);
    return [...m];
  });
  if (!qt.length) return null;
  const conceptos = conceptosDe(C, q), qc = conceptos.map(x => x.c);
  // las palabras que no forman parte de la frase del concepto tienen que estar igualmente:
  // «tortilla de patatas» no son unas patatas cualesquiera
  const cubiertas = new Set(conceptos.flatMap(x => x.cubre));
  const resto = qt.filter(alts => !cubiertas.has(alts[0]));
  const hayConfundibles = norm(q).split(" ").some(w => CONFUNDIBLES[w.replace(/s$/, "")]);
  const res = [];
  for (const p of C.P) {
    const T = C.T[p.t];
    const casa = w => p.busca.some(b => empieza(b, w)) || T.canonL.some(c => empieza(c, w));
    const ok = qt.every(casa);
    const porConcepto = qc.length > 0 && qc.every(c => T.canon.has(c)) && resto.every(casa);
    if (!ok && !porConcepto) continue;
    if (hayConfundibles && confundido(q, norm(p.n))) continue;
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

