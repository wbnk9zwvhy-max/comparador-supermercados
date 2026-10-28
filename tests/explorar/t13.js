const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(4000);
  console.log(await pg.evaluate(async () => {
    const C = preparar(await (await fetch('catalogo.json')).json()); AJ = mezclarAjustes({});
    const L = [];
    const refs = C.P.filter(p => /(pechuga|pavo).*(9[0-9]|8[0-9]) ?%|9[0-9] ?% ?pavo/i.test(p.n)).slice(0, 8);
    for (const ref of refs) {
      L.push(`${C.tiendas[ref.s]} | ${ref.n} | ${NIVELES[nivelDe(ref)]}`);
      for (let s = 0; s < 4; s++) { if (s === ref.s) continue; const e = equivalente(C, ref, s, 1);
        L.push(`   ${C.tiendas[s]}: ${e ? e.p.n + ' | ' + (sinDatos(e.p) ? 'sin datos' : NIVELES[nivelDe(e.p)]) + ' | ' + e.como + (e.menosNatural ? ' | MENOS NATURAL' : '') + ' | ' + e.coste + '€' : '—'}`); }
    }
    const t0 = performance.now(); const items = C.P.slice(0, 2000).filter((p, i) => i % 100 === 0).map(p => ({ k: p.k, n: p.n, q: 1 }));
    planificar(C, items, new Set([0, 1, 2, 3]), 4, true); L.push('plan ms ' + Math.round(performance.now() - t0));
    return L.join('\n');
  }));
  console.log('ERR', errs); await b.close();
})();
