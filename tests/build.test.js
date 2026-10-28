/* El build produce un único index.html con todo dentro y el marcador minificado. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), os = require("os"), path = require("path");
const { construir, marcador } = require("../build.js");

test("build: un solo archivo, sin marcadores de plantilla y con MARCADOR válido", async () => {
  const salida = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "comparador-")), "index.html");
  await construir(salida);
  const html = fs.readFileSync(salida, "utf8");
  for (const resto of ["/*ESTILOS*/", "/*CODIGO*/", "/*MARCADOR*/"]) assert.ok(!html.includes(resto), resto);
  assert.equal((html.match(/<script>/g) || []).length, 1, "todo el código en un único <script>");
  assert.ok(!/<script src="(?!https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)\/)/.test(html), "solo scripts de CDN permitidos");
  const m = await marcador();
  assert.doesNotThrow(() => new Function(m), "el marcador minificado es JavaScript válido");
  assert.ok(html.includes("encodeURIComponent(\"(async()=>{"), "MARCADOR inyectado");
  assert.ok(Buffer.byteLength(html) < 400 * 1024, "index.html razonablemente pequeño");
});
