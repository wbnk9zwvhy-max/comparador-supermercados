/* ------------------------------------------------------------------ ajustes de la persona */
// Gastos de envío por defecto (publicados en prensa; dependen de la zona, se pueden cambiar en Ajustes)
const ENVIOS_DEF = [
  { activo: true, coste: 8.2, umbral: null, costeSobre: 8.2, minimo: 50 },   // Mercadona: 8,20 €, pedido mínimo 50 €
  { activo: true, coste: 7, umbral: 60, costeSobre: 4, minimo: 0 },          // Consum: 7 €, 4 € desde 60 €
  { activo: true, coste: 4.99, umbral: 100, costeSobre: 0, minimo: 0 },      // DIA: 4,99 €, gratis desde 100 €
  { activo: false, coste: 0, umbral: null, costeSobre: 0, minimo: 0 },       // LIDL no lleva la compra de alimentación a casa
];
const AJ_DEF = { saludable: false, socio: false, envios: ENVIOS_DEF };
let AJ = AJ_DEF; // ajustes vigentes; App los fija en cada render a partir del estado guardado
const mezclarAjustes = a => ({ ...AJ_DEF, ...(a || {}), envios: ENVIOS_DEF.map((e, i) => ({ ...e, ...(((a || {}).envios || [])[i] || {}) })) });
const chequeDe = p => AJ.socio && p.s === 1 && p.ch ? p.ch : 0;
const precioEf = p => Math.max(0, Math.round((p.p - chequeDe(p)) * 100) / 100);
const upEf = p => p.up == null ? null : chequeDe(p) ? Math.round(p.up * precioEf(p) / p.p * 100) / 100 : p.up;
// lo sano = lo natural: nivel 0-4 según sus ingredientes (ver «Cómo se decide» en Ajustes)
const nivelDe = p => Math.min(4, Math.floor((p.sa || 0) / 10));
const NIVELES = ["Ultraprocesado", "Con aditivos", "Poco procesado", "Sin aditivos", "Natural"];
const sinDatos = p => p.mo === "Sin datos de ingredientes";
// en modo saludable gana el más natural; a igualdad, el más barato por kg o L
const mejorQue = (a, b) => AJ.saludable && a.sa !== b.sa ? a.sa > b.sa : (upEf(a) < upEf(b) || (upEf(a) === upEf(b) && precioEf(a) < precioEf(b)));
