/* Carga la lógica de la app (src/logica/*.js) en un contexto de Node, sin navegador ni React.
   Catálogo: por defecto la foto fija de tests/fijos (las pruebas no cambian cada día);
   con CATALOGO=app/catalogo.json se prueban los datos del día. Los módulos son scripts clásicos que comparten ámbito global,
   así que se ejecutan en el mismo contexto vm, en el orden del build. */
const fs = require("fs"), path = require("path"), vm = require("vm"), zlib = require("zlib");
const { LOGICA } = require("../build.js");

const RAIZ = path.join(__dirname, "..");
const CATALOGO = process.env.CATALOGO ? path.resolve(process.env.CATALOGO) : path.join(__dirname, "fijos/catalogo-2026-10-28.json.gz");

let cache = null;
function cargar() {
  if (cache) return cache;
  const memoria = new Map();
  const ctx = vm.createContext({
    console, Intl, Math, JSON, Map, Set,
    localStorage: { getItem: k => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, String(v)), removeItem: k => memoria.delete(k) },
  });
  for (const f of LOGICA) vm.runInContext(fs.readFileSync(path.join(RAIZ, f), "utf8"), ctx, { filename: f });
  // ayudantes de prueba dentro del mismo ámbito (para poder asignar AJ y ESTRICTO, que son `let` del script)
  vm.runInContext(`
    var __ajustes = a => { AJ = mezclarAjustes(a || {}); };
    var __global = n => eval(n);
  `, ctx);
  const bruto = fs.readFileSync(CATALOGO);
  const datos = JSON.parse(CATALOGO.endsWith(".gz") ? zlib.gunzipSync(bruto) : bruto);
  const g = ctx.__global;
  const C = g("preparar")(datos);
  ctx.__ajustes({});
  // súper con productos en este catálogo: en GitHub Actions DIA no responde y sus casos se saltan
  const conProductos = new Set(C.P.map(p => p.s));
  const hay = nombre => conProductos.has(C.tiendas.indexOf(nombre));
  cache = { ctx, C, g, ajustes: ctx.__ajustes, datos, hay };
  return cache;
}

module.exports = { cargar, CATALOGO };
