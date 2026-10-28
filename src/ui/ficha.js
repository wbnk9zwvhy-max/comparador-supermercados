/* ------------------------------------------------------------------ ingredientes y naturalidad */
const TROZOS = new Map();
function useIngredientes(C, p) {
  const [d, setD] = useState(undefined);
  useEffect(() => {
    let vivo = true;
    const n = C.trozos_ingredientes;
    if (!n) { setD(null); return; }
    let h = 0;
    for (const ch of p.k) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
    const j = h % n, url = `ingredientes/i${String(j).padStart(2, "0")}.json`;
    if (!TROZOS.has(j)) TROZOS.set(j, fetch(url).then(r => r.ok ? r.json() : {}).catch(() => { TROZOS.delete(j); return {}; }));
    setD(undefined);
    TROZOS.get(j).then(t => { if (vivo) setD(t[p.k] || null); });
    return () => { vivo = false; };
  }, [p.k]);
  return d;
}
// resalta en la lista de ingredientes los aditivos y los ingredientes de ultraprocesado
const RX_MARCA = /\b(e ?-?\d{3,4}[a-z]?|aromas?|colorantes?|edulcorantes?|sucralosa|acesulfamo?( k)?|aspartamo?|emulgentes?|emulsionantes?|lecitinas?|espesantes?|gelificantes?|estabilizantes?(?! \(?cloruro)|estabilizadores?(?! \(?cloruro)|almid[oó]n(es)? modificados?|jarabe de [a-záéíóú ]+?(?=[,.(]|$)|dextrosa|maltodextrina|conservadores?|conservantes?|antioxidantes?|corrector(es)? de (la )?acidez|regulador(es)? de (la )?acidez|acidulantes?|sorbato [a-z]+|benzoato [a-z]+|nitrito [a-z]+|nitrato [a-z]+|ascorbato [a-z]+|polifosfatos?|difosfatos?|trifosfatos?|fosfatos?|sales de fundido|glutamato [a-z]+|potenciador(es)? del sabor|carragen[a-z]+|goma [a-z]+|aceite de palma|palmiste|grasas? vegetal(es)?|hidrogenad[ao]s?|margarina|caseinato [a-z]+|prote[ií]na [a-z]+ (aislada|hidrolizada)|antiaglomerantes?|gasificantes?|humectantes?)\b/gi;
function Resaltado({ texto }) {
  const partes = [];
  let ult = 0, m;
  RX_MARCA.lastIndex = 0;
  while ((m = RX_MARCA.exec(texto))) {
    if (m.index > ult) partes.push(texto.slice(ult, m.index));
    partes.push(html`<mark key=${m.index}>${m[0]}</mark>`);
    ult = m.index + m[0].length;
  }
  partes.push(texto.slice(ult));
  return partes;
}
function Nivel({ p }) {
  const nv = nivelDe(p);
  return html`<span class=${"nivel" + (nv <= 1 ? " bajo" : "")} role="img" aria-label=${`Nivel ${nv + 1} de 5`}>
    ${[0, 1, 2, 3, 4].map(i => html`<i key=${i} class=${i <= nv ? "on" : ""}></i>`)}</span>`;
}
function Naturalidad({ C, p }) {
  const d = useIngredientes(C, p);
  const [abierto, setAbierto] = useState(false);
  const nv = nivelDe(p);
  const titulo = sinDatos(p) ? "Sin datos de ingredientes" : NIVELES[nv];
  return html`<section class="tarjeta natural" aria-labelledby="nat-tit">
    <div class="cab-nat"><h3 class="h3" id="nat-tit">${titulo}</h3>${!sinDatos(p) && html`<${Nivel} p=${p} />`}</div>
    <p class="peq">${sinDatos(p) ? (p.s === 3 ? "LIDL no publica sus ingredientes y este producto no está en Open Food Facts." : "Ni la tienda ni Open Food Facts publican sus ingredientes, y no se han podido leer en las fotos del envase.") + " En el modo saludable va por detrás de lo que se sabe que es natural o poco procesado." : p.mo}</p>
    ${d && d[0] && html`<p class="ingr"><b>Ingredientes${d[5] === "ocr" ? " (leídos de la foto del envase)" : d[5] === "off" ? " (de Open Food Facts)" : ""}: </b><${Resaltado} texto=${d[0]} /></p>`}
    ${d && (d[1].length > 0 || d[2].length > 0) && html`<p class="peq">${d[1].length ? `Propio de ultraprocesados: ${d[1].join(", ")}. ` : ""}${d[2].length ? `Para conservarlo: ${d[2].join(", ")}.` : ""}</p>`}
    <button class="enlace-btn" aria-expanded=${abierto} onClick=${() => setAbierto(!abierto)} style=${{ justifySelf: "start" }}>${abierto ? "Ocultar el criterio" : "¿Cómo se decide qué es más sano?"}</button>
    ${abierto && html`<${Criterio} />`}
  </section>`;
}
function Criterio() {
  return html`<div style=${{ display: "grid", gap: 8 }}>
    <p class="peq">Más sano es lo más natural, no lo que tiene menos calorías. Leemos la lista de ingredientes de cada producto y contamos los aditivos y los ingredientes propios de los ultraprocesados. Un queso de «leche, fermentos, sal y cuajo» va por delante de uno «light» con almidón, conservantes y aromas.</p>
    <ol class="criterio">
      <li><b>Natural:</b> sin aditivos y con pocos ingredientes, o un alimento fresco sin procesar.</li>
      <li><b>Sin aditivos:</b> sin aditivos, pero con más ingredientes o con azúcar añadido.</li>
      <li><b>Poco procesado:</b> lleva un aditivo para conservarlo (conservante, antioxidante o corrector de acidez).</li>
      <li><b>Con aditivos:</b> varios aditivos de conservación o un ingrediente de ultraprocesado.</li>
      <li><b>Ultraprocesado:</b> dos o más ingredientes de ultraprocesado: aromas, colorantes, edulcorantes, emulgentes, espesantes, almidones modificados, jarabes de glucosa, grasas vegetales refinadas, proteínas aisladas…</li>
    </ol>
    <p class="peq">Entre dos igual de naturales gana el ecológico, el de huevos camperos, el de más % de carne o el integral, y después el más barato. El ácido cítrico, la vitamina C, los fermentos y el cuajo no restan. Los ingredientes salen de las webs de Mercadona y DIA, de Open Food Facts (Consum y LIDL, por su código de barras) y, si no están en ninguna parte, se leen de la foto de la parte de atrás del envase. Lo que no tiene datos de ingredientes va por detrás de lo que se sabe que es natural o poco procesado.</p>
  </div>`;
}

/* ------------------------------------------------------------------ ficha de producto */
function Detalle({ C, p, cerrar, poner, cantidadDe, abrir }) {
  const ref = useRef(null), antes = useRef(document.activeElement);
  useEffect(() => {
    const prev = antes.current;
    ref.current && ref.current.focus();
    const tecla = e => {
      if (e.key === "Escape") cerrar();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll("button, a[href], select, input");
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", tecla);
    const ov = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", tecla); document.body.style.overflow = ov; prev && prev.focus && prev.focus(); };
  }, [p]);
  const iguales = p.g >= 0 ? (C.porGrupo.get(p.g) || []).filter(x => x.k !== p.k).sort((a, b) => precioEf(a) - precioEf(b)) : [];
  const otras = [];
  for (let s = 0; s < C.tiendas.length; s++) {
    if (s === p.s || iguales.some(x => x.s === s)) continue;
    const e = equivalente(C, p, s, 1);
    if (e && e.como !== "igual") otras.push(e);
  }
  otras.sort((a, b) => a.coste - b.coste);
  const n = cantidadDe(p.k);
  const dominio = p.url ? new URL(p.url).hostname.replace(/^www\./, "") : null;
  return html`<div>
    <div class="velo" onClick=${cerrar}></div>
    <div class="hoja" role="dialog" aria-modal="true" aria-labelledby="det-tit" ref=${ref} tabindex="-1">
      <div class="hoja-in">
        <div class="asa" aria-hidden="true"></div>
        <div class="det-foto"><${Foto} C=${C} p=${p} t=${112} /><${Logo} C=${C} s=${p.s} t=${32} />
          <button class="cerrar" onClick=${cerrar} aria-label="Cerrar">${Icono.x}</button></div>
        <div style=${{ display: "grid", gap: 6 }}>
          <p class="peq">${C.secciones[p.sec]}${C.cats[p.cat] ? ` › ${C.cats[p.cat].nombre}` : ""}</p>
          <h2 class="h2" id="det-tit">${p.n}</h2>
          ${p.b && !norm(p.n).includes(norm(p.b)) && html`<p class="peq">${p.b}</p>`}
        </div>
        <div class="precio-grande"><b>${fmt(precioEf(p))}</b>${p.up != null && html`<span class="sub num">${fmtU(upEf(p), p.u)}</span>`}
          ${p.a ? html`<span class="peq">antes <s>${fmt(p.a)}</s></span>` : ""}</div>
        <${Etiquetas} p=${p} />
        ${p.mo && html`<${Naturalidad} C=${C} p=${p} />`}
        ${p.ch > 0 && html`<p class="peq">Acumulas ${fmt(p.ch)} en tu Cheque Crece por cada unidad${AJ.socio ? `: con eso te sale a ${fmt(precioEf(p))}` : " si eres socio de Consum"}.</p>`}
        ${p.pk ? html`<p class="peq">Comprando ${p.pk[0]}, cada uno sale a ${fmt(p.pk[1])}.</p>` : ""}
        <div style=${{ display: "grid", gap: 10 }}>
          ${n ? html`<div style=${{ display: "flex", gap: 12, alignItems: "center" }}><${Cantidad} n=${n} nombre=${p.n} mas=${() => poner(p, n + 1)} menos=${() => poner(p, n - 1)} />
              <span class="peq">${n === 1 ? "En tu lista" : `${n} en tu lista`}</span></div>`
            : html`<button class="btn ancho" onClick=${() => poner(p, 1)}>${Icono.mas} Añadir a la lista</button>`}
          ${p.url && html`<a class="btn sec ancho" href=${p.url} target="_blank" rel="noopener" style=${{ textDecoration: "none" }}>Ver en ${dominio}</a>`}
        </div>
        ${iguales.length > 0 && html`<section style=${{ display: "grid", gap: 10 }}><h3 class="h3">El mismo producto en otros súper</h3>
          <ul class="filas tarjeta">${iguales.map(x => html`<${FilaProducto} key=${x.k} C=${C} p=${x} n=${cantidadDe(x.k)} poner=${poner} abrir=${abrir} aj=${AJ} />`)}</ul></section>`}
        ${otras.length > 0 && html`<section style=${{ display: "grid", gap: 10 }}><h3 class="h3">Alternativas en otros súper</h3>
          <p class="peq">Lo ${AJ.saludable ? "más natural y barato" : "más barato"} del mismo tipo, para la misma cantidad. Si una tienda no lo tiene, lo más parecido que vende.</p>
          <ul class="filas tarjeta">${otras.map(e => html`<${FilaProducto} key=${e.p.k} C=${C} p=${e.p} n=${cantidadDe(e.p.k)} poner=${poner} abrir=${abrir} aj=${AJ}
            extra=${html`<span class="peq">${e.n > 1 ? `${e.n} × para la misma cantidad · ` : ""}${fmt(e.coste)}${e.menosNatural ? " · menos natural" : ""}${e.estimada ? " · cantidad aproximada" : ""}${e.como === "parecido" ? " · parecido" : e.como === "equivalente" ? " · lo mismo con otro nombre" : e.como === "sustituto" ? " · sustituto: no hay uno igual" : ""}</span>`} />`)}</ul></section>`}
      </div>
    </div>
  </div>`;
}

