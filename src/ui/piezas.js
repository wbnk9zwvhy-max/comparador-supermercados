/* ------------------------------------------------------------------ piezas */
const LOGOS = ["logos/mercadona.png", "logos/consum.png", "logos/dia.png", "logos/lidl.png"];
const Logo = ({ C, s, t = 24 }) => html`<img class="logo" src=${LOGOS[s]} width=${t} height=${t} alt=${C ? C.tiendas[s] : ""} loading="lazy" decoding="async" />`;
const TiendaChip = ({ C, s, t = 18 }) => html`<span class="tienda-chip"><${Logo} C=${null} s=${s} t=${t} /><span translate="no">${C.tiendas[s]}</span></span>`;

const Foto = memo(function Foto({ C, p, t = 56, radio }) {
  if (!p || p.foto < 0) return html`<div class="foto vacia" style=${{ width: t, height: t }} aria-hidden="true">Sin foto</div>`;
  const porHoja = C.columnas * C.columnas, hoja = Math.floor(p.foto / porHoja), celda = p.foto % porHoja;
  const col = celda % C.columnas, fila = Math.floor(celda / C.columnas);
  return html`<div class="foto" role="img" aria-label=${p.n} style=${{
    width: t, height: t, borderRadius: radio, backgroundImage: `url(miniaturas/m${String(hoja).padStart(3, "0")}.webp)`,
    backgroundSize: `${C.columnas * t}px ${C.columnas * t}px`, backgroundPosition: `-${col * t}px -${fila * t}px` }}></div>`;
});

// etiquetas: más saludable (con su motivo), Cheque Crece y oferta pack
function Etiquetas({ p, todas = true }) {
  const t = [];
  if (p.a) t.push(html`<span key="o" class="tag oferta">Oferta</span>`);
  const nv = nivelDe(p);
  if (nv === 4) t.push(html`<span key="s" class="tag sano">${todas ? p.mo : "Natural"}</span>`);
  else if (AJ.saludable && nv === 0) t.push(html`<span key="s" class="tag ultra">Ultraprocesado</span>`);
  if (p.ch > 0) t.push(html`<span key="c" class="tag cheque">${AJ.socio ? "−" : "+"}${fmt(p.ch)} Cheque Crece</span>`);
  if (todas && p.pk) t.push(html`<span key="p" class="tag neutra">${p.pk[0]} × ${fmt(p.pk[1])}</span>`);
  if (todas && p.gr) t.push(html`<span key="g" class="tag neutra">Formato grande</span>`);
  return t.length ? html`<span class="tags">${t}</span>` : null;
}

/* «+» que se convierte en «− 1 +» al añadir */
function Cantidad({ n, mas, menos, nombre }) {
  if (!n) return html`<span class="cantidad sola"><button onClick=${mas} aria-label=${`Añadir ${nombre} a la lista`}>${Icono.mas}</button></span>`;
  return html`<span class="cantidad abierta" role="group" aria-label=${`Cantidad de ${nombre}`}>
    <button onClick=${menos} aria-label=${n === 1 ? `Quitar ${nombre} de la lista` : `Quitar una unidad de ${nombre}`}>${n === 1 ? Icono.papelera : Icono.menos}</button>
    <output aria-live="polite">${n}</output>
    <button onClick=${mas} aria-label=${`Añadir una unidad de ${nombre}`}>${Icono.mas}</button></span>`;
}

const TarjetaProducto = memo(function TarjetaProducto({ C, p, n, poner, abrir, mejor }) {
  const pu = upEf(p);
  return html`<li class=${"pcard" + (mejor ? " mejor-pu" : "")}>
    <button class="abrir" onClick=${() => abrir(p)} aria-label=${`${p.n}, ${C.tiendas[p.s]}, ${fmt(precioEf(p))}`}>
      <div class="imagen"><${Foto} C=${C} p=${p} t=${112} /><${Logo} C=${C} s=${p.s} t=${26} />${mejor && html`<span class="etq-mejor">Mejor €/${UNID[p.u]}</span>`}</div>
      <div style=${{ display: "grid", gap: 4, minWidth: 0 }}>
        <span class="precio">${fmt(precioEf(p))}${p.a ? html`<s>${fmt(p.a)}</s>` : ""}</span>
        <span class="pu-fila">${pu != null ? html`<span class="pu">${fmtU(pu, p.u)}</span>` : ""}</span>
        <span class="n">${p.n}</span>
        <${Etiquetas} p=${p} todas=${false} />
      </div>
    </button>
    <div class="accion"><${Cantidad} n=${n} nombre=${p.n} mas=${() => poner(p, n + 1)} menos=${() => poner(p, n - 1)} /></div>
  </li>`;
});

const FilaProducto = memo(function FilaProducto({ C, p, n, poner, abrir, extra }) {
  const pu = upEf(p);
  return html`<li class="fila">
    <button class="abrir" onClick=${() => abrir(p)} aria-label=${`${p.n}, ${C.tiendas[p.s]}, ${fmt(precioEf(p))}`}>
      <${Foto} C=${C} p=${p} t=${52} />
      <span class="info"><span class="n">${p.n}</span>
        <span class="meta"><${TiendaChip} C=${C} s=${p.s} t=${16} /></span>
        ${extra || html`<${Etiquetas} p=${p} />`}</span>
      <span class="pu">${fmt(precioEf(p))}${pu != null && html`<small>${fmtU(pu, p.u)}</small>`}</span>
    </button>
    <${Cantidad} n=${n} nombre=${p.n} mas=${() => poner(p, n + 1)} menos=${() => poner(p, n - 1)} />
  </li>`;
});

