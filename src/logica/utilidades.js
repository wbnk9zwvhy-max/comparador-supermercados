/* ------------------------------------------------------------------ utilidades */
const CONECTORES = new Set(["de","del","la","el","los","las","con","en","y","al","a","para","o","e","su"]);
const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const fmt = v => v == null ? "—" : eur.format(v);
const norm = t => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const stem = w => {
  if (w.length > 4 && w.endsWith("ones")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 4 && (w.endsWith("a") || w.endsWith("o"))) w = w.slice(0, -1);
  return w;
};
const tokens = q => norm(q).split(" ").filter(w => w && !CONECTORES.has(w)).map(stem);
// sinónimos: «leche de almendras» es como las tiendas llaman a la «bebida de almendras»
const VEGETAL = /^(almendr|aven|soj|arroz|coc|avellan|chuf|nuez|nuec|espelt|anacard|guisant|quino|cañam|canam)/;
const SINONIMOS = { zum: ["jug"], jug: ["zum"], yogurt: ["yogur"], aguacat: ["palt"] };
function consulta(q) {
  const t = tokens(q);
  const vegetal = t.some(w => VEGETAL.test(w));
  return t.map(w => w === "leche" && vegetal ? ["leche", "bebid"] : [w, ...(SINONIMOS[w] || [])]);
}
// palabras distintas con la misma raíz (la raíz quita el género): buscando una, no vale la otra
const CONFUNDIBLES = { pulpo: "pulpa", pulpa: "pulpo", pasta: "pasto", bolsa: "bolso", bolso: "bolsa", puerta: "puerto", puerto: "puerta" };
const confundido = (q, nombre) => norm(q).split(" ").some(w => {
  const w1 = w.replace(/s$/, ""), otra = CONFUNDIBLES[w1];
  return otra && new RegExp(`\\b${otra}s?\\b`).test(nombre) && !new RegExp(`\\b${w1}s?\\b`).test(nombre);
});
const empieza = (o, alts) => o && alts.some(a => o.startsWith(a));
// la misma palabra (las raíces ya quitan plural y género: «limones» = «limón»), no otra que empieza igual («limonada», «salsa»)
const igual = (o, alts) => o && alts.some(a => o === a);
const leer = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const UNID = ["kg", "L", "ud", "docena", "lavado"];
const fmtU = (v, u) => v == null || u == null ? "" : `${eur.format(v)}/${UNID[u]}`;
// accesos rápidos: [texto, categoría a la que llevan] (la categoría evita ambigüedades: «Patatas» frescas, no de bolsa)
const BASICOS = [["Leche entera", "l_leche"], ["Huevos medianos", "l_huevos"], ["Pan de molde", "pa_molde"],
  ["Jamón serrano", "ch_jamon"], ["Pavo", "ch_pavo"], ["Pechuga de pollo", "c_pollo"], ["Aceite de oliva virgen extra", "d_aceite"],
  ["Plátano", "fruta"], ["Patatas", "patata"], ["Tomate frito", "d_tomate"], ["Yogur natural", "l_yogur"], ["Arroz redondo", "d_arroz"],
  ["Atún", "d_conserva_pescado"], ["Agua mineral", "b_agua"], ["Papel higiénico", "li_papel"], ["Detergente", "li_ropa"]];

