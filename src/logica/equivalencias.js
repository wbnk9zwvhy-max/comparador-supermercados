/* ------------------------------------------------------------------ equivalencias para la lista */
const masa = u => u === 0 || u === 1;
// unidades y docenas se pueden comparar: 1 docena = 12 unidades
const piezas = u => u === 2 || u === 3;
const enBase = p => p.q == null ? null : p.u === 3 ? p.q * 12 : p.q;
// sin unidad conocida (p. ej. «Huevos» sin formato) se compara envase a envase
const comparables = (a, b) => a == null || b == null || a === b || (masa(a) && masa(b)) || (piezas(a) && piezas(b));
const CALIFICATIVOS = new Set(["ecologic", "ecologico", "bio", "eco", "granel", "malla", "bolsa", "suelt", "seleccion", "premium", "gourmet"]);
function precioDeN(c, n) {
  // oferta pack de Consum («8 latas a 0,98 €/ud») y Cheque Crece del socio
  let total = n * c.p;
  if (c.pk && n >= c.pk[0]) { const packs = Math.floor(n / c.pk[0]) * c.pk[0]; total = packs * c.pk[1] + (n - packs) * c.p; }
  return Math.round((total - n * chequeDe(c)) * 100) / 100;
}
/* sin formato («Huevos» de Mercadona, sin cantidad) se estima cuánto trae con su precio y lo que cuesta el kg, L
   o la docena de lo de su categoría en la misma tienda; así no se cambia por media docena solo porque es más barata */
