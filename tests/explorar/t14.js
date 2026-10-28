const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(4000);
  console.log(await pg.evaluate(async () => {
    const C = preparar(await (await fetch('catalogo.json')).json()); AJ = mezclarAjustes({});
    let tot = 0, silencio = 0, avisos = 0, mejor = 0; const ej = [];
    const refs = C.P.filter((p, i) => i % 37 === 0 && p.mo && !sinDatos(p));
    for (const ref of refs) for (let s = 0; s < 4; s++) {
      if (s === ref.s) continue; const e = equivalente(C, ref, s, 1); if (!e || e.como === 'igual') continue; tot++;
      const peor = sinDatos(e.p) || e.p.sa < ref.sa - (ref.sa % 10) || (nivelDe(e.p) === nivelDe(ref) && e.p.sa % 10 < ref.sa % 10);
      if (peor && !e.menosNatural) { silencio++; ej.push(ref.n + ' -> ' + e.p.n); }
      if (e.menosNatural) avisos++; if (nivelDe(e.p) > nivelDe(ref)) mejor++;
    }
    return JSON.stringify({ refs: refs.length, sustituciones: tot, menosNaturalSinAviso: silencio, conAviso: avisos, masNatural: mejor, ej: ej.slice(0, 5) });
  }));
  await b.close();
})();
