const { chromium } = require('playwright');
const fs = require('fs');
const D = './salida/';
const code = fs.readFileSync('../scripts/marcador.min.js', 'utf8');
const enc = o => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
(async () => {
  const b = await chromium.launch();
  for (const [nombre, url, cesta, check] of [
    ['mercadona', 'https://tienda.mercadona.es/', { s: 'm', l: [['10379', 2], ['4241', 1]] }, () => localStorage.getItem('MO-cart')],
    ['consum', 'https://tienda.consum.es/es', { s: 'c', l: [[4809, 2, '238311']] }, () => localStorage.getItem('CookieTol')],
  ]) {
    const ctx = await b.newContext({ locale: 'es-ES', viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
    const pg = await ctx.newPage(); const msgs = [];
    pg.on('dialog', async d => { msgs.push(d.message()); await d.accept(); });
    await pg.goto(url + '#comparador=' + enc(cesta), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(14000);
    try { await pg.evaluate(code); } catch (e) { msgs.push('nav'); }
    await pg.waitForTimeout(9000);
    await pg.waitForTimeout(6000);
    console.log(nombre, await pg.evaluate(() => document.querySelector('body').innerText.match(/\d+,\d\d €/g)?.slice(0,3)), msgs, (await pg.evaluate(check) || '').slice(0, 300));
    await pg.screenshot({ path: D + 'bm_' + nombre + '.png' });
    await ctx.close();
  }
  await b.close();
})();
