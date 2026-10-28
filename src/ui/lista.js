/* ------------------------------------------------------------------ lista */
function ResumenPlan({ C, r, ir, compacto }) {
  const plan = r && r.plan;
  if (!plan) return null;
  return html`<button class="tarjeta" onClick=${() => ir("comprar")} style=${{ border: 0, textAlign: "left", width: "100%", padding: 16, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center" }}
    aria-label=${`Ver dónde comprar. Total ${fmt(plan.total)}`}>
    <span style=${{ display: "grid", gap: 6, minWidth: 0 }}>
      <span class="peq">${plan.usadas.length > 1 ? "Lo más barato, repartiendo" : "Lo más barato hoy"}${plan.gastos ? ", con envío" : ""}</span>
      <span style=${{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        ${plan.usadas.map(s => html`<${TiendaChip} key=${s} C=${C} s=${s} t=${22} />`)}</span>
    </span>
    <span style=${{ display: "flex", alignItems: "center", gap: 6 }}><span class="num" style=${{ font: `800 ${compacto ? 22 : 26}px/1 var(--display)` }}>${fmt(plan.total)}</span>${Icono.flecha}</span>
  </button>`;
}

function Lista({ C, estado, cambiar, abrir, ir, poner, r }) {
  const [vaciar, setVaciar] = useState(false);
  const items = estado.items;
  const pend = items.filter(it => !it.h).length;
  const fijar = (k, fn) => cambiar(e => ({ ...e, items: e.items.map(it => it.k === k ? fn(it) : it) }));
  if (!items.length) return html`<div class="vacio"><span class="icono-grande">${Icono.lista}</span><h2 class="h2">Tu lista está vacía</h2>
    <p>Busca un producto y pulsa + para añadirlo. Después verás en qué supermercado te sale más barata la compra.</p>
    <button class="btn" onClick=${() => ir("buscar")}>${Icono.lupa} Buscar productos</button></div>`;
  return html`<div>
    <section class="seccion" style=${{ marginTop: 14 }}><${ResumenPlan} C=${C} r=${r} ir=${ir} /></section>
    <section class="seccion" aria-labelledby="lista-tit">
      <div class="seccion-cab"><h2 class="h2" id="lista-tit">Productos</h2><span class="peq">${pend} de ${items.length} por coger</span></div>
      <ul class="filas tarjeta">${items.map(it => {
        const p = C.porClave.get(it.k);
        return html`<li key=${it.k} class="fila ${it.h ? "hecho" : ""}" style=${{ gridTemplateColumns: "auto minmax(0,1fr) auto" }}>
          <button class="check" aria-pressed=${!!it.h} aria-label=${it.h ? `Desmarcar ${it.n}` : `Marcar ${it.n} como cogido`} onClick=${() => fijar(it.k, x => ({ ...x, h: !x.h }))}>
            <span>${it.h ? Icono.ok : ""}</span></button>
          ${p ? html`<button class="abrir" style=${{ gridTemplateColumns: "48px minmax(0,1fr)" }} onClick=${() => abrir(p)} aria-label=${`Ver ${it.n}`}>
              <${Foto} C=${C} p=${p} t=${48} />
              <span class="info"><span class="n">${it.n}</span><span class="meta"><${TiendaChip} C=${C} s=${p.s} t=${16} /><span class="num">${fmt(precioEf(p))}</span></span></span></button>`
            : html`<span class="info"><span class="n">${it.n}</span><span class="peq">Ya no está a la venta</span></span>`}
          ${p ? html`<${Cantidad} n=${it.q} nombre=${it.n} mas=${() => poner(p, it.q + 1)} menos=${() => poner(p, it.q - 1)} />`
            : html`<button class="btn sec peq-btn" onClick=${() => cambiar(e => ({ ...e, items: e.items.filter(x => x.k !== it.k) }))}>Quitar</button>`}
        </li>`;
      })}</ul>
      <div style=${{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        ${items.some(it => it.h) && html`<button class="btn sec peq-btn" onClick=${() => cambiar(e => ({ ...e, items: e.items.filter(it => !it.h) }))}>Quitar lo cogido</button>`}
        ${!vaciar ? html`<button class="btn sec peq-btn" onClick=${() => setVaciar(true)}>Vaciar lista</button>`
          : html`<span class="tarjeta" role="alertdialog" aria-label="Confirmar" style=${{ display: "flex", gap: 8, alignItems: "center", padding: "6px 6px 6px 14px", flexWrap: "wrap" }}>
              <span class="peq">¿Vaciar los ${items.length} productos?</span>
              <button class="btn peq-btn" onClick=${() => { cambiar(e => ({ ...e, items: [] })); setVaciar(false); }}>Vaciar</button>
              <button class="btn sec peq-btn" onClick=${() => setVaciar(false)}>Cancelar</button></span>`}
      </div>
    </section>
  </div>`;
}

