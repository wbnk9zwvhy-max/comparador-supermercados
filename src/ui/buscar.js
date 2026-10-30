/* ------------------------------------------------------------------ buscar */
function QueBuscas({ C, opciones, cat, elegir }) {
  if (opciones.length < 2) return null;
  return html`<div class="intencion">
    <p class="h3" id="int-tit">¿Qué buscas?</p>
    <div class="chips" role="group" aria-labelledby="int-tit">
      ${opciones.map(o => html`<button key=${o.c} class="chip" aria-pressed=${cat === o.c} onClick=${() => elegir(o.c)}>
        ${C.cats[o.c].nombre}<span class="cuenta">${o.n}</span></button>`)}
      <button class="chip" aria-pressed=${cat === -1} onClick=${() => elegir(-1)}>Todo</button>
    </div></div>`;
}

function Comparativa({ C, comp, cantidadDe, poner, abrir, refinar, q, cat, grandes, setGrandes }) {
  if (!comp) return null;
  const aviso = comp.ocultos > 0 || grandes
    ? html`<p class="peq">${grandes ? "Incluye piezas enteras y formatos de hostelería. " : `No cuenta ${comp.ocultos === 1 ? "1 pieza entera o formato grande" : comp.ocultos + " piezas enteras o formatos grandes"}, poco habituales en casa. `}
        <button class="enlace-btn" onClick=${() => setGrandes(!grandes)}>${grandes ? "Quitarlos" : "Incluirlos"}</button></p>` : null;
  if (comp.solo || !comp.filas || !comp.filas.length) return aviso ? html`<section class="tarjeta comp">${aviso}</section>` : null;
  const { filas, u } = comp;
  const mejor = filas[0];
  const resto = filas.slice(1);
  const n = cantidadDe(mejor.p.k);
  const motivo = AJ.saludable && mejor.p.sa > 0;
  return html`<section class="tarjeta comp" aria-labelledby="comp-tit">
    <div class="comp-cab"><div style=${{ minWidth: 0 }}><h2 class="h2" id="comp-tit">${comp.titulo}</h2>
      <p class="peq">${cat >= 0 ? C.cats[cat].nombre + " · " : ""}${AJ.saludable ? "gana lo más natural; luego el más barato" : "gana el más barato"} por ${UNID[u]}</p></div></div>
    <button class="ganador" onClick=${() => abrir(mejor.p)} aria-label=${`Más ${AJ.saludable ? "sano" : "barato"}: ${mejor.p.n} en ${C.tiendas[mejor.s]}, ${fmtU(upEf(mejor.p), u)}`}>
      <span class="sello">${AJ.saludable ? "Más sano" : "Más barato"}</span>
      <${Foto} C=${C} p=${mejor.p} t=${76} />
      <span style=${{ display: "grid", gap: 6, minWidth: 0 }}>
        <${TiendaChip} C=${C} s=${mejor.s} t=${20} />
        <span class="precio">${fmt(precioEf(mejor.p))} <small class="pu-gan">${fmtU(upEf(mejor.p), u)}</small></span>
        <span class="n">${mejor.p.n}</span>
        ${(motivo || chequeDe(mejor.p) > 0) && html`<span class="tags">${motivo && html`<span class="tag">${mejor.p.mo}</span>`}${chequeDe(mejor.p) > 0 && html`<span class="tag">−${fmt(mejor.p.ch)} Cheque Crece</span>`}</span>`}
      </span>
    </button>
    ${resto.length > 0 && html`<ul class="rivales">${resto.map(f => {
      const d = upEf(f.p) - upEf(mejor.p);
      return html`<li key=${f.s}><button class="rival" onClick=${() => abrir(f.p)} aria-label=${`${C.tiendas[f.s]}: ${f.p.n}, ${fmtU(upEf(f.p), f.p.u)}`}>
        <${Logo} C=${C} s=${f.s} t=${36} />
        <span style=${{ minWidth: 0 }}><span class="n" style=${{ display: "block" }}>${f.p.n}${f.aprox ? " (similar)" : ""}</span>
          <span class="peq">${fmtU(upEf(f.p), f.p.u)}${d >= 0.005 && !AJ.saludable ? html` · <span class="dif">+${fmt(d)}/${UNID[f.p.u]} (+${Math.round(100 * d / upEf(mejor.p))} %)</span>` : d <= -0.005 ? ` · ${fmt(d)}/${UNID[f.p.u]}` : " · mismo precio por " + UNID[f.p.u]}${AJ.saludable && f.p.sa > 0 ? ` · ${f.p.mo}` : ""}</span></span>
        <span class="pu">${fmt(precioEf(f.p))}</span>
      </button></li>`;
    })}</ul>`}
    ${aviso}
    <button class="btn ancho" onClick=${() => poner(mejor.p, n + 1)}>${Icono.mas} ${n ? `Añadir otra (${n} en tu lista)` : `Añadir a la lista · ${fmt(precioEf(mejor.p))}`}</button>
    ${comp.refinar.length > 0 && html`<div style=${{ display: "grid", gap: 8 }}><p class="peq">Afina la búsqueda</p>
      <div class="chips">${comp.refinar.map(w => html`<button key=${w} class="chip" onClick=${() => refinar(q.trim() + " " + w, cat)}>${w}</button>`)}</div></div>`}
  </section>`;
}

