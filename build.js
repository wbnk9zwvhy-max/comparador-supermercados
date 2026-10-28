/* Build: junta src/ en un solo app/index.html (el artifact necesita un único archivo con sus datos al lado).
   Los módulos son scripts clásicos que comparten ámbito global, igual que cuando todo estaba en un archivo:
   se concatenan en este orden. MARCADOR se genera minificando scripts/marcador.js con terser.
   Uso: node build.js [salida]   (por defecto app/index.html) */
const fs = require("fs"), path = require("path");
const { minify } = require("terser");

const LOGICA = ["utilidades", "catalogo", "ajustes", "busqueda", "intencion", "comparar", "equivalencias", "sustitutos", "planificador"]
  .map(n => `src/logica/${n}.js`);
const UI = ["react", "estado", "iconos", "piezas", "buscar", "lista", "comprar", "carrito", "ajustes", "ficha", "app"]
  .map(n => `src/ui/${n}.js`);
// React va primero: la lógica no lo usa, pero así el orden del código es el de siempre
const ORDEN = [UI[0], ...LOGICA, ...UI.slice(1)];

const leer = f => fs.readFileSync(path.join(__dirname, f), "utf8");

async function marcador() {
  const { code } = await minify(leer("scripts/marcador.js"));
  return code;
}

async function construir(salida = path.join(__dirname, "app/index.html")) {
  // literal en ASCII (·…), como estaba en el archivo original
  const literal = JSON.stringify(await marcador()).replace(/[\u0080-￿]/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  const codigo = ORDEN.map(leer).join("").replace("/*MARCADOR*/", () => literal);
  const final = leer("src/plantilla.html")
    .replace("/*ESTILOS*/\n", () => leer("src/estilos.css"))
    .replace("/*CODIGO*/\n", () => codigo);
  fs.writeFileSync(salida, final);
  return { salida, bytes: Buffer.byteLength(final) };
}

module.exports = { LOGICA, ORDEN, construir, marcador };

if (require.main === module) construir(process.argv[2]).then(r => console.log(`${r.salida}: ${(r.bytes / 1024).toFixed(1)} KB`));
