# Comparador de supermercados

App web que compara Mercadona, Consum, DIA y LIDL. Publicada como Artifact de claude.ai
(https://claude.ai/artifact/9Au9HZhPtGrPp3oLXm6S91); la actualización diaria puede hacerse sin Claude con
GitHub Actions y GitHub Pages (ver «Actualización diaria»).

## Puesta en marcha

```bash
uv venv --python 3.12 --managed-python .venv          # Python con OpenSSL (el de macOS usa LibreSSL)
uv pip install --python .venv/bin/python requests rapidfuzz pillow
brew install tesseract
npm install && npx playwright install chromium
```

> El Python 3.12/3.13 de Homebrew falla en este Mac (`pyexpat` no encaja con la libexpat del sistema);
> por eso el entorno se crea con `uv` y un Python autónomo.

## Día a día

| Orden | Qué hace |
|---|---|
| `npm test` | build + pruebas de la lógica en Node (~2 s), app en Chromium, accesibilidad (axe-core) y Python |
| `npm run build` | junta `src/` en `app/index.html` (un solo archivo, como necesita el artifact) |
| `npm run test:hoy` | las mismas pruebas con `app/catalogo.json` (los datos del día) en lugar del catálogo fijo |
| `npm run servir` | sirve `app/` en http://localhost:8765 |
| `node tests/medir/carga-movil.js` | tiempo de carga como en un móvil (CPU 4× más lenta, 4G) |
| `node tests/medir/accesibilidad.js` | axe-core en las cuatro pestañas, en claro y oscuro |

**Nunca se edita `app/index.html` a mano**: se genera con `npm run build`.

## Código de la app (`src/`)

Los módulos son scripts clásicos que comparten ámbito global, igual que cuando todo estaba en un archivo;
`build.js` los concatena en orden, mete los estilos y el marcador minificado con terser.

| Archivo | Qué hace |
|---|---|
| `src/plantilla.html`, `src/estilos.css` | cabecera, CSS (tokens de color en `:root`) |
| `src/logica/utilidades.js` | normalizar, raíces, sinónimos, `CONFUNDIBLES` (pulpo ≠ pulpa) |
| `src/logica/catalogo.js` | `preparar()`: lee `catalogo.json` |
| `src/logica/ajustes.js` | ajustes, precio efectivo, **naturalidad** en la app (`nivelDe`, `mejorQue`) |
| `src/logica/busqueda.js` | `buscar()`: palabras, conceptos y búsqueda relajada si no hay nada |
| `src/logica/intencion.js` | `intencion()`: qué categoría quiere decir quien busca |
| `src/logica/comparar.js` | `comparar()`: la comparativa entre súper |
| `src/logica/equivalencias.js` | `equivalente()`: sustituto en otra tienda; nunca menos natural sin avisar; cantidad estimada |
| `src/logica/sustitutos.js` | `elegirParecido()`, `sustituto()` |
| `src/logica/planificador.js` | `planificar()`: dónde comprar la cesta, con envíos |
| `src/ui/*.js` | React 18 + htm (estado, piezas, buscar, lista, comprar, carrito, ajustes, ficha, app) |

`src/logica` no usa React ni el DOM: las pruebas la cargan en Node con `tests/cargar.js`.

## Pruebas (`tests/`)

- `busqueda.test.js`, `sustitutos.test.js`, `planificador.test.js`: los casos que deben seguir funcionando
  (leche de almendras, limón, sal, gulas, ternera para guisar, pechuga de pavo, auditoría «0 menos natural sin aviso»,
  «hasta k súper» nunca más caro…).
- `app.e2e.test.js`: la app en Chromium (búsqueda, pestañas, «Llenar carrito», accesibilidad).
- `build.test.js`: un solo `index.html` con el marcador válido.
- `test_naturalidad.py`, `test_ocr.py`: criterio de «sano = natural» y lectura de ingredientes de las fotos.
- `fijos/catalogo-2026-10-28.json.gz`: catálogo publicado el 28/10/2026; las pruebas no cambian cada día.
- `explorar/`: los scripts de exploración de Claude Chat (sin asserts; `bm_test.js` prueba el marcador en las webs reales).

## Datos (`scripts/`)

| Archivo | Qué hace |
|---|---|
| `scraper_mercadona.py` | API pública `/api/categories/`, almacén `vlc1`. ~4.360 productos |
| `scraper_consum.py` | `/api/rest/V1.0/catalog/product`. ~9.300 |
| `scraper_dia.py` | `/api/v1/plp-back/reduced`. ~5.780. **Sin cabeceras de navegador** (DIA responde 403). Desde un Mac doméstico DIA bloquea igualmente (antibots); funciona desde la nube |
| `scraper_lidl.py` | fichas del mapa del sitio (`__NUXT_DATA__`). ~274 con precio |
| `ingredientes.py` | caché de ingredientes: web (Mercadona, DIA), Open Food Facts por EAN (Consum, LIDL) y OCR de fotos (hasta 300 al día; contraste + enfoque; solo se usan lecturas ≥ 0,8) |
| `descargar_fotos.py` | foto de cada producto (solo las nuevas) |
| `categorias.py` | categorías, **naturalidad** (nivel 0-4 + desempate) y **equivalencias** (FRASES, PALABRAS, IGNORAR) |
| `construir_app.py` | `catalogo.json`, `miniaturas/mNNN.webp`, `ingredientes/iNN.json` |
| `marcador.js` | marcador «Llenar carrito» (el build lo minifica y lo mete en `index.html`) |

Todos con pausas de 0,3-0,4 s y como mucho 6 hilos. **No borrar `datos/ingredientes_cache.json`** (unas 2 h de OCR y OFF).

```bash
cd scripts
for t in mercadona consum dia lidl; do ../.venv/bin/python scraper_$t.py; done
../.venv/bin/python ingredientes.py ../datos/ingredientes_cache.json
../.venv/bin/python descargar_fotos.py . ../fotos
cp ../datos/ingredientes_cache.json . && ../.venv/bin/python construir_app.py ../fotos ../app
cd .. && npm run build && npm run test:hoy
```

Se regeneran y no van en git: `fotos/`, `app/catalogo.json`, `app/miniaturas/`, `app/ingredientes/`, `scripts/productos_*`.

## Actualización diaria sin tokens (GitHub Actions + Pages)

`.github/workflows/actualizar.yml` se ejecuta cada día a las 10:00 (Madrid, horario de invierno):
precios → ingredientes y OCR → fotos nuevas → construir → **pruebas con los datos del día** → publicar en GitHub Pages.

- Si un súper falla, se usan sus datos del día anterior (rama `datos`, que se reescribe cada día sin historial).
- **DIA no responde a los servidores de GitHub** (antibots): la web de GitHub Pages sale sin DIA. El artifact sí lo tiene,
  porque su tarea diaria en claude.ai lo trae desde la nube.
- El OCR de fotos tiene un tope de 25 min (`OCR_MINUTOS`); lo que no da tiempo queda para el día siguiente.
- Si las pruebas fallan, no se publica: la web sigue con los datos de ayer.
- Las fotos se guardan en la caché de Actions (la primera vez se bajan todas, ~20.000).
- En GitHub Pages la lista de cada persona se guarda en su navegador (`localStorage`); en el artifact, en la nube de claude.ai.

Repositorio: https://github.com/wbnk9zwvhy-max/comparador-supermercados · Web: https://wbnk9zwvhy-max.github.io/comparador-supermercados/
Para el artifact, publicar `app/` con Claude cuando se quiera (no hace falta a diario).

## Formato de catalogo.json (lo lee `preparar()`)

`productos[i]` = `[tienda, id, nombre, marca, precio, precio_antes, precio_unidad, unidad, cantidad, seccion, tipo, grupo, foto,
url, busca, categoria, formato_grande, cheque_crece, pack, salud, motivo_salud, ingredientes_principales]`.
`tipos[i]` = `[etiqueta, seccion, orden, visibles, canon]` (canon: raíces unificadas + conceptos `#gula`, `#vacuno_guisar`…).
`salud` = nivel×10 + desempate (4 Natural, 3 Sin aditivos, 2 Poco procesado, 1 Con aditivos, 0 Ultraprocesado; sin datos = 10).
