/* Sustitutos en la cesta: equivalencias entre tiendas y la regla «nunca menos natural sin avisar». */
const test = require("node:test");
const assert = require("node:assert/strict");
const { cargar } = require("./cargar");

const { C, g, ajustes, hay } = cargar();
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
  for (const [t, rx] of Object.entries(esperado).filter(([t]) => hay(t))) {
    const e = en(ref, t);
    assert.ok(e, t);
    assert.match(e.p.n, rx, t);
    assert.equal(e.como, "equivalente", t);
  }
});

test("Pechuga 92% pavo (Mercadona) → Bonnatur 95% (Consum), Elpozo 93% (DIA) y LIDL con aviso", () => {
  const ref = producto("Pechuga 92% pavo", "Mercadona");
  const c = en(ref, "Consum"), l = en(ref, "LIDL");
  assert.match(c.p.n, /bonnatur 95/i); assert.ok(!c.menosNatural);
  if (hay("DIA")) { const d = en(ref, "DIA"); assert.match(d.p.n, /pechuga de pavo 93% elpozo/i); assert.ok(!d.menosNatural); }
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
    const minimo = 100 * (C.tiendas.filter(hay).length - 1);  // 300 con los cuatro súper
    assert.ok(tot > minimo, `pocas sustituciones auditadas (${tot})`);
    assert.deepEqual(silencio.slice(0, 5), [], `modo sano=${saludable}`);
  }
});

test("«Huevos» de Mercadona (sin formato): se estima la cantidad y no se cambia por media docena ni por huevos de codorniz", () => {
  const ref = C.P.find(p => p.n === "Huevos" && p.s === S.Mercadona);
  assert.equal(ref.q, null);
  for (const t of ["Consum", "DIA"].filter(hay)) {
    const e = en(ref, t);
    assert.ok(e && e.estimada, t);
    assert.doesNotMatch(e.p.n, /codorniz/i, t);
    assert.ok(e.p.q * e.n * 12 >= 12, `${t}: ${e.n} × ${e.p.n} son menos de una docena`);
  }
});

test("pienso, comida de bebé y productos infantiles nunca sustituyen a una compra normal", () => {
  const paraOtros = p => /^(Bebé|Mascotas)$/.test(C.secciones[p.sec]) ||
    /\b(perros?|gatos?|mascotas?|cachorros?|bebes?|infantil(es)?|junior|kids|ninos?|papillas?|potitos?)\b/.test(g("norm")(p.n));
  const malos = [];
  for (const ref of C.P.filter((p, i) => i % 5 === 0 && !paraOtros(p))) for (let s = 0; s < 4; s++) {
    if (s === ref.s) continue;
    const e = equivalente(C, ref, s, 1);
    if (e && e.como !== "igual" && paraOtros(e.p)) malos.push(`${ref.n} → ${e.p.n}`);
  }
  assert.deepEqual(malos.slice(0, 5), []);
});

test("marcas fuertes: Oreo se cambia por galletas rellenas genéricas donde no hay Oreo", () => {
  const ref = producto("Galletas Oreo Rellenas de Crema", "Consum");
  assert.match(en(ref, "Mercadona").p.n, /galletas rellenas/i);
  if (hay("DIA")) assert.match(en(ref, "DIA").p.n, /oreo/i);
});
