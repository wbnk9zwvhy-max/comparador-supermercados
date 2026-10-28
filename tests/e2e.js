const { chromium } = require('playwright');
const D = './salida/';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ locale: 'es-ES', viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(4000);
  await pg.evaluate(async () => {
    const C = preparar(await (await fetch('catalogo.json')).json());
    const items = ['Leche entera Hacendado', 'Huevos', 'Tomate frito Hacendado', 'Queso Fundido Light 16 Porciones'].map(n => C.P.find(p => p.n === n)).filter(Boolean).map(p => ({ k: p.k, n: p.n, q: 1, h: false }));
    localStorage.setItem('comparador.estado.v1', JSON.stringify({ items, activas: [0], max: 1, envio: true, ajustes: {}, rev: 1 }));
  });
  await pg.goto('http://localhost:8765/index.html#comprar'); await pg.reload(); await pg.waitForTimeout(4500);
  const links = await pg.$$eval('.llenar a', as => as.map(a => [a.innerText, a.href]));
  console.log(links.map(l => l[0] + ' ' + l[1].slice(0, 90)));
  await pg.screenshot({ path: D + 'llenar.png', fullPage: true });
  const marc = await pg.evaluate(() => MARCADOR);
  const code = decodeURIComponent(marc.slice('javascript:'.length));
  const mer = links.find(l => /Mercadona/.test(l[0]));
  if (mer) {
    const p2 = await ctx.newPage(); const msgs = []; p2.on('dialog', async d => { msgs.push(d.message()); await d.accept(); });
    await p2.goto(mer[1], { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(6000);
    try { await p2.evaluate(code); } catch (e) {}
    await p2.waitForTimeout(6000);
    console.log(msgs, await p2.evaluate(() => localStorage.getItem('MO-cart')));
  }
  console.log('ERR', errs); await b.close();
})();
