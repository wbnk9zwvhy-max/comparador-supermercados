const { chromium } = require('playwright');
const D = './salida/';
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8765/index.html#ajustes'); await pg.waitForTimeout(4500);
  const y = await pg.evaluate(() => document.getElementById('marc-tit').getBoundingClientRect().top + scrollY);
  await pg.evaluate(y => scrollTo(0, y - 10), y); await pg.waitForTimeout(300);
  await pg.screenshot({ path: D + 'aj_marc.png' });
  // ficha con ingredientes leídos de foto
  const k = await pg.evaluate(async () => {
    const C = preparar(await (await fetch('catalogo.json')).json());
    for (let j = 0; j < 24; j++) { const t = await (await fetch(`ingredientes/i${String(j).padStart(2, '0')}.json`)).json();
      for (const [kk, v] of Object.entries(t)) if (v[5] === 'ocr') { const p = C.porClave.get(kk); if (p && p.s === 1) return p.n; } }
  });
  await pg.goto('http://localhost:8765/index.html#buscar'); await pg.waitForTimeout(3500);
  await pg.fill('#q', k); await pg.waitForTimeout(1500);
  await pg.click('.pcard .abrir'); await pg.waitForTimeout(1500);
  await pg.screenshot({ path: D + 'ficha_ocr.png' });
  console.log(k, 'ERR', errs); await b.close();
})();
