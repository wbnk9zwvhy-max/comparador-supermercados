# Comparador de supermercados

App web que compara Mercadona, Consum, DIA y LIDL. Hoy está publicada como Artifact de claude.ai
(https://claude.ai/artifact/9Au9HZhPtGrPp3oLXm6S91). Una tarea programada en la nube la actualiza cada día a las 10:00.

## Piezas

| Archivo | Qué hace |
|---|---|
| `scripts/scraper_mercadona.py` | Catálogo de tienda.mercadona.es (API pública `/api/categories/`, almacén `vlc1`). ~4.360 productos |
| `scripts/scraper_consum.py` | Catálogo de tienda.consum.es (`/api/rest/V1.0/catalog/product`). ~9.300 |
| `scripts/scraper_dia.py` | Catálogo de dia.es (`/api/v1/plp-back/reduced`). **Sin cabeceras de navegador**: con User-Agent de Chrome DIA responde 403. ~5.780 |
| `scripts/scraper_lidl.py` | LIDL no vende comida online. Lee las 715 fichas de supermercado del mapa del sitio (id de 8 cifras) decodificando `__NUXT_DATA__` (devalue) y añade su buscador. ~274 con precio |
| `scripts/descargar_fotos.py` | Foto de cada producto (`CARPETA_DATOS CARPETA_FOTOS [tiendas]`) |
| `scripts/ingredientes.py` | Caché de ingredientes: web de Mercadona y DIA, Open Food Facts por EAN (Consum y LIDL) y, para lo que falta, OCR de las fotos del envase con tesseract `spa` (hasta 300 al día). Imprime «Ingredientes: listo» |
| `scripts/categorias.py` | Categorías comunes, **naturalidad** (nivel 0-4 + desempate) y **equivalencias** entre tiendas (FRASES, PALABRAS, IGNORAR) |
| `scripts/construir_app.py` | Genera `catalogo.json`, `miniaturas/mNNN.webp` (sprites 10×10 de 112 px) e `ingredientes/iNN.json` (24 trozos por hash de la clave) |
| `scripts/marcador.js` | Bookmarklet «Llenar carrito» (fuente legible; minificado con terser va dentro de `index.html` como `MARCADOR`) |
| `app/index.html` | La app (React 18 + htm desde CDN, todo en un archivo) |
| `datos/ingredientes_cache.json` | Caché de ingredientes (~12.000 productos con lista) |
| `tests/*.js` | Pruebas con Playwright usadas durante el desarrollo (rutas adaptadas; servir `app/` en `localhost:8765`) |

## Ejecutar todo en local

```bash
pip install requests rapidfuzz pillow        # + tesseract instalado (brew install tesseract)
cd scripts
cp ../datos/ingredientes_cache.json .
python3 scraper_mercadona.py && python3 scraper_consum.py && python3 scraper_dia.py && python3 scraper_lidl.py
python3 ingredientes.py ingredientes_cache.json        # descarga spa.traineddata a ~/.cache/tessdata si falta
python3 descargar_fotos.py . ../fotos
python3 construir_app.py ../fotos ../app               # escribe catalogo.json, miniaturas/, ingredientes/
cd ../app && python3 -m http.server 8765               # y abrir http://localhost:8765
```

Faltan en el zip (se regeneran): `fotos/`, `catalogo.json`, `miniaturas/`, `ingredientes/` y `logos/*.png`.
Los logos están publicados en el artifact (`logos/mercadona.png`, `consum.png`, `dia.png`, `lidl.png`).

## Formato de catalogo.json (lo lee `preparar()` en index.html)

`productos[i]` = `[tienda, id, nombre, marca, precio, precio_antes, precio_unidad, unidad, cantidad, seccion, tipo, grupo, foto,
url, busca, categoria, formato_grande, cheque_crece, pack, salud, motivo_salud, ingredientes_principales]`.
`tipos[i]` = `[etiqueta, seccion, orden, visibles, canon]` (canon: raíces unificadas + conceptos `#gula`, `#vacuno_guisar`…).
`salud` = nivel×10 + desempate (4 Natural, 3 Sin aditivos, 2 Poco procesado, 1 Con aditivos, 0 Ultraprocesado; sin datos = 10).
