const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(5000);
  const out = await pg.evaluate(async () => {
    const C = preparar(await (await fetch('catalogo.json')).json());
    AJ = mezclarAjustes({});
    const pick = (q, s) => { const r = buscar(C, q); const op = intencion(C, r); const cat = op[0] ? op[0].c : -1;
      const l = r.res.filter(x => x.p.cat === cat && (s == null || x.p.s === s) && !x.p.gr).sort((a, b) => a.nivel - b.nivel); return l[0] && l[0].p; };
    const L = [];
    const lista = [['jamón serrano', 2], ['leche entera', 0], ['huevos', 0], ['aceite de oliva virgen extra', 1], ['papel higiénico', 0], ['tomate frito', 0], ['yogur natural', 1], ['pechuga de pollo', 0], ['plátano', 2], ['café molido', 1], ['detergente', 0], ['atún', 2], ['queso curado', 0], ['pan de molde', 1], ['cerveza', 0], ['patatas', 0], ['manzana', 0], ['agua mineral', 0], ['galletas', 2], ['arroz redondo', 0]];
    const items = [];
    for (const [q, s] of lista) { const p = pick(q, s); if (p) items.push({ k: p.k, n: p.n, q: q === 'leche entera' ? 6 : q === 'cerveza' ? 12 : 1 }); }
    L.push('items ' + items.length);
    for (const envio of [false, true]) for (const n of [5, 20]) {
      const its = items.slice(0, n);
      const t0 = performance.now();
      const r = planificar(C, its, new Set([0, 1, 2, 3]), 4, envio);
      const ms = Math.round(performance.now() - t0);
      L.push(`envio=${envio} n=${n} ${ms}ms | ` + [1, 2, 3, 4].map(k => { const x = r.porMax[k]; return `max${k}: ${x.total} [${x.usadas.map(s => C.tiendas[s]).join('+')}] f${x.faltan.length} sus${x.sustitutos} env${x.gastos}`; }).join(' | '));
      L.push('   una: ' + r.unaTienda.map(x => `${C.tiendas[x.conj[0]]} ${x.total} f${x.faltan.length} s${x.sustitutos}`).join(', '));
    }
    const r = planificar(C, items, new Set([0, 1, 2, 3]), 4, false);
    for (const a of r.plan.asign) L.push(`  ${a.o.it.n} (${C.tiendas[a.o.p.s]}) -> ${a.s == null ? '—' : C.tiendas[a.s] + ': ' + a.e.p.n + ' ' + a.e.n + 'x ' + a.e.coste + ' [' + a.e.como + ']'}`);
    return L.join('\n');
  });
  console.log(out); await b.close();
})();
