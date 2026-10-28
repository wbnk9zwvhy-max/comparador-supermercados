/* ------------------------------------------------------------------ llenar el carrito del súper */
// Código del marcador «Llenar carrito» (fuente legible en scripts/marcador.js). Se ejecuta en la web del súper, con la sesión
// de quien lo usa, y añade a su carrito la cesta que esta app pone en la dirección (#comparador=...).
const MARCADOR = "javascript:" + encodeURIComponent(/*MARCADOR*/);
const WEB_SUPER = ["https://tienda.mercadona.es/", "https://tienda.consum.es/es", "https://www.dia.es/"];
const COD_SUPER = ["m", "c", "d"];
const b64url = t => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function codigoCesta(s, filas) {
  const l = filas.map(f => {
    const p = f.e.p, code = s === 1 && p.url ? (p.url.match(/\/(\d+)\/?$/) || [])[1] : undefined;
    return code ? [p.id, f.e.n, code] : [p.id, f.e.n];
  });
  return b64url(JSON.stringify({ s: COD_SUPER[s], l }));
}
const enlaceCesta = (s, filas) => WEB_SUPER[s] + "#comparador=" + codigoCesta(s, filas);

function Marcador({ compacto }) {
  const ref = useRef(null);
  const [copiado, setCopiado] = useState(false);
  useEffect(() => { if (ref.current) ref.current.setAttribute("href", MARCADOR); }, []);
  const copiar = async () => { try { await navigator.clipboard.writeText(MARCADOR); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch (e) { setCopiado(null); } };
  return html`<div style=${{ display: "grid", gap: 10 }}>
    ${!compacto && html`<p class="peq">Los súper no dejan que otra web llene su carrito, pero sí un marcador de tu navegador: lo pulsas estando en su web, con tu sesión, y añade toda la cesta de golpe. Se instala una sola vez y vale para Mercadona, Consum y DIA. Lo que añade es lo mismo que verás luego en su app, porque el carrito va con tu cuenta.</p>`}
    <ol class="criterio">
      <li><b>Copia el marcador:</b> <button class="enlace-btn" onClick=${copiar}>${copiado ? "¡Copiado!" : copiado === null ? "No se pudo copiar: mantén pulsado el enlace de abajo" : "Copiar marcador"}</button></li>
      <li><b>iPhone (Safari):</b> abre cualquier web, pulsa Compartir → «Añadir marcador», ponle de nombre <b>Llenar carrito</b> y guárdalo. Después ve a Marcadores, pulsa «Editar», toca el marcador y cambia su dirección pegando lo que copiaste.</li>
      <li><b>Ordenador:</b> arrastra este enlace a la barra de marcadores: <a ref=${ref} class="enlace" onClick=${e => { e.preventDefault(); copiar(); }}>Llenar carrito</a></li>
      <li><b>Para usarlo:</b> en la cesta pulsa «Llenar carrito en…»; se abre la web del súper; ahí abre Marcadores y toca «Llenar carrito». Si no has iniciado sesión, lo deja en el carrito de invitado y lo conservas al identificarte.</li>
    </ol>
  </div>`;
}

function GrupoTienda({ C, g, plan, envio, abrir, copiar }) {
  const [web, setWeb] = useState(false);
  const [ayuda, setAyuda] = useState(false);
  const e = AJ.envios[g.s];
  const sub = plan.sub[g.s] || 0;
  const gasto = envio ? plan.envios[g.s] : null;
  const falta = envio && e.umbral && sub < e.umbral ? r2(e.umbral - sub) : 0;
  const corto = envio && plan.cortos.includes(g.s);
  const texto = g.filas.map(f => `${f.e.n > 1 ? f.e.n + " × " : ""}${f.e.p.n}`).join("\n");
  return html`<div class="tarjeta grupo">
    <div class="grupo-cab"><${Logo} C=${C} s=${g.s} t=${36} />
      <span style=${{ minWidth: 0 }}><span class="h3" translate="no">${C.tiendas[g.s]}</span><span class="peq" style=${{ display: "block" }}>${g.filas.length} ${g.filas.length === 1 ? "producto" : "productos"}</span></span>
      <span class="subtotal">${fmt(r2(sub + (gasto || 0)))}</span></div>
    ${g.filas.map(f => html`<div key=${f.o.it.k} class="linea">
      <button style=${{ all: "unset", cursor: "pointer", borderRadius: 12 }} onClick=${() => abrir(f.e.p)} aria-label=${`Ver ${f.e.p.n}`}><${Foto} C=${C} p=${f.e.p} t=${44} /></button>
      <div style=${{ minWidth: 0 }}><div>${f.e.n > 1 ? `${f.e.n} × ` : ""}${f.e.p.n}</div>
        ${f.e.menosNatural && html`<div class="eq aviso">Menos natural que el que elegiste (${f.o.p.mo || NIVELES[nivelDe(f.o.p)]} → ${f.e.p.mo || NIVELES[nivelDe(f.e.p)]}): ${C.tiendas[g.s]} no tiene nada igual de natural</div>`}
        ${f.e.como === "sustituto" ? html`<div class="eq aviso">Sustituto: ${C.tiendas[g.s]} no tiene «${f.o.it.n}» ni uno del mismo tipo; es lo más parecido</div>`
          : f.e.como !== "igual" && html`<div class="eq">En lugar de ${f.o.it.n}${f.e.como === "parecido" ? " (parecido)" : f.e.como === "equivalente" ? ": aquí se llama así" : ""}</div>`}
        ${f.e.estimada && html`<div class="eq">Cantidad aproximada: «${f.o.it.n}» no dice cuánto trae, se ha calculado por su precio</div>`}
        ${g.s !== f.o.p.s && f.o.por[f.o.p.s] && f.o.por[f.o.p.s].coste - f.e.coste >= 0.01 && html`<div class="eq">Ahorras ${fmt(r2(f.o.por[f.o.p.s].coste - f.e.coste))} frente a comprarlo en ${C.tiendas[f.o.p.s]}</div>`}
        ${chequeDe(f.e.p) > 0 && html`<div class="eq">Incluye ${fmt(r2(chequeDe(f.e.p) * f.e.n))} de Cheque Crece</div>`}</div>
      <span class="num" style=${{ fontWeight: 600 }}>${fmt(f.e.coste)}</span></div>`)}
    ${envio && html`<div class="linea"><span></span><div>
        <div>${gasto ? "Gastos de envío" : "Envío gratis"}</div>
        ${falta > 0 && html`<div class="eq">Añade ${fmt(falta)} más y el envío ${e.costeSobre ? `baja a ${fmt(e.costeSobre)}` : "es gratis"}</div>`}
        ${corto && html`<div class="eq aviso">Pedido mínimo de ${fmt(e.minimo)}: faltan ${fmt(r2(e.minimo - sub))}</div>`}</div>
      <span class="num" style=${{ fontWeight: 600 }}>${gasto ? fmt(gasto) : fmt(0)}</span></div>`}
    ${g.s <= 2 && html`<div class="llenar">
      <a class="btn ancho" href=${enlaceCesta(g.s, g.filas)} target="_blank" rel="noopener" style=${{ textDecoration: "none" }}>${Icono.carro} Llenar carrito en ${C.tiendas[g.s]}</a>
      <p class="peq">Se abre su web: toca tu marcador «Llenar carrito» y se añade todo. <button class="enlace-btn" aria-expanded=${ayuda} onClick=${() => setAyuda(!ayuda)}>${ayuda ? "Ocultar" : "¿Primera vez?"}</button>
        <button class="enlace-btn" onClick=${() => copiar(enlaceCesta(g.s, g.filas), "la cesta")}>Copiar código</button></p>
      ${ayuda && html`<${Marcador} compacto=${true} />`}
    </div>`}
    <div class="grupo-pie">
      <button class="enlace-btn" aria-expanded=${web} onClick=${() => setWeb(!web)}>${web ? "Ocultar enlaces" : `Producto a producto en ${C.tiendas[g.s]}`}</button>
      <button class="enlace-btn" onClick=${() => copiar(texto, C.tiendas[g.s])}>Copiar lista</button>
    </div>
    ${web && html`<div class="web-lista">
      <p class="peq">Abre cada producto en la web de ${C.tiendas[g.s]} y añádelo a su carrito.${g.s === 3 ? " LIDL no vende alimentación online: llévate la lista a la tienda." : ""}</p>
      <ol>${g.filas.map(f => html`<li key=${f.o.it.k}>${f.e.p.url ? html`<a class="enlace" href=${f.e.p.url} target="_blank" rel="noopener">${f.e.n > 1 ? `${f.e.n} × ` : ""}${f.e.p.n}</a>` : f.e.p.n}</li>`)}</ol>
    </div>`}
  </div>`;
}

/* Formas de hacer la compra, de más barata a más cara: en uno, dos o los súper que haga falta, en tienda o con envío */
function Escenarios({ C, r, otro, estado, cambiar }) {
  if (!r || !r.porMax) return null;
  const nombre = x => x.usadas.map(s => C.tiendas[s]).join(" + ");
  const filas = [], vistos = new Set();
  const poner = (x, envio, max) => {
    if (!x || !x.usadas.length) return;
    const clave = (envio ? "e" : "t") + x.usadas.join(",");
    if (vistos.has(clave)) return;
    vistos.add(clave);
    filas.push({ x, envio, max, clave });
  };
  for (const [envio, plan] of [[r.envio, r], [!r.envio, otro]]) {
    if (!plan || !plan.porMax) continue;
    for (const k of [1, 2, 4]) poner(plan.porMax[k], envio, k);
  }
  if (filas.length < 2) return null;
  const completas = filas.filter(f => !f.x.faltan.length && !f.x.cortos.length);
  const base = completas.length ? completas : filas;
  base.sort((a, b) => a.x.total - b.x.total);
  const mas = base[0];
  const actual = filas.find(f => f.envio === r.envio && f.x === r.plan) || null;
  const lista = base.slice(0, 6);
  return html`<section class="seccion" aria-labelledby="esc-tit">
    <div class="seccion-cab"><h2 class="h2" id="esc-tit">Todas las formas de comprarlo</h2></div>
    <p class="peq">Calculado con tu lista entera: los mismos productos (o su equivalente más barato) en cada caso${r.envio || otro ? ", con y sin envío a casa" : ""}. Pulsa una opción para elegirla.</p>
    <ul class="escenarios tarjeta">${lista.map(f => {
      const elegido = actual && f.clave === actual.clave;
      return html`<li key=${f.clave} class=${f === mas ? "mejor" : ""}><button aria-pressed=${!!elegido}
          onClick=${() => cambiar(e => ({ ...e, envio: f.envio, max: f.max, activas: [...new Set([...e.activas, ...f.x.usadas])].sort() }))}>
        <span style=${{ minWidth: 0, display: "grid", gap: 3 }}>
          <span style=${{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontWeight: 600 }}>${f.x.usadas.map(s => html`<${Logo} key=${s} C=${C} s=${s} t=${18} />`)}<span translate="no">${nombre(f.x)}</span></span>
          <span class="peq">${f.envio ? `A domicilio · ${f.x.gastos ? fmt(f.x.gastos) + " de envío" : "envío gratis"}` : "Yendo a la tienda"}${f.x.sustitutos ? ` · ${f.x.sustitutos} sustituto${f.x.sustitutos > 1 ? "s" : ""}` : ""}${f.x.faltan.length ? ` · faltan ${f.x.faltan.length}` : ""}${f.x.cortos.length ? " · no llega al pedido mínimo" : ""}${elegido ? " · lo que ves arriba" : ""}</span>
        </span>
        <span class="cifra">${fmt(f.x.total)}</span></button></li>`;
    })}</ul>
  </section>`;
}

function Comprar({ C, estado, cambiar, abrir, ir, avisar, r, otro }) {
  const activas = useMemo(() => new Set(estado.activas), [estado.activas]);
  const envio = !!estado.envio;
  if (!estado.items.length) return html`<div class="vacio"><span class="icono-grande">${Icono.carro}</span><h2 class="h2">Primero, haz tu lista</h2>
    <p>Añade productos y aquí verás en qué supermercado te sale más barata la compra, junta o repartida.</p>
    <button class="btn" onClick=${() => ir("buscar")}>${Icono.lupa} Buscar productos</button></div>`;
  const alternar = s => cambiar(e => {
    const a = new Set(e.activas); a.has(s) ? a.delete(s) : a.add(s);
    return { ...e, activas: [...a].sort() };
  });
  const copiar = async (texto, tienda) => {
    try { await navigator.clipboard.writeText(texto); avisar(`Lista de ${tienda} copiada`); }
    catch (e) { avisar("No se ha podido copiar. Abre los enlaces de cada producto."); }
  };
  const plan = r && r.plan;
  const grupos = plan ? plan.usadas.map(s => ({ s, filas: plan.asign.filter(a => a.s === s) })).sort((a, b) => b.filas.length - a.filas.length) : [];
  const ahorro = plan && r.mejorUna && plan.faltan.length <= r.mejorUna.faltan.length ? r2(r.mejorUna.total - plan.total) : 0;
  // ¿el límite de súper elegido hace perder dinero? ¿y el modo (tienda o envío)?
  const extra = plan && r.mejor && r.mejor !== plan && r.mejor.faltan.length <= plan.faltan.length && !r.mejor.cortos.length ? r2(plan.total - r.mejor.total) : 0;
  const otroMejor = otro && otro.mejor;
  const otroAhorro = plan && otroMejor && !otroMejor.faltan.length && !otroMejor.cortos.length && otroMejor.faltan.length <= plan.faltan.length
    && (r.mejor ? r.mejor.total : plan.total) > 0 && (envio || estado.items.length >= 15 || plan.total >= 60) ? r2((r.mejor && !r.mejor.cortos.length ? r.mejor.total : plan.total) - otroMejor.total) : 0;
  return html`<div>
    <section class="seccion tarjeta" style=${{ padding: 16, marginTop: 14 }} aria-label="Cómo quieres comprar">
      <div class="seg" role="group" aria-label="¿Cómo vas a comprar?">
        <button aria-pressed=${!envio} onClick=${() => cambiar(e => ({ ...e, envio: false }))}>Voy a la tienda</button>
        <button aria-pressed=${envio} onClick=${() => cambiar(e => ({ ...e, envio: true }))}>Me lo traen a casa</button>
      </div>
      <div class="seg" role="group" aria-label="¿En cuántos supermercados?">
        ${[[1, "1 súper"], [2, "Hasta 2"], [4, "Los que haga falta"]].map(([n, t]) => html`<button key=${n} aria-pressed=${estado.max === n} onClick=${() => cambiar(e => ({ ...e, max: n }))}>${t}</button>`)}
      </div>
      <div class="logos-sel" role="group" aria-label="Supermercados que tienes en cuenta">
        ${C.tiendas.map((t, s) => {
          const sinEnvio = envio && !AJ.envios[s].activo;
          return html`<button key=${t} class="logo-sel" aria-pressed=${activas.has(s) && !sinEnvio} disabled=${sinEnvio} onClick=${() => alternar(s)}>
            <${Logo} C=${null} s=${s} t=${28} /><span translate="no">${t}</span>${sinEnvio ? html`<span class="peq">· sin envío</span>` : ""}</button>`;
        })}
      </div>
      ${envio && html`<p class="peq">Se suman los gastos de envío de cada súper y se respeta su pedido mínimo. Ajusta las tarifas de tu zona en <button class="enlace-btn" onClick=${() => ir("ajustes")}>Ajustes</button>.</p>`}
    </section>
    ${!plan ? html`<div class="vacio"><p>${envio ? "Ninguno de los supermercados elegidos lleva la compra a casa. Activa alguno o elige «Voy a la tienda»." : "Elige al menos un supermercado."}</p></div>` : html`<section class="seccion" aria-live="polite">
      <div class="tarjeta total">
        <span class="peq">${grupos.length === 1 ? `Toda la compra en ${C.tiendas[grupos[0].s]}` : `Repartiendo entre ${grupos.map(g => C.tiendas[g.s]).join(" y ")}`}${envio ? ", con envío a casa" : ""}</span>
        <span class="cifra">${fmt(plan.total)}</span>
        ${envio && html`<span class="peq">${fmt(plan.productos)} en productos + ${plan.gastos ? fmt(plan.gastos) + " de envío" : "envío gratis"}</span>`}
        ${ahorro >= 0.01 && html`<span class="etq">${Icono.etiqueta} Ahorras ${fmt(ahorro)} frente a todo en ${C.tiendas[r.mejorUna.conj[0]]}</span>`}
        ${ahorro < 0.01 && plan.usadas.length === 1 && r.mejor && r.mejor.usadas.length === 1 && html`<span class="peq">Repartir la compra no sale más barato${envio ? " con los gastos de envío" : ""}: ${C.tiendas[plan.usadas[0]]} es lo mejor para tu lista.</span>`}
        ${extra >= 0.5 && html`<span class="aviso-plan">Repartiendo entre ${r.mejor.usadas.map(s => C.tiendas[s]).join(" y ")} ahorrarías ${fmt(extra)} más.
          <button class="btn peq-btn" onClick=${() => cambiar(e => ({ ...e, max: 4 }))}>Repartir así</button></span>`}
        ${otroAhorro >= 0.5 && html`<span class="aviso-plan">${envio ? `Yendo a la tienda te ahorras ${fmt(otroAhorro)}` : `Con envío a casa pagarías ${fmt(otroAhorro)} menos`}${otro.plan ? ` (${otro.plan.usadas.map(s => C.tiendas[s]).join(" + ")})` : ""}.
          <button class="btn sec peq-btn" onClick=${() => cambiar(e => ({ ...e, envio: !envio }))}>${envio ? "Ver en tienda" : "Ver con envío"}</button></span>`}
        ${plan.cortos.length > 0 && html`<span class="peq aviso">No llegas al pedido mínimo de ${plan.cortos.map(s => C.tiendas[s]).join(" y ")}.</span>`}
        ${plan.faltan.length > 0 && html`<span class="peq">No hemos encontrado ${plan.faltan.length === 1 ? "1 producto" : plan.faltan.length + " productos"} en estos supermercados: ${plan.faltan.map(o => o.it.n).join(", ")}.</span>`}
      </div>
      ${grupos.map(g => html`<${GrupoTienda} key=${g.s} C=${C} g=${g} plan=${plan} envio=${envio} abrir=${abrir} copiar=${copiar} />`)}
      <${Escenarios} C=${C} r=${r} otro=${otro} estado=${estado} cambiar=${cambiar} />
      <p class="peq">«Llenar carrito» usa tu marcador del navegador en la web de cada súper: así entra con tu sesión y añade toda la cesta de golpe. LIDL no vende alimentación online: llévate su lista a la tienda.</p>
    </section>`}
    ${r && html`<section class="seccion" aria-labelledby="rk-tit"><h2 class="h2" id="rk-tit">Todo en un solo súper</h2>
      <ol class="ranking tarjeta">${[...r.unaTienda].sort((a, b) => a.sinEnvio - b.sinEnvio || a.faltan.length - b.faltan.length || a.total - b.total).map(x => html`<li key=${x.conj[0]} class=${r.mejorUna && x.conj[0] === r.mejorUna.conj[0] ? "mejor" : ""}>
        <${Logo} C=${C} s=${x.conj[0]} t=${36} />
        <div style=${{ minWidth: 0 }}><b translate="no">${C.tiendas[x.conj[0]]}</b>
          <div class="peq">${x.sinEnvio ? "No lleva la compra a casa" : x.faltan.length ? `Faltan ${x.faltan.length}: ${x.faltan.map(o => o.it.n).join(", ")}` : "Tiene toda tu lista"}</div>
          ${envio && !x.sinEnvio && html`<div class="peq">${x.gastos ? `Incluye ${fmt(x.gastos)} de envío` : "Envío gratis"}${x.cortos.length ? " · no llega al pedido mínimo" : ""}</div>`}</div>
        <span class="cifra">${x.sinEnvio ? "—" : fmt(x.total)}</span></li>`)}</ol>
      <p class="peq">Si un súper no tiene el producto exacto, se usa el más barato del mismo tipo y tamaño parecido${AJ.saludable ? ", dando prioridad al más saludable" : ""}.</p></section>`}
  </div>`;
}

