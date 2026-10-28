/* ------------------------------------------------------------------ iconos */
const svg = (d, extra = {}) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${extra.w || 2} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const Icono = {
  lupa: svg(html`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`),
  inicio: svg(html`<path d="M3.5 10.5 12 4l8.5 6.5V19a1 1 0 0 1-1 1H15v-5.5H9V20H4.5a1 1 0 0 1-1-1z"/>`),
  lista: svg(html`<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>`),
  carro: svg(html`<path d="M3 5h2.5l2.2 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8.5H6.4"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>`),
  ajustes: svg(html`<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>`),
  mas: svg(html`<path d="M12 5v14M5 12h14"/>`, { w: 2.4 }),
  menos: svg(html`<path d="M5 12h14"/>`, { w: 2.4 }),
  papelera: svg(html`<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>`),
  ok: svg(html`<path d="m5 12.5 4.5 4.5L19 7.5"/>`, { w: 2.6 }),
  x: svg(html`<path d="M6 6l12 12M18 6 6 18"/>`, { w: 2.2 }),
  flecha: svg(html`<path d="m9 6 6 6-6 6"/>`, { w: 2.4 }),
  atras: svg(html`<path d="m15 6-6 6 6 6"/>`, { w: 2.4 }),
  etiqueta: svg(html`<path d="M3.5 12.5V4.5h8l8.5 8.5-8 8z"/><circle cx="8" cy="9" r="1.4"/>`),
};

