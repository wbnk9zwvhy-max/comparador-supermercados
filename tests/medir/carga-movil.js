/* Mide la carga de la app como en un móvil de gama media: CPU 4× más lenta y red 4G (9 Mbit/s, 150 ms).
   Uso: node tests/medir/carga-movil.js [veces]   (sirve app/ con el catálogo de prueba, comprimido con gzip) */
const http = require("http"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const { chromium } = require("playwright");
const { CATALOGO } = require("../cargar");

const APP = path.join(__dirname, "../../app");
const VECES = Number(process.argv[2] || 3);

(async () => {
  const crudo = CATALOGO.endsWith(".gz") ? zlib.gunzipSync(fs.readFileSync(CATALOGO)) : fs.readFileSync(CATALOGO);
  const gz = zlib.gzipSync(crudo, { level: 6 });
  const server = http.createServer((req, res) => {
    const ruta = new URL(req.url, "http://x").pathname.replace(/^\/+/, "") || "index.html";
    if (ruta === "catalogo.json") { res.writeHead(200, { "content-type": "application/json", "content-encoding": "gzip" }); return res.end(gz); }
    const f = path.join(APP, path.normalize(ruta));
    if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200); fs.createReadStream(f).pipe(res);
  }).listen(0);
  await new Promise(r => server.on("listening", r));
  const url = `http://127.0.0.1:${server.address().port}/index.html#buscar`;
  const b = await chromium.launch();
  const tiempos = [];
  for (let i = 0; i < VECES; i++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES" });
    const pg = await ctx.newPage();
    const cdp = await ctx.newCDPSession(pg);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 9e6 / 8, uploadThroughput: 3e6 / 8 });
    const t0 = Date.now();
    await pg.goto(url);
    await pg.waitForSelector("#contenido:not(:has([aria-busy]))", { timeout: 120000 });
    const listo = Date.now() - t0;
    const t1 = Date.now();
    await pg.fill("#q", "leche de almendras");
    await pg.getByText("Bebida de almendras").first().waitFor();
    tiempos.push({ listo, busqueda: Date.now() - t1, heapMB: Math.round((await pg.evaluate(() => performance.memory?.usedJSHeapSize || 0)) / 1e6) });
    await ctx.close();
  }
  console.log(`catálogo ${(crudo.length / 1e6).toFixed(2)} MB (gzip ${(gz.length / 1e6).toFixed(2)} MB)`);
  for (const t of tiempos) console.log(`  lista en ${t.listo} ms · búsqueda ${t.busqueda} ms · memoria ${t.heapMB} MB`);
  await b.close(); server.close();
})();
