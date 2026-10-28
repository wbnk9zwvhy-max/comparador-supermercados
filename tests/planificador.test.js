/* Planificador de la cesta: permitir más súper nunca sale más caro. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { cargar } = require("./cargar");

const { C, g, ajustes } = cargar();
const buscar = g("buscar"), intencion = g("intencion"), planificar = g("planificar");

function elegir(q, s) {
  const r = buscar(C, q), op = intencion(C, r), cat = op[0] ? op[0].c : -1;
  const l = r.res.filter(x => x.p.cat === cat && (s == null || x.p.s === s) && !x.p.gr).sort((a, b) => a.nivel - b.nivel);
  return l[0] && l[0].p;
}
const LISTA = [["jamón serrano", 2], ["leche entera", 0], ["huevos", 0], ["aceite de oliva virgen extra", 1], ["papel higiénico", 0], ["tomate frito", 0], ["yogur natural", 1], ["pechuga de pollo", 0], ["plátano", 2], ["café molido", 1], ["detergente", 0], ["atún", 2], ["queso curado", 0], ["pan de molde", 1], ["cerveza", 0], ["patatas", 0], ["manzana", 0], ["agua mineral", 0], ["galletas", 2], ["arroz redondo", 0]];
const ITEMS = LISTA.map(([q, s]) => elegir(q, s)).filter(Boolean)
  .map((p, i) => ({ k: p.k, n: p.n, q: LISTA[i][0] === "leche entera" ? 6 : LISTA[i][0] === "cerveza" ? 12 : 1 }));

test.beforeEach(() => ajustes({}));

test("la lista de prueba encuentra sus 20 productos", () => assert.equal(ITEMS.length, 20));

for (const envio of [false, true]) for (const n of [5, 20]) {
  test(`«Hasta k súper» nunca sube al permitir más (envío=${envio}, ${n} productos)`, () => {
    const r = planificar(C, ITEMS.slice(0, n), new Set([0, 1, 2, 3]), 4, envio);
    const tot = [1, 2, 3, 4].map(k => r.porMax[k]);
    for (let k = 1; k < 4; k++) {
      // con menos productos sin encontrar, o igual y no más caro
      const a = tot[k - 1], b = tot[k];
      assert.ok(b.faltan.length < a.faltan.length || (b.faltan.length === a.faltan.length && b.total <= a.total + 0.005),
        `hasta ${k + 1}: ${b.total} € > hasta ${k}: ${a.total} €`);
      assert.ok(b.usadas.length <= k + 1);
    }
  });
}

test("cestas al azar: la propiedad se mantiene", () => {
  let semilla = 7;
  const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648;
  const conPrecio = C.P.filter(p => p.p > 0 && !p.gr);
  for (let caso = 0; caso < 15; caso++) {
    const items = Array.from({ length: 3 + Math.floor(azar() * 10) }, () => {
      const p = conPrecio[Math.floor(azar() * conPrecio.length)];
      return { k: p.k, n: p.n, q: 1 + Math.floor(azar() * 3) };
    });
    for (const envio of [false, true]) {
      const r = planificar(C, items, new Set([0, 1, 2, 3]), 4, envio);
      for (let k = 2; k <= 4; k++) {
        const a = r.porMax[k - 1], b = r.porMax[k];
        if (!a || !b) continue;
        assert.ok(b.faltan.length < a.faltan.length || (b.faltan.length === a.faltan.length && b.total <= a.total + 0.005),
          `caso ${caso} envío=${envio}: hasta ${k} = ${b.total} € > hasta ${k - 1} = ${a.total} €`);
      }
    }
  }
});
