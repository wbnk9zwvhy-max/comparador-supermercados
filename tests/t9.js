const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(4000);
  console.log(await pg.evaluate(async () => {
    const C = preparar(await (await fetch('catalogo.json')).json());
    const L = [];
    for (const sano of [false, true]) {
      AJ = mezclarAjustes({ saludable: sano });
      L.push('--- saludable=' + sano);
      for (const q of ['gulas', 'ternera para guisar', 'ternera gallega de guisar', 'delicias del mar']) {
        const r = buscar(C, q); const op = intencion(C, r); const cat = op[0] ? op[0].c : -1;
        const comp = comparar(C, { ...r, res: r.res.filter(x => x.p.cat === cat) }, q, { cat });
        L.push(q + ' → ' + (op[0] ? C.cats[op[0].c].nombre : '-') + ' | ' + (comp && comp.filas ? comp.filas.map(f => `${C.tiendas[f.s]}: ${f.p.n} ${f.p.up}`).join(' ; ') : JSON.stringify(comp)));
      }
      for (const nombre of ['Ternera Gallega de Guisar', 'La Gula del Norte', 'Delicias del mar de surimi Hacendado']) {
        const ref = C.P.find(p => p.n === nombre);
        L.push('  ' + nombre + ' (' + C.tiendas[ref.s] + '):');
        for (let s = 0; s < 4; s++) { if (s === ref.s) continue; const e = equivalente(C, ref, s, 1); L.push(`     ${C.tiendas[s]}: ${e ? e.p.n + ' [' + e.como + '] ' + e.coste + '€ sa' + e.p.sa : '—'}`); }
      }
    }
    return L.join('\n');
  }));
  console.log('ERR', errs); await b.close();
})();
