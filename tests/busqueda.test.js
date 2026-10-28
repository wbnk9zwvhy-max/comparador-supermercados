/* Buscador: intención por categoría, comparativa entre súper y equivalencias de nombres (casos del traspaso). */
const test = require("node:test");
const assert = require("node:assert/strict");
const { cargar } = require("./cargar");

const { C, g, ajustes } = cargar();
const buscar = g("buscar"), intencion = g("intencion"), comparar = g("comparar");

function primeraCategoria(q) {
  const r = buscar(C, q), op = intencion(C, r);
  return { r, op, cat: op[0] ? C.cats[op[0].c] : null };
}
function comparativa(q) {
  const { r, op, cat } = primeraCategoria(q);
  const comp = comparar(C, { ...r, res: r.res.filter(x => x.p.cat === cat.i) }, q, { cat: cat.i });
  return { cat, comp, tiendas: comp.filas.map(f => C.tiendas[f.s]), nombres: Object.fromEntries(comp.filas.map(f => [C.tiendas[f.s], f.p.n])) };
}

test.beforeEach(() => ajustes({}));

test("«leche de almendras» → Bebidas vegetales, comparativa «Bebida de almendras» en Mercadona, Consum y DIA", () => {
  const { cat, comp, tiendas } = comparativa("leche de almendras");
  assert.equal(cat.nombre, "Bebidas vegetales");
  assert.equal(comp.titulo, "Bebida de almendras");
  for (const t of ["Mercadona", "Consum", "DIA"]) assert.ok(tiendas.includes(t), t);
});

for (const q of ["limón", "limones"]) test(`«${q}» → Fruta primero, no refrescos`, () => {
  assert.equal(primeraCategoria(q).cat.clave, "fruta");
});

test("«sal» → Sal y especias, no Salsas", () => {
  assert.equal(primeraCategoria("sal").cat.clave, "d_especias");
});

test("«patatas» → frescos primero (no patatas fritas)", () => {
  assert.equal(primeraCategoria("patatas").cat.clave, "patata");
});

test("«tomate» → frescos primero (no tomate frito)", () => {
  assert.equal(primeraCategoria("tomate").cat.clave, "verdura");
});

for (const q of ["gulas", "delicias del mar"]) test(`«${q}» → Surimi y gulas con los nombres de cada súper`, () => {
  const { cat, nombres } = comparativa(q);
  assert.equal(cat.clave, "p_surimi");
  assert.match(nombres.Mercadona, /delicias del mar/i);
  assert.match(nombres.Consum, /la gula del norte/i);
  assert.match(nombres.DIA, /suced[aá]neo de angulas/i);
});

test("«ternera para guisar» → Ternera y vacuno en los 4 súper", () => {
  const { cat, tiendas } = comparativa("ternera para guisar");
  assert.equal(cat.clave, "c_vacuno");
  assert.deepEqual([...tiendas].sort(), ["Consum", "DIA", "LIDL", "Mercadona"]);
});

test("una palabra solo es igual si coincide su raíz: «limón» no es «limonada», «sal» no es «salsa»", () => {
  const T = q => primeraCategoria(q).r.res.filter(x => x.nivel === 0).map(x => x.p.n.toLowerCase());
  assert.ok(T("limón").every(n => !/limonada/.test(n)));
  assert.ok(T("sal").every(n => !/salsa/.test(n)));
});

test("en el modo normal la comparativa gana el más barato por kg o L", () => {
  const { comp } = comparativa("leche de almendras");
  const up = comp.filas.map(f => g("upEf")(f.p));
  assert.equal(up[0], Math.min(...up));
});

test("las 55 búsquedas de siempre devuelven alguna categoría", () => {
  const qs = ["leche", "huevos", "pan", "tomate", "patatas", "naranja", "manzana", "plátano", "pollo", "salmón", "atún", "arroz", "pasta", "aceite", "yogur", "cerveza", "agua", "café", "chocolate", "galletas", "fresa", "coco", "pimiento", "cebolla", "ajo", "lechuga", "pepino", "zanahoria", "sandía", "melón", "pera", "uva", "aguacate", "mantequilla", "nata", "zumo de naranja", "jamón", "chorizo", "queso fresco", "detergente", "papel higiénico", "champú", "leche sin lactosa", "leche de soja", "helado", "pizza", "turrón", "miel", "azúcar", "sal", "vino tinto", "limonada", "lima", "té", "hamburguesa"];
  const sin = qs.filter(q => !primeraCategoria(q).cat);
  assert.deepEqual(sin, []);
});
