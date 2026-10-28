/* La app de verdad en Chromium (Playwright), servida en local con el catálogo de prueba. */
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const { chromium } = require("playwright");
const { CATALOGO } = require("./cargar");

const APP = path.join(__dirname, "..", "app");
const TIPOS = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".js": "text/javascript" };

let server, base, browser;
test.before(async () => {
  const catalogo = CATALOGO.endsWith(".gz") ? zlib.gunzipSync(fs.readFileSync(CATALOGO)) : fs.readFileSync(CATALOGO);
  server = http.createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
    if (ruta === "catalogo.json") { res.writeHead(200, { "content-type": TIPOS[".json"] }); return res.end(catalogo); }
    const f = path.join(APP, path.normalize(ruta));
    if (!f.startsWith(APP) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});
test.after(async () => { await browser?.close(); server?.close(); });

async function abrir(hash = "", movil = true) {
  const ctx = await browser.newContext({ locale: "es-ES", viewport: movil ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const errores = [];
  pg.on("pageerror", e => errores.push(e.message));
  await pg.goto(base + "index.html" + hash);
  await pg.waitForSelector("#contenido:not(:has([aria-busy]))", { timeout: 20000 });
  return { pg, ctx, errores };
}

test("carga sin errores y busca «leche de almendras» con su comparativa", async () => {
  const { pg, ctx, errores } = await abrir("#buscar");
  await pg.fill("#q", "leche de almendras");
  await pg.getByText("Bebida de almendras").first().waitFor({ timeout: 10000 });
  const texto = await pg.textContent("#contenido");
  assert.match(texto, /Bebidas vegetales/);
  assert.deepEqual(errores, []);
  await ctx.close();
});

test("todas las pestañas se abren sin errores (móvil y escritorio)", async () => {
  for (const movil of [true, false]) {
    const { pg, ctx, errores } = await abrir("#buscar", movil);
    for (const v of ["lista", "comprar", "ajustes", "buscar"]) {
      await pg.evaluate(v => { location.hash = v; }, v);
      await pg.waitForTimeout(300);
    }
    assert.deepEqual(errores, [], movil ? "móvil" : "escritorio");
    await ctx.close();
  }
});

test("una cesta guardada da botones «Llenar carrito» con la cesta codificada", async () => {
  const { pg, ctx } = await abrir();
  await pg.evaluate(async () => {
    const C = preparar(await (await fetch("catalogo.json")).json());
    const items = ["Leche entera Hacendado", "Tomate frito Hacendado"].map(n => C.P.find(p => p.n === n)).filter(Boolean).map(p => ({ k: p.k, n: p.n, q: 1, h: false }));
    localStorage.setItem("comparador.estado.v1", JSON.stringify({ items, activas: [0], max: 1, envio: true, ajustes: {}, rev: 1 }));
  });
  await pg.goto(base + "index.html#comprar");
  await pg.reload();
  await pg.waitForSelector(".llenar a", { timeout: 20000 });
  const links = await pg.$$eval(".llenar a", as => as.map(a => a.href));
  assert.ok(links.some(h => /mercadona\.es\/?#comparador=[A-Za-z0-9_-]+$/.test(h)), links.join("\n"));
  assert.match(await pg.evaluate(() => MARCADOR), /^javascript:/);
  await ctx.close();
});

test("accesibilidad (axe-core, WCAG AA): sin problemas en la búsqueda, claro y oscuro", async () => {
  const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  for (const tema of ["light", "dark"]) {
    const ctx = await browser.newContext({ locale: "es-ES", viewport: { width: 390, height: 844 }, colorScheme: tema });
    const pg = await ctx.newPage();
    await pg.goto(base + "index.html#buscar");
    await pg.waitForSelector("#contenido:not(:has([aria-busy]))", { timeout: 20000 });
    await pg.fill("#q", "leche de almendras");
    await pg.getByText("Bebida de almendras").first().waitFor();
    await pg.addScriptTag({ content: AXE });
    const fallos = await pg.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations
      .map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(", ")}`));
    assert.deepEqual(fallos, [], tema);
    await ctx.close();
  }
});
