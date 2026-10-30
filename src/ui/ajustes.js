/* ------------------------------------------------------------------ ajustes */
// «Mercadona, Consum y LIDL»
const lista = xs => xs.length > 1 ? xs.slice(0, -1).join(", ") + " y " + xs[xs.length - 1] : xs.join("");
function Ajustes({ C, estado, cambiar }) {
  const aj = mezclarAjustes(estado.ajustes);
  const fijar = cambio => cambiar(e => ({ ...e, ajustes: { ...mezclarAjustes(e.ajustes), ...cambio } }));
  const fijarEnvio = (s, campo, valor) => cambiar(e => {
    const a = mezclarAjustes(e.ajustes);
    return { ...e, ajustes: { ...a, envios: a.envios.map((x, i) => i === s ? { ...x, [campo]: valor } : x) } };
  });
  const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) && n >= 0 ? n : 0; };
  const campo = (s, k, etiqueta, valor) => html`<label class="campo"><span>${etiqueta}</span>
    <span class="euro"><input id=${`env-${s}-${k}`} name=${`env-${s}-${k}`} inputmode="decimal" autocomplete="off" value=${valor == null ? "" : String(valor).replace(".", ",")}
      placeholder="Sin umbral…" onChange=${ev => fijarEnvio(s, k, ev.target.value === "" ? null : num(ev.target.value))} /> €</span></label>`;
  return html`<div>
    <section class="seccion" aria-labelledby="pref-tit" style=${{ marginTop: 14 }}><h2 class="h2" id="pref-tit">Preferencias</h2>
      <div class="tarjeta grupo-ios">
        <${Interruptor} id="aj-sano" activo=${aj.saludable} cambiar=${v => fijar({ saludable: v })} titulo="Priorizar lo más saludable"
          texto="Elige primero lo más natural (menos aditivos e ingredientes de ultraprocesado, según su lista de ingredientes) y, entre lo igual de natural, lo más barato. No se fija en las calorías." />
        <${Interruptor} id="aj-socio" activo=${aj.socio} cambiar=${v => fijar({ socio: v })} titulo=${html`<${Logo} C=${null} s=${1} t=${22} /> Soy socio de Consum`}
          texto="Resta del precio de Consum lo que acumulas en tu Cheque Crece con los productos en promoción. Lo recibes en tu próximo cheque regalo, no en caja." />
      </div>
    </section>
    <section class="seccion" aria-labelledby="marc-tit"><h2 class="h2" id="marc-tit">Llenar el carrito del súper</h2>
      <div class="tarjeta" style=${{ padding: 16 }}><${Marcador} /></div>
    </section>
    <section class="seccion" aria-labelledby="crit-tit"><h2 class="h2" id="crit-tit">Cómo se decide qué es más sano</h2>
      <div class="tarjeta" style=${{ padding: 16 }}><${Criterio} /></div>
    </section>
    <section class="seccion" aria-labelledby="env-tit"><h2 class="h2" id="env-tit">Envío a domicilio</h2>
      <p class="peq">Tarifas publicadas por cada cadena. Cambian según el código postal: corrígelas si en tu zona son otras.</p>
      <div class="tarjeta grupo-ios">${C.vivas.map(s => [C.tiendas[s], s]).map(([t, s]) => {
        const e = aj.envios[s];
        return html`<div key=${t}>
          <${Interruptor} id=${`env-${s}`} activo=${e.activo} cambiar=${v => fijarEnvio(s, "activo", v)} titulo=${html`<${Logo} C=${null} s=${s} t=${26} /><span translate="no">${t}</span>`}
            texto=${e.activo ? "Lleva la compra a tu zona" : s === 3 ? "LIDL no lleva la compra de alimentación a casa" : "No se tiene en cuenta para envíos"} />
          ${e.activo && html`<div class="campos">
            ${campo(s, "coste", "Gastos de envío", e.coste)}
            ${campo(s, "minimo", "Pedido mínimo", e.minimo)}
            ${campo(s, "umbral", "Desde un pedido de", e.umbral)}
            ${campo(s, "costeSobre", "el envío cuesta", e.costeSobre)}
          </div>`}
        </div>`;
      })}</div>
      <button class="btn sec" onClick=${() => fijar({ envios: ENVIOS_DEF })}>Restablecer tarifas</button>
    </section>
    <section class="seccion" aria-labelledby="dat-tit"><h2 class="h2" id="dat-tit">Sobre los datos</h2>
      <div class="tarjeta" style=${{ padding: 16, display: "grid", gap: 10 }}>
        <div class="super-fila">${C.vivas.map(s => html`<${Logo} key=${s} C=${C} s=${s} t=${36} />`)}</div>
        <p class="peq">Precios de las webs de ${lista(C.vivas.map(s => C.tiendas[s]))}, actualizados cada mañana.${C.vivas.length < C.tiendas.length ? ` Hoy no hay precios de ${lista(C.tiendas.filter((_, s) => !C.vivas.includes(s)))}: su web no ha respondido.` : ""} Los de Mercadona son los de su almacén de Valencia; los de las demás cadenas, los que muestra su web por defecto. LIDL solo publica online una parte de su surtido.</p>
      </div>
    </section>
  </div>`;
}

