const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(5000);
  const out = await pg.evaluate(async () => {
    const C = preparar(await (await fetch('catalogo.json')).json());
    const qs = ['leche','huevos','pan','tomate','patatas','naranja','manzana','plátano','pollo','salmón','atún','arroz','pasta','aceite','yogur','cerveza','agua','café','chocolate','galletas','fresa','coco','pimiento','cebolla','ajo','lechuga','pepino','zanahoria','sandía','melón','pera','uva','aguacate','mantequilla','nata','zumo de naranja','jamón','chorizo','queso fresco','detergente','papel higiénico','champú','leche sin lactosa','leche de soja','helado','pizza','turrón','miel','azúcar','sal','vino tinto','limonada','lima','té','hamburguesa'];
    return qs.map(q => { const r = buscar(C, q); const op = intencion(C, r); return q + ' → ' + op.slice(0, 2).map(o => C.cats[o.c].nombre + ':' + Math.round(o.puntos)).join(' / '); });
  });
  console.log(out.join('\n')); await b.close();
})();
