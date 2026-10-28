/* Revisión de accesibilidad con axe-core en las cuatro pestañas (móvil, claro y oscuro).
   Uso: node tests/medir/accesibilidad.js */
const http = require("http"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const { chromium } = require("playwright");
const { CATALOGO } = require("../cargar");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const APP = path.join(__dirname, "../../app");

(async () => {
  const cat = CATALOGO.endsWith(".gz") ? zlib.gunzipSync(fs.readFileSync(CATALOGO)) : fs.readFileSync(CATALOGO);
  const server = http.createServer((req, res) => {
    const ruta = new URL(req.url, "http://x").pathname.replace(/^\/+/, "") || "index.html";
    if (ruta === "catalogo.json") { res.writeHead(200, { "content-type": "application/json" }); return res.end(cat); }
    const f = path.join(APP, path.normalize(ruta));
    if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": f.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" }); fs.createReadStream(f).pipe(res);
  }).listen(0);
  await new Promise(r => server.on("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  const b = await chromium.launch();
  const total = new Map();
  for (const tema of ["light", "dark"]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES", colorScheme: tema });
    const pg = await ctx.newPage();
    await pg.goto(base + "#buscar");
    await pg.waitForSelector("#contenido:not(:has([aria-busy]))");
    // una lista con productos para que Mi lista y Comprar tengan contenido
    await pg.evaluate(async () => {
      const C = preparar(await (await fetch("catalogo.json")).json());
      const items = ["Leche entera Hacendado", "Tomate frito Hacendado", "Huevos"].map(n => C.P.find(p => p.n === n)).filter(Boolean).map(p => ({ k: p.k, n: p.n, q: 1, h: false }));
      localStorage.setItem("comparador.estado.v1", JSON.stringify({ items, activas: [0, 1, 2, 3], max: 4, envio: false, ajustes: {}, rev: 1 }));
    });
    for (const [vista, antes] of [["buscar", null], ["buscar", "leche de almendras"], ["lista"], ["comprar"], ["ajustes"]]) {
      await pg.goto(base + "#" + vista); await pg.reload();
      await pg.waitForSelector("#contenido:not(:has([aria-busy]))");
      if (antes) { await pg.fill("#q", antes); await pg.waitForTimeout(1200); }
      await pg.waitForTimeout(600);
      await pg.addScriptTag({ content: AXE });
      const r = await pg.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"] })).violations
        .map(v => ({ id: v.id, impact: v.impact, ayuda: v.help, nodos: v.nodes.slice(0, 4).map(n => n.target.join(" ") + (n.any[0]?.message ? " — " + n.any[0].message.slice(0, 140) : "")), n: v.nodes.length })));
      console.log(`\n== ${tema} · ${vista}${antes ? " «" + antes + "»" : ""}: ${r.length} problemas`);
      for (const v of r) { console.log(`  [${v.impact}] ${v.id} ×${v.n}: ${v.ayuda}`); v.nodos.forEach(x => console.log("      " + x)); total.set(v.id, (total.get(v.id) || 0) + v.n); }
    }
    await ctx.close();
  }
  console.log("\nTOTAL", JSON.stringify(Object.fromEntries(total)));
  await b.close(); server.close();
})();
