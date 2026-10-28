/* ------------------------------------------------------------------ comprar */
function Interruptor({ id, activo, cambiar, titulo, texto, deshabilitado }) {
  return html`<div class="ajuste">
    <div style=${{ minWidth: 0 }}><label for=${id} class="ajuste-tit">${titulo}</label>${texto && html`<p class="peq" id=${id + "-d"}>${texto}</p>`}</div>
    <button id=${id} role="switch" aria-checked=${!!activo} aria-describedby=${texto ? id + "-d" : undefined} class="switch" disabled=${deshabilitado}
      onClick=${() => cambiar(!activo)}><span></span></button>
  </div>`;
}

