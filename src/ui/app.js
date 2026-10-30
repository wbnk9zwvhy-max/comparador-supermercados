/* ------------------------------------------------------------------ app */
const VISTAS = ["buscar", "lista", "comprar", "ajustes"];
const NAV = [["buscar", "Buscar", "inicio"], ["lista", "Mi lista", "lista"], ["comprar", "Comprar", "carro"], ["ajustes", "Ajustes", "ajustes"]];
const TITULOS = { buscar: "¿Qué compramos hoy?", lista: "Mi lista", comprar: "Dónde comprar", ajustes: "Ajustes" };

function PanelCompra({ C, estado, r, poner, abrir, ir }) {
  const items = estado.items;
  return html`<aside class="panel" aria-labelledby="panel-tit"><div class="panel-in">
    <div class="seccion-cab"><h2 class="h3" id="panel-tit">Tu compra</h2><span class="peq">${items.length} ${items.length === 1 ? "producto" : "productos"}</span></div>
    ${!items.length ? html`<p class="peq">Pulsa + en cualquier producto y aquí verás tu lista y dónde te sale más barata.</p>` : html`
      <${ResumenPlan} C=${C} r=${r} ir=${ir} compacto=${true} />
      <ul class="filas">${items.slice(0, 30).map(it => {
        const p = C.porClave.get(it.k);
        if (!p) return null;
        return html`<li key=${it.k} class="fila"><button class="abrir" onClick=${() => abrir(p)} aria-label=${`Ver ${p.n}`}>
          <${Foto} C=${C} p=${p} t=${44} /><span class="info"><span class="n" style=${{ fontSize: 14 }}>${p.n}</span>
          <span class="meta"><${Logo} C=${C} s=${p.s} t=${16} /><span class="num">${fmt(precioEf(p))}</span></span></span></button>
          <${Cantidad} n=${it.q} nombre=${p.n} mas=${() => poner(p, it.q + 1)} menos=${() => poner(p, it.q - 1)} /></li>`;
      })}</ul>
      <button class="btn ancho" onClick=${() => ir("comprar")}>${Icono.carro} Ver dónde comprar</button>`}
  </div></aside>`;
}

