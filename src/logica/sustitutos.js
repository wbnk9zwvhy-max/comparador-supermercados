/* entre los candidatos: los más parecidos; de ellos, con el modo sano, los más naturales; y de esos, el más barato */
function elegirParecido(C, ref, lista, cant, como, minimo = 0, banda = 0.1) {
  let cands = naturalComoRef(ref, lista).map(p => ({ p, sim: parecido(C, ref, p) })).filter(x => x.sim > minimo);
  if (!cands.length) return null;
  const max = Math.max(...cands.map(x => x.sim));
  let top = cands.filter(x => x.sim >= max - banda).map(x => x.p);
  if (AJ.saludable) { const m = Math.max(...top.map(c => c.sa)); top = top.filter(c => c.sa === m); }
  let mejor = null;
  for (const c of top) { const r = costeCon(c, ref, cant); if (!mejor || r.coste < mejor.coste) mejor = r; }
  return { ...mejor, como, sim: max };
}
/* sin el mismo producto, otro nombre para lo mismo ni uno del mismo tipo: el más parecido de su categoría
   (o de su sección), avisando */
function sustituto(C, ref, s, cant, enSec, compatible) {
  // de su categoría y con algo en común (las categorías de cada tienda no son perfectas)
  // buscando algo igual de natural no vale cualquier cosa de la categoría: tiene que parecerse de verdad
  const r = elegirParecido(C, ref, enSec.filter(p => p.cat === ref.cat && ref.cat >= 0 && compatible(p)), cant, "sustituto", ESTRICTO ? 0.5 : 0.15);
  if (r) return r;
  return elegirParecido(C, ref, enSec.filter(compatible), cant, "sustituto", 0.6);
}

