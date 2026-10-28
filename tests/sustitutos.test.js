/* Sustitutos en la cesta: equivalencias entre tiendas y la regla «nunca menos natural sin avisar». */
const test = require("node:test");
const assert = require("node:assert/strict");
const { cargar } = require("./cargar");

const { C, g, ajustes } = cargar();
const equivalente = g("equivalente"), nivelDe = g("nivelDe"), sinDatos = g("sinDatos");
const S = Object.fromEntries(C.tiendas.map((t, i) => [t, i]));
const producto = (nombre, tienda) => {
  const p = C.P.find(x => x.n.startsWith(nombre) && x.s === S[tienda]);
  assert.ok(p, `no está «${nombre}» en ${tienda}`);
  return p;
};
const en = (ref, tienda) => equivalente(C, ref, S[tienda], 1);

test.beforeEach(() => ajustes({}));

test("Ternera Gallega de Guisar (Consum) → equivalentes en Mercadona, DIA y LIDL", () => {
  const ref = producto("Ternera Gallega de Guisar", "Consum");
  const esperado = { Mercadona: /trozo de vacuno para cocido/i, DIA: /carne de vacuno en tacos/i, LIDL: /taco de vacuno para guisar/i };
  for (const [t, rx] of Object.entries(esperado)) {
    const e = en(ref, t);
    assert.ok(e, t);
    assert.match(e.p.n, rx, t);
    assert.equal(e.como, "equivalente", t);
  }
});

test("Pechuga 92% pavo (Mercadona) → Bonnatur 95% (Consum), Elpozo 93% (DIA) y LIDL con aviso", () => {
  const ref = producto("Pechuga 92% pavo", "Mercadona");
  const c = en(ref, "Consum"), d = en(ref, "DIA"), l = en(ref, "LIDL");
  assert.match(c.p.n, /bonnatur 95/i); assert.ok(!c.menosNatural);
  assert.match(d.p.n, /pechuga de pavo 93% elpozo/i); assert.ok(!d.menosNatural);
  assert.ok(l && l.menosNatural, "en LIDL debe avisar «menos natural»");
});

test("auditoría: 0 sustituciones menos naturales sin aviso (con y sin modo sano)", () => {
  for (const saludable of [false, true]) {
    ajustes({ saludable });
    let tot = 0;
    const silencio = [];
    const refs = C.P.filter((p, i) => i % 37 === 0 && p.mo && !sinDatos(p));
    for (const ref of refs) for (let s = 0; s < 4; s++) {
      if (s === ref.s) continue;
      const e = equivalente(C, ref, s, 1);
      if (!e || e.como === "igual") continue;
      tot++;
      const peor = sinDatos(e.p) || e.p.sa < ref.sa - (ref.sa % 10) || (nivelDe(e.p) === nivelDe(ref) && e.p.sa % 10 < ref.sa % 10);
      if (peor && !e.menosNatural) silencio.push(`${ref.n} → ${e.p.n}`);
    }
    assert.ok(tot > 300, `pocas sustituciones auditadas (${tot})`);
    assert.deepEqual(silencio.slice(0, 5), [], `modo sano=${saludable}`);
  }
});