function Resultados({ C, r, cantidadDe, poner, abrir }) {
  const [orden, setOrden] = useState("relevancia");
  const [tienda, setTienda] = useState(-1);
  const [ver, setVer] = useState(24);
  useEffect(() => setVer(24), [r, orden, tienda]);
  const lista = useMemo(() => {
    let l = r.res.filter(x => tienda < 0 || x.p.s === tienda);
    const pu = x => x.p.up == null ? Infinity : upEf(x.p);
    const sano = (a, b) => AJ.saludable ? b.p.sa - a.p.sa : 0;
    if (orden === "relevancia") l = [...l].sort((a, b) => a.nivel - b.nivel || a.p.gr - b.p.gr || sano(a, b) || a.extra - b.extra || pu(a) - pu(b));
    else if (orden === "sano") l = [...l].sort((a, b) => b.p.sa - a.p.sa || pu(a) - pu(b));
    else if (orden === "unidad") l = [...l].sort((a, b) => pu(a) - pu(b));
    else l = [...l].sort((a, b) => precioEf(a.p) - precioEf(b.p));
    return l;
  }, [r, orden, tienda, AJ]);
  // la etiqueta amarilla del lineal: el más barato por kg, L o unidad entre lo que se ve (en la unidad más común)
  const mejorPu = useMemo(() => {
    const veces = new Map();
    for (const x of lista) if (x.p.up != null && !x.p.gr) veces.set(x.p.u, (veces.get(x.p.u) || 0) + 1);
    const [u, n] = [...veces.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    if (!n || n < 3) return null;
    const cand = lista.filter(x => x.p.u === u && x.p.up != null && !x.p.gr), min = Math.min(...cand.map(x => upEf(x.p)));
    return new Set(cand.filter(x => upEf(x.p) <= min + 0.005).map(x => x.p.k));  // si empatan, todos
  }, [lista, AJ]);
  return html`<section class="seccion" aria-labelledby="res-tit">
    <div class="barra-res">
      <h2 class="h2" id="res-tit">${lista.length.toLocaleString("es-ES")} ${lista.length === 1 ? "producto" : "productos"}</h2>
      <label><span class="sr">Ordenar por</span>
        <select id="orden" name="orden" value=${orden} onChange=${e => setOrden(e.target.value)}>
          <option value="relevancia">Más relevantes</option><option value="unidad">Precio por kg o L</option>
          <option value="precio">Precio</option><option value="sano">Más saludables</option>
        </select></label>
    </div>
    <div class="chips" role="group" aria-label="Filtrar por supermercado">
      <button class="chip" aria-pressed=${tienda < 0} onClick=${() => setTienda(-1)}>Todos</button>
      ${C.vivas.map(s => [C.tiendas[s], s]).map(([t, s]) => html`<button key=${t} class="chip" aria-pressed=${tienda === s} onClick=${() => setTienda(s)}><${Logo} C=${null} s=${s} t=${20} /><span translate="no">${t}</span></button>`)}
    </div>
    <ul class="rejilla-prod">${lista.slice(0, ver).map(x => html`<${TarjetaProducto} key=${x.p.k} C=${C} p=${x.p} n=${cantidadDe(x.p.k)} poner=${poner} abrir=${abrir} aj=${AJ} mejor=${!!mejorPu && mejorPu.has(x.p.k)} />`)}</ul>
    ${ver < lista.length && html`<button class="btn sec ancho" onClick=${() => setVer(v => v + 36)}>Ver ${Math.min(36, lista.length - ver)} más</button>`}
  </section>`;
}

function fotosDe(C, tipos, n = 3) {
  const out = [];
  for (const ti of tipos) {
    const p = C.T[ti].prods.find(x => x.foto >= 0 && !x.gr);
    if (p) out.push(p);
    if (out.length === n) break;
  }
  return out;
}

function FilaTipo({ C, ti, irA }) {
  const t = C.T[ti];
  let m = null;
  for (const p of t.prods) if (p.up != null && !p.gr && (!m || mejorQue(p, m))) m = p;
  m = m || t.prods[0];
  const tiendas = [...new Set(t.prods.map(p => p.s))].sort();
  return html`<li class="fila sin-accion">
    <button class="abrir" onClick=${() => irA(t.etq, t.cat)} aria-label=${`Comparar ${t.etq}`}>
      <${Foto} C=${C} p=${m} t=${52} />
      <span class="info"><span class="n">${t.etq}</span>
        <span class="meta">${tiendas.map(s => html`<${Logo} key=${s} C=${C} s=${s} t=${18} />`)}<span>Mejor en ${C.tiendas[m.s]}</span></span></span>
      <span class="pu">${fmt(precioEf(m))}<small>${m.up != null ? fmtU(upEf(m), m.u) : "desde"}</small></span>
    </button></li>`;
}

function VistaSeccion({ C, sec, volver, irA }) {
  const [cat, setCat] = useState(-1);
  const [ver, setVer] = useState(40);
  useEffect(() => { setVer(40); window.scrollTo(0, 0); }, [cat]);
  const cats = C.catsPorSec[sec];
  const migas = html`<nav class="peq" aria-label="Estás en" style=${{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
    <button class="enlace-btn" onClick=${volver}>Inicio</button><span aria-hidden="true">›</span>
    ${cat < 0 ? html`<span aria-current="page">${C.secciones[sec]}</span>` : html`<button class="enlace-btn" onClick=${() => setCat(-1)}>${C.secciones[sec]}</button><span aria-hidden="true">›</span><span aria-current="page">${C.cats[cat].nombre}</span>`}</nav>`;
  if (cat < 0) return html`<section class="seccion" aria-labelledby="sec-tit">${migas}
    <h2 class="titulo-grande" id="sec-tit" style=${{ fontSize: 28 }}>${C.secciones[sec]}</h2>
    <div class="rejilla-sec">${cats.map(c => html`<button key=${c.i} class="sec-tile" onClick=${() => setCat(c.i)}>
      <span class="collage" aria-hidden="true">${fotosDe(C, c.tipos.length ? c.tipos : []).map(p => html`<${Foto} key=${p.k} C=${C} p=${p} t=${46} />`)}</span>
      <span><b>${c.nombre}</b><span class="peq" style=${{ display: "block" }}>${c.tipos.length ? `${c.tipos.length} comparativas` : `${c.n} productos`}</span></span></button>`)}</div>
  </section>`;
  const c = C.cats[cat];
  return html`<section class="seccion" aria-labelledby="cat-tit">${migas}
    <h2 class="titulo-grande" id="cat-tit" style=${{ fontSize: 28 }}>${c.nombre}</h2>
    ${c.tipos.length ? html`<p class="sub">${c.tipos.length} productos que puedes comparar en dos o más supermercados.</p>
      <ul class="filas tarjeta">${c.tipos.slice(0, ver).map(ti => html`<${FilaTipo} key=${ti} C=${C} ti=${ti} irA=${irA} />`)}</ul>
      ${ver < c.tipos.length && html`<button class="btn sec ancho" onClick=${() => setVer(v => v + 60)}>Ver más</button>`}`
    : html`<p class="sub">Ningún producto de esta categoría está a la vez en dos supermercados. Búscalo por su nombre para ver los ${c.n} que hay.</p>`}
  </section>`;
}

function Inicio({ C, irA, abrirSec }) {
  const secs = useMemo(() => C.secciones.map((n, i) => ({ n, i, fotos: fotosDe(C, C.tiposPorSec[i]) })).filter(x => C.catsPorSec[x.i].length), [C]);
  const basicos = useMemo(() => BASICOS.map(([texto, clave]) => {
    const c = C.cats.find(x => x.clave === clave);
    const r = buscar(C, texto);
    const p = r && r.res.find(x => x.p.foto >= 0 && (!c || x.p.cat === c.i) && x.nivel <= 1);
    return { texto, cat: c ? c.i : undefined, p: p && p.p };
  }), [C]);
  return html`<div>
    <section class="seccion" aria-labelledby="bas-tit">
      <h2 class="h2" id="bas-tit">Lo de siempre</h2>
      <div class="chips">${basicos.map(b => html`<button key=${b.texto} class="chip" style=${{ paddingLeft: b.p ? 5 : 14 }} onClick=${() => irA(b.texto, b.cat)}>
        ${b.p && html`<${Foto} C=${C} p=${b.p} t=${28} />`}${b.texto}</button>`)}</div>
    </section>
    <section class="seccion" aria-labelledby="secs-tit">
      <h2 class="h2" id="secs-tit">Secciones</h2>
      <div class="rejilla-sec">${secs.map(x => html`<button key=${x.n} class="sec-tile" onClick=${() => abrirSec(x.i)}>
        <span class="collage" aria-hidden="true">${x.fotos.map(p => html`<${Foto} key=${p.k} C=${C} p=${p} t=${46} />`)}</span>
        <span><b>${x.n}</b><span class="peq" style=${{ display: "block" }}>${C.tiposPorSec[x.i].length} comparativas</span></span></button>`)}</div>
    </section>
  </div>`;
}

function Buscar({ C, q, setQ, cantidadDe, poner, abrir, aj }) {
  const qd = useDeferredValue(q);
  const [sec, setSec] = useState(-1);
  const [catSel, setCatSel] = useState(null);
  const [grandes, setGrandes] = useState(false);
  const pendiente = useRef(null);
  const irA = useCallback((texto, cat) => { pendiente.current = cat ?? null; setQ(texto); window.scrollTo(0, 0); }, [setQ]);
  useEffect(() => { setCatSel(pendiente.current); pendiente.current = null; setGrandes(false); }, [qd]);
  useEffect(() => { if (q) setSec(-1); }, [q]);
  const r = useMemo(() => buscar(C, qd), [C, qd]);
  const opciones = useMemo(() => intencion(C, r), [C, r]);
  const cat = catSel !== null && (catSel === -1 || opciones.some(o => o.c === catSel)) ? catSel : (opciones[0] ? opciones[0].c : -1);
  const rc = useMemo(() => r && cat >= 0 ? { ...r, res: r.res.filter(x => x.p.cat === cat) } : r, [r, cat]);
  const comp = useMemo(() => comparar(C, rc, qd, { cat, grandes }), [C, rc, qd, cat, grandes, aj]);
  if (!qd.trim()) {
    if (sec >= 0) return html`<${VistaSeccion} C=${C} sec=${sec} volver=${() => setSec(-1)} irA=${irA} />`;
    return html`<${Inicio} C=${C} irA=${irA} abrirSec=${i => { setSec(i); window.scrollTo(0, 0); }} />`;
  }
  if (!r || !r.res.length) return html`<div class="vacio"><span class="icono-grande">${Icono.lupa}</span><h2 class="h2">Nada para «${qd}»</h2>
    <p>Prueba con menos palabras o con el nombre genérico del producto: «leche» en lugar de una marca.</p></div>`;
  return html`<div>
    ${r.sin && html`<p class="peq" role="status" style=${{ margin: "0 0 10px" }}>Nada con «${r.sin.join(" ")}»: se muestra lo que hay sin esa${r.sin.length > 1 ? "s palabras" : " palabra"}.</p>`}
    <${QueBuscas} C=${C} opciones=${opciones} cat=${cat} elegir=${setCatSel} />
    <div class="seccion" style=${{ marginTop: 14 }}><${Comparativa} C=${C} comp=${comp} cantidadDe=${cantidadDe} poner=${poner} abrir=${abrir} refinar=${irA} q=${qd}
      cat=${cat} grandes=${grandes} setGrandes=${setGrandes} /></div>
    <${Resultados} C=${C} r=${rc} cantidadDe=${cantidadDe} poner=${poner} abrir=${abrir} />
  </div>`;
}