const NO_ALIMENTO = new Set(["Limpieza y hogar", "Higiene y belleza", "Otros", "Mascotas"]);
function cantidadEstimada(C, ref) {
  if (ref._qe !== undefined) return ref._qe;
  ref._qe = null;
  // solo en alimentación: en limpieza o higiene «unidad» no dice nada (un bastoncillo no es una compresa)
  if (!(ref.p > 0) || ref.cat < 0 || NO_ALIMENTO.has(C.secciones[ref.sec])) return null;
  const otros = (C.porTiendaSec.get(ref.s * 100 + ref.sec) || []).filter(p => p !== ref && p.cat === ref.cat && p.q && p.p > 0 && p.u != null && !p.gr);
  const veces = new Map();
  for (const p of otros) { const f = piezas(p.u) ? "piezas" : masa(p.u) ? "masa" : p.u; veces.set(f, (veces.get(f) || 0) + 1); }
  const [familia, n] = [...veces.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  if (!n || n < 3) return null;
  const precios = otros.filter(p => (familia === "piezas" ? piezas(p.u) : familia === "masa" ? masa(p.u) : p.u === familia))
    .map(p => p.p / enBase(p)).sort((a, b) => a - b);
  const u = familia === "piezas" ? 2 : familia === "masa" ? 0 : familia;
  return ref._qe = { base: ref.p / precios[precios.length >> 1], u };
}
function costeCon(C, c, ref, cant) {
  let n = cant, estimada = false;
  if (ref.q && c.q && comparables(ref.u, c.u)) n = Math.max(1, Math.ceil(enBase(ref) * cant / enBase(c) - 0.03));
  else if (ref.q == null && c.q && c !== ref) {
    const e = cantidadEstimada(C, ref);
    if (e && comparables(e.u, c.u)) { n = Math.max(1, Math.round(e.base * cant / enBase(c))); estimada = true; }
  }
  return { p: c, n, coste: precioDeN(c, n), ...(estimada ? { estimada } : {}) };
}
// pienso, comida de bebé y productos infantiles nunca sustituyen a una compra normal (al revés sí se permite)
const RX_PARA_OTROS = /\b(perros?|gatos?|mascotas?|cachorros?|felin\w*|canin\w*|bebes?|infantil(es)?|junior|kids|ninos?|ninas?|papillas?|potitos?|lactantes?)\b/;
const paraOtros = (C, p) => p._po ?? (p._po = C.secciones[p.sec] === "Bebé" || C.secciones[p.sec] === "Mascotas" || RX_PARA_OTROS.test(norm(p.n)));
/* Nunca se cambia lo que elegiste por algo menos natural: primero se busca entre lo igual o más natural que tu
   producto (según sus ingredientes) y solo si no hay ninguno se acepta uno menos natural, avisando. */
let ESTRICTO = false;
function naturalComoRef(ref, lista) {
  if (!ESTRICTO || sinDatos(ref)) return lista;
  // más natural, o igual de natural sin perder lo que lo distingue (% de carne, ecológico, integral…)
  const n = nivelDe(ref), extra = ref.sa % 10;
  return lista.filter(c => !sinDatos(c) && (nivelDe(c) > n || (nivelDe(c) === n && c.sa % 10 >= extra)));
}
function equivalente(C, ref, s, cant) {
  if (ref.s === s || ref.g >= 0) { const r = equivalenteDe(C, ref, s, cant); if (r && r.como === "igual") return r; }
  ESTRICTO = true;
  let r = equivalenteDe(C, ref, s, cant);
  ESTRICTO = false;
  if (r) return r;
  r = equivalenteDe(C, ref, s, cant);
  if (r && !sinDatos(ref) && (sinDatos(r.p) || r.p.sa < ref.sa - (ref.sa % 10) || (nivelDe(r.p) === nivelDe(ref) && r.p.sa % 10 < ref.sa % 10))) r = { ...r, menosNatural: true };
  return r;
}
function equivalenteDe(C, ref, s, cant) {
  if (ref.s === s) return { p: ref, n: cant, coste: precioDeN(ref, cant), como: "igual" };
  if (ref.g >= 0) {
    const m = (C.porGrupo.get(ref.g) || []).find(p => p.s === s);
    if (m) return { ...costeCon(C, m, ref, cant), como: "igual" };
  }
  const elegir = (lista, como) => {
    lista = naturalComoRef(ref, lista);
    if (!lista.length) return null;
    if (AJ.saludable) { const m = Math.max(...lista.map(c => c.sa)); lista = lista.filter(c => c.sa === m); }
    let mejor = null;
    for (const c of lista) { const r = costeCon(C, c, ref, cant); if (!mejor || r.coste < mejor.coste) mejor = r; }
    return { ...mejor, como };
  };
  // nunca se cambia una compra normal por una pieza entera o un formato de hostelería
  const tamano = p => ref.gr || !p.gr;
  // con la cantidad estimada, lo que cuesta mucho menos (o más) por unidad es otra cosa: huevos de codorniz por huevos
  const est = ref.q == null ? cantidadEstimada(C, ref) : null;
  const razonable = p => !est || !p.q || !comparables(est.u, p.u) || (x => x > 0.4 && x < 2.5)(p.p / enBase(p) / (ref.p / est.base));
  const compatible = p => comparables(p.u, ref.u) && tamano(p) && (paraOtros(C, ref) || !paraOtros(C, p)) && razonable(p);
  const mismoTipo = C.T[ref.t].prods.filter(p => p.s === s && compatible(p));
  const r1 = elegir(mismoTipo, "tipo"); if (r1) return r1;
  // el mismo producto con otro nombre en esa tienda (gulas = delicias del mar de surimi; ternera de guisar = añojo para guisar)
  const re = elegirParecido(C, ref, equivalentesEn(C, ref, s).filter(compatible), cant, "equivalente", 0, 0.03); if (re) return re;
  const ot = C.T[ref.t].orden;
  if (!ot.length) return null;
  const enSec = C.porTiendaSec.get(s * 100 + ref.sec) || [];
  const enCat = enSec.filter(p => p.cat === ref.cat);
  // parecido: el tipo empieza igual (probando con menos palabras, mínimo dos);
  // «ecológico», «granel», «bio»… no cambian el producto, así que se prueban también sin ellos
  const base = ot.filter(w => !CALIFICATIVOS.has(w));
  const intentos = [];
  for (let n = ot.length; n >= Math.min(2, ot.length); n--) intentos.push(ot.slice(0, n));
  if (base.length && base.length < ot.length) intentos.push(base);
  for (const candidatos of [enCat, enSec]) {
    for (const pref of intentos) {
      const lista = [];
      for (const p of candidatos) {
        if (!compatible(p)) continue;
        const o = C.T[p.t].orden;
        if (pref.every((w, i) => o[i] === w)) lista.push(p);
      }
      const r = elegir(lista, "parecido"); if (r) return r;
    }
  }
  // último recurso: todas las palabras del tipo aparecen en el nombre (marcas dentro del nombre: «Refresco Coca-Cola light»)
  const lista = enSec.filter(p => compatible(p) && ot.every(w => p.busca.includes(w)));
  const r3 = elegir(lista, "parecido"); if (r3) return r3;
  return sustituto(C, ref, s, cant, enSec, compatible);
}
/* equivalentes: comparten un concepto (#gula, #vacuno_guisar…) o, quitando calificativos («gallega», «IGP»,
   «selección»…) y unificando sinónimos («añojo» = «ternera» = «vacuno»), se llaman igual */
const clavePalabras = (C, T) => T.canonL.filter(w => !C.eq.ign.has(w)).sort().join(" ");
function equivalentesEn(C, ref, s) {
  const T = C.T[ref.t];
  if (!C.porConcepto) {
    C.porConcepto = new Map(); C.porPalabras = new Map();
    for (const p of C.P) {
      for (const c of C.T[p.t].canon) if (c[0] === "#") { if (!C.porConcepto.has(c)) C.porConcepto.set(c, []); C.porConcepto.get(c).push(p); }
      const k = clavePalabras(C, C.T[p.t]);
      if (k) { if (!C.porPalabras.has(k)) C.porPalabras.set(k, []); C.porPalabras.get(k).push(p); }
    }
  }
  const out = new Set();
  for (const c of T.canon) if (c[0] === "#") for (const p of C.porConcepto.get(c) || []) if (p.s === s) out.add(p);
  const k = clavePalabras(C, T);
  if (k) for (const p of C.porPalabras.get(k) || []) if (p.s === s && p.sec === ref.sec) out.add(p);
  return [...out];
}
/* parecido entre dos productos (0 a ~3): conceptos y palabras canónicas en común, misma palabra principal,
   mismos primeros ingredientes y misma categoría */
function parecido(C, a, b) {
  const A = C.T[a.t], B = C.T[b.t];
  const pa = [...A.canon].filter(w => !C.eq.ign.has(w)), pb = new Set([...B.canon].filter(w => !C.eq.ign.has(w)));
  let comun = 0, total = 0;
  for (const w of new Set([...pa, ...pb])) { const peso = w[0] === "#" ? 2 : 1; total += peso; if (pb.has(w) && pa.includes(w)) comun += peso; }
  let sim = total ? comun / total : 0;
  const prim = o => o.map(w => C.eq.pal[w] || w).find(w => !C.eq.ign.has(w));
  if (A.orden.length && B.orden.length && prim(A.orden) === prim(B.orden)) sim += 0.5;
  if (a.ig.length && b.ig.length) {
    const I = new Set(a.ig); let c = 0;
    for (const w of b.ig) if (I.has(w)) c++;
    sim += 0.4 * c / (new Set([...a.ig, ...b.ig]).size || 1);
  }
  if (a.cat === b.cat && a.cat >= 0) sim += 0.15;
  return sim;
}