function App() {
  const [C, setC] = useState(null);
  const [error, setError] = useState(false);
  const [vista, setVista] = useState(() => VISTAS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "buscar");
  const [q, setQ] = useState("");
  const [det, setDet] = useState(null);
  const [aviso, setAviso] = useState(null); // { texto, deshacer }
  const [estado, cambiar, sync] = useEstado();
  const aj = useMemo(() => mezclarAjustes(estado.ajustes), [estado.ajustes]);
  AJ = aj;

  useEffect(() => {
    fetch("catalogo.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => setC(preparar(d))).catch(() => setError(true));
    const h = () => { const v = location.hash.slice(1); if (VISTAS.includes(v)) setVista(v); };
    addEventListener("hashchange", h);
    return () => removeEventListener("hashchange", h);
  }, []);
  const ir = useCallback(v => { setVista(v); setDet(null); try { history.replaceState(null, "", "#" + v); } catch (e) {} window.scrollTo(0, 0); }, []);
  const cantidades = useMemo(() => new Map(estado.items.map(it => [it.k, it.q])), [estado.items]);
  const cantidadDe = useCallback(k => cantidades.get(k) || 0, [cantidades]);
  const avisar = useCallback((texto, deshacer) => setAviso({ texto, deshacer, id: Date.now() }), []);
  // fija la cantidad de un producto en la lista (0 lo quita, con opción de deshacer)
  const poner = useCallback((p, n) => {
    let previo = null;
    cambiar(e => {
      const ya = e.items.find(it => it.k === p.k);
      previo = e.items;
      if (n <= 0) return { ...e, items: e.items.filter(it => it.k !== p.k) };
      if (ya) return { ...e, items: e.items.map(it => it.k === p.k ? { ...it, q: n, h: false } : it) };
      return { ...e, items: [...e.items, { k: p.k, n: p.n, q: n, h: false }] };
    });
    if (n <= 0) avisar(`Quitado: ${p.n}`, () => cambiar(e => ({ ...e, items: previo })));
    else if (!cantidades.get(p.k)) avisar(`Añadido: ${p.n}`);
  }, [cambiar, avisar, cantidades]);
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(null), aviso.deshacer ? 4500 : 2200); return () => clearTimeout(t); }, [aviso]);

  const activas = useMemo(() => new Set(estado.activas.filter(s => !C || C.vivas.includes(s))), [estado.activas, C]);
  const plan = useMemo(() => C ? planificar(C, estado.items, activas, estado.max, !!estado.envio) : null, [C, estado.items, activas, estado.max, estado.envio, aj]);
  const otro = useMemo(() => C && vista === "comprar" ? planificar(C, estado.items, activas, 4, !estado.envio) : null, [C, estado.items, activas, estado.envio, aj, vista]);

  const fecha = C ? new Date(C.fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : null;
  const pend = estado.items.length;
  const verBarra = C && pend > 0 && vista !== "comprar" && !det && plan && plan.plan;
  const navBoton = (v, t, ic, cls) => html`<button key=${v} class=${cls} aria-current=${vista === v ? "page" : undefined} onClick=${() => ir(v)}>${Icono[ic]}<span>${t}</span>
    ${v === "lista" && pend > 0 && html`<span class="badge" aria-label=${`${pend} productos`}>${pend}</span>`}</button>`;
  return html`<${React.Fragment}>
    <a class="salto" href="#contenido">Saltar al contenido</a>
    <div class="marco">
      <nav class="lateral" aria-label="Secciones de la app">
        <div class="marca-lat"><span class="marca-icono">${Icono.etiqueta}</span><b>Comparador de supermercados</b></div>
        ${NAV.map(([v, t, ic]) => navBoton(v, t, ic, "nav-lat"))}
        <div class="pie">
          <div class="super-fila">${(C ? C.vivas : [0, 1, 2, 3]).map(s => html`<${Logo} key=${s} C=${C} s=${s} t=${30} />`)}</div>
          <p class="peq">${C ? `Precios del ${fecha}` : "Cargando precios…"}</p>
          <p class="peq">${sync === "nube" ? "Tu lista se guarda en tu cuenta" : "Tu lista se guarda en este dispositivo"}</p>
        </div>
      </nav>
      <div class="centro">
        <header class="cab">
          <h1 class="titulo-grande">${TITULOS[vista]}</h1>
          ${vista === "buscar" && html`<p class="sub">${C ? html`${C.P.length.toLocaleString("es-ES")} productos · precios del ${fecha}` : error ? "No se han podido cargar los precios" : "Cargando precios…"}</p>`}
        </header>
        ${vista === "buscar" && html`<div class="buscador-wrap"><div class="buscador" role="search">
          <span class="lupa">${Icono.lupa}</span>
          <label for="q" class="sr">Buscar productos</label>
          <input id="q" name="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="Leche, pavo, huevos…"
            value=${q} onChange=${e => setQ(e.target.value)} />
          ${q && html`<button class="borrar" aria-label="Borrar búsqueda" onClick=${() => { setQ(""); document.getElementById("q")?.focus(); }}>${Icono.x}</button>`}
        </div></div>`}
        <main id="contenido">
          ${error ? html`<div class="vacio"><h2 class="h2">No se han podido cargar los precios</h2><p>Comprueba tu conexión y vuelve a abrir la app.</p></div>`
            : !C ? html`<div class="seccion" aria-busy="true" aria-label="Cargando precios…"><div class="esq" style=${{ height: 44 }}></div><div class="rejilla-sec">${[1, 2, 3, 4, 5, 6].map(i => html`<div key=${i} class="esq" style=${{ height: 132 }}></div>`)}</div></div>`
            : vista === "buscar" ? html`<${Buscar} C=${C} q=${q} setQ=${setQ} cantidadDe=${cantidadDe} poner=${poner} abrir=${setDet} aj=${aj} />`
            : vista === "lista" ? html`<${Lista} C=${C} estado=${estado} cambiar=${cambiar} abrir=${setDet} ir=${ir} poner=${poner} r=${plan} />`
            : vista === "comprar" ? html`<${Comprar} C=${C} estado=${estado} cambiar=${cambiar} abrir=${setDet} ir=${ir} avisar=${avisar} r=${plan} otro=${otro} />`
            : html`<${Ajustes} C=${C} estado=${estado} cambiar=${cambiar} />`}
        </main>
      </div>
      ${C && html`<${PanelCompra} C=${C} estado=${estado} r=${plan} poner=${poner} abrir=${setDet} ir=${ir} />`}
    </div>
    ${verBarra && html`<button class="barra-compra" onClick=${() => ir("comprar")} aria-label=${`Ver dónde comprar tus ${pend} productos: desde ${fmt(plan.plan.total)}`}>
      <span class="bolsa">${pend}</span>
      <span style=${{ minWidth: 0 }}><span class="t1" style=${{ display: "block" }}>Desde ${fmt(plan.plan.total)}</span>
        <span class="t2">${plan.plan.usadas.map(s => html`<${Logo} key=${s} C=${null} s=${s} t=${16} />`)}${plan.plan.usadas.length > 1 ? "repartiendo la compra" : "en un solo súper"}</span></span>
      <span class="ir">Ver${Icono.flecha}</span>
    </button>`}
    <nav class="tabbar" aria-label="Secciones de la app"><div class="tabbar-in">${NAV.map(([v, t, ic]) => navBoton(v, t, ic, "tab"))}</div></nav>
    ${det && C && html`<${Detalle} C=${C} p=${det} cerrar=${() => setDet(null)} poner=${poner} cantidadDe=${cantidadDe} abrir=${setDet} />`}
    <div class="sr" aria-live="polite">${aviso ? aviso.texto : ""}</div>
    ${aviso && html`<div class=${"toast" + (verBarra ? "" : " sin-barra")} key=${aviso.id}><span aria-hidden="true">${aviso.texto}</span>
      ${aviso.deshacer && html`<button onClick=${() => { aviso.deshacer(); setAviso(null); }}>Deshacer</button>`}</div>`}
  </${React.Fragment}>`;
}

ReactDOM.createRoot(document.getElementById("app")).render(html`<${App} />`);
